
mongoose = require 'mongoose'
_ = require 'lodash'
assert = require 'assert'
async = require 'async'

required = require 'src/core/required.js'
please = require 'src/lib/please.js'
jobs = require 'src/config/kue.js'
redis = require 'src/config/redis.js'
labs = require('src/core/labs.js').data

Resource = mongoose.model 'Resource'
User = mongoose.model 'User'
Post = Resource.model 'Post'
Comment = Resource.model 'Comment'
CommentTree = Resource.model 'CommentTree'
Notification = Resource.model 'Notification'

logger = null

# TMERA: Throw Mongo Errors Right Away

###*
 * Creates a new CommentTree object for a post document and saves it.
 * @param 	{Post} 	parent 	The post object we're creating the tree for
 * @param 	{Function} cb Callback(err, tree, parent)
 * @throws 	{Error} If mongo fails to create CommentTree
 * @throws 	{Error} If mongo fails to update parent post with new comment_tree attribute
###
createTree = (parent, cb) ->
	please.args {$isModel:Post}, '$isFn'

	if parent.comment_tree
		logger.warn('Overriding post %s comment_tree attribute (=%s).',
			parent._id, parent.comment_tree)
		delete parent.comment_tree

	logger.debug('Creating comment_tree for post %s', parent._id)
	tree = new CommentTree {
		parent: parent._id
	}
	tree.save (err, tree) ->
		if err
			logger.error(err, 'Failed to save comment_tree (for post %s)', parent._id)
			throw err # TMERA
		# Atomic. YES.
		Post.findOneAndUpdate { _id: parent._id }, { comment_tree: tree._id },
			(err, parent) ->
				if err
					logger.error(err, 'Failed to update post %s with comment_tree attr', parent._id)
					throw err # TMERA
				cb(tree, parent)

###*
 * Find or create a CommentTree.
 * - Handle cases when the referenced tree (post.comment_tree) doesn't exist (anymore?).
 * @param 	{Post}			parent 	The post object we're creating the tree for.
 * @param 	{Function}	cb 			Callback(err, tree, parent)
 * @throws 	{Error} If mongo fails trying to find CommentTree
 * @throws 	{Error} If createTree throws error
###
findOrCreatePostTree = (parent, cb) ->
	please.args {$isModel:Post}, '$isFn'

	if parent.comment_tree
		CommentTree.findOne { _id: parent.comment_tree }, (err, tree) ->
			if err
				logger.error('Failed to find tree (%s)', parent.comment_tree, err)
				throw err # TMERA
			else if not tree
				logger.warn('CommentTree %s of parent %s not found. Attempt to create new one.',
					parent.comment_tree, parent._id)
				createTree parent, (tree, parent) ->
					please.args {$isModel:CommentTree}, {$isModel:Post}
					logger.warn('CommentTree for parent %s finally created.', parent._id)
					cb(tree, parent)
			else
				cb(tree, parent)
	else
		# No tree object.
		# We're fucked if it exists but isn't referenced.
		createTree parent, (tree, parent) ->
			please.args {$isModel:CommentTree}, {$isModel:Post}
			# Pass on new parent (with comment_tree attr updated)
			cb(tree, parent)

###*
 * [commentToNote description]
 * - I've tried my best to make this function atomic, to no success.
 * - This function also handles replies_to functionality and triggering of
 * - Notification to users. (does it?)
 * @param  {User}		me			Author object
 * @param  {Post}   parent 	Parent post on which me is writing
 * @param  {Object} data		Comment content
 * @param  {Function} cb 		[description]
###
commentToNote = (me, parent, data, cb) ->
	please.args {$isModel:User}, {$isModel:Post}, {$contains:['content']}, '$isFn'

	findOrCreatePostTree parent, (tree, parent) -> # Use potentially updated parent object.

		# README: Using new Comment({...}) here is leading to RangeError on server. #WTF
		_comment = tree.docs.create({
			author: User.toAuthorObject(me)
			content: {
				body: data.content.body
			}
			tree: parent.comment_tree
			parent: parent._id
			# Attrs bellow are specific to Note comments
			replies_to: null
			thread_root: null
			replies_users: null
		})

		# README: The expected object (without those crazy __parentArray, __$, ... properties)
		comment = new Comment(_comment)
		logger.debug('commentToPost(%s) with comment_tree(%s)', parent._id, parent.comment_tree)

		# Atomically push comment to commentTree
		# BEWARE: the comment object won't be validated, since we're not pushing it to the tree object and saving.
		# CommentTree.findOneAndUpdate { _id: tree._id }, {$push: { docs : comment }}, (err, tree) ->

		# Non-atomically saving comment to comment tree
		# README: Atomic version is leading to "RangeError: Maximum call stack size exceeded" on heroku.
		tree.docs.push(_comment) # Push the weird object.
		tree.save (err) ->
			if err
				logger.error('Failed to push comment to CommentTree', err)
				return cb(err)

			jobs.create('NEW note comment', {
				title: "comment added: #{comment.author.name} posted #{comment.id} to #{parent._id}",
				comment: comment.toObject(),
			}).save()

			# Trigger notification.
			# Notification.Trigger(me, Notification.Types.PostComment)(comment, parent, ->)
			cb(null, comment)

###*
 * [commentToDiscussion description]
 * - I've tried my best to make this function atomic, to no success.
 * - This function also handles replies_to functionality and triggering of
 * - Notification to users. (does it?)
 * @param  {User}		me			Author object
 * @param  {Post}   parent 	Parent post on which me is writing
 * @param  {Object} data		Comment content
 * @param  {Function} cb 		[description]
###
commentToDiscussion = (me, parent, data, cb) ->
	please.args {$isModel:User}, {$isModel:Post}, {$contains:['content']}, '$isFn'

	findOrCreatePostTree parent, (tree, parent) ->
		# Get potentially updated parent object.

		thread_root = null
		replies_to = null
		if data.replies_to
			replied = tree.docs.id(data.replies_to)
			if replied # make sure object exists
				replies_to = data.replies_to
				if replied.replies_to
					thread_root = replied.thread_root
				else
					thread_root = data.replies_to

		console.log(thread_root, replies_to)

		# README: Using new Comment({...}) here is leading to RangeError on server. #WTF
		_comment = tree.docs.create({
			author: User.toAuthorObject(me)
			content: {
				body: data.content.body
			}
			tree: parent.comment_tree
			parent: parent._id
			replies_to: null
			thread_root: null
			replies_users: null
		})
		# FIXME:
		# The expected object (without those crazy __parentArray, __$, ... properties)
		comment = new Comment(_comment)
		logger.debug('commentToPost(%s) with comment_tree(%s)', parent._id, parent.comment_tree)

		# Atomically push comment to commentTree
		# BEWARE: the comment object won't be validated, since we're not pushing it to the tree object and saving.
		# CommentTree.findOneAndUpdate { _id: tree._id }, {$push: { docs : comment }}, (err, tree) ->

		# Non-atomically saving comment to comment tree
		# README: Atomic version is leading to "RangeError: Maximum call stack size exceeded" on heroku.
		tree.docs.push(_comment) # Push the weird object.
		tree.save (err) ->
			if err
				logger.error('Failed to push comment to CommentTree', err)
				return cb(err)

			jobs.create('NEW discussion exchange', {
				title: "exchange added: #{comment.author.name} posted #{comment.id} to #{parent._id}",
				exchange: comment.toObject(),
			}).save()
			# Trigger notification.
			Notification.Trigger(me, Notification.Types.PostComment)(comment, parent, ->)
			cb(null, comment)

deleteComment = (me, comment, tree, cb) ->
	please.args {$isModel:User},{$isModel:Comment},{$isModel:CommentTree},'$isFn'

	logger.debug 'Removing comment(%s) from tree(%s)', comment._id, tree._id

	tree.docs.pull(comment._id)

	tree.save (err, doc) ->
		if err
			logger.error("Failed to pull comment(comment._id) from tree(#{tree._id})", err)
			return cb(err)
		console.log('removed')

		jobs.create('DELETE post child', {
			title: "Deleteed: #{comment.author.name} deleted #{comment.id} from #{comment.tree}",
			parentId: comment.parent.toObject(),
			treeId: tree._id,
			child: comment.toObject(),
		}).save()

		Notification.find { resources: comment._id }, (err, docs) ->
			if err
				logger.error("Err finding notifications: ", err)
				return
			console.log "Removing #{err} #{docs.length} notifications of comment #{comment.id}"
			docs.forEach (doc) ->
				doc.remove()

		cb(null, null)

upvoteComment = (me, res, cb) ->
	please.args {$isModel:User}, {$isModel:Comment}, '$isFn'
	CommentTree.findOneAndUpdate { _id: res.tree, 'docs._id': res._id },
	{ $addToSet: { 'docs.$.votes': me._id} }, (err, tree) ->
		if err
			logger.error("Failed to $addToSet user's(#{me._id}) vote to comment(#{res._id}) belonging"
				"to tree(#{res.tree}")
			return cb(err)
		if not tree
			logger.error("Couldn't find comment(#{res._id})'s tree(#{res.tree}) to upvote")
			return cb(true)
		obj = tree.docs.id(res._id)
		if not obj
			logger.error("Couldn't find comment(#{res._id}) in tree(#{res.tree})")
			return cb(true)
		cb(null, new Comment(obj))

unupvoteComment = (me, res, cb) ->
	please.args {$isModel:User}, {$isModel:Comment}, '$isFn'
	CommentTree.findOneAndUpdate { _id: res.tree, 'docs._id': res._id },
	{ $pull: { 'docs.$.votes': me._id} }, (err, tree) ->
		if err
			logger.error("Failed to $pull user's (#{me._id}) vote from comment (#{res._id}) belonging"
				"to tree (#{res.tree}")
			return cb(err)
		if not tree
			logger.error("Couldn't find comment (#{res._id})' comment tree (#{res.tree}) to unupvote")
			return cb(true)
		obj = tree.docs.id(res._id)
		if not obj
			logger.error("Couldn't find comment(#{res._id}) in tree(#{res.tree})")
			return cb(true)
		cb(null, new Comment(obj))

##########################################################################################
##########################################################################################

createPost = (self, data, cb) ->
	please.args {$isModel:User}, '$skip', '$isFn'
	post = new Post {
		author: User.toAuthorObject(self)
		content: {
			title: data.content.title
			body: data.content.body
		}
		type: data.type
		subject: data.subject
		tags: data.tags
	}
	post.save (err, post) ->
		# use asunc.parallel to run a job
		# Callback now, what happens later doesn't concern the user.
		if err
			return cb(err)
		cb(null, post)

KarmaService = require('src/core/karma')

upvotePost = (self, res, cb) ->
	please.args {$isModel:User}, {$isModel:Post}, '$isFn'
	if ''+res.author.id == ''+self.id
		cb()
		return

	done = (err, doc) ->
		if err
			console.log("ERRO upvote POST", err)
			throw err
			return cb(err)

		if not doc
			logger.debug('Vote already there?', res.id)
			return cb(null)

		jobs.create('post upvote', {
			title: "New upvote: #{self.name} → #{res.id}",
			authorId: res.author.id,
			post: doc.toObject(),
			agent: self.toObject(),
		}).save()
		cb(null, doc)

	Post.findOneAndUpdate {
		_id: ''+res._id, votes: { $ne: self._id }
	}, {
		$push: { votes: self._id }
	}, done

unupvotePost = (self, res, cb) ->
	please.args {$isModel:User}, {$isModel:Post}, '$isFn'
	if ''+res.author.id == ''+self.id
		cb()
		return

	done = (err, doc) ->
		if err
			console.log("ERRO unupvote POST", err)
			throw err
			return cb(err)
		if not doc
			logger.debug('Vote wasn\'t there?', res.id)
			return cb(null)
		jobs.create('post unupvote', {
			title: "New unupvote: #{self.name} → #{res.id}",
			authorId: res.author.id,
			post: doc.toObject(),
			agent: self.toObject(),
		}).save()
		cb(null, doc)

	Post.findOneAndUpdate {
		_id: ''+res._id, votes: self._id
	}, {
		$pull: { votes: self._id }
	}, done

##########################################################################################
##########################################################################################

sanitizeBody = (body, type) ->
	sanitizer = require 'sanitize-html'
	DefaultSanitizerOpts = {
		# To be added: 'pre', 'caption', 'hr', 'code', 'strike',
		allowedTags: ['h1','h2','b','em','strong','a','img','u','ul','li','blockquote','p','br','i'],
		allowedAttributes: {'a': ['href'],'img': ['src']},
		selfClosing: ['img', 'br'],
		transformTags: {'b':'strong','i':'em'},
		exclusiveFilter: (frame) -> frame.tag in ['a','span'] and not frame.text.trim()
	}
	getSanitizerOptions = (type) ->
		switch type
			when Post.Types.Discussion
				return _.extend({}, DefaultSanitizerOpts, {
					allowedTags: ['b','em','strong','a','u','ul','blockquote','p','img','br','i','li'],
				})
			else
				return DefaultSanitizerOpts
		return DefaultSanitizerOpts
	str = sanitizer(body, getSanitizerOptions(type))
	# Don't mind my little hack to remove excessive breaks
	str = str.replace(new RegExp("(<br \/>){2,}","gi"), "<br />")
		.replace(/<p>(<br \/>)?<\/p>/gi, '')
		.replace(/<br \/><\/p>/gi, '</p>')
	return str

##########################################################################################
##########################################################################################

class Unspam
	@limit = (ms) ->
		# Identify calls to this controller
		key = ~~(Math.random()*1000000)/1 # Assuming it's not going to collide
		(req, res, next) ->
			return next() # DONTSHIP
			if not req.session._unspam
				throw "Unspam middleware not used."

			if not req.session._unspam[key]
				req.session._unspam[key] = Date.now()
				return next()
			else if req.session._unspam[key]+ms < Date.now()
				req.session._unspam[key] = Date.now()
				return next()
			else
				req.session._unspam[key] = Date.now() # Refresh limit?
				res.endJSON({ error: true, limitError: true, message: "" })

	@middleware = (req, use, next) ->
		if not req.session._unspam
			req.session._unspam = {}
		next()

module.exports = (app) ->

	router = require("express").Router()

	logger = app.get('logger').child({child:'API',dir:'posts'})

	router.use required.login
	router.use Unspam.middleware

	router.post '/', (req, res) ->
		req.parse Post.ParseRules, (err, reqBody) ->
			body = sanitizeBody(reqBody.content.body, reqBody.type)
			req.logger.error reqBody.subject
			# Get tags
			assert(reqBody.subject of labs)
			if reqBody.tags and reqBody.subject and labs[reqBody.subject].children
				tags = []
				for tag in reqBody.tags when tag of labs[reqBody.subject].children
					tags.push(tag)
			#
			createPost req.user, {
				type: reqBody.type
				subject: reqBody.subject
				tags: tags
				content: {
					title: reqBody.content.title
					body: body
				}
			}, req.handleErr404 (doc) ->
				res.endJSON(doc)

##########################################################################################
##########################################################################################

	router.param('postId', (req, res, next, postId) ->
		try
			id = mongoose.Types.ObjectId.createFromHexString(postId);
		catch e
			return next({ type: "InvalidId", args:'postId', value:postId});
		Post.findOne { _id:id }, req.handleErr404 (post) ->
			req.post = post
			next()
	)

	router.param('treeId', (req, res, next, treeId) ->
		try
			id = mongoose.Types.ObjectId.createFromHexString(treeId);
		catch e
			return next({ type: "InvalidId", args:'treeId', value:treeId});
		CommentTree.findOne { _id:id }, req.handleErr404 (tree) ->
			req.tree = tree
			next()
	)

	router.param('commentId', (req, res, next, commentId) ->
		try
			id = mongoose.Types.ObjectId.createFromHexString(commentId);
		catch e
			return next({ type: "InvalidId", args:'commentId', value:commentId});

		if not 'treeId' of req.params
			throw "Fetching commentId in url with no reference to its tree (no treeId parameter)."
		if not 'tree' of req
			throw "Fetching commentId in url without tree object in request (no req.tree, as expected)."

		req.comment = new Comment(req.tree.docs.id(id))
		if not req.comment
			return next({ type: "ObsoleteId", status: 404, args: {commentId: id, treeId: req.param.treeId} })

		next()
	)

##########################################################################################
##########################################################################################

	router.route('/:postId')
		.get (req, res) ->
			stuffGetPost req.user, req.post, (err, data) ->
				res.endJSON(data: data)

		.put required.selfOwns('post'), (req, res) ->
			post = req.post
			req.parse Post.ParseRules, (err, reqBody) ->
				post.content.body = sanitizeBody(reqBody.content.body, post.type)
				post.content.title = reqBody.content.title
				post.updated_at = Date.now()
				if reqBody.tags and post.subject and labs[post.subject].children
					post.tags = []
					console.log('here', reqBody.tags, labs[post.subject].children)
					for tag in reqBody.tags when tag of labs[post.subject].children
						console.log('tag', tag)
						post.tags.push(tag)
					console.log(post.tags)
				post.save req.handleErr (me) ->
					post.stuff req.handleErr (stuffedPost) ->
						res.endJSON stuffedPost
		.delete required.selfOwns('post'), (req, res) ->
			req.post.remove (err) ->
				if err
					return req.logger.error('err', err)
				res.endJSON(req.post, error: err?)

	router.get '/:postId/upvote', required.selfDoesntOwn('post'),
	Unspam.limit(200), (req, res) ->
		KarmaService.send req.user, KarmaService.Types.PostUpvote, {
			post: req.post,
		}, ->
		res.endJSON { error: err? }

	router.get '/:postId/unupvote', required.selfDoesntOwn('post'),
	Unspam.limit(200), (req, res) ->
		KarmaService.undo req.user, KarmaService.Types.PostUpvote, {
			post: req.post,
		}, ->
		res.endJSON { error: err? }

	router.post '/:postId/upvote', required.selfDoesntOwn('post'),
	Unspam.limit(5*1000), (req, res) ->
		upvotePost req.user, req.post, (err, doc) ->
			res.endJSON { error: err?, data: doc or req.post }

	router.post '/:postId/unupvote', required.selfDoesntOwn('post'),
	Unspam.limit(5*1000), (req, res) ->
		unupvotePost req.user, req.post, (err, doc) ->
			res.endJSON { error: err?, data: doc or req.post }

	####

	router.route('/:postId/comments')
		.get (req, res) ->
			req.post.getComments req.handleErr404 (comments) ->
				res.endJSON(data: comments, error: false, page: -1) # sending all (page → -1)
		.post (req, res, next) ->
			# TODO: Detect repeated posts and comments!
			req.parse Comment.ParseRules, (err, body) ->
				data = { content: {body:body.content.body} }

				if req.post.type is Post.Types.Discussion
					req.logger.debug("Adding discussion exchange.")
					if body.replies_to
						data.replies_to = body.replies_to
					commentToDiscussion req.user, req.post, data, (err, doc) ->
						if err
							return next(err)
						res.endJSON(error:false, data:doc)
				else
					commentToNote req.user, req.post, data, (err, doc) ->
						if err
							return next(err)
						res.endJSON(error:false, data:doc)

##########################################################################################
##########################################################################################

	router.delete '/:treeId/:commentId', required.selfOwns('comment'), (req, res, next) ->
		deleteComment req.user, req.comment, req.tree, (err, result) ->
			res.endJSON { data: null, error: err? }

	# I don't want to retrieve neither the tree or the comment object, so I changed the parameter names.
	router.put '/:treeId2/:commentId2', (req, res, next) ->
		comment = req.comment
		req.parse Comment.ParseRules, (err, reqBody) ->
			# Atomic. Thank Odim.
			# THINK: should it update author object on save?
			CommentTree.findOneAndUpdate {
					_id: req.params.treeId2,
					'docs._id': req.params.commentId2,
					'docs.author.id': req.user._id
				},
				{
					$set: {
						'docs.$.content.body': reqBody.content.body,
						'docs.$.meta.updated_at': Date.now()
					}
				}, (err, tree) ->
					comment = new Comment(tree.docs.id(req.params.commentId2))
					res.endJSON(comment)

	router.post '/:treeId/:commentId/upvote', required.selfDoesntOwn('comment'), (req, res, next) ->
		upvoteComment req.user, req.comment, (err, doc) ->
			if err
				return next(err)
			res.endJSON { error: false, data: doc }

	router.post '/:treeId/:commentId/unupvote', required.selfDoesntOwn('comment'), (req, res, next) ->
		unupvoteComment req.user, req.comment, (err, doc) ->
			if err
				return next(err)
			res.endJSON { error: false, data: doc }


	return router


module.exports.stuffGetPost = stuffGetPost = (agent, post, cb) ->
	please.args {$isModel:User}, {$isModel:Post}, '$isFn'

	post.stuff (err, stuffedPost) ->
		if err
			console.log("ERRO???", err)
			return cb(err)

		stuffedPost._meta = {}
		async.parallel([
			(done) ->
				agent.doesFollowUser post.author.id, (err, val) ->
					# Fail silently.
					if err
						val = false
						logger.error("Error retrieving doesFollowUser value", err)
					stuffedPost._meta.authorFollowed = val
					done()
			(done) ->
				redis.incr post.getCacheField('Views'), (err, count) ->
					if err
						logger.error("Error retrieving views count", err)
					else
						stuffedPost._meta.views = count
					done()
		], (err, results) ->
			cb(err, stuffedPost)
		)
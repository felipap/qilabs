
mongoose = require 'mongoose'
_ = require 'lodash'
assert = require 'assert'
async = require 'async'
validator = require 'validator'

required = require '../lib/required'
please = require 'src/lib/please.js'
jobs = require 'src/config/kue.js'
redis = require 'src/config/redis.js'
labs = require 'src/core/labs'

unspam = require '../lib/unspam'
og = require '../lib/og'

User = mongoose.model 'User'
Post = mongoose.model 'Post'
Comment = mongoose.model 'Comment'
CommentTree = mongoose.model 'CommentTree'
Notification = mongoose.model 'Notification'

logger = null

# Throw Mongodb Errors Right Away
TMERA = (call) ->
	if typeof call is 'string'
		message = [].slice.call(arguments)
		return (call) ->
			return (err) ->
				if err
					message.push(err)
					logger.error.apply(logger, message)
					console.trace()
					throw err
				call.apply(this, [].slice.call(arguments, 1))
	else
		return (err) ->
			if err
				logger.error("TMERA:", err)
				console.trace()
				throw err
			call.apply(this, [].slice.call(arguments, 1))

###*
 * Creates a new CommentTree object for a post document and saves it.
 * @param 	{Post} 	parent 	The post object we're creating the tree for
 * @param 	{Function} cb Callback(err, tree, parent)
 * @throws 	{Error} If mongo fails to create CommentTree
 * @throws 	{Error} If mongo fails to update parent post with new comment_tree attribute
###
createTree = (parent, cb) ->
	please {$model:Post}, '$isFn'

	if parent.comment_tree
		logger.warn('Overriding post %s comment_tree attribute (=%s).',
			parent._id, parent.comment_tree)
		delete parent.comment_tree

	logger.debug('Creating comment_tree for post %s', parent._id)
	tree = new CommentTree {
		parent: parent._id
	}
	tree.save TMERA('Failed to save comment_tree (for post %s)', parent._id)((tree) ->
		# Atomic. YES.
		Post.findOneAndUpdate { _id: parent._id }, { comment_tree: tree._id },
			TMERA('Failed to update post %s with comment_tree attr', parent._id)((parent) ->
				cb(tree, parent)
			)
	)

###*
 * Find or create a CommentTree.
 * - Handle cases when the referenced tree (post.comment_tree) doesn't exist (anymore?).
 * @param 	{Post}			parent 	The post object we're creating the tree for.
 * @param 	{Function}	cb 			Callback(err, tree, parent)
 * @throws 	{Error} If mongo fails trying to find CommentTree
 * @throws 	{Error} If createTree throws error
###
findOrCreatePostTree = (parent, cb) ->
	please {$model:Post}, '$isFn'

	if parent.comment_tree
		CommentTree.findOne { _id: parent.comment_tree },
		TMERA('Failed to find tree (%s)', parent.comment_tree) (tree) ->
			if not tree
				logger.warn('CommentTree %s of parent %s not found. Attempt to create new one.',
					parent.comment_tree, parent._id)
				createTree parent, (tree, parent) ->
					please {$model:CommentTree}, {$model:Post}
					logger.warn('CommentTree for parent %s finally created.', parent._id)
					cb(tree, parent)
			else
				cb(tree, parent)
	else
		# No tree object.
		# We're fucked if it exists but isn't referenced.
		createTree parent, (tree, parent) ->
			please {$model:CommentTree}, {$model:Post}
			# Pass on new parent (with comment_tree attr updated)
			cb(tree, parent)


###*
 * [commentToPost description]
 * - I've tried my best to make this function atomic, to no success.
 * - This function also handles replies_to functionality and triggering of
 * @param  {User}		me			Author object
 * @param  {Post}   parent 	Parent post on which me is writing
 * @param  {Object} data		Comment content
 * @param  {Function} cb 		[description]
###
commentToPost = (me, parent, data, cb) ->
	please {$model:User}, {$model:Post}, {$contains:['content']}, '$isFn'

	findOrCreatePostTree parent, (tree, parent) ->
		# Get potentially updated parent object.

		thread_root = null
		replies_to = null
		replied_user = null
		# Make sure replies_to exists. README: assumes only one tree exists for a post
		if data.replies_to
			replied = tree.docs.id(data.replies_to)
			if replied # make sure object exists
				replied_user = replied.author
				if data.content.body[0] isnt '@' # not talking to anyone
					replies_to = data.replies_to
				if replied.thread_root # replied is also nested
					thread_root = replied.thread_root
				else # replied is root
					thread_root = data.replies_to
			else
				logger.warn 'Tried to reply to a comment that didn\'t exist: %s', data.replies_to

		mentions = []
		if data.content.body[0] is '@' # talking to someone
			# Find that user in participation
			usernames = data.content.body.match(/@([_a-z0-9]{4,})/gi)
			if usernames and usernames.length < 4 # penalty for more than 5 mentions
				for _username in _.filter(_.unique(usernames), (i) -> i isnt me.username)
					username = _username.slice(1)
					part = _.find(parent.participations, (i) -> i.user.username is username)
					if part
						mentions.push(''+part.user.id)
					else
						# For now, ignore mentions to users who are not participating.
						logger.debug 'Mentioned user '+username+' not in participations of '+parent._id
						;

		# README: Using new Comment({...}) here is leading to RangeError on server. #WTF
		_comment = tree.docs.create({
			author: User.toAuthorObject(me)
			content: {
				body: data.content.body
			}
			tree: parent.comment_tree
			parent: parent._id
			replies_to: replies_to
			thread_root: thread_root
			# replied_users: replied_user and [User.toAuthorObject(replied_user)] or null
		})

		# The expected object (without those crazy __parentArray, __$, ... properties)
		comment = new Comment(_comment)
		logger.debug 'commentToPost(%s) with comment_tree(%s)', parent._id, parent.comment_tree

		# Atomically push comment to commentTree
		# BEWARE: the comment object won't be validated, since we're not pushing it to the tree object and saving.
		# CommentTree.findOneAndUpdate { _id: tree._id }, {$push: { docs : comment }}, (err, tree) ->

		# Non-atomically saving? comment to comment tree
		# README: Atomic version is leading to "RangeError: Maximum call stack size exceeded" on heroku.
		tree.docs.push(_comment) # Push the weird object.
		tree.save (err) ->
			if err
				logger.error('Failed to push comment to CommentTree', err)
				return cb(err)

			jobs.create('NEW comment', {
				title: 'comment added: '+comment.author.name+' posted '+comment.id+' to '+parent._id,
				commentId: comment._id
				treeId: tree._id
				parentId: parent._id
				commentId: comment._id
			}).save()

			if replies_to
				jobs.create('NEW comment reply', {
					title: 'reply added: '+comment.author.name+' posted '+comment.id+' to '+parent._id,
					treeId: tree._id
					parentId: parent._id
					commentId: comment._id
					repliedId: replied._id
				}).save()

			if mentions and mentions.length
				for mention in mentions
					jobs.create('NEW comment mention', {
						title: 'mention: '+comment.author.name+' mentioned '+mention+' in '+comment.id+' in '+parent._id,
						treeId: tree._id
						parentId: parent._id
						commentId: comment._id
						mentionedId: mention
					}).save()
			cb(null, comment)

deleteComment = (me, comment, tree, cb) ->
	please {$model:User},{$model:Comment},{$model:CommentTree},'$isFn'

	logger.debug 'Removing comment(%s) from tree(%s)', comment._id, tree._id

	tree.docs.pull(comment._id)

	tree.save (err, doc) ->
		if err
			logger.error("Failed to pull comment(comment._id) from tree(#{tree._id})", err)
			return cb(err)
		console.log('removed')

		jobs.create('DELETE post comment', {
			title: "Deleteed: #{comment.author.name} deleted #{comment.id} from #{comment.tree}"
			comment: new Comment(comment).toObject()
		}).save()

		cb(null, null)

upvoteComment = (me, res, cb) ->
	please {$model:User}, {$model:Comment}, '$isFn'
	CommentTree.findOneAndUpdate { _id: res.tree, 'docs._id': res._id },
	{ $addToSet: { 'docs.$.votes': me._id} }, (err, tree) ->
		if err
			logger.error("Failed to $addToSet user's(#{me._id}) vote to comment(#{res._id}) belonging"
				"to tree(#{res.tree}")
			return cb(err)
		if not tree
			return cb(new Error("Couldn't find comment(#{res._id})'s tree(#{res.tree}) to upvote"))
		obj = tree.docs.id(res._id)
		if not obj
			return cb(new Error("Couldn't find comment(#{res._id}) in tree(#{res.tree})"))
		cb(null, new Comment(obj))

unupvoteComment = (me, res, cb) ->
	please {$model:User}, {$model:Comment}, '$isFn'
	CommentTree.findOneAndUpdate { _id: res.tree, 'docs._id': res._id },
	{ $pull: { 'docs.$.votes': me._id} }, (err, tree) ->
		if err
			logger.error("Failed to $pull user's (#{me._id}) vote from comment (#{res._id}) belonging"
				"to tree (#{res.tree}")
			return cb(err)
		if not tree
			return cb(new Error("Couldn't find comment (#{res._id})' comment tree (#{res.tree}) to unupvote"))
		obj = tree.docs.id(res._id)
		if not obj
			return cb(new Error("Couldn't find comment(#{res._id}) in tree(#{res.tree})"))
		cb(null, new Comment(obj))

##########################################################################################
##########################################################################################

createPost = (self, data, cb) ->
	please {$model:User}, '$skip', '$isFn'

	create = () ->
		post = new Post {
			author: User.toAuthorObject(self)
			content: {
				title: data.content.title
				body: data.content.body
				link: data.content.link
				image: data.content.image
				link_image: data.content.link_image
				link_type: data.content.link_type
				link_title: data.content.link_title
				link_description: data.content.link_description
			}
			users_watching: [self.id]
			type: data.type
			lab: data.lab
			tags: data.tags
		}
		post.save (err, post) ->
			if err
				return cb(err)
			cb(null, post)

			jobs.create('NEW post', {
				title: "create post: #{self.name} posted #{post.id}",
				post: post.toObject(),
				author: self.toObject(),
			}).save()

	console.log(data.content)
	if validator.isURL(data.content.link)
		og self, data.content.link, (err, ogdata) ->
			data.content.link = validator.trim(ogdata.url or data.content.link)
			data.content.link_type = ogdata.type
			data.content.link_title = ogdata.title
			data.content.link_image = ogdata.image?.url
			data.content.link_updated = ogdata.updated
			data.content.link_description = ogdata.description
			create()
	else
		if data.content.link # Invalid link passed validation function?
			logger.warn "Link existed but wasn't valid. WTF"
		create()

watchPost = (self, res, cb) ->
	please {$model:User}, {$model:Post}, '$isFn'

	Post.findOneAndUpdate {
		_id: ''+res._id, users_watching: { $ne: self._id }
	}, {
		$addToSet: { users_watching: self._id }
	}, TMERA("Error watch") (doc) ->
		if not doc
			logger.debug('Watching already there?', res.id)
			return cb(null, null)
		cb(null, doc)

unwatchPost = (self, res, cb) ->
	please {$model:User}, {$model:Post}, '$isFn'

	Post.findOneAndUpdate {
		_id: ''+res._id, users_watching: self._id
	}, {
		$pull: { users_watching: self._id }
	}, TMERA("Error unwatch") (doc) ->
		if not doc
			logger.debug('Watching not there?', res.id)
			return cb(null, null)
		cb(null, doc)

upvotePost = (self, res, cb) ->
	please {$model:User}, {$model:Post}, '$isFn'
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
	please {$model:User}, {$model:Post}, '$isFn'
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

module.exports = (app) ->

	router = require("express").Router()

	logger = app.get('logger').child({child:'API',dir:'posts'})

	router.use required.login

	router.get '/meta', unspam.limit(1*1000), (req, res, next) ->
		link = req.query.link

		og req.user, link, (err, data) ->
			if err
				console.log(err)
				res.endJSON(error: true, message: "Erro puts.")
			else if data
				console.log data
				res.endJSON(data)
			else
				res.endJSON(null)

	router.post '/', (req, res) ->
		req.parse Post.ParseRules, (err, reqBody) ->
			# Get tags
			assert(reqBody.lab of labs)
			if reqBody.tags and reqBody.lab and labs[reqBody.lab].children
				tags = []
				for tag in reqBody.tags when tag of labs[reqBody.lab].children
					tags.push(tag)
			#
			createPost req.user, {
				type: reqBody.type
				lab: reqBody.lab
				tags: tags
				content: {
					title: reqBody.content.title
					body: reqBody.content.body
					link: reqBody.content.link
				}
			}, req.handleErr404 (doc) ->
				res.endJSON(doc)

##########################################################################################
##########################################################################################

	router.param('postId', (req, res, next, postId) ->
		try
			id = mongoose.Types.ObjectId.createFromHexString(postId);
		catch e
			return next({ type: 'InvalidId', args:'postId', value:postId});
		Post.findOne { _id:id }, req.handleErr404 (post) ->
			req.post = post
			next()
	)

	router.param('treeId', (req, res, next, treeId) ->
		try
			id = mongoose.Types.ObjectId.createFromHexString(treeId);
		catch e
			return next({ type: 'InvalidId', args:'treeId', value:treeId});
		CommentTree.findOne { _id:id }, req.handleErr404 (tree) ->
			req.tree = tree
			next()
	)

	router.param('commentId', (req, res, next, commentId) ->
		try
			id = mongoose.Types.ObjectId.createFromHexString(commentId);
		catch e
			return next({ type: 'InvalidId', args:'commentId', value:commentId});

		if not 'treeId' of req.params
			throw 'Fetching commentId in url with no reference to its tree (no treeId parameter).'
		if not 'tree' of req
			throw 'Fetching commentId in url without tree object in request (no req.tree, as expected).'

		req.comment = new Comment(req.tree.docs.id(id))
		if not req.comment
			return next({ type: 'ObsoleteId', status: 404, args: {commentId: id, treeId: req.param.treeId} })

		next()
	)

##########################################################################################
##########################################################################################

	hashCode = `function() {
  var hash = 0, i, chr, len;
  if (this.length == 0) return hash;
  for (i = 0, len = this.length; i < len; i++) {
    chr   = this.charCodeAt(i);
    hash  = ((hash << 5) - hash) + chr;
    hash |= 0; // Convert to 32bit integer
  }
  return hash;
};`

	router.get '/sign_img_s3', (req, res) ->
		aws = require 'aws-sdk'
		aws.config.update({
			accessKeyId: nconf.get('AWS_ACCESS_KEY_ID'),
			secretAccessKey: nconf.get('AWS_SECRET_ACCESS_KEY')
		})
		s3 = new aws.S3()
		key = req.query.s3_object_name
		key = '/media/posts/uimages/'+req.user.id+'_'+hashCode()
		s3_params = {
			Bucket: nconf.get('S3_BUCKET'),
			Key: key,
			Expires: 60,
			ContentType: req.query.s3_object_type,
			ACL: 'public-read'
		}
		console.log s3_params, {
			accessKeyId: nconf.get('AWS_ACCESS_KEY_ID'),
			secretAccessKey: nconf.get('AWS_SECRET_ACCESS_KEY')
		}
		s3.getSignedUrl 'putObject', s3_params, (err, data) ->
			if err
				console.log('err!', err)
			else
				console.log(data)
				return_data = {
					signed_request: data,
					url: 'https://'+nconf.get('S3_BUCKET')+'.s3.amazonaws.com/'+key
				}
				res.endJSON(return_data)

	router.route('/:postId')
		.get (req, res) ->
			stuffGetPost req.user, req.post, (err, data) ->
				res.endJSON(data: data)
		.put required.selfOwns('post'), (req, res) ->
			post = req.post
			req.parse Post.ParseRules, (err, reqBody) ->
				post.content.body = reqBody.content.body
				post.content.title = reqBody.content.title
				post.updated_at = Date.now()
				if reqBody.tags and post.lab and labs[post.lab].children
					post.tags = []
					console.log('here', reqBody.tags, labs[post.lab].children)
					for tag in reqBody.tags when tag of labs[post.lab].children
						console.log('tag', tag)
						post.tags.push(tag)
					console.log(post.tags)
				post.save req.handleErr (me) ->
					# post.stuff req.handleErr (stuffedPost) ->
					res.endJSON me
		.delete required.selfOwns('post'), (req, res) ->
			req.post.remove (err) ->
				if err
					return req.logger.error('err', err)
				res.endJSON(req.post, error: err?)

	router.post '/:postId/watch', required.selfDoesntOwn('post'),
	unspam.limit(1000), (req, res) ->
		watchPost req.user, req.post, (err, doc) ->
			if err
				req.logger.error("Error watching", err)
				res.endJSON(error: true)
			else if doc
				res.endJSON(watching: req.user.id in doc.users_watching)
			else
				res.endJSON(watching: req.user.id in req.post.users_watching)

	router.post '/:postId/unwatch', required.selfDoesntOwn('post'),
	unspam.limit(1000), (req, res) ->
		unwatchPost req.user, req.post, (err, doc) ->
			if err
				req.logger.error("Error unwatching", err)
				res.endJSON(error: true)
			else if doc
				res.endJSON(watching: req.user.id in doc.users_watching)
			else
				res.endJSON(watching: req.user.id in req.post.users_watching)

	router.post '/:postId/upvote', required.selfDoesntOwn('post'),
	unspam.limit(1000), (req, res) ->
		upvotePost req.user, req.post, (err, doc) ->
			if err
				req.logger.error("Error upvoting", err)
				res.endJSON(error: true)
			else if doc
				res.endJSON(liked: req.user.id in doc.votes)
			else
				res.endJSON(liked: req.user.id in req.post.votes)

	router.post '/:postId/unupvote', required.selfDoesntOwn('post'),
	unspam.limit(1000), (req, res) ->
		unupvotePost req.user, req.post, (err, doc) ->
			if err
				req.logger.error("Error unupvoting", err)
				res.endJSON(error: true)
			else if doc
				res.endJSON(liked: req.user.id in doc.votes)
			else
				res.endJSON(liked: req.user.id in req.post.votes)

	####

	router.route('/:postId/comments')
		.get (req, res) ->
			req.post.getCommentTree req.handleErr (tree) ->
				if tree
					comments = tree.toJSON().docs
					comments.forEach (i) ->
						i._meta =
							liked: !!~i.votes.indexOf(req.user.id)
						delete i.votes
				res.endJSON(data: comments or [], error: false, page: -1) # sending all (page → -1)
		.post (req, res, next) ->
			# TODO: Detect repeated posts and comments!
			req.parse Comment.ParseRules, (err, body) ->
				data = {
					content: {
						body: body.content.body
					}
					replies_to: req.body.replies_to
				}

				req.logger.debug('Adding discussion exchange.')
				commentToPost req.user, req.post, data, (err, doc) ->
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
						'docs.$.updated_at': Date.now()
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
	please {$model:User}, {$model:Post}, '$isFn'

	post.getCommentTree (err, tree) ->
		if err
			console.log('ERRO???', err)
			return cb(err)

		stuffedPost = post.toJSON()
		if tree
			stuffedPost.comments = tree.toJSON().docs.slice()
			stuffedPost.comments.forEach (i) ->
			  i._meta = { liked: !!~i.votes.indexOf(agent.id) }
			  delete i.votes
		else
			stuffedPost.comments = []

		stuffedPost._meta = {}
		stuffedPost._meta.liked = !!~post.votes.indexOf(agent.id)
		stuffedPost._meta.watching = !!~post.users_watching.indexOf(agent.id)

		async.parallel([
			(done) ->
				agent.doesFollowUser post.author.id, (err, val) ->
					# Fail silently.
					if err
						val = false
						logger.error('Error retrieving doesFollowUser value', err)
					stuffedPost._meta.authorFollowed = val
					done()
			(done) ->
				redis.incr post.getCacheField('Views'), (err, count) ->
					if err
						logger.error('Error retrieving views count', err)
					else
						stuffedPost._meta.views = count
					done()
		], (err, results) ->
			cb(err, stuffedPost)
		)

mongoose = require 'mongoose'
required = require 'src/core/required.js'
_ = require 'underscore'

please = require 'src/lib/please.js'
please.args.extend(require 'src/models/lib/pleaseModels.js')
jobs = require 'src/config/kue.js'

Resource = mongoose.model 'Resource'
User = Resource.model 'User'
Post = Resource.model 'Post'
Comment = Resource.model 'Comment'
CommentTree = Resource.model 'CommentTree'
Notification = Resource.model 'Notification'

logger = null

ObjectId = mongoose.Types.ObjectId

# replyToComment = (me, parent, data, cb) ->
# 	please.args({$isModel:User}, {$isModel:Post},{$contains:['content','replies_to']}, '$isCb')

# 	commentToPost (err, doc) ->
# 		Notification.Trigger(me, Notification.Types.PostComment)(doc, parent, ->)

createTree = (parent, cb) ->
	please.args({$isModel:Post})

	logger.debug('Creating comment_tree for post %s', parent._id)
	tree = new CommentTree {
		parent: parent._id
	}
	tree.save (err, tree) ->
		if err
			logger.error(err, 'Failed to save comment_tree (for post %s)', parent._id)
			return cb(err)
		parent.update { comment_tree: tree._id }, (err, updated) ->
			if err
				logger.error(err, 'Failed to update post %s with comment_tree attr', parent._id)
				return cb(err)
			cb(false, tree)


###
Create a post object with type comment.
###
commentToPost = (me, parent, data, cb) ->
	please.args({$isModel:User}, {$isModel:Post},{$contains:['content']}, '$isCb')

	if not parent.comment_tree
		createTree parent, (err, tree) ->
			if err
				throw "PQP"
			parent.comment_tree = tree._id
			commentToPost(me, parent, data, cb)
		return

	logger.debug('commentToPost(id=%s) with comment_tree(id=%s)', parent._id, parent.comment_tree)
	
	comment = new Comment({
		author: User.toAuthorObject(me)
		content: {
			body: data.content.body
		}
		tree: parent.comment_tree
		parent: parent._id
		replies_to: null
		replies_users: null
	})

	# Atomically push Comment to CommentTree
	CommentTree.findOneAndUpdate { _id: parent.comment_tree }, {$push: { docs : comment }}, (err, doc) ->
		if err
			logger.error(err, 'Failed to push comment to CommentTree')
			return cb(err)
		if not doc
			logger.warn('CommentTree %s of parent %s not found. Failed to push comment.',
				parent.comment_tree, parent._id)
			createTree parent, (err, tree) ->
				if err
					logger.warn("Erro ao insistir em criar árvore.");
					return cb(err)
				else
					parent.comment_tree = tree._id
					commentToPost(me, parent, data, cb)
			return
		cb(null, comment)
		# Notification.Trigger(me, Notification.Types.PostComment)(doc, parent, ->)

upvoteComment = (me, res, cb) ->
	please.args({$isModel:User}, {$isModel:Comment}, '$isCb')
	done = (err, docs) ->
		cb(err, docs)
	Comment.findOneAndUpdate {_id: ''+res.id}, {$push: {votes: me._id}}, done

unupvoteComment = (me, res, cb) ->
	please.args({$isModel:User}, {$isModel:Comment}, '$isCb')
	done = (err, docs) ->
		cb(err, docs)
	Comment.findOneAndUpdate {_id: ''+res.id}, {$pull: {votes: me._id}}, done

################################################################################
################################################################################

createPost = (self, data, cb) ->
	please.args({$isModel:User}, {$contains:['content','type','subject']}, '$isCb')
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
	post.save (err, post) =>
		# use asunc.parallel to run a job
		# Callback now, what happens later doesn't concern the user.
		cb(err, post)
		if err then return

		self.update { $inc: { 'stats.posts': 1 }}, ->

upvotePost = (self, res, cb) ->
	please.args({$isModel:User}, {$isModel:Post}, '$isCb')
	if ''+res.author.id == ''+self.id
		cb()
		return

	done = (err, docs) ->
		cb(err, docs)
		if not err and jobs
			jobs.create('post upvote', {
				title: "New upvote: #{self.name} → #{res.id}",
				authorId: res.author.id,
				post: res,
				agent: self,
			}).save()
	Post.findOneAndUpdate {_id: ''+res.id}, {$push: {votes: self._id}}, done

unupvotePost = (self, res, cb) ->
	please.args({$isModel:User}, {$isModel:Post}, '$isCb')
	if ''+res.author.id == ''+self.id
		cb()
		return

	done = (err, docs) ->
		cb(err, docs)
		if not err and jobs
			jobs.create('post unupvote', {
				title: "New unupvote: #{self.name} → #{res.id}",
				authorId: res.author.id,
				resource: res,
				agent: self,
			}).save()
	Post.findOneAndUpdate {_id: ''+res.id}, {$pull: {votes: self._id}}, done

################################################################################
################################################################################

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
	# Nevermind my little hack to remove excessive breaks
	str = str.replace(new RegExp("(<br \/>){2,}","gi"), "<br />")
		.replace(/<p>(<br \/>)?<\/p>/gi, '')
		.replace(/<br \/><\/p>/gi, '</p>')
	return str

dryText = (str) -> str.replace(/(\s{1})[\s]*/gi, '$1')
pureText = (str) -> str.replace(/(<([^>]+)>)/ig,"")

pages = require('src/core/pages.js').data

TITLE_MIN = 10
TITLE_MAX = 100
BODY_MIN = 20
BODY_MAX = 20*1000
COMMENT_MIN = 3
COMMENT_MAX = 1000

val = require('validator')

PostRules = {
	subject:
		$valid: (str) ->
			str in _.keys(pages)
	tags:
		$required: false
	type:
		$valid: (str) -> str.toLowerCase() in ['note','discussion']
		$clean: (str) -> # Camelcasify the type
			str = val.stripLow(val.trim(str))
			str[0].toUpperCase()+str.slice(1).toLowerCase()
	content:
		title:
			$valid: (str) -> val.isLength(str, TITLE_MIN, TITLE_MAX)
			$clean: (str) -> val.stripLow(dryText(str))
		body:
			$valid: (str) -> val.isLength(pureText(str), BODY_MIN) and val.isLength(str, 0, BODY_MAX)
			$clean: (str, body) -> val.stripLow(dryText(str))
}

PostCommentRules = {
	content:
		body:
			$valid: (str) -> val.isLength(str, COMMENT_MIN, COMMENT_MAX)
			$clean: (str) -> _.escape(dryText(val.trim(str)))
}

module.exports = (app) ->

	router = require("express").Router()

	logger = app.get('logger').child({child:'API',dir:'posts'})

	router.use required.login

	router.post '/', (req, res) ->
		# Parse
		req.parse PostRules, (err, reqBody) ->
			body = sanitizeBody(reqBody.content.body, reqBody.type)
			req.logger.error reqBody.subject
			if reqBody.subject and pages[reqBody.subject]?.children?.length
				tags = tag for tag in reqBody.tags when tag in pages[reqBody.subject].children
			createPost req.user, {
				type: reqBody.type
				subject: reqBody.subject
				tags: tags
				content: {
					title: reqBody.content.title
					body: body
				}
			}, req.handleErrResult (doc) ->
				res.endJSON(doc)

	##########################################################################################################
	##########################################################################################################

	router.param('postId', (req, res, next, postId) ->
		try
			id = mongoose.Types.ObjectId.createFromHexString(postId);
		catch e
			return next({ type: "InvalidId", args:'postId', value:postId});
		Post.findOne { _id:postId }, req.handleErrResult (post) ->
			req.post = post
			next()
	)

	router.param('treeId', (req, res, next, treeId) ->
		try
			id = mongoose.Types.ObjectId.createFromHexString(treeId);
		catch e
			return next({ type: "InvalidId", args:'treeId', value:treeId});
		CommentTree.findOne { _id:treeId }, req.handleErrResult (tree) ->
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

		req.comment = Comment.fromObject(req.tree.docs.id(id))
		next()
	)

	##########################################################################################################
	##########################################################################################################

	router.route('/:postId')
		.get (req, res) ->
			post = req.post
			post.stuff req.handleErrResult (stuffedPost) ->
				if req.user
					req.user.doesFollowUser post.author.id, (err, val) ->
						res.endJSON( data: _.extend(stuffedPost, { _meta: { authorFollowed: val } }))
				else
					res.endJSON( data: _.extend(stuffedPost, { _meta: null }))
		.put required.resources.selfOwns('postId'), (req, res) ->
			post = req.post
			# if post.type is 'Comment' # Prevent users from editing of comments.
			# 	return res.status(403).endJSON({error:true, msg:''})
			# if post.parent
				# req.parse PostChildRules, (err, reqBody) ->
				# 	post.content.body = sanitizeBody(reqBody.content.body, post.type)
				# 	post.updated_at = Date.now()
				# 	post.save req.handleErrResult (me) ->
				# 		post.stuff req.handleErrResult (stuffedPost) ->
				# 			res.endJSON stuffedPost
			# else
			req.parse PostRules, (err, reqBody) ->
				post.content.body = sanitizeBody(reqBody.content.body, post.type)
				post.content.title = reqBody.content.title
				post.updated_at = Date.now()
				if post.subject
					post.tags = (tag for tag in reqBody.tags when tag in pages[post.subject].children)
				post.save req.handleErrResult (me) ->
					post.stuff req.handleErrResult (stuffedPost) ->
						res.endJSON stuffedPost
		.delete required.resources.selfOwns('postId'), (req, res) ->
			doc = req.post
			doc.remove (err) ->
				if err
					req.logger.error('err', err)
				res.endJSON(doc, error: err)
	
	router.route('/:postId/upvote')
		.post (required.resources.selfDoesntOwn('postId')), (req, res) ->
			upvotePost req.user, req.post, (err, doc) ->
				res.endJSON { error: err, data: doc }

	router.route('/:postId/unupvote')
		.post (required.resources.selfDoesntOwn('postId')), (req, res) ->
			unupvotePost req.user, req.post, (err, doc) ->
				res.endJSON { error: err, data: doc }

	router.route('/:postId/comments')
		.get (req, res) ->
			post = req.post
			post.getComments req.handleErrResult (comments) =>
				res.endJSON {
					data: comments
					error: false
					page: -1 # sending all
				}
		.post (req, res, next) ->
			req.parse PostCommentRules, (err, body) ->
				# Detect repeated posts and comments!
				commentToPost req.user, req.post, { content: {body:body.content.body} }, (err, doc) =>
					if err
						return next(err)
					else
						res.endJSON(error:false, data:doc)

	##########################################################################################################
	##########################################################################################################

	router.route('/:treeId/:commentId')
		.get (req, res) -> 0
		.delete required.selfOwns('comment'), (req, res, next) ->
			deleted = req.tree.docs.id(req.params.commentId)
			req.tree.docs.pull(req.params.commentId)
			req.tree.save (err, doc) ->
				if err
					req.logger.error('...', err)
					return next(err)
				# Now remove document itself (triggering hooks)
				deleted.remove (err) ->
					console.log('removed')
					if err
						req.logger.error('Error saving tree', err)
						return next(err)
					res.endJSON(data:null, error: false)

		.put required.selfOwns('comment'), (req, res, next) ->
			comment = req.comment
			req.parse PostChildRules, (err, reqBody) ->
				comment.content.body = sanitizeBody(reqBody.content.body, 'Comment')
				comment.meta.updated_at = Date.now()
				comment.save req.handleErrResult (me) ->
					res.endJSON comment.toJSON()

	router.post '/:treeId/:commentId/upvote', required.selfDoesntOwn('comment'), (req, res) ->
		upvoteComment req.user, req.comment, (err, doc) ->
			res.endJSON { error: err, data: doc }

	router.post '/:treeId/:commentId/unupvote', required.selfDoesntOwn('comment'), (req, res) ->
		unupvoteComment req.user, req.comment, (err, doc) ->
			res.endJSON { error: err, data: doc }


	return router
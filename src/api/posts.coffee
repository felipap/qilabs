
mongoose = require 'mongoose'
_ = require 'underscore'
required = require 'src/core/required.js'
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

extendErr = (err, label) ->
	_.extend(err,{required:(err.required||[]).concat(label)})

# replyToComment = (me, parent, data, cb) ->
# 	please.args({$isModel:User}, {$isModel:Post},{$contains:['content','replies_to']}, '$isCb')

createTree = (parent, cb) ->
	please.args({$isModel:Post}, '$isCb')

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

commentToPost = (me, parent, data, cb) ->
	###
	I've tried my best to make this function atomic, to no success.
	###
	please.args({$isModel:User}, {$isModel:Post}, {$contains:['content']}, '$isCb')

	if not parent.comment_tree
		createTree parent, (err, tree) ->
			if err
				throw "PQP"+err
			parent.comment_tree = tree._id
			commentToPost(me, parent, data, cb)
		return

	CommentTree.findOne { _id: parent.comment_tree }, (err, tree) ->
		if err
			logger.error('Failed to find tree (id=%s)', parent.comment_tree, err)
		if not tree
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

		# Using new Comment({...}) here is leading to RangeError on server. #WTF
		comment = tree.docs.create({
			author: User.toAuthorObject(me)
			content: {
				body: data.content.body
			}
			tree: parent.comment_tree
			parent: parent._id
			replies_to: null
			replies_users: null
		})
		logger.debug('commentToPost(id=%s) with comment_tree(id=%s)', parent._id, parent.comment_tree)
		logger.debug('pre:findOneAndUpdate _id: %s call', parent.comment_tree)

		# Atomically push comment to commentTree
		# BEWARE: the comment object won't be validated, since we're not pushing it to the tree object and saving.
		# CommentTree.findOneAndUpdate { _id: tree._id }, {$push: { docs : comment }}, (err, tree) ->

		# Non-atomically saving comment to comment tree
		# Atomic version is leading to "RangeError: Maximum call stack size exceeded" on heroku.
		tree.docs.push(comment)
		tree.save (err) ->
			if err
				logger.error('Failed to push comment to CommentTree', err)
				return cb(err)
			# Triggering this job inside the pre/post 'save' middlware won't work, because findOneAndUpdate
			# (the atomic alternative to push/save) doesn't activate mongoose's middlewares.
			jobs.create('post children', {
				title: "New comment: #{comment.author.name} posted #{comment.id} to #{parent._id}",
				post: comment,
			}).save()
			cb(null, comment)
			console.log(comment instanceof Resource)
			Notification.Trigger(me, Notification.Types.PostComment)(Comment.fromObject(comment), parent, ->)


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

######################################################################################################
######################################################################################################

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
	post.save (err, post) ->
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
	# Don't mind my little hack to remove excessive breaks
	str = str.replace(new RegExp("(<br \/>){2,}","gi"), "<br />")
		.replace(/<p>(<br \/>)?<\/p>/gi, '')
		.replace(/<br \/><\/p>/gi, '</p>')
	return str

pages = require('src/core/pages.js').data

module.exports = (app) ->

	router = require("express").Router()

	logger = app.get('logger').child({child:'API',dir:'posts'})

	router.use required.login

	router.post '/', (req, res) ->
		req.parse Post.ParseRules, (err, reqBody) ->
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
			}, req.handleErr404 (doc) ->
				res.endJSON(doc)

	##########################################################################################################
	##########################################################################################################

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

		req.comment = Comment.fromObject(req.tree.docs.id(id))
		next()
	)

	##########################################################################################################
	##########################################################################################################

	router.route('/:postId')
		.get (req, res) ->
			req.post.stuff req.handleErr404 (stuffedPost) ->
				if req.user
					req.user.doesFollowUser req.post.author.id, (err, val) ->
						# Fail silently.
						if err
							val = false
							logger.error("Error retrieving doesFollowUser value", err)
						res.endJSON(data: _.extend(stuffedPost, { _meta: { authorFollowed: val } }))
				else
					res.endJSON(data: _.extend(stuffedPost, { _meta: null }))
		.put required.selfOwns('post'), (req, res) ->
			post = req.post
			req.parse Post.ParseRules, (err, reqBody) ->
				post.content.body = sanitizeBody(reqBody.content.body, post.type)
				post.content.title = reqBody.content.title
				post.updated_at = Date.now()
				if post.subject
					post.tags = (tag for tag in reqBody.tags when tag in pages[post.subject].children)
				post.save req.handleErr (me) ->
					post.stuff req.handleErr (stuffedPost) ->
						res.endJSON stuffedPost
		.delete required.selfOwns('post'), (req, res) ->
			req.post.remove (err) ->
				if err
					return req.logger.error('err', err)
				res.endJSON(req.post, error: err)
	
	router.post '/:postId/upvote', required.selfDoesntOwn('post'), (req, res) ->
		upvotePost req.user, req.post, (err, doc) ->
			res.endJSON { error: err?, data: doc }

	router.post '/:postId/unupvote', required.selfDoesntOwn('post'), (req, res) ->
		unupvotePost req.user, req.post, (err, doc) ->
			res.endJSON { error: err?, data: doc }

	router.route('/:postId/comments')
		.get (req, res) ->
			req.post.getComments req.handleErr404 (comments) ->
				res.endJSON(data: comments, error: false, page: -1) # sending all (page → -1)
		.post (req, res, next) ->
			req.parse Comment.ParseRules, (err, body) ->
				# TODO: Detect repeated posts and comments!
				commentToPost req.user, req.post, { content: {body:body.content.body} }, (err, doc) ->
					if err
						return next(err)
					res.endJSON(error:false, data:doc)

	##########################################################################################################
	##########################################################################################################

	router.route('/:treeId/:commentId')
		# .get (req, res) -> 0
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
					res.endJSON { data: null, error: false }

		.put required.selfOwns('comment'), (req, res, next) ->
			comment = req.comment
			req.parse PostChildRules, (err, reqBody) ->
				comment.content.body = reqBody.content.body
				comment.meta.updated_at = Date.now()
				comment.save req.handleErr404 (me) ->
					res.endJSON comment.toJSON()

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
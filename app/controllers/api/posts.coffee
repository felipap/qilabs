
mongoose = require 'mongoose'
_ = require 'lodash'
assert = require 'assert'
async = require 'async'
validator = require 'validator'

required = require '../lib/required'
please = require 'app/lib/please.js'
redis = require 'app/config/redis.js'
labs = require 'app/data/labs'

unspam = require '../lib/unspam'
og = require 'app/lib/og'

User = mongoose.model 'User'
Post = mongoose.model 'Post'
Comment = mongoose.model 'Comment'
CommentTree = mongoose.model 'CommentTree'

{
	commentToPost
	deleteComment
	upvoteComment
	unupvoteComment
	createPost
	watchPost
	unwatchPost
	upvotePost
	unupvotePost
	stuffGetPost
} = require 'app/actions/posts'

module.exports = (app) ->

	router = require("express").Router()

	logger = app.get('logger').child({child:'API',dir:'posts'})

	# router.use required.login

	router.get '/meta', required.login, unspam.limit(1*1000), (req, res, next) ->
		# Get facebook meta about a link
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

	router.post '/', required.login, (req, res) ->
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
					images: req.body.content.images or []
					link: reqBody.content.link
				}
			}, req.handleErr404 (doc) ->
				res.endJSON(doc)

	##############################################################################
	##############################################################################

	router.param 'postId', (req, res, next, postId) ->
		try
			id = mongoose.Types.ObjectId.createFromHexString(postId);
		catch e
			return next({ type: 'InvalidId', args:'postId', value:postId});
		Post.findOne { _id:id }, req.handleErr404 (post) ->
			req.post = post
			next()

	router.param 'treeId', (req, res, next, treeId) ->
		try
			id = mongoose.Types.ObjectId.createFromHexString(treeId);
		catch e
			return next({ type: 'InvalidId', args:'treeId', value:treeId});
		CommentTree.findOne { _id:id }, req.handleErr404 (tree) ->
			req.tree = tree
			next()

	router.param 'commentId', (req, res, next, commentId) ->
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
			return next {
				type: 'ObsoleteId'
				status: 404
				args: {commentId: id, treeId: req.param.treeId}
			}
		if req.comment.deleted
			# Prevent interactions with deleted post.
			# FIXME: Is this OK?
			return res.endJSON()

		next()

	##############################################################################
	##############################################################################

	# Sign
	router.get '/sign_img_s3', required.login, unspam.limit(1*1000), (req, res) ->
		aws = require 'aws-sdk'
		crypto = require 'crypto'

		req.logger.warn "Faz check aqui, felipe"

		aws.config.update({
			accessKeyId: nconf.get('AWS_ACCESS_KEY_ID'),
			secretAccessKey: nconf.get('AWS_SECRET_ACCESS_KEY')
		})
		s3 = new aws.S3()
		key = req.query.s3_object_name
		key = 'media/posts/uimages/'+crypto.randomBytes(10).toString('hex')
		s3_params = {
			Bucket: nconf.get('S3_BUCKET'),
			Key: key,
			Expires: 60,
			# post: req.query.,
			Metadata: {
				'uploader': req.user.id,
			},
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

	router.get '/:postId', (req, res) ->
		stuffGetPost req.user, req.post, (err, data) ->
			res.endJSON(data: data)

	router.put '/:postId', required.login, required.self.canEdit('post'),
	(req, res) ->
		post = req.post
		req.parse Post.ParseRules, (err, reqBody) ->
			post.content.body = reqBody.content.body
			post.content.title = reqBody.content.title
			post.content.images = req.body.content.images or []
			req.logger.warn("Faz o checkzinho aqui tb, felipe")

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

	router.delete '/:postId', required.login, required.selfOwns('post'),
	(req, res) ->
		req.post.remove (err) ->
			if err
				req.logger.error("Error removing", req.problem, err)
				res.endJSON(error: true)
			else
				res.endJSON(error: false)

	##

	router.post '/:postId/watch', required.login, required.selfDoesntOwn('post'),
	unspam.limit(1000), (req, res) ->
		watchPost req.user, req.post, (err, doc) ->
			if err
				req.logger.error("Error watching", err)
				res.endJSON(error: true)
			else if doc
				res.endJSON(watching: req.user.id in doc.users_watching)
			else
				res.endJSON(watching: req.user.id in req.post.users_watching)

	router.post '/:postId/unwatch', required.login, required.selfDoesntOwn('post'),
	unspam.limit(1000), (req, res) ->
		unwatchPost req.user, req.post, (err, doc) ->
			if err
				req.logger.error("Error unwatching", err)
				res.endJSON(error: true)
			else if doc
				res.endJSON(watching: req.user.id in doc.users_watching)
			else
				res.endJSON(watching: req.user.id in req.post.users_watching)

	##

	router.post '/:postId/upvote', required.login, required.selfDoesntOwn('post'),
	unspam.limit(1000), (req, res) ->
		upvotePost req.user, req.post, (err, doc) ->
			if err
				req.logger.error("Error upvoting", err)
				res.endJSON(error: true)
			else if doc
				res.endJSON(liked: req.user.id in doc.votes)
			else
				res.endJSON(liked: req.user.id in req.post.votes)

	router.post '/:postId/unupvote', required.login, required.selfDoesntOwn('post'),
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

	router.get '/:postId/comments', (req, res) ->
		req.post.getCommentTree req.handleErr (tree) ->
			if tree
				comments = tree.toJSON().docs
				comments.forEach (i) ->
					i._meta =
						liked: !!~i.votes.indexOf(req.user.id)
					delete i.votes
			# sending all (page → -1)
			res.endJSON(data: comments or [], error: false, page: -1)

	router.post '/:postId/comments', required.login, (req, res, next) ->
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

	##############################################################################
	##############################################################################

	router.delete '/:treeId/:commentId',
	required.login,
	required.selfOwns('comment'),
	(req, res, next) ->
		deleteComment req.user, req.comment, req.tree, (err, result) ->
			res.endJSON { data: null, error: err? }

	# I don't want to retrieve neither the tree or the comment object, so I
	# changed the parameter names.
	router.put '/:treeId2/:commentId2',
	required.login,
	(req, res, next) ->
		req.parse Comment.ParseRules, (err, reqBody) ->
			# Atomic. Thank Odim.
			# THINK: should it update author object on save?

			# CommentTree.findOneAndUpdate {
			# 		_id: req.params.treeId2,
			# 		'docs._id': req.params.commentId2,
			# 		'docs.author.id': req.user._id
			# 		'docs.deleted': false
			# 	},
			# 	{
			# 		$set: {
			# 			'docs.$.content.body': reqBody.content.body,
			# 			'docs.$.updated_at': Date.now()
			# 		}
			# 	}, (err, tree) ->
			# 		comment = new Comment(tree.docs.id(req.params.commentId2))
			# 		res.endJSON(comment)

	router.post '/:treeId/:commentId/upvote',
	required.login,
	required.selfDoesntOwn('comment'),
	(req, res, next) ->
		upvoteComment req.user, req.comment, (err, doc) ->
			if err
				return next(err)
			res.endJSON { error: false, data: doc }

	router.post '/:treeId/:commentId/unupvote',
	required.login,
	required.selfDoesntOwn('comment'),
	(req, res, next) ->
		unupvoteComment req.user, req.comment, (err, doc) ->
			if err
				return next(err)
			res.endJSON { error: false, data: doc }

	return router
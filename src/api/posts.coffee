
mongoose = require 'mongoose'
required = require 'src/lib/required.js'
_ = require 'underscore'

please = require 'src/lib/please.js'
please.args.extend(require 'src/models/lib/pleaseModels.js')
jobs = require 'src/config/kue.js'

Resource = mongoose.model 'Resource'
User = Resource.model 'User'
Post = Resource.model 'Post'
Notification = Resource.model 'Notification'

##

################################################################################
## related to the Posting ######################################################

###
Create a post object with type comment.
###
postToParentPost = (self, parent, data, cb) ->
	please.args({$isModel:User}, {$isModel:Post},{$contains:['content','type']}, '$isCb')
	# Detect repeated posts and comments!
	comment = new Post {
		author: User.toAuthorObject(self)
		content: {
			body: data.content.body
		}
		parent: parent
		type: data.type
	}
	comment.save (err, doc) ->
		return cb(err) if err
		cb(null, doc)

		Notification.Trigger(self, Notification.Types.PostComment)(comment, parent, ->)

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
		console.log('post save:', err, post)
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
		console.log err, docs
		cb(err, docs)
		if not err
			jobs.create('post upvote', {
				title: "New upvote: #{self.name} → #{res.id}",
				authorId: res.author.id,
				resource: res,
				agent: self,
			}).save()
	Post.findOneAndUpdate {_id: ''+res.id}, {$push: {votes: self._id}}, done

unupvotePost = (self, res, cb) ->
	please.args({$isModel:User}, {$isModel:Post}, '$isCb')
	if ''+res.author.id == ''+self.id
		cb()
		return

	done = (err, docs) ->
		console.log err, docs
		cb(err, docs)
		if not err
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
	console.log(body, str)
	return str

dryText = (str) -> str.replace(/(\s{1})[\s]*/gi, '$1')
pureText = (str) -> str.replace(/(<([^>]+)>)/ig,"")

pages = require('src/config/pages.js').data

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


nestify = (obj) ->
	router = require('express').Router(mergeParams: true)

	expectArray = (obj) ->
		if obj instanceof Array
			return obj
		return [obj]

	for attr in ['get', 'post', 'put', 'delete']
		if attr of obj
			console.log attr
			router[attr].apply router, ['/'].concat(expectArray(obj[attr]))

	if 'children' of obj
		for path, val of obj.children
			router.use(path, nestify(val))

	return router

module.exports = (app) ->

	express = require("express")
	router = express.Router()
	router.use required.login
	router.post '/', (req, res) ->
		# Parse
		req.parse PostRules, (err, reqBody) ->
			body = sanitizeBody(reqBody.content.body, reqBody.type)
			console.log reqBody.subject
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
				res.endJson(doc)

	router.param('postId', (req, res, next, postId) ->
		try
			id = mongoose.Types.ObjectId.createFromHexString(postId);
		catch e
			return next({ type: "InvalidId", args:'postId', value:postId});
		Post.findOne { _id:postId }, req.handleErrResult (post) ->
			req.post = post
			next()
	)

	router.route('/:postId')
		.get (req, res) ->
			post = req.post
			post.stuff req.handleErrResult (stuffedPost) ->
				if req.user
					req.user.doesFollowUser post.author.id, (err, val) ->
						res.endJson( data: _.extend(stuffedPost, { _meta: { authorFollowed: val } }))
				else
					res.endJson( data: _.extend(stuffedPost, { _meta: null }))
		.put required.posts.selfOwns('postId'), (req, res) ->
			post = req.post
			if post.type is 'Comment' # Prevent users from editing of comments.
				return res.status(403).endJson({error:true, msg:''})
			if post.parent
				req.parse PostChildRules, (err, reqBody) ->
					post.content.body = sanitizeBody(reqBody.content.body, post.type)
					post.updated_at = Date.now()
					post.save req.handleErrResult (me) ->
						post.stuff req.handleErrResult (stuffedPost) ->
							res.endJson stuffedPost
			else
				req.parse PostRules, (err, reqBody) ->
					post.content.body = sanitizeBody(reqBody.content.body, post.type)
					post.content.title = reqBody.content.title
					post.updated_at = Date.now()
					if post.subject
						post.tags = (tag for tag in reqBody.tags when tag in pages[post.subject].children)
					post.save req.handleErrResult (me) ->
						post.stuff req.handleErrResult (stuffedPost) ->
							res.endJson stuffedPost
		.delete required.posts.selfOwns('postId'), (req, res) ->
			doc = req.post
			doc.remove (err) ->
				if err
					console.log('err', err)
				res.endJson(doc, error: err)
	
	router.route(':postId/upvote')
		.post (required.posts.selfDoesntOwn('id')), (req, res) ->
			post = req.post
			upvotePost req.user, post, (err, doc) ->
				res.endJson { error: err, data: doc }

	router.route(':postId/unupvote')
		.post (required.posts.selfDoesntOwn('id')), (req, res) ->
			post = req.post
			unupvotePost req.user, post, (err, doc) ->
				res.endJson { error: err, data: doc }

	router.route('/:postId/comments')
		.get (req, res) ->
			post = req.post
			post.getComments req.handleErrResult (comments) =>
				res.endJson {
					data: comments
					error: false
					page: -1 # sending all
				}
		.post (req, res) ->
			req.parse PostCommentRules, (err, body) ->
				data = {
					content: {
						body: body.content.body
					}
					type: Post.Types.Comment
				}
				parent = req.post
				postToParentPost req.user, parent, data,
					req.handleErrResult (doc) =>
						res.endJson(error:false, data:doc)

	return router

mongoose = require 'mongoose'
required = require 'src/lib/required.js'
_ = require 'underscore'

Resource = mongoose.model 'Resource'
User = Resource.model 'User'
Post = Resource.model 'Post'

##

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
			when Post.Types.Answer
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

tagMap = require('src/config/tags.js').data

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
			str in ['application', 'mathematics']
	tags:
		$required: false
		$clean: (tags) -> tag for tag in tags when tag in _.keys(tagMap)
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

PostAnswerRules = {
	content:
		body:
			$valid: (str) -> val.isLength(pureText(str), BODY_MIN) and val.isLength(str, 0, BODY_MAX)
			$clean: (str, body) -> val.stripLow(dryText(str))
}

PostCommentRules = {
	content:
		body:
			$valid: (str) -> val.isLength(str, COMMENT_MIN, COMMENT_MAX)
			$clean: (str) -> _.escape(dry(val.trim(str)))
}

module.exports = {

	permissions: [required.login],

	post: (req, res) ->
		# Parse
		req.parse PostRules, (err, reqBody) ->
			body = sanitizeBody(reqBody.content.body, reqBody.type)
			req.user.createPost {
				type: reqBody.type,
				tags: reqBody.tags,
				content: {
					title: reqBody.content.title
					body: body
				}
			}, req.handleErrResult((doc) ->
				res.endJson doc
			)

	children: {
		'/:id': {
			get: (req, res) ->
				return unless postId = req.paramToObjectId('id')
				Post.findOne { _id:postId }, req.handleErrResult((post) ->
					post.stuff req.handleErrResult (stuffedPost) ->
						if req.user
							req.user.doesFollowUser stuffedPost.author.id, (err, val) ->
								res.endJson( data: _.extend(stuffedPost, { meta: { followed: val } }))
						else
							res.endJson( data: _.extend(stuffedPost, { meta: null }))
				)

			put: [required.posts.selfOwns('id'),
				(req, res) ->
					return if not postId = req.paramToObjectId('id')
					Post.findById postId, req.handleErrResult (post) =>
						if post.type is 'Comment' # Prevent users from editing of comments.
							return res.status(403).endJson({error:true, msg:''})

						if post.parentPost
							req.parse PostChildRules, (err, reqBody) ->
								post.content.body = sanitizeBody(reqBody.content.body, post.type)
								post.updated = Date.now()
								post.save req.handleErrResult (me) ->
									post.stuff req.handleErrResult (stuffedPost) ->
										res.endJson stuffedPost
						else
							req.parse PostRules, (err, reqBody) ->
								post.content.body = sanitizeBody(reqBody.content.body, post.type)
								post.content.title = reqBody.content.title
								post.updated = Date.now()
								post.tags = reqBody.tags
								post.save req.handleErrResult (me) ->
									post.stuff req.handleErrResult (stuffedPost) ->
										res.endJson stuffedPost
				]

			delete: [required.posts.selfOwns('id'),
				(req, res) ->
					return if not postId = req.paramToObjectId('id')
					Post.findOne {_id: postId, 'author.id': req.user.id},
						req.handleErrResult (doc) ->
							doc.remove (err) ->
								if err
									console.log('err', err)
								res.endJson(doc, error: err)
				]

			children: {
				'/upvote':
					post: [required.posts.selfDoesntOwn('id'),
						(req, res) ->
							return if not postId = req.paramToObjectId('id')
							Post.findById postId, req.handleErrResult (post) =>
								req.user.upvotePost post, (err, doc) ->
									res.endJson { error: err, data: doc }
					]
				'/unupvote':
					post: [required.posts.selfDoesntOwn('id'),
						(req, res) ->
							return if not postId = req.paramToObjectId('id')
							Post.findById postId, req.handleErrResult (post) =>
								req.user.unupvotePost post, (err, doc) ->
									res.endJson { error: err, data: doc }
					]
				'/comments':
					get: (req, res) ->
						return if not postId = req.paramToObjectId('id')
						Post.findById postId
							.exec req.handleErrResult (post) ->
								post.getComments req.handleErrResult((comments) =>
									res.endJson {
										data: comments
										error: false
										page: -1 # sending all
									}
								)
					# post: [required.posts.selfCanComment('id'), (req, res) ->
					post: [(req, res) ->
						return if not postId = req.paramToObjectId('id')
						req.parse PostCommentRules, (err, body) ->
							data = {
								content: {
									body: body.content.body
								}
								type: Post.Types.Comment
							}

							Post.findById postId, req.handleErrResult (parentPost) =>
								req.user.postToParentPost parentPost, data,
									req.handleErrResult (doc) =>
										res.endJson(error:false, data:doc)
					]
			}
		},
	},
}
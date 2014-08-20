
mongoose = require 'mongoose'
required = require 'src/lib/required.js'

Resource = mongoose.model 'Resource'

_ = require 'underscore'

User = Resource.model 'User'
Post = Resource.model 'Post'
Problem = Resource.model 'Problem'

##

defaultSanitizerOptions = {
	# To be added: 'pre', 'caption', 'hr', 'code', 'strike', 
	allowedTags: ['h1','h2','b','em','strong','a','img','u','ul','li', 'blockquote', 'p', 'br', 'i'], 
	allowedAttributes: {
		'a': ['href'],
		'img': ['src'],
	},
	# selfClosing: [ 'img', 'br', 'hr', 'area', 'base', 'basefont', 'input', 'link', 'meta' ],
	selfClosing: ['img', 'br'],
	transformTags: {
		'b': 'strong',
		'i': 'em',
	},
	exclusiveFilter: (frame) ->
		return frame.tag in ['a','span'] and not frame.text.trim()
}

sanitizeBody = (body, type) ->
	sanitizer = require 'sanitize-html'
	getSanitizerOptions = (type) ->
		switch type
			when Post.Types.Question
				return _.extend({}, defaultSanitizerOptions, {
					allowedTags: ['b','em','strong','a','u','ul','blockquote','p','img','br','i','li'],
				})
			when Post.Types.Answer
				return _.extend({}, defaultSanitizerOptions, {
					allowedTags: ['b','em','strong','a','u','ul','blockquote','p','img','br','i','li'],
				})
			else
				return defaultSanitizerOptions
		return defaultSanitizerOptions
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

ProblemRules = {
	subject:
		$valid: (str) ->
			str in ['application', 'mathematics']
	tags:
		$required: false
		$clean: (tags) ->
			tag for tag in tags when tag in _.keys(tagMap)
	content:
		title:
			$valid: (str) ->
				val.isLength(str, TITLE_MIN, TITLE_MAX)
			$clean: (str) ->
				val.stripLow(dryText(str))
		body:
			$valid: (str) ->
				val.isLength(pureText(str), BODY_MIN) and val.isLength(str, 0, BODY_MAX)
			$clean: (str) ->
				val.stripLow(dryText(str))
		answer:
			options:
				$valid: (str) ->
					true
			is_mc:
				$valid: (str) ->
					true
}

module.exports = {
	permissions: [required.login],
	post: (req, res) ->
		req.parse ProblemRules, (err, reqBody) ->
			body = sanitizeBody(reqBody.content.body)
			console.log reqBody, reqBody.content.answer
			req.user.createProblem {
				subject: 'mathematics'
				topics: ['combinatorics']
				content: {
					title: reqBody.content.title
					body: body
					source: reqBody.content.source
					answer: {
						is_mc: true
						options: reqBody.content.answer.options
						value: 0
					}
				}
			}, req.handleErrResult (doc) ->
				res.endJson doc

	children: {
		'/:id': {
			get: (req, res) ->
				return unless id = req.paramToObjectId('id')
				Problem.findOne { _id:id }, req.handleErrResult((doc) ->
					res.endJson(data: doc)
					# res.endJson( data: _.extend(post, { meta: null }))
					# post.stuff req.handleErrResult (stuffedPost) ->
					# 	if req.user
					# 		req.user.doesFollowUser stuffedPost.author.id, (err, val) ->
					# 			res.endJson( data: _.extend(stuffedPost, { meta: { followed: val } }))
					# 	else
					# 		res.endJson( data: _.extend(stuffedPost, { meta: null }))
				)

			put: [required.problems.selfOwns('id'),
				(req, res) ->
					return if not problema = req.paramToObjectId('id')
					Problem.findById problema, req.handleErrResult (problem) ->
						req.parse ProblemRules, (err, reqBody) ->
							body = sanitizeBody(reqBody.content.body)
							console.log reqBody, reqBody.content.answer

							problem.updated_at = Date.now()
							# problem.topics = reqBody.topics
							# problem.subject = reqBody.subject
							problem.content.title = reqBody.content.title
							problem.content.body = reqBody.content.body
							problem.content.source = reqBody.content.source
							problem.content.answer = {
								options: reqBody.content.answer.options
								is_mc: reqBody.content.answer.is_mc
								value: reqBody.content.answer.value
							}
							problem.save req.handleErrResult((doc) ->
								res.endJson doc
								# problem.stuff req.handleErrResult (stuffedPost) ->
							)
				]

			delete: [required.problems.selfOwns('id'), (req, res) ->
				return if not problema = req.paramToObjectId('id')
				Problem.findOne {_id: problema, 'author.id': req.user.id},
					req.handleErrResult (doc) ->
						doc.remove (err) ->
							console.log('err?', err)
							res.endJson(doc, error: err)
				]

		},
		'/upvote':
			# post: [required.problems.selfCanComment('id'),
			post: [required.problems.selfDoesntOwn('id'), (req, res) ->
				return if not problema = req.paramToObjectId('id')
				Problem.findById problema, req.handleErrResult (problem) =>
					req.user.upvoteProbl problem, (err, doc) ->
						res.endJson { error: err, data: doc }
			]
		'/unupvote':
			post: [required.problems.selfDoesntOwn('id'), (req, res) ->
				return if not problema = req.paramToObjectId('id')
				Problem.findById problema, req.handleErrResult (problem) =>
					req.user.unupvoteProbl problem, (err, doc) ->
						res.endJson { error: err, data: doc }
			]
		'/answers':
			# post: [required.posts.selfCanComment('id'), (req, res) ->
			post: [(req, res) ->
				return unless postId = req.paramToObjectId('id')
				Post.findById postId,
					req.handleErrResult (parentPost) =>
						return unless content = checks.contentExists(req.body.content, res)
						return unless _body = checks.body(content.body, res)
						postBody = sanitizeBody(_body, Post.Types.Answer)
						data = {
							content: {
								body: postBody
							}
							type: Post.Types.Answer
						}

						# console.log 'final data:', data
						req.user.postToParentPost parentPost, data,
							req.handleErrResult (doc) =>
								res.endJson doc
			]


	}
}
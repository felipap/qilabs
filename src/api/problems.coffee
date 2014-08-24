
mongoose = require 'mongoose'
required = require 'src/lib/required.js'
_ = require 'underscore'

please = require 'src/lib/please.js'
please.args.extend(require 'src/models/lib/pleaseModels.js')

jobs = require 'src/config/kue.js'

Resource = mongoose.model 'Resource'
User = Resource.model 'User'
Post = Resource.model 'Post'
Problem = Resource.model 'Problem'
Answer = Resource.model 'Answer'

createProblem = (self, data, cb) ->
	please.args({$isModel:User},
		{$contains:['content','topics'],content:{$contains:['title','body','answer']}}, '$isCb')
	problem = new Problem {
		author: User.toAuthorObject(self)
		content: {
			title: data.content.title
			body: data.content.body
			answer: {
				options: data.content.answer.options
				value: data.content.answer.value
				is_mc: data.content.answer.is_mc
			}
		}
		tags: data.tags
	}
	problem.save (err, doc) =>
		console.log('doc save:', err, doc)
		# use asunc.parallel to run a job
		# Callback now, what happens later doesn't concern the user.
		cb(err, doc)
		if err then return

		# self.update { $inc: { 'stats.posts': 1 }}, ->
		# jobs.create('problem new', {
		# 	title: "New problem: #{self.name} posted #{post.id}",
		# 	author: self,
		# 	post: post,
		# }).save()

upvoteProblem = (self, res, cb) ->
	please.args({$isModel:User}, {$isModel:Problem}, '$isCb')
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
	Problem.findOneAndUpdate {_id: ''+res.id}, {$push: {votes: self._id}}, done

unupvoteProblem = (self, res, cb) ->
	please.args({$isModel:User}, {$isModel:Problem}, '$isCb')
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
	Problem.findOneAndUpdate {_id: ''+res.id}, {$pull: {votes: self._id}}, done

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
		source:
			$valid: (str) ->
				not str or val.isLength(str, 0, 80)
			$clean: (str) ->
				val.stripLow(dryText(str))
		body:
			$valid: (str) ->
				val.isLength(pureText(str), BODY_MIN) and val.isLength(str, 0, BODY_MAX)
			$clean: (str) ->
				val.stripLow(dryText(str))
		answer:
			options:
				$valid: (array) ->
					if array instanceof Array and array.length is 5
						for e in array
							if e.length >= 40
								return false
						return true
					return false
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
			createProblem req.user, {
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
				Problem.findOne { _id:id }
					.populate Problem.APISelect
					.exec req.handleErrResult (doc) ->
						jsonDoc = _.extend(doc.toJSON(), _meta:{})
						req.user.doesFollowUser doc.author.id, (err, val) ->
							if err
								console.error("PQP1", err)
							jsonDoc._meta.authorFollowed = val
							if doc.hasAnswered.indexOf(''+req.user.id) is -1
								jsonDoc._meta.userAnswered = false
								res.endJson({data:jsonDoc})
							else
								jsonDoc._meta.userAnswered = true
								doc.getFilledAnswers (err, children) ->
									if err
										console.error("PQP2", err, children)
									jsonDoc._meta.children = children
									res.endJson({data:jsonDoc})

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

			children: {
				'/upvote':
					# post: [required.problems.selfCanComment('id'),
					post: [required.problems.selfDoesntOwn('id'), (req, res) ->
						return if not problema = req.paramToObjectId('id')
						Problem.findById problema, req.handleErrResult (problem) =>
							upvoteProblem req.user, problem, (err, doc) ->
								res.endJson { error: err, data: doc }
					]

				'/unupvote':
					post: [required.problems.selfDoesntOwn('id'), (req, res) ->
						return if not problema = req.paramToObjectId('id')
						Problem.findById problema, req.handleErrResult (problem) =>
							unupvoteProblem req.user, problem, (err, doc) ->
								res.endJson { error: err, data: doc }
					]

				'/answers':
					post: (req, res) ->
						return unless postId = req.paramToObjectId('id')
						Problem.findById postId, req.handleErrResult (doc) =>

							userTries = _.findWhere(doc.userTries, { user: ''+req.user.id })
							if doc.hasAnswered.indexOf(''+req.user.id) is -1
								return res.status(403).endJson({ error: true })

							Answer.findOne { 'author.id': ''+req.user.id }, (err, doc) ->
								if doc
									return res.status(400).endJson({ error: true, message: 'Resposta já enviada. '})
								ans = new Answer {
									author: {
									},
									content: {
										body: req.body.content.body
									}
								}

				'/try':
					post: (req, res) ->
						# Is this nuclear enough?
						return unless postId = req.paramToObjectId('id')
						Problem.findById postId, req.handleErrResult (doc) ->
							correct = req.body.test is '0'
							userTries = _.findWhere(doc.userTries, { user: ''+req.user.id })
							console.log typeof req.body.test, correct, req.body.test
							if userTries?
								if userTries.tries >= 3 # No. of tried exceeded
									return res.status(403).endJson({ error: true, message: "Número de tentativas excedido."})
							else # First try from user
								userTries = { user: req.user.id, tries: 0 }
								doc.userTries.push(userTries)

							if correct
								# User is correct
								doc.hasAnswered.push(req.user.id)
								doc.save()
								doc.getFilledAnswers (err, answers) ->
									if err
										console.error "error", err
										res.endJson({ error: true })
									else
										res.endJson({ result: true, answers: answers })
								return
							else
								Problem.findOneAndUpdate { _id: ''+doc.id, 'userTries.user': ''+req.user.id}, {$inc:{'userTries.$.tries': 1}}, (err, docs) ->
									console.log arguments
								res.endJson({ result: false })
			}
		}
	}
}

mongoose = require 'mongoose'
_ = require 'underscore'

required = require 'src/core/required.js'
please = require 'src/lib/please.js'
jobs = require 'src/config/kue.js'

Resource = mongoose.model 'Resource'
User = mongoose.model 'User'
Post = Resource.model 'Post'
Problem = Resource.model 'Problem'

logger = null

createProblem = (self, data, cb) ->
	please.args({$isModel:User}, '$skip', '$isFn')

	problem = new Problem {
		author: User.toAuthorObject(self)
		content: {
			title: data.content.title
			body: data.content.body
		}
		answer: {
			options: data.answer.options
			value: data.answer.value
			is_mc: data.answer.is_mc
		}
	}

	problem.save (err, doc) ->
		# Callback now, what happens later doesn't concern the user.
		if err
			logger.error("Error creating problem", err)
			return cb(err)
		cb(null, doc)
		# jobs.create('problem new', {
		# 	title: "New problem: #{self.name} posted #{post.id}",
		# 	author: self,
		# 	post: post,
		# }).save()

upvoteProblem = (self, res, cb) ->
	please.args({$isModel:User}, {$isModel:Problem}, '$isFn')
	if ''+res.author.id == ''+self.id
		cb()
		return

	done = (err, docs) ->
		console.log err, docs
		if err
			return cb(err)
		jobs.create('post upvote', {
			title: "New upvote: #{self.name} → #{res.id}",
			authorId: res.author.id,
			resource: res,
			agent: self,
		}).save()
	Problem.findOneAndUpdate {_id: ''+res.id}, {$push: {votes: self._id}}, done

unupvoteProblem = (self, res, cb) ->
	please.args({$isModel:User}, {$isModel:Problem}, '$isFn')
	if ''+res.author.id == ''+self.id
		cb()
		return

	done = (err, docs) ->
		console.log err, docs
		if err
			return cb(err)
		jobs.create('post unupvote', {
			title: "New unupvote: #{self.name} → #{res.id}",
			authorId: res.author.id,
			resource: res,
			agent: self,
		}).save()
	Problem.findOneAndUpdate {_id: ''+res.id}, {$pull: {votes: self._id}}, done


##########################################################################################
##########################################################################################

sanitizeProblemBody = (body, type) ->
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
		_.extend({}, DefaultSanitizerOpts, {
			allowedTags: ['b','em','strong','a','u','ul','blockquote','p','img','br','i','li'],
		})
	str = sanitizer(body, getSanitizerOptions(type))
	# Don't mind my little hack to remove excessive breaks
	str = str.replace(new RegExp("(<br \/>){2,}","gi"), "<br />")
		.replace(/<p>(<br \/>)?<\/p>/gi, '')
		.replace(/<br \/><\/p>/gi, '</p>')
	return str

##########################################################################################
##########################################################################################

module.exports = (app) ->

	router = require('express').Router()

	router.use required.login

	logger = app.logger

	router.param('problemId', (req, res, next, problemId) ->
		try
			id = mongoose.Types.ObjectId.createFromHexString(problemId);
		catch e
			return next({ type: "InvalidId", args:'problemId', value:problemId});
		Problem.findOne { _id:problemId }, req.handleErr404 (problem) ->
			req.problem = problem
			next()
	)

	router.post '/', (req, res) ->
		req.parse Problem.ParseRules, (err, reqBody) ->
			body = sanitizeProblemBody(reqBody.content.body)
			console.log reqBody, reqBody.content.answer
			answer = {
				is_mc: reqBody.answer.is_mc
				options: reqBody.answer.is_mc and reqBody.answer.options or null
				value: reqBody.answer.is_mc and null or reqBody.answer.value
			}
			createProblem req.user, {
				subject: 'mathematics'
				# topics: ['combinatorics']
				content: {
					title: reqBody.content.title
					body: body
					source: reqBody.content.source
				}
				answer: answer
			}, req.handleErr (doc) ->
				console.log("oo", doc)
				res.endJSON(doc)

	router.route('/:problemId')
		.get (req, res) ->
			jsonDoc = _.extend(req.problem.toJSON(), _meta:{})
			req.user.doesFollowUser req.problem.author.id, (err, val) ->
				if err
					console.error("PQP1", err)
				jsonDoc._meta.authorFollowed = val
				if req.problem.hasAnswered.indexOf(''+req.user.id) is -1
					jsonDoc._meta.userAnswered = false
					res.endJSON({data:jsonDoc})
				else
					jsonDoc._meta.userAnswered = true
					req.problem.getFilledAnswers (err, children) ->
						if err
							console.error("PQP2", err, children)
						jsonDoc._meta.children = children
						res.endJSON({data:jsonDoc})

		.put required.selfOwns('problem'), (req, res) ->
			problem = req.problem
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
				problem.save req.handleErr404((doc) ->
					res.endJSON doc
					# problem.stuff req.handleErr404 (stuffedPost) ->
				)

		.delete required.selfOwns('problem'), (req, res) ->
			doc = req.doc
			doc.remove (err) ->
				console.log('err?', err)
				res.endJSON(doc, error: err)

	router.route('/:problemId/upvote')
		.post required.selfDoesntOwn('problem'), (req, res) ->
			doc = req.problem
			upvoteProblem req.user, doc, (err, doc) ->
				res.endJSON { error: err, data: doc }

	router.route('/:problemId/unupvote')
		.post required.selfDoesntOwn('problem'), (req, res) ->
			doc = req.problem
			unupvoteProblem req.user, doc, (err, doc) ->
				res.endJSON { error: err, data: doc }

	router.route('/:problemId/answers')
		.post (req, res) ->
			doc = req.problem
			userTries = _.findWhere(doc.userTries, { user: ''+req.user.id })

			if doc.hasAnswered.indexOf(''+req.user.id) is -1
				return res.status(403).endJSON({ error: true, message: "Responta já enviada." })

			Answer.findOne { 'author.id': ''+req.user.id }, (err, doc) ->
				if doc
					return res.status(400).endJSON({ error: true, message: 'Resposta já enviada. '})
				ans = new Answer {
					author: {},
					content: {
						body: req.body.content.body
					}
				}

	router.route('/:problemId/try')
		.post (req, res) ->
			# Is this nuclear enough?
			doc = req.problem
			correct = req.body.test is '0'
			userTries = _.findWhere(doc.userTries, { user: ''+req.user.id })
			console.log typeof req.body.test, correct, req.body.test
			if userTries?
				if userTries.tries >= 3 # No. of tried exceeded
					return res.status(403).endJSON({ error: true, message: "Número de tentativas excedido."})
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
						res.endJSON({ error: true })
					else
						res.endJSON({ result: true, answers: answers })
				return
			else
				Problem.findOneAndUpdate { _id: ''+doc.id, 'userTries.user': ''+req.user.id}, {$inc:{'userTries.$.tries': 1}}, (err, docs) ->
					console.log arguments
				res.endJSON({ result: false })

	return router

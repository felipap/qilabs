
mongoose = require 'mongoose'
_ = require 'lodash'

required = require 'src/controllers/lib/required'
unspam = require 'src/controllers/lib/unspam'
actions = require 'src/core/actions/problems'

User = mongoose.model 'User'
Problem = mongoose.model 'Problem'

getProblemId = (req, res, next, problemId) ->
	try
		id = mongoose.Types.ObjectId.createFromHexString(problemId);
	catch e
		return next({ type: "InvalidId", args:'problemId', value:problemId});
	Problem.findOne { _id:problemId }, req.handleErr404 (problem) ->
		req.problem = problem
		next()

module.exports = (app) ->

	router = require('express').Router()

	router.use required.login

	actions.setLogger(app.get('logger'))

	router.param('problemId', getProblemId)

	router.post '/', (req, res) ->
		req.parse Problem.ParseRules, (err, reqBody) ->
			console.log reqBody, reqBody.content.answer
			actions.createProblem req.user, {
				subject: 'mathematics'
				# topics: ['combinatorics']
				level: reqBody.level
				topic: reqBody.topic
				content: {
					title: reqBody.content.title
					body: reqBody.content.body
					source: reqBody.content.source
				}
				answer: {
					is_mc: reqBody.answer.is_mc
					options: reqBody.answer.is_mc and reqBody.answer.options or null
					value: if reqBody.answer.is_mc then null else reqBody.answer.value
				}
			}, req.handleErr (doc) ->
				res.endJSON(doc.toJSON({ select: Problem.APISelectAuthor, virtuals: true }))

	router.route('/:problemId')
		.get (req, res) ->
			# If user is the problem's author, show answers
			if req.problem.author._id is req.user._id
				jsonDoc = _.extend(req.problem.toJSON({
						select: Problem.APISelectAuthor,
						virtuals: true
					}), _meta:{})
			else
				jsonDoc = _.extend(req.problem.toJSON(), _meta:{})
			req.user.doesFollowUser req.problem.author.id, (err, val) ->
				if err
					console.error("PQP1", err)
				jsonDoc._meta.authorFollowed = val
				answered = !!_.findWhere(req.problem.hasAnswered, { user: req.user.id })

				jsonDoc._meta.liked = !!~req.problem.votes.indexOf(req.user.id)
				jsonDoc._meta.tries = _.find(req.problem.userTries, { user: req.user.id })?.tries or 0
				jsonDoc._meta.solved = !!_.find(req.problem.hasAnswered, { user: req.user.id })
				jsonDoc._meta.watching = !!~req.problem.users_watching.indexOf(req.user.id)

				if answered
					res.endJSON({ data: jsonDoc })
				else
					req.problem.getFilledAnswers (err, children) ->
						if err
							console.error("PQP2", err, children)
						jsonDoc._meta.children = children
						res.endJSON({ data: jsonDoc })

		.put required.selfOwns('problem'), (req, res) ->
			problem = req.problem
			req.parse Problem.ParseRules, (err, reqBody) ->
				# body = actions.sanitizeBody(reqBody.content.body)
				problem.updated_at = Date.now()
				# problem.topics = reqBody.topics
				# problem.subject = reqBody.subject
				problem.level = reqBody.level
				problem.topic = reqBody.topic
				problem.content = {
					title: reqBody.content.title
					body: reqBody.content.body
					source: reqBody.content.source
				}
				if reqBody.answer.is_mc
					problem.answer = {
						is_mc: true
						options: reqBody.answer.options
					}
				else
					problem.answer = {
						is_mc: false
						value: reqBody.answer.value
					}
				problem.save req.handleErr (doc) ->
					res.endJSON(doc.toJSON({ select: Problem.APISelectAuthor, virtuals: true }))

		.delete required.selfOwns('problem'), (req, res) ->
			req.problem.remove (err) ->
				console.log('err?', err)
				res.endJSON(error: err)

	router.post '/:problemId/upvote', required.selfDoesntOwn('problem'),
	unspam.limit(1000), (req, res) ->
		actions.upvote req.user, req.problem, (err, doc) ->
			if err
				req.logger.error("Error upvoting", err)
				res.endJSON(error: true)
			else if doc
				res.endJSON(liked: req.user.id in doc.votes)
			else
				res.endJSON(liked: req.user.id in req.post.votes)

	router.post '/:problemId/unupvote', required.selfDoesntOwn('problem'),
	unspam.limit(1000), (req, res) ->
		actions.unupvote req.user, req.problem, (err, doc) ->
			if err
				req.logger.error("Error unupvoting", err)
				res.endJSON(error: true)
			else if doc
				res.endJSON(liked: req.user.id in doc.votes)
			else
				res.endJSON(liked: req.user.id in req.post.votes)

	router.route('/:problemId/answers')
		.post (req, res) ->
			doc = req.problem
			userTries = _.findWhere(doc.userTries, { user: req.user.id })

			if doc.hasAnswered.indexOf(req.user.id) is -1
				return res.status(403).endJSON({ error: true, message: "Resposta já enviada." })

			Answer.findOne { 'author._id': ''+req.user._id }, (err, doc) ->
				if doc
					return res.status(400).endJSON({ error: true, message: 'Resposta já enviada. '})
				ans = new Answer {
					author: {},
					content: {
						body: req.body.content.body
					}
				}

	router.post '/:problemId/try', (req, res) ->
		userTried = _.findWhere(req.problem.userTries, { user: req.user.id })
		userAnswered = _.findWhere(req.problem.hasAnswered, { user: req.user.id })

		if userAnswered
			res.status(403).endJSON({
				error: true
				message: "Você já resolveu esse problema."
			})
			return

		#
		if userTried
			if userTried.tries >= 3 # No. of tries exceeded
				res.status(403).endJSON({
					error: true
					message: "Número de tentativas excedido."
				})
				return
			else
				# Inc tries atomically.
				Problem.findOneAndUpdate {
					_id: req.problem._id
					'userTries.user': req.user.id
				}, {
					$inc: {
						'userTries.$.tries': 1
					}
				}, (err, doc) ->
					if err
						return req.logger.eror("Error updating problem object", err)
					if not doc
						req.logger.farn("Couldn't Problem.findOneAndUpdate", req.problem._id)
		else # First try from user → Add tries object.
			Problem.findOneAndUpdate {
				_id: req.problem._id
				'userTries.user': { $ne: req.user.id } # README THIS MIGHT BE COMPLETELY WRONG
			}, {
				$push: {
					userTries: {
						tries: 1
						user: req.user.id
						last_try: Date.now()
					}
				}
			}, (err, doc) ->
				if err
					return req.logger.eror("Error updating problem object", err)
				if not doc
					req.logger.warn("Couldn't Problem.findOneAndUpdate", req.problem._id)
				else
					console.log(doc)

		# Check correctness
		correct = false
		if req.problem.answer.is_mc
			if req.problem.validAnswer(req.body.value)
				correct = true
		else
			if req.problem.validAnswer(req.body.value)
				correct = true

		#
		if correct
			Problem.findOneAndUpdate {
				_id: req.problem._id
				# Make sure user didn't already answer it
				'hasAnswered.user': { $ne: req.user.id }
			}, {
				$push: {
					hasAnswered: {
						user: req.user.id
						when: Date.now()
					}
				}
			}, (err, doc) ->
				if err
					return req.logger.eror("Error updating problem object (2)", err)
				if not doc
					req.logger.warn("Couldn't Problem.findOneAndUpdate specified", req.problem._id)
				else
					console.log(doc)
				res.endJSON({ correct: true })
		else
			res.endJSON({ correct: false })

	return router
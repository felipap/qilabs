
mongoose = require 'mongoose'
_ = require 'lodash'

required = require 'app/controllers/lib/required'
unspam = require 'app/controllers/lib/unspam'
actions = require 'app/actions/problems'

User = mongoose.model 'User'
Problem = mongoose.model 'Problem'

module.exports = (app) ->

	router = require('express').Router()

	router.use required.login

	router.param 'problemId', (req, res, next, problemId) ->
		try
			id = mongoose.Types.ObjectId.createFromHexString(problemId);
		catch e
			return next({ type: "InvalidId", args:'problemId', value:problemId});
		Problem.findOne { _id:problemId }, req.handleErr404 (problem) ->
			req.problem = problem
			next()

	##

	router.post '/', (req, res) ->
		req.parse Problem.ParseRules, (err, reqBody) ->
			console.log reqBody, reqBody.content.answer
			actions.createProblem req.user, {
				# topics: ['combinatorics']
				subject: reqBody.subject
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

	router.get '/:problemId', (req, res) ->
		actions.stuffGetProblem req.user, req.problem, (err, json) ->
			res.endJSON(data: json)

	router.put '/:problemId', required.selfOwns('problem'), (req, res) ->
		problem = req.problem
		req.parse Problem.ParseRules, (err, reqBody) ->
			# body = actions.sanitizeBody(reqBody.content.body)
			problem.updated_at = Date.now()
			problem.subject = reqBody.subject
			problem.level = reqBody.level
			console.log(reqBody.topic, reqBody)
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

	router.delete '/:problemId', required.selfOwns('problem'), (req, res) ->
		req.problem.remove (err) ->
			if err
				req.logger.error("Error removing", req.problem, err)
				res.endJSON(error: true)
			else
				res.endJSON(error: false)

	##

	router.post '/:problemId/upvote', required.selfDoesntOwn('problem'),
	unspam.limit(1000), (req, res) ->
		actions.upvote req.user, req.problem, (err, doc) ->
			if err
				req.logger.error("Error upvoting", err)
				res.endJSON(error: true)
			else if doc
				res.endJSON(liked: req.user.id in doc.votes)
			else
				res.endJSON(liked: req.user.id in req.problem.votes)

	router.post '/:problemId/unupvote', required.selfDoesntOwn('problem'),
	unspam.limit(1000), (req, res) ->
		actions.unupvote req.user, req.problem, (err, doc) ->
			if err
				req.logger.error("Error unupvoting", err)
				res.endJSON(error: true)
			else if doc
				res.endJSON(liked: req.user.id in doc.votes)
			else
				res.endJSON(liked: req.user.id in req.problem.votes)

	##

	router.post '/:problemId/see', required.selfDoesntOwn('problem'), (req, res) ->
		actions.seeAnswer req.user, req.problem, (err, doc) ->
			if err
				req.logger.error("Error seeing answer", err)
				res.endJSON(error: true)
			else
				res.endJSON(error:false)

	router.get '/:problemId/answers', (req, res) ->
		res.endJSON(error: false, docs: 'Nothing here! Satisfied?')

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
			if req.problem.answer.is_mc or userTried.tries >= 3 # No. of tries exceeded
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
				User.findOneAndUpdate {
					_id: req.user.id
				}, {
					$inc: { 'stats.qiPoints': 1 }
				}, (err, doc) ->
					if err
						throw err
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
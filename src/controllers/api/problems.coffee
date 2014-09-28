
mongoose = require 'mongoose'
_ = require 'lodash'

required = require 'src/core/required.js'
please = require 'src/lib/please.js'
jobs = require 'src/config/kue.js'

Resource = mongoose.model 'Resource'
User = mongoose.model 'User'
Post = Resource.model 'Post'
Problem = mongoose.model 'Problem'

logger = null

##########################################################################################
##########################################################################################

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
		# 	title: "New problem: #{self.name} posted #{post._id}",
		# 	author: self,
		# 	post: post,
		# }).save()

upvoteProblem = (self, res, cb) ->
	please.args({$isModel:User}, {$isModel:Problem}, '$isFn')
	if ''+res.author._id == ''+self._id
		cb()
		return

	done = (err, doc) ->
		if err
			return cb(err)
		if not doc
			logger.debug('Vote already there?', res._id)
			return cb(null)
		cb(null, doc)
		# jobs.create('problem upvote', {
		# 	title: "New upvote: #{self.name} → #{res._id}",
		# 	authorId: res.author._id,
		# 	resource: res,
		# 	agent: self,
		# }).save()
	Problem.findOneAndUpdate {
		_id: ''+res._id, votes: { $ne: self._id }
	}, {
		$push: { votes: self._id }
	}, done

unupvoteProblem = (self, res, cb) ->
	please.args({$isModel:User}, {$isModel:Problem}, '$isFn')
	if ''+res.author._id == ''+self._id
		cb()
		return

	done = (err, doc) ->
		if err
			return cb(err)
		if not doc
			logger.debug('Vote wasn\'t there?', res._id)
			return cb(null)
		cb(null, doc)
		# jobs.create('post unupvote', {
		# 	title: "New unupvote: #{self.name} → #{res._id}",
		# 	authorId: res.author._id,
		# 	resource: res,
		# 	agent: self,
		# }).save()
	Problem.findOneAndUpdate {
		_id: ''+res._id, votes: self._id
	}, {
		$pull: { votes: self._id }
	}, done

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

	logger = app.get('logger')

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
			createProblem req.user, {
				subject: 'mathematics'
				# topics: ['combinatorics']
				level: reqBody.level
				topic: reqBody.topic
				content: {
					title: reqBody.content.title
					body: body
					source: reqBody.content.source
				}
				answer: {
					is_mc: reqBody.answer.is_mc
					options: reqBody.answer.is_mc and reqBody.answer.options or null
					value: reqBody.answer.is_mc and null or reqBody.answer.value
				}
			}, req.handleErr (doc) ->
				res.endJSON(doc.toJSON({ select: Problem.APISelectAuthor, virtuals: true }))

	router.route('/:problemId')
		.get (req, res) ->
			# If user is the problem's author, show answers
			if req.problem.author._id is req.user._id
				jsonDoc = _.extend(req.problem.toJSON({ select: Problem.APISelectAuthor, virtuals: true }), _meta:{})
			else
				jsonDoc = _.extend(req.problem.toJSON(), _meta:{})
			req.user.doesFollowUser req.problem.author.id, (err, val) ->
				if err
					console.error("PQP1", err)
				jsonDoc._meta.authorFollowed = val
				answered = !!_.findWhere(req.problem.hasAnswered, { user: req.user._id })
				if answered
					jsonDoc._meta.userAnswered = true
					res.endJSON({ data: jsonDoc })
				else
					jsonDoc._meta.userAnswered = false
					req.problem.getFilledAnswers (err, children) ->
						if err
							console.error("PQP2", err, children)
						jsonDoc._meta.children = children
						res.endJSON({ data: jsonDoc })

		.put required.selfOwns('problem'), (req, res) ->
			problem = req.problem
			req.parse Problem.ParseRules, (err, reqBody) ->
				body = sanitizeProblemBody(reqBody.content.body)
				# console.log "PUT", req.body, "reqbody", reqBody, reqBody.content.answer
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
				problem.answer = {
					is_mc: reqBody.answer.is_mc
					options: reqBody.answer.is_mc and reqBody.answer.options or null
					value: reqBody.answer.is_mc and null or reqBody.answer.value
				}
				problem.save req.handleErr (doc) ->
					res.endJSON(doc.toJSON({ select: Problem.APISelectAuthor, virtuals: true }))

		.delete required.selfOwns('problem'), (req, res) ->
			req.problem.remove (err) ->
				console.log('err?', err)
				res.endJSON(error: err)

	router.route('/:problemId/upvote')
		.post required.selfDoesntOwn('problem'), (req, res) ->
			upvoteProblem req.user, req.problem, req.handleErr (doc) ->
				res.endJSON {
					error: false
					data: doc.toJSON({ select: Problem.APISelectAuthor, virtuals: true })
				}

	router.route('/:problemId/unupvote')
		.post required.selfDoesntOwn('problem'), (req, res) ->
			unupvoteProblem req.user, req.problem, req.handleErr (doc) ->
				res.endJSON {
					error: false
					data: doc.toJSON({ select: Problem.APISelectAuthor, virtuals: true })
				}

	router.route('/:problemId/answers')
		.post (req, res) ->
			doc = req.problem
			userTries = _.findWhere(doc.userTries, { user: ''+req.user._id })

			if doc.hasAnswered.indexOf(''+req.user._id) is -1
				return res.status(403).endJSON({ error: true, message: "Responta já enviada." })

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
		userTried = _.findWhere(req.problem.userTries, { user: req.user._id })
		userAnswered = _.findWhere(req.problem.hasAnswered, { user: req.user._id })

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
					'userTries.user': req.user._id
				}, {
					$inc: {
						'userTries.$.tries': 1
					}
				}, (err, doc) ->
					if err
						return logger.eror("Error updating problem object", err)
					if not doc
						logger.warn("Couldn't Problem.findOneAndUpdate", req.problem._id)
		else # First try from user → Add tries object.
			Problem.findOneAndUpdate {
				_id: req.problem._id
				'userTries.user': { $ne: req.user._id } # README THIS MIGHT BE COMPLETELY WRONG
			}, {
				$push: {
					userTries: {
						tries: 1
						user: req.user._id
						last_try: Date.now()
					}
				}
			}, (err, doc) ->
				if err
					return logger.eror("Error updating problem object", err)
				if not doc
					logger.warn("Couldn't Problem.findOneAndUpdate", req.problem._id)
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
				'hasAnswered.user': { $ne: req.user._id }
			}, {
				$push: {
					hasAnswered: {
						user: req.user._id
						when: Date.now()
					}
				}
			}, (err, doc) ->
				if err
					return logger.eror("Error updating problem object (2)", err)
				if not doc
					logger.warn("Couldn't Problem.findOneAndUpdate specified", req.problem._id)
				else
					console.log(doc)
		else
			res.endJSON({ correct: false })

	# router.post '/:problemId/try', (req, res) ->
	# 	# Is this nuclear enough?
	# 	doc = req.problem
	# 	correct = req.body.test is '0'
	# 	userTries = _.findWhere(doc.userTries, { user: ''+req.user._id })
	# 	console.log typeof req.body.test, correct, req.body.test
	# 	if userTries?
	# 		if userTries.tries >= 3 # No. of tried exceeded
	# 			return res.status(403).endJSON({ error: true, message: "Número de tentativas excedido."})
	# 	else # First try from user
	# 		userTries = { user: req.user._id, tries: 0 }
	# 		doc.userTries.push(userTries)

	# 	if correct
	# 		# User is correct
	# 		doc.hasAnswered.push(req.user._id)
	# 		doc.save()
	# 		doc.getFilledAnswers (err, answers) ->
	# 			if err
	# 				console.error "error", err
	# 				res.endJSON({ error: true })
	# 			else
	# 				res.endJSON({ result: true, answers: answers })
	# 		return
	# 	else
	# 		Problem.findOneAndUpdate { _id: ''+doc._id, 'userTries.user': ''+req.user._id}, {$inc:{'userTries.$.tries': 1}}, (err, docs) ->
	# 			console.log arguments
	# 		res.endJSON({ result: false })

	# router.post '/:problemId/try', (req, res) ->
		# userTries = _.findWhere(req.problem.userTries)
		# # Test if user's already tried it.
		# move = _.findWhere(play.moves, (i) -> i.index is index)
		# if move
		# 	return res.endJSON({ error: true, message: "Tentativas excedidas." })
		# trying = parseInt(req.body.try)
		# num = parseInt(req.params.num)
		# console.log("Trying #{trying} for answer #{pset.docs[num].content.answer}")
		# if trying is pset.docs[num].content.answer
		# 	console.log('certo')
		# 	play.moves.push({ index: index, solved: true })
		# 	req.user.save (err) ->
		# 		if err
		# 			throw err
		# 	return res.endJSON({
		# 		error: false,
		# 		correct: true,
		# 		data: { index: index, solved: true },
		# 		redirect: "/p/#{pset._id}/#{play.moves.length+1}"
		# 	})
		# console.log(JSON.stringify(trying), JSON.stringify(pset.docs[num].content.answer))
		# # Wrong answer.
		# play.last_update = new Date()
		# play.moves.push({ index: index, solved: false })
		# req.user.save (err) ->
		# 	if err
		# 		throw err
		# return res.endJSON({
		# 	error: false,
		# 	correct: false,
		# 	data: { index: index, solved: false },
		# })

	return router

	return router

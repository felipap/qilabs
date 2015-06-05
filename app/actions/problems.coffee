
mongoose = require 'mongoose'
_ = require 'lodash'

please = require 'app/lib/please.js'
jobs = require 'app/config/kue.js'

User = mongoose.model 'User'
Problem = mongoose.model 'Problem'

logger = global.logger.mchild()

module.exports.createProblem = (self, data, cb) ->
	please {$model:User}, '$skip', '$fn'

	problem = new Problem {
		author: User.toAuthorObject(self)
		content: {
			title: data.content.title
			body: data.content.body
			source: data.content.source
		}
		topic: data.topic
		subject: data.subject
		level: data.level
		_set: data._set or null
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
			throw err
		cb(null, doc)
		# jobs.create('problem new', {
		# 	title: "New problem: #{self.name} posted #{post._id}",
		# 	author: self.toObject(),
		# 	post: post.toObject(),
		# }).save()

module.exports.upvote = (self, res, cb) ->
	please {$model:User}, {$model:Problem}, '$fn'
	if res.author.id is self.id
		cb()
		return

	done = (err, doc) ->
		if err
			throw err
		if not doc
			logger.debug('Vote already there?', res._id)
			return cb(null)
		cb(null, doc)
		# jobs.create('problem upvote', {
		# 	title: "New upvote: #{self.name} → #{res._id}",
		# 	authorId: res.author.id,
		# 	resource: res.toObject(),
		# 	agent: self.toObject(),
		# }).save()
	Problem.findOneAndUpdate {
		_id: ''+res._id, votes: { $ne: self._id }
	}, {
		$push: { votes: self._id }
	}, done

module.exports.unupvote = (self, res, cb) ->
	please {$model:User}, {$model:Problem}, '$fn'
	if res.author.id is self.id
		cb()
		return

	done = (err, doc) ->
		if err
			throw err
		if not doc
			logger.debug('Vote wasn\'t there?', res._id)
			return cb(null)
		cb(null, doc)
		# jobs.create('post unupvote', {
		# 	title: "New unupvote: #{self.name} → #{res._id}",
		# 	authorId: res.author.id,
		# 	resource: res.toObject(),
		# 	agent: self.toObject(),
		# }).save()
	Problem.findOneAndUpdate {
		_id: ''+res._id, votes: self._id
	}, {
		$pull: { votes: self._id }
	}, done

module.exports.seeAnswer = (self, res, cb) ->
	please {$model:User}, {$model:Problem}, '$fn'

	done = (err, doc) ->
		if err
			throw err
		cb(null)

	Problem.findOneAndUpdate {
		_id: ''+res._id, hasSeenAnswers: { $ne: self.id }
	}, {
		$push: { hasSeenAnswers: self.id }
	}, done

module.exports.stuffGetProblem = (self, problem, cb) ->
	please '$skip', {$model:Problem}, '$fn'

	if self and not self instanceof User
		throw new Error('uffsdf')

	jsonDoc = problem.toJSON()

	if not self
		maxTries = if problem.answer.is_mc then 1 else 3

		stats = {
			authorFollowed: false
			liked: false
			userTries: 0
			userIsAuthor: false
			userTried: false
			userTriesLeft: maxTries
			userSawAnswer: false
			userSolved: false
			userWatching: false
		}

		if problem.answer.is_mc
			jsonDoc.answer.mc_options = problem.getShuffledMCOptions()
		jsonDoc._meta = stats
		cb(null, jsonDoc)
		return

	if problem.author.id is self._id
		jsonDoc = _.extend(problem.toJSON({
				select: Problem.APISelectAuthor,
				virtuals: true
			}), _meta:{})
		jsonDoc.answer.mc_options = jsonDoc.answer.options
		cb(null, jsonDoc)
	else
		self.doesFollowUserId problem.author.id, (err, val) ->
			if err
				logger.error("PQP!", err)
				throw err

			nTries = _.find(problem.userTries, { user: self.id })?.tries or 0
			maxTries = if problem.answer.is_mc then 1 else 3

			stats = {
				authorFollowed: val
				liked: !!~problem.votes.indexOf(self.id)
				userTries: nTries
				userIsAuthor: problem.author.id is self.id
				userTried: !!nTries
				userTriesLeft: Math.max(maxTries - nTries, 0)
				userSawAnswer: !!~problem.hasSeenAnswers.indexOf(self.id)
				userSolved: !!_.find(problem.hasAnswered, { user: self.id })
				userWatching: !!~problem.users_watching.indexOf(self.id)
			}

			if problem.answer.is_mc
				if stats.userSolved or
				stats.userIsAuthor or
				stats.userSawAnswer or
				not stats.userTriesLeft # Show options in proper place (correct first)
					jsonDoc.answer.mc_options = problem.answer.options
				else # Show shuffled options
					jsonDoc.answer.mc_options = problem.getShuffledMCOptions()
			jsonDoc._meta = stats
			cb(null, jsonDoc)


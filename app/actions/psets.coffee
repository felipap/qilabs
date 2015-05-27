
mongoose = require 'mongoose'
_ = require 'lodash'
async = require 'async'

please = require 'app/lib/please.js'
jobs = require 'app/config/kue.js'
User = mongoose.model 'User'
Problem = mongoose.model 'Problem'
ProblemSet = mongoose.model 'ProblemSet'
TMERA = require 'app/lib/tmera'

logger = global.logger.mchild()
stuffGetProblem = require('./problems').stuffGetProblem

module.exports.stuffGetPset = (self, pset, cb) ->
	please {$model:User}, {$model:ProblemSet}, '$fn'
	jsonDoc = pset.toJSON()
	pids = _.map(pset.problem_ids, (id) -> ''+id)

	self.doesFollowUserId pset.author.id, (err, val) ->
		if err
			logger.error("PQP!", err)
			throw err

		stats =
			authorFollowed: val
			liked: !!~pset.votes.indexOf(self.id)
			userIsAuthor: pset.author.id is self.id

		jsonDoc._meta = stats

		Problem.find { _id: { $in: pids } }, TMERA (problems) ->
			async.map problems, ((prob, next) ->
				stuffGetProblem self, prob, next
			), (err, jsonProblems) ->
				if err
					throw err
				jsonDoc.problems = jsonProblems
				cb(null, jsonDoc)

module.exports.createPset = (self, data, cb) ->
	please {$model:User}, '$skip', '$fn'

	# Find problems with the passed ids and use only ids of existing problems
	Problem.find { _id: { $in: data.problem_ids } }, TMERA (problems) ->
		pids = _.pluck(problems, 'id')

		pset = new ProblemSet {
			author: User.toAuthorObject(self)
			name: data.name
			subject: data.subject
			slug: data.slug
			description: data.description
			problem_ids: pids
		}

		pset.save (err, doc) ->
			# Update problems in pids to point to this problemset.
			# This should definitely be better documented.

			# Callback now, what happens later doesn't concern the user.
			if err
				logger.error "Error creating pset", err
				throw err
			cb(null, doc)
			# jobs.create('pset new', {
			# 	title: "New pset: #{self.name} posted #{post._id}",
			# 	author: self.toObject(),
			# 	post: post.toObject(),
			# }).save()

module.exports.updatePset = (self, pset, data, cb) ->
	please {$model:User}, {$model:ProblemSet}, '$skip', '$fn'

	# Find problems with the passed ids and use only ids of existing problems
	Problem.find { _id: { $in: data.problem_ids } }, TMERA (problems) ->
		pids = _.pluck(problems, 'id')

		pset.updated_at = Date.now()
		pset.name = data.name
		pset.subject = data.subject
		pset.problem_ids = pids
		pset.slug = data.slug
		pset.description = data.description
		pset.levels_str = _.unique(_.pluck(problems, 'level'))

		pset.save (err, doc) ->
			if err
				logger.error "Error updating pset", err
				throw err
			cb(null, doc)

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

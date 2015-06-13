
var mongoose = require('mongoose')
var _ = require('lodash')

var please = require('app/lib/please.js')
var jobs = require('app/config/kue.js')

var User = mongoose.model('User')
var Problem = mongoose.model('Problem')

var logger = global.logger.mchild()


module.exports.createProblem = function(self, data, cb) {
	please({$model:User},'$skip','$fn')

	var problem = new Problem({
		author: User.toAuthorObject(self),
		title: data.title,
		localIndex: data.localIndex,
		body: data.body,
		source: data.source,
		topic: data.topic,
		subject: data.subject,
		level: data.level,
		_set: data._set || null,
		answer: {
			options: data.answer.options,
			value: data.answer.value,
			is_mc: data.answer.is_mc,
		},
	})

	problem.save((err, doc) => {
		if (err) {
			logger.error("Error creating problem", err)
			throw err
		}
		cb(null, doc)
		// jobs.create('problem new', {
		// 	title: "New problem: #{self.title} posted #{post._id}",
		// 	author: self.toObject(),
		// 	post: post.toObject(),
		// }).save()
	})
}

module.exports.upvote = function(self, res, cb) {
	please({$model:User},{$model:Problem},'$fn')

	if (res.author.id === self.id) {
		cb()
		return
	}

	function done(err, doc) {
		if (err) {
			throw err
		}
		if (!doc) {
			logger.debug('Vote already there?', res._id)
			return cb(null)
		}
		cb(null, doc)
		// jobs.create('problem upvote', {
		// 	title: "New upvote: #{self.name} → #{res._id}",
		// 	authorId: res.author.id,
		// 	resource: res.toObject(),
		// 	agent: self.toObject(),
		// }).save()
	}

	Problem.findOneAndUpdate(
		{ _id: '' + res._id, votes: { $ne: self._id } },
		{ $push: { votes: self._id }
	}, done)
}

module.exports.unupvote = function(self, res, cb) {
	please({$model:User},{$model:ProblemSet},'$fn')

	if (res.author.id === self.id) {
		cb()
		return
	}

	function done(err, doc) {
		if (err) {
			throw err
		}
		if (!doc) {
			logger.debug('Vote wasn\'t there?', res._id)
			cb(null)
			return
		}
		cb(null, doc)
	}

	ProblemSet.findOneAndUpdate(
		{ _id: '' + res._id, votes: self._id },
		{ $pull: { votes: self._id } },
		done)
}

module.exports.seeAnswer = function (self, res, cb) {
	please({$model:User},{$model:Problem},'$fn')

	function done(err, doc) {
		if (err) {
			throw err
		}
		cb(null)
	}

	Problem.findOneAndUpdate(
		{ _id: ''+res._id, hasSeenAnswers: { $ne: self.id } },
		{ $push: { hasSeenAnswers: self.id } },
		done
	)
}

module.exports.stuffGetProblem = function(self, problem, cb) {
	please('$skip', { $model: Problem}, '$fn')

	if (self && !self instanceof User) {
		throw new Error('uffsdf')
	}

	if (self && (problem.author.id === self._id || self.flags.editor)) {
		var jsonDoc = _.extend(
			problem.toJSON({ select: Problem.APISelectAuthor, virtuals: true }),
			{ _meta: {} }
		)
	} else {
		var jsonDoc = problem.toJSON()
	}

	var maxTries = problem.answer.is_mc ? 1 : 3

	if (!self) {
		var meta = {
			authorFollowed: false,
			liked: false,
			userTries: 0,
			userIsEditor: false,
			userTried: false,
			userTriesLeft: maxTries,
			userSawAnswer: false,
			userSolved: false,
			userWatching: false
		}

		if (problem.answer.is_mc) {
			jsonDoc.answer.mc_options = problem.getShuffledMCOptions()
		}

		jsonDoc._meta = meta
		cb(null, jsonDoc)
		return
	}

	if (problem.author.id === self._id) {
		jsonDoc.answer.mc_options = jsonDoc.answer.options
		cb(null, jsonDoc)
	} else {
		self.doesFollowUserId(problem.author.id, function(err, val) {
			if (err) {
				throw err
			}

			var nTries = _.find(problem.userTries, { user: self.id }) || 0

			var meta = {
				authorFollowed: val,
				liked: !!~problem.votes.indexOf(self.id),
				userTries: nTries,
				userIsAuthor: problem.author.id === self.id,
				userTried: !!nTries,
				userTriesLeft: Math.max(maxTries - nTries, 0),
				userSawAnswer: !!~problem.hasSeenAnswers.indexOf(self.id),
				userSolved: !!_.find(problem.hasAnswered, {
					user: self.id
				}),
				userWatching: !!~problem.users_watching.indexOf(self.id)
			}

			if (problem.answer.is_mc) {
				if (meta.userSolved || meta.userIsAuthor || meta.userSawAnswer || !meta.userTriesLeft) {
					jsonDoc.answer.mc_options = problem.answer.options
				} else {
					jsonDoc.answer.mc_options = problem.getShuffledMCOptions()
				}
			}
			jsonDoc._meta = meta
			cb(null, jsonDoc)
		})
	}
}

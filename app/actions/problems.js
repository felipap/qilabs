
var mongoose = require('mongoose')
var _ = require('lodash')

var please = require('app/lib/please.js')
var jobs = require('app/config/kue.js')

var User = mongoose.model('User')
var Problem = mongoose.model('ProblemCore')
var ProblemCache = mongoose.model('ProblemCache')

var logger = global.logger.mchild()

module.exports.createProblem = function(self, data, cb) {
	please({$model:User},'$skip','$fn')

	var problem = new Problem({
		author: User.toAuthorObject(self),
		name: data.name,
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
	})
}

module.exports.upvote = function(self, res, cb) {
	please({$model:User},{$model:Problem},'$fn')

	if (res.author && res.author.id === self.id) {
		logger.warn('User tried to upvote their own problem.')
		return cb()
	}

	function done(err, doc) {
		if (err) {
			throw err
		}
		if (!doc) {
			logger.debug('Vote already there?', res._id)
			return cb(null, true)
		}
		cb(null, doc.votes.indexOf(self._id) !== -1)
	}

	ProblemCache.findOneAndUpdate(
		{ problem: '' + res._id, likes: { $ne: self._id } },
		{ $push: { votes: self._id }
	}, done)
}

module.exports.unupvote = function(self, res, cb) {
	please({$model:User},{$model:ProblemSet},'$fn')

	if (res.author && res.author.id === self.id) {
		logger.warn('User tried to unupvote their own problem.')
		return cb()
	}

	function done(err, doc) {
		if (err) {
			throw err
		}
		if (!doc) {
			logger.debug('Vote wasn\'t there?', res._id)
			return cb(null, false)
		}
		cb(null, doc.votes.indexOf(self._id) !== -1)
	}

	ProblemCache.findOneAndUpdate(
		{ problem: '' + res._id, likes: self._id },
		{ $pull: { votes: self._id } },
		done)
}

module.exports.registerAnswerSeen = function(self, res, cb) {
	please({$model:User},{$model:Problem},'$fn')

	ProblemCache.findOneAndUpdate(
		{ problem: ''+res._id, hasSeenAnswers: { $ne: self.id } },
		{ $push: { hasSeenAnswers: self.id } },
		(err, doc) => {
			if (err) {
				throw err
			}
			cb(null)
		}
	)
}

// Decorator for mongoose calls.
function TMERA(cb) {
	return (err) => {
		if (err) {
			console.trace()
			throw err
		}

		cb.apply(null, [].slice.call(arguments, 1))
	}
}

module.exports.stuffGetProblem = function(self, problem, cb) {
	please('$skip', { $model: Problem}, '$fn')

	if (self && !self instanceof User) {
		throw new Error('WTF!')
	}

	var selfIsAuthor = selfIsEditor = false
	if (self) {
		var selfIsAuthor = problem.author && problem.author.id === self._id
		var selfIsEditor = self.flags.editor
	}

	function genJSON() {
		return new Promise(function(accept, reject) {
			if (selfIsAuthor || selfIsEditor) {
				var json = problem.toJSON({
					select: Problem.AuthorAPISelect,
					virtuals: true,
				})
			} else {
				var json = problem.toJSON()
			}

			accept(json)
		})
	}

	function fillMeta(json) {
		return new Promise(function(resolve, reject) {
			function onGetCache(cache) {
				json.counts = {
					likes: cache.likes.length,
					solved: cache.hasAnswered.length,
				}

				json._meta = {
					liked: false,
					userTries: 0,
					userTried: false,
					userTriesLeft: problem.maxTries,
					userSawAnswer: false,
					userSolved: false,
					// userWatching: false
				}

				var selfSolved = selfSawAnswer = false
				if (self) {
					var selfSolved = !!_.find(cache.hasAnswered, { user: self.id })
					var selfSawAnswer = !!~cache.hasSeenAnswers.indexOf(self.id)
				}

				if (problem.isMultipleChoice) {
					if (selfIsAuthor || selfIsEditor || selfSolved || selfSawAnswer) {
						json.answer.mcOptions = problem.answer
					} else {
						// Shuffle multiple choices if user can still answer it.
						json.answer.mcOptions = problem.getShuffledMCOptions()
					}
				}

				if (!self) {
					resolve(json)
					return
				}

				var selfTries = _.find(cache.userTries, { user: self.id }) || 0

				if (selfIsAuthor) {
					json._meta.liked = true
					resolve(json)
					return
				}

				_.extend(json._meta, {
					liked: !!~cache.likes.indexOf(self.id),
					userTries: selfTries,
					userTried: selfTries !== 0,
					userTriesLeft: Math.max(problem.maxTries - selfTries, 0),
					userSawAnswer: selfSawAnswer,
					userSolved: selfSolved,
				})

				resolve(json)
			}

			ProblemCache.findOne({ problem: problem.id }, TMERA(onGetCache))
		})
	}

	genJSON()
		.then(fillMeta)
		.then((json) => {
			cb(null, json)
		}, (err) => {
			console.trace()
			logger.error("Error thrown!", err, err.stack)
			cb(err)
		})
}

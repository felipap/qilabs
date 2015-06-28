
var mongoose = require('mongoose')
var _ = require('lodash')

var please = require('app/lib/please.js')
var jobs = require('app/config/kue.js')

var User = mongoose.model('User')
var Problem = mongoose.model('ProblemCore')
var ProblemCache = mongoose.model('ProblemCache')

var logger = global.logger.mchild()

var validator = require('validator')

module.exports.createProblem = function(self, data, cb) {
	please({$model:User},'$skip','$fn')

	function getImagesInMarkdown(text) {
		var images = text.match(/!\[.*?\]\(.+?\)/g)
		return _.map(images, (i) => i.match(/^!\[.*?\]\((.+?)\)$/)[1])
	}

	var problem = new Problem({
		name: data.name,
		body: data.body,
		source: data.source,
		images: getImagesInMarkdown(data.body),
		//
		level: data.level,
		subject: data.subject,
		topic: data.topic,
		//
		isMultipleChoice: data.isMultipleChoice,
		//
		originalPset: data._set,
		originalIndex: data.originalIndex,
	})

	if (data.isOriginalAuthor) {
		problem.author = User.toAuthorObject(self)
	}

	if (data.isMultipleChoice) {
		data.answer = data.answer.options
	} else {
		data.answer = data.answer.value
	}

	problem.save((err, doc) => {
		if (err) {
			logger.error('Error creating problem', err)
			throw err
		}
		cb(null, doc)
	})
}

module.exports.delete = function(self, res, cb) {
	throw new Error('But you can\'t do that! :(')
	res.remove(cb)
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
		cb(null, true)
	}

	ProblemCache.findOneAndUpdate(
		{ problem: '' + res._id, likes: { $ne: self._id } },
		{ $push: { likes: self._id }
	}, done)
}

module.exports.unupvote = function(self, res, cb) {
	please({$model:User},{$model:Problem},'$fn')

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
		cb(null, false)
	}

	ProblemCache.findOneAndUpdate(
		{ problem: '' + res._id, likes: self._id },
		{ $pull: { likes: self._id } },
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
	please('$skip', {$model:Problem}, '$fn')

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
			var json = problem.toJSON()

			if (!selfIsAuthor && !selfIsEditor) {
				delete json.answer
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
						json.mcOptions = problem.answer
					} else {
						// Shuffle multiple choices if user can still answer it.
						json.mcOptions = problem.getShuffledMCOptions()
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
					userTries: selfTries, // FIXME: why the fuck?
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
			logger.error('Error thrown!', err, err.stack)
			cb(err)
		})
}

module.exports.tryAnswer = function(self, problem, testStr, cb) {

	function incNumTries(cb) {
		ProblemCache.findOneAndUpdate(
			{ problem: problem._id , 'userTries.user': self.id },
			{ $inc: { 'userTries.$.tries': 1 } },
			(err, doc) => {
				if (err) {
					throw err
				}
				if (!doc) {
					logger.error('Couldn\'t ProblemCache for problem', problem._id,
						'user', self.id)
				}
				cb()
			})
	}

	function addTry(cb) {
		ProblemCache.findOneAndUpdate(
			{ problem: problem._id, 'userTries.user': { $ne: self.id } },
			{ $push: {
				// README THIS MIGHT BE COMPLETELY WRONG
				userTries: { tries: 1, user: self.id, lastTry: Date.now() }
			} },
			(err, doc) => {
				if (err) {
					throw err
				}

				if (!doc) {
					logger.error('Couldn\'t ProblemCache for problem', problem._id,
						'user', self.id)
				}
				cb()
			})
	}

	function CONGRATULATIONS(cb) {
		ProblemCache.findOneAndUpdate(
			// Really make sure user didn't already answer it
			{ problem: problem._id, 'hasAnswered.user': { $ne: self.id } },
			{ $push: { hasAnswered: { user: self.id, when: Date.now() } } },
			(err, doc) => {
				if (err) {
					throw err
				}

				// // Update qi points.
				// // This must be improved ASAP.
				// User.findOneAndUpdate(
				// 	{ _id: self.id },
				// 	{ $inc: { 'stats.qiPoints': 1 } },
				// 	(err, doc) => {
				// 		if (err) {
				// 			throw err
				// 		}
				// 	})

				// if (!doc) {
				// 	req.logger.warn("Couldn't Problem.findOneAndUpdate specified", problem._id)
				// } else {
				// 	console.log(doc)
				// }
				//
				if (!doc) {
					logger.error('Couldn\'t ProblemCache for problem', problem._id,
						'user', self.id)
				}

				cb()
			})
	}

	function onGetCache(cache) {
		var selfTry = _.findWhere(cache.userTries, { user: self.id })
		var selfAnswered = _.findWhere(cache.hasAnswered, { user: self.id })

		if (selfAnswered) {
			cb({ error: 'AlreadyTried' })
			return
		}

		function onUpdatedCache() {
			var correct = problem.hasValidAnswer(validator.trim(testStr))

			if (!correct) {
				cb(null, false)
				return
			}

			CONGRATULATIONS(() => cb(null, true))
		}

		if (selfTry) {
			if (selfTry.tries > problem.maxTries) {
				cb({ error: 'TriesExceeded' })
				return
			}
			incNumTries(onUpdatedCache)
		} else {
			addTry(onUpdatedCache)
		}
	}

	ProblemCache.findOne({ problem: problem.id }, TMERA(onGetCache))
}
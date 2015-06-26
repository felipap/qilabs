
var mongoose = require('mongoose')
var _ = require('lodash')

var required = require('app/controllers/lib/required')
var unspam = require('app/controllers/lib/unspam')
var actions = require('app/actions/problems')
var config = require('app/static/config')

var User = mongoose.model('User')
var Problem = mongoose.model('Problem')

TITLE_MIN = 10
TITLE_MAX = 100
BODY_MIN = 20
BODY_MAX = 20*1000

dryText = (str) => str.replace(/( {1})[ ]*/gi, '$1')
pureText = (str) => str.replace(/(<([^>]+)>)/ig,"")
var validator = require('validator')

var ParseRules = {
	title: {
		$required: false,
		$valid: (s) => {
			return validator.isLength(s, TITLE_MIN, TITLE_MAX)
		},
		$clean: (s) => {
			return validator.sipLow(dryText(s), true)
		},
	},
	level: {
		$validate: (s) => {
			if (config.problemLevels.indexOf(s) === -1) {
				return 'Nível inválido.'
			}
		},
	},
	subject: {
		$validate: (s) => {
			if (config.problemSubjects.indexOf(s) === -1) {
				return 'Nível inválido.'
			}
		},
	},
	topic: {
		$required: false,
		$validate: false,
	},
	localIndex: {
		$required: false,
		$validate: false,
	},
	body: {
		$valid: (s) => {
			return validator.isLength(pureText(s), BODY_MIN) &&
				validator.isLength(s, 0, BODY_MAX)
		},
		$clean: (s) => {
			return validator.stripLow(s, true)
			// remove images
			// s = s.replace /(!\[.*?\]\()(.+?)(\))/g, (whole, a, b, c) ->
			// 	return ''
		}
	},
	source: {
		$valid: (s) => {
			return !s || validator.isLength(s, 0, 100)
		},
		$clean: (s) => {
			return validator.stripLow(dryText(s), true)
		},
	},
	answer: {
		is_mc: {
			$valid: (str) => {
				return str === true || str === false
			}
		},
		options: {
			$required: false,
			$valid: (array) => {
				if (array instanceof Array && [4,5].indexOf(array.length) !== -1) {
					for (var i=0; i<array.length; ++i) {
						var e = array[i]
						if (typeof e !== "string" || e.length >= 100) {
							return false
						}
					}
					return true
				}
				return false
			}
		},
		value: {
			$required: false,
			$valid: (str) => {
				return str
			},
			$clean: (str) => {
				return str
			},
			// $msg: (str) -> "A solução única precisa ser um número inteiro."
		}
	},
}

module.exports = function (app) {
	var router = require('express').Router()

	router.use(required.login)

	router.param('problemId', function(req, res, next, problemId) {
		try {
			mongoose.Types.ObjectId.createFromHexString(problemId)
		} catch (e) {
			return next({ type: "InvalidId", args: 'problemId', value: problemId})
		}
		Problem.findOne({ _id:problemId }, req.handleErr404((problem) => {
			req.problem = problem
			next()
		}))
	})

	router.post('/', function(req, res) {
		req.parse(ParseRules, (reqBody) => {
			actions.createProblem(req.user, {
				subject: reqBody.subject,
				localIndex: reqBody.localIndex,
				level: reqBody.level,
				topic: reqBody.topic,
				title: reqBody.title,
				body: reqBody.body,
				source: reqBody.source,
				answer: {
					is_mc: reqBody.answer.is_mc,
					options: reqBody.answer.is_mc && reqBody.answer.options || null,
					value: reqBody.answer.is_mc ? null : reqBody.answer.value
				}
			}, req.handleErr((doc) => {
				res.endJSON(
					doc.toJSON({ select: Problem.APISelectAuthor, virtuals: true }
				))
			}))
		})
	})

	router.get('/:problemId', function(req, res) {
		actions.stuffGetProblem(req.user, req.problem, (err, json) => {
			res.endJSON({ data: json })
		})
	})

	router.put('/:problemId', required.selfOwns('problem'), function(req, res) {
		var problem = req.problem
		req.parse(ParseRules, (reqBody) => {
			problem.updated_at = Date.now()
			problem.subject = reqBody.subject
			problem.localIndex = reqBody.localIndex
			problem.level = reqBody.level
			console.log(reqBody.topic, reqBody)
			problem.topic = reqBody.topic
			problem.title = reqBody.title
			problem.body = reqBody.body
			problem.source = reqBody.source

			if (reqBody.answer.is_mc) {
				problem.answer = {
					is_mc: true,
					options: reqBody.answer.options
				}
			} else {
				problem.answer = {
					is_mc: false,
					value: reqBody.answer.value
				}
			}

			problem.save(req.handleErr((doc) => {
				res.endJSON(
					doc.toJSON({ select: Problem.APISelectAuthor, virtuals: true }
				))
			}))
		})
	})

	router["delete"]('/:problemId', required.selfOwns('problem'),
	function(req, res) {
		req.problem.remove((err) => {
			if (err) {
				req.logger.error("Error removing", req.problem, err)
				res.endJSON({ error: true })
			} else {
				res.endJSON({ error: false })
			}
		})
	})

	router.post('/:problemId/upvote', required.selfDoesntOwn('problem'),
	unspam.limit(1000),
	function(req, res) {
		actions.upvote(req.user, req.problem, (err, doc) => {
			if (err) {
				req.logger.error("Error upvoting", err)
				res.endJSON({ error: true })
			} else if (doc) {
				res.endJSON({ liked: doc.votes.indexOf(req.user.id) !== -1 })
			} else {
				res.endJSON({ liked: req.problem.votes.indexOf(req.user.id) !== -1 })
			}
		})
	})

	router.post('/:problemId/unupvote', required.selfDoesntOwn('problem'),
	unspam.limit(1000),
	function(req, res) {
		actions.unupvote(req.user, req.problem, (err, doc) => {
			if (err) {
				req.logger.error("Error unupvoting", err)
				res.endJSON({ error: true })
			} else if (doc) {
				res.endJSON({ liked: doc.votes.indexOf(req.user.id) !== -1 })
			} else {
				res.endJSON({ liked: req.problem.votes.indexOf(req.user.id) !== -1 })
			}
		})
	})

	router.post('/:problemId/see', required.selfDoesntOwn('problem'),
	function(req, res) {
		actions.seeAnswer(req.user, req.problem, (err, doc) => {
			if (err) {
				req.logger.error("Error seeing answer", err)
				res.endJSON({ error: true })
			} else {
				res.endJSON({ error: false })
			}
		})
	})

	router.get('/:problemId/answers', function(req, res) {
		res.endJSON({ error: false, docs: 'Nothing here! Satisfied?' })
	})


	router.post('/:problemId/try', function(req, res) {
		var userTried = _.findWhere(req.problem.userTries, { user: req.user.id })
		var userAnswered = _.findWhere(req.problem.hasAnswered, { user: req.user.id })

		if (userAnswered) {
			res.status(403).endJSON({
				error: true,
				message: "Você já resolveu esse problema."
			})
			return
		}

		if (userTried) {
			if (req.problem.answer.is_mc || userTried.tries >= 3) {
				// No. of tries exceeded
				res.status(403).endJSON({
					error: true,
					message: "Número de tentativas excedido."
				})
				return
			}
			// Increase number of tries atomically.
			Problem.findOneAndUpdate(
				{ _id: req.problem._id, 'userTries.user': req.user.id },
				{ $inc: { 'userTries.$.tries': 1 } },
				(err, doc) => {
					if (err) {
						req.logger.eror("Error updating problem object", err)
						throw err
					}
					if (!doc) {
						req.logger.farn("Couldn't Problem.findOneAndUpdate", req.problem._id)
					}
				})
		} else {
			// This is the users' first try → Add us to the userTries object.
			Problem.findOneAndUpdate(
			{ _id: req.problem._id, 'userTries.user': { $ne: req.user.id } },
			{ $push: {
				// README THIS MIGHT BE COMPLETELY WRONG
				userTries: { tries: 1, user: req.user.id, lastTry: Date.now() }
			} },
			(err, doc) => {
				if (err) {
					throw err
				}

				if (!doc) {
					req.logger.warn("Couldn't Problem.findOneAndUpdate", req.problem._id)
				} else {
					console.log(doc)
				}
			})
		}

		// Check correctness
		var correct = false
		if (req.problem.answer.is_mc) {
			if (req.problem.validAnswer(req.body.value)) {
				correct = true
			}
		} else {
			if (req.problem.validAnswer(req.body.value)) {
				correct = true
			}
		}

		if (correct) {
			Problem.findOneAndUpdate(
				// Really make sure user didn't already answer it
				{ _id: req.problem._id, 'hasAnswered.user': { $ne: req.user.id } },
				{ $push: { hasAnswered: { user: req.user.id, when: Date.now() } } },
				(err, doc) => {
					if (err) {
						throw err
					}

					// Update qi points.
					// This must be improved ASAP.
					User.findOneAndUpdate(
						{ _id: req.user.id },
						{ $inc: { 'stats.qiPoints': 1 } },
						(err, doc) => {
							if (err) {
								throw err
							}
						})

					if (!doc) {
						req.logger.warn("Couldn't Problem.findOneAndUpdate specified", req.problem._id)
					} else {
						console.log(doc)
					}

					return res.endJSON({ correct: true })
				})
		} else {
			return res.endJSON({ correct: false })
		}
	})

	return router
}
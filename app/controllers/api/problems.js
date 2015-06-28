
var mongoose = require('mongoose')
var _ = require('lodash')

// var unduplicate = require('app/controllers/lib/unduplicate')
function unduplicate (req, res, next) {
	console.log('Implement me!')
	next()
}

var required = require('app/controllers/lib/required')
var unspam = require('app/controllers/lib/unspam')
var actions = require('app/actions/problems')
var config = require('app/static/config')

var User = mongoose.model('User')
var Problem = mongoose.model('ProblemCore')

dryText = (str) => str.replace(/( {1})[ ]*/gi, '$1')
pureText = (str) => str.replace(/(<([^>]+)>)/ig,"")
var validator = require('validator')

var ParseRules = {
	name: {
		$required: false,
		$validate: (s) => {
			if (s.length < config.ProblemNameMin) {
				return "Título muito pequeno."
			}
			if (s.length > config.ProblemNameMax) {
				return "Título muito grande."
			}
		},
		$clean: (s) => {
			return validator.sipLow(dryText(s), true)
		},
	},
	body: {
		$validate: (s) => {
			var pure = pureText(s)

			if (pure.length < config.ProblemBodyMin) {
				return "Texto muito pequeno."
			}

			// Intentionally not pure.
			if (s.length > config.ProblemBodyMax) {
				return "Texto muito grande."
			}
		},
		$clean: (s) => {
			return validator.stripLow(s, true)
			// remove images
			// s = s.replace /(!\[.*?\]\()(.+?)(\))/g, (whole, a, b, c) ->
			// 	return ''
		}
	},
	isOriginalAuthor: {
		$valid: validator.isBoolean,
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
	source: {
		$valid: (s) => {
			return !s || validator.isLength(s, 0, 100)
		},
		$clean: (s) => {
			return validator.stripLow(dryText(s), true)
		},
	},
	isMultipleChoice: {
		$valid: (str) => {
			return str === true || str === false
		}
	},
	answer: {
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

	router.param('problemId', function(req, res, next, id) {
		try {
			mongoose.Types.ObjectId.createFromHexString(id)
		} catch (e) {
			return next({ type: "InvalidId", args: 'problemId', value: id})
		}
		Problem.findOne({ _id: id }, req.handleErr404((problem) => {
			req.problem = problem
			next()
		}))
	})

	router.get('/:problemId',
		unspam.limit(1000),
		(req, res, next) => {
			actions.stuffGetProblem(req.user, req.problem, (err, json) => {
				if (err) {
					next(err)
					return
				}
				res.endJSON(json)
			})
		})

	router.use(required.login)

	router.post('/',
		unspam.limit(1000),
		unduplicate,
		(req, res) => {
			req.parse(ParseRules, (body) => {
				actions.createProblem(req.user, body, req.handleErr((doc) => {
					res.endJSON({ error: false })
				}))
			})
		})

	router.put('/:problemId',
		unspam.limit(1000),
		required.selfCanEdit('problem'),
		(req, res) => {
			req.parse(ParseRules, (body) => {
				var data = {
					subject: body.subject,
					level: body.level,
					topic: body.topic,
					name: body.name,
					body: body.body,
					source: body.source,
					isMultipleChoice: body.isMultipleChoice,
					originalIndex: body.originalIndex,
					originalPset: body._pset,
					updated: Date.now(),
					answer: body.isMultipleChoice? body.answer.options : body.answer.value
				}

				Problem.findOneAndUpdate({ _id: req.problem.id }, data,
					req.handleErr((doc) => {
						res.endJSON(doc.toJSON({ select: '-answer', virtuals: true }))
					}))
			})
		})

	router.delete('/:problemId',
		required.selfCanEdit('problem'),
		(req, res) => {
			actions.delete(req.user, req.problem, (err, removed) => {
				if (err) {
					req.logger.error("Error removing", req.problem, err)
					res.endJSON({ error: true })
				} else {
					res.endJSON({ error: false })
				}
			})
		})

	router.post('/:problemId/upvote',
		required.selfDoesntOwn('problem'),
		unspam.limit(1000),
		(req, res) => {
			actions.upvote(req.user, req.problem, (err, liked) => {
				if (err) {
					req.logger.error("Error upvoting", err)
					res.endJSON({ error: true })
					return
				}
				res.endJSON({ liked: liked })
			})
		})

	router.post('/:problemId/unupvote',
		required.selfDoesntOwn('problem'),
		unspam.limit(1000),
		(req, res) => {
			actions.unupvote(req.user, req.problem, (err, liked) => {
				if (err) {
					req.logger.error("Error unupvoting", err)
					res.endJSON({ error: true })
					return
				}
				res.endJSON({ liked: liked })
			})
		})

	router.post('/:problemId/see',
		required.selfDoesntOwn('problem'),
		(req, res) => {
			actions.registerSeenAnswer(req.user, req.problem, (err, doc) => {
				if (err) {
					req.logger.error("Error seeing answer", err)
					res.endJSON({ error: true })
				} else {
					res.endJSON({ error: false })
				}
			})
		})

	router.get('/:problemId/answers', function(req, res) {
		res.endJSON({ error: false, docs: 'Nothing here! Happy?' })
	})

	router.post('/:problemId/try', function(req, res, next) {
		actions.tryAnswer(req.user, req.problem, req.body.value,
		(err, result) => {
			if (err) {
				err.APIError = true
				next(err)
				return
			}
			res.endJSON({ result: result })
		})
	})

	return router
}
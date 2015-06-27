
var mongoose = require('mongoose')
var async = require('async')
var _ = require('lodash')

var required = require('app/controllers/lib/required')
var unspam = require('app/controllers/lib/unspam')
var actions = require('app/actions/psets')
var cardActions = require('app/actions/cards')
var psetActions = require('app/actions/psets')

var TMERA = require('app/lib/tmera')

var User = mongoose.model('User')
var Problem = mongoose.model('Problem')
var ProblemSet = mongoose.model('ProblemSet')

module.exports = (app) => {
	var router = require('express').Router()

	router.param('psetId', function (req, res, next, psetId) {
		try {
			var id = mongoose.Types.ObjectId.createFromHexString(psetId)
		} catch (e) {
			return next({ type: "InvalidId", args: 'psetId', value: psetId })
		}

		ProblemSet.findOne({ _id: psetId }, req.handleErr404((pset) => {
			req.pset = pset
			next()
		}))
	})

	router.param('psetSlug', function (req, res, next, psetSlug) {
		ProblemSet.findOne({ slug: psetSlug }, req.handleErr404((pset) => {
			req.pset = pset
			next()
		}))
	})

	//

	router.get('/:psetId/problems', function (req, res) {
		Problem.find({ _id: { $in: req.pset.problem_ids }})
			.sort('-created_at')
			.limit(20)
			.exec((err, docs) => {
				if (err) {
					throw err
				}

				if (!docs.length || !docs[docs.length-1]) {
					minDate = 0
				} else {
					minDate = docs[docs.length-1].created_at
				}

				res.endJSON({
					minDate: 1*minDatem,
					eof: minDate === 0,
					data: cardActions.workProblemCards(req.user, docs),
				})
			})
	})



	var u = ['/:psetId','/s/:psetSlug']
	u.forEach((n) => {
		router.get(n, function (req, res) {
			psetActions.stuffGetPset(req.user, req.pset, (err, json) => {
				res.endJSON({ data: json })
			})
		})
	})

	router.use(required.login)

	router.post('/', function (req, res) {
		req.parse(ProblemSet.ParseRules, (reqBody) => {
			actions.createPset(req.user, reqBody, req.handleErr((doc) => {

				res.endJSON(doc.toJSON({
					select: ProblemSet.APISelectAuthor,
					virtuals: true,
				}))
			}))
		})
	})

	router.put('/:psetId', required.selfOwns('pset'), function (req, res) {
		req.parse(ProblemSet.ParseRules, (reqBody) => {
			actions.updatePset(req.user, req.pset, reqBody, req.handleErr((doc) => {
				res.endJSON(doc.toJSON({
					select: ProblemSet.APISelectAuthor,
					virtuals: true,
				}))
			}))
		})
	})

	router.delete('/:psetId',
		required.selfOwns('pset'),
		(req, res) => {
			req.pset.remove((err) => {
				if (err) {
					req.logger.error("Error removing", req.pset, err)
					res.endJSON({ error: true })
				} else {
					res.endJSON({ error: false })
				}
			})
		})

	router.post('/:psetId/upvote',
		required.selfDoesntOwn('pset'),
		unspam.limit(1000),
		(req, res) => {
			actions.upvote(req.user, req.pset, (err, liked) => {
				if (err) {
					req.logger.error("Error upvoting", err)
					res.endJSON({ error: true })
					return
				}
				res.endJSON({ liked: liked })
			})
		})

	router.post('/:psetId/unupvote',
		required.selfDoesntOwn('pset'),
		unspam.limit(1000),
		(req, res) => {
			actions.unupvote(req.user, req.pset, (err, liked) => {
				if (err) {
					req.logger.error("Error unupvoting", err)
					res.endJSON({ error: true })
					return
				}
				res.endJSON({ liked: liked })
			})
		})

	return router
}
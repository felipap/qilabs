
mongoose = require 'mongoose'
async = require 'async'
_ = require 'lodash'

required = require 'app/controllers/lib/required'
unspam = require 'app/controllers/lib/unspam'
actions = require 'app/actions/psets'
cardsActions = require 'app/actions/cards'

User = mongoose.model 'User'
Problem = mongoose.model 'Problem'
ProblemSet = mongoose.model 'ProblemSet'
TMERA = require 'app/lib/tmera'

module.exports = (app) ->

	router = require('express').Router()

	router.use required.login

	router.param 'psetId', (req, res, next, psetId) ->
		try
			id = mongoose.Types.ObjectId.createFromHexString(psetId);
		catch e
			return next({ type: "InvalidId", args:'psetId', value:psetId});
		ProblemSet.findOne { _id: psetId }, req.handleErr404 (pset) ->
			req.pset = pset
			next()

	##

	router.post '/', (req, res) ->
		req.parse ProblemSet.ParseRules, (err, reqBody) ->
			# Find problems with the passed ids and use only ids of existing problems
			Problem.find { id: { $in: reqBody.problems } }, TMERA (problems) ->
				pids = _.pluck(problems, 'id')
				console.log('exists:', pids)

				actions.createPset req.user, {
					name: reqBody.name
					subject: reqBody.subject
					slug: reqBody.slug
					description: reqBody.description
					problems: pids
				}, req.handleErr (doc) ->
					# Update problems in pids to point to this problemset.
					# This should definitely be better documented.
					res.endJSON(doc.toJSON({ select: Problem.APISelectAuthor, virtuals: true }))

	router.get '/:psetId/problems', (req, res) ->
		Problem.find {}
			.sort '-created_at'
			.limit 20
			.exec TMERA (docs) ->
				if not docs.length or not docs[docs.length-1]
					minDate = 0
				else
					minDate = docs[docs.length-1].created_at

				res.endJSON(
					minDate: 1*minDate
					eof: minDate is 0
					data: cardsActions.workProblemCards(req.user, docs)
				)


	router.get '/:psetId', (req, res) ->

		if req.pset.author.id is req.user._id
			jsonDoc = _.extend(req.pset.toJSON({
					select: Problem.APISelectAuthor,
					virtuals: true
				}), _meta:{})
			jsonDoc.answer.mc_options = jsonDoc.answer.options
			res.endJSON({ data: jsonDoc })
		else
			jsonDoc = req.pset.toJSON()
			req.user.doesFollowUserId req.pset.author.id, (err, val) ->
				if err
					req.logger.error("PQP!", err)

				stats =
					authorFollowed: val
					liked: !!~req.pset.votes.indexOf(req.user.id)
					# userTries: nTries
					userIsAuthor: req.pset.author.id is req.user.id
					# userTried: !!nTries
					# userTriesLeft: Math.max(maxTries - nTries, 0)
					# userSawAnswer: !!~req.pset.hasSeenAnswers.indexOf(req.user.id)
					# userSolved: !!_.find(req.pset.hasAnswered, { user: req.user.id })
					# userWatching: !!~req.pset.users_watching.indexOf(req.user.id)

				jsonDoc._meta = stats
				res.endJSON({ data: jsonDoc })

	router.put '/:psetId', required.selfOwns('pset'), (req, res) ->
		pset = req.pset
		req.parse ProblemSet.ParseRules, (err, reqBody) ->
			# body = actions.sanitizeBody(reqBody.content.body)
			pset.updated_at = Date.now()
			pset.name = reqBody.name
			pset.subject = reqBody.subject
			pset.problems = reqBody.problems
			pset.slug = reqBody.slug
			pset.description = reqBody.description
			pset.save req.handleErr (doc) ->
				res.endJSON(doc.toJSON({ select: ProblemSet.APISelectAuthor, virtuals: true }))

	router.delete '/:psetId', required.selfOwns('pset'), (req, res) ->
		req.pset.remove (err) ->
			if err
				req.logger.error("Error removing", req.pset, err)
				res.endJSON(error: true)
			else
				res.endJSON(error: false)

	return router
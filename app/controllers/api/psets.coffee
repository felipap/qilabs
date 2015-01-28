
mongoose = require 'mongoose'
_ = require 'lodash'

required = require 'app/controllers/lib/required'
unspam = require 'app/controllers/lib/unspam'
actions = require 'app/actions/psets'

User = mongoose.model 'User'
Problem = mongoose.model 'Problem'
ProblemSet = mongoose.model 'ProblemSet'

module.exports = (app) ->

	router = require('express').Router()

	router.use required.login

	router.param 'psetId', (req, res, next, psetId) ->
		try
			id = mongoose.Types.ObjectId.createFromHexString(psetId);
		catch e
			return next({ type: "InvalidId", args:'psetId', value:psetId});
		ProblemSet.findOne { _id:psetId }, req.handleErr404 (pset) ->
			req.pset = pset
			next()

	##

	router.post '/', (req, res) ->
		req.parse ProblemSet.ParseRules, (err, reqBody) ->
			actions.createPset req.user, {
				title: reqBody.title
				description: reqBody.description
				problemIds: reqBody.problemIds
			}, req.handleErr (doc) ->
				res.endJSON(doc.toJSON({ select: Problem.APISelectAuthor, virtuals: true }))

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
			req.user.doesFollowUser req.pset.author.id, (err, val) ->
				if err
					req.logger.error("PQP!", err)

				nTries = _.find(req.pset.userTries, { user: req.user.id })?.tries or 0
				maxTries = if req.pset.answer.is_mc then 1 else 3

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

				if req.pset.answer.is_mc
					if stats.userSolved or
					stats.userIsAuthor or
					stats.userSawAnswer or
					not stats.userTriesLeft # Show options in proper place (correct first)
						jsonDoc.answer.mc_options = req.pset.answer.options
					else # Show shuffled options
						jsonDoc.answer.mc_options = req.pset.getShuffledMCOptions()

				jsonDoc._meta = stats

				res.endJSON({ data: jsonDoc })

	router.put '/:psetId', required.selfOwns('pset'), (req, res) ->
		pset = req.pset
		req.parse ProblemSet.ParseRules, (err, reqBody) ->
			# body = actions.sanitizeBody(reqBody.content.body)
			pset.updated_at = Date.now()
			pset.title = reqBody.title
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
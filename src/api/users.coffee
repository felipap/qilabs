
async = require 'async'
mongoose = require 'mongoose'
_ = require 'underscore'
required = require 'src/lib/required.js'

Resource = mongoose.model 'Resource'
User = Resource.model 'User'

module.exports = (app) ->
	router = require('express').Router()

	router.use required.login

	router.param('userId', (req, res, next, userId) ->
		try
			id = mongoose.Types.ObjectId.createFromHexString(userId);
		catch e
			return next({ type: "InvalidId", args:'userId', value:userId});
		User.findOne { _id:userId }, req.handleErrResult (user) ->
			req.requestedUser = user
			next()
	)

	router.get '/:userId', (req, res) ->
		res.endJSON req.requestedUser.toJSON()

	router.get '/:userId/avatar', (req, res) ->
		res.redirect(req.requestedUser.avatarUrl)

	router.get '/:userId/posts', (req, res) ->
		maxDate = parseInt(req.query.maxDate)
		if isNaN(maxDate)
			maxDate = Date.now()

		User.getUserTimeline req.requestedUser, { maxDate: maxDate },
			req.handleErrResult (docs, minDate=-1) ->
				res.endJSON(minDate: minDate, data: docs)

	router.get '/:userId/followers', (req, res) ->
		req.requestedUser.getPopulatedFollowers (err, results) ->
			# Add meta.followed attr to users, with req.user → user follow status
			async.map results, ((person, next) ->
					req.user.doesFollowUser person, (err, val) ->
						next(err, _.extend(person.toJSON(),{meta:{followed:val}}))
				), (err, results) ->
					if err
						res.endJSON(error: true)
					else
						res.endJSON(data: results)

	router.get '/:userId/following', (req, res) ->
		req.requestedUser.getPopulatedFollowing (err, results) ->
			# Add meta.followed attr to users, with req.user → user follow status
			async.map results, ((person, next) ->
					req.user.doesFollowUser person, (err, val) ->
						next(err, _.extend(person.toJSON(),{meta:{followed:val}}))
				), (err, results) ->
					if err
						res.endJSON(error: true)
					else
						res.endJSON(data: results)

	router.post '/:userId/follow', (req, res) ->
		req.user.dofollowUser req.requestedUser, (err, done) ->
			res.endJSON(error: !!err)

	router.post '/:userId/unfollow', (req, res) ->
		req.user.unfollowUser req.requestedUser, (err, done) ->
			res.endJSON(error: !!err)

	return router

async = require 'async'
mongoose = require 'mongoose'
_ = require 'underscore'

required = require 'src/core/required.js'
please = require 'src/lib/please.js'
jobs = require 'src/config/kue.js'
redis = require 'src/config/redis.js'

Resource = mongoose.model 'Resource'
User = Resource.model 'User'
Follow = Resource.model 'Follow'

#### Actions.

dofollowUser = (agent, user, cb) ->
	please.args({$isModel:'User'}, {$isModel:'User'}, '$isFn')

	if ''+user.id is ''+agent.id
		# One can't follow itself
		return cb(true)

	Follow.findOne {follower:agent, followee:user}, (err, doc) =>
		unless doc
			doc = new Follow {
				follower: agent._id
				followee: user._id
			}
			doc.save()

			# ACID, please
			redis.sadd agent.getCacheField("Following"), ''+user.id, (err, doc) ->
				console.log "sadd on following", arguments
				if err
					console.log err

			jobs.create('user follow', {
				title: "New follow: #{agent.name} → #{user.name}",
				follower: agent,
				followee: user,
				follow: doc
			}).save()
		cb(err, !!doc)

unfollowUser = (agent, user, cb) ->
	please.args({$isModel:'User'}, {$isModel:'User'}, '$isFn')

	Follow.findOne { follower: agent._id, followee: user._id }, (err, doc) =>
		if err
			console.warn("error finding one follow", err)
			return cb(err)

		if doc
			doc.remove(cb)
			jobs.create('user unfollow', {
				title: "New unfollow: #{agent.name} → #{user.name}",
				followee: user,
				follower: agent,
			}).save()

			# remove on redis anyway? or only inside clause?
			redis.srem agent.getCacheField("Following"), ''+user.id, (err, doc) ->
				console.log "srem on following", arguments
				if err
					console.log "ERROR REMOVING ON REDIS", err
					console.trace()
					return cb(err)
				cb(null)

module.exports = (app) ->
	router = require('express').Router()

	router.use required.login

	router.param('userId', (req, res, next, userId) ->
		try
			id = mongoose.Types.ObjectId.createFromHexString(userId);
		catch e
			return next({ type: "InvalidId", args:'userId', value:userId});
		User.findOne { _id:userId }, req.handleErr404 (user) ->
			req.requestedUser = user
			next()
	)

	router.get '/:userId', (req, res) ->
		res.endJSON req.requestedUser.toJSON()

	router.get '/:userId/avatar', (req, res) ->
		res.redirect req.requestedUser.avatarUrl

	router.get '/:userId/posts', (req, res) ->
		maxDate = parseInt(req.query.maxDate)
		if isNaN(maxDate)
			maxDate = Date.now()

		User.getUserTimeline req.requestedUser, { maxDate: maxDate },
			req.handleErr404 (docs, minDate=-1) ->
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
		dofollowUser req.user, req.requestedUser, (err) ->
			res.endJSON(error: !!err)

	router.post '/:userId/unfollow', (req, res) ->
		unfollowUser req.user, req.requestedUser, (err) ->
			res.endJSON(error: !!err)

	return router
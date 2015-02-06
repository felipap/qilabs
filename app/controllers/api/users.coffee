
async = require 'async'
mongoose = require 'mongoose'
_ = require 'lodash'

required = require '../lib/required'
please = require 'app/lib/please.js'
jobs = require 'app/config/kue.js'
redis = require 'app/config/redis.js'
unspam = require '../lib/unspam'

User = mongoose.model 'User'
Follow = mongoose.model 'Follow'

#### Actions

dofollowUser = (agent, user, cb) ->
	please({$model:'User'}, {$model:'User'}, '$isFn')

	if ''+user.id is ''+agent.id
		# One can't follow itself
		return cb(new Error("Dude, you can't follow yourself"))

	Follow.findOne {follower:agent, followee:user}, (err, doc) =>
		unless doc
			doc = new Follow {
				follower: agent._id
				followee: user._id
			}
			doc.save (err, doc) ->
				if err
					throw err
				cb(null, doc)

				redis.sadd agent.getCacheField("Following"), ''+user.id, (err, doc) ->
					console.log "sadd on following", arguments
					if err
						console.log err

				jobs.create('user follow', {
					title: "New follow: #{agent.name} → #{user.name}",
					followerId: agent.id,
					followeeId: user.id,
					followId: doc.id,
				}).save()
			return
		cb(err, !!doc)

unfollowUser = (agent, user, cb) ->
	please({$model:'User'}, {$model:'User'}, '$isFn')

	Follow.findOne { follower: agent._id, followee: user._id }, (err, doc) =>
		if err
			console.warn("error finding one follow", err)
			return cb(err)

		if doc
			doc.remove (err, ok) ->
				jobs.create('user unfollow', {
					title: "New unfollow: #{agent.name} → #{user.name}",
					followeeId: user.id,
					followerId: agent.id,
					followId: doc.id,
				}).save()

				# remove on redis anyway? or only inside clause?
				redis.srem agent.getCacheField("Following"), ''+user.id, (err, doc) ->
					console.log "srem on following", arguments
					if err
						console.log "ERROR REMOVING ON REDIS", err
						console.trace()
				cb(null)
		else
				cb(null)

####

module.exports = (app) ->
	router = require('express').Router()

	router.param 'userId', (req, res, next, userId) ->
		try
			id = mongoose.Types.ObjectId.createFromHexString(userId);
		catch e
			return next({ type: "InvalidId", args:'userId', value:userId});
		User.findOne { _id:userId }, req.handleErr404 (user) ->
			req.requestedUser = user
			next()

	router.param 'username', (req, res, next, username) ->
		User.findOne { username:username }, req.handleErr404 (user) ->
			req.requestedUser = user
			next()

	router.get '/:userId', (req, res) ->
		if req.user.flags.admin
			res.endJSON req.requestedUser.toObject()
		else
			res.endJSON req.requestedUser.toJSON()

	router.get '/u/:username', (req, res) ->
		if req.user.flags.admin
			res.endJSON req.requestedUser.toObject()
		else
			res.endJSON req.requestedUser.toJSON()

	router.get '/:userId/avatar', (req, res) ->
		res.redirect req.requestedUser.avatarUrl

	router.get '/:userId/posts', unspam.limit('api_follows', 500), (req, res) ->
		maxDate = parseInt(req.query.maxDate)
		if isNaN(maxDate)
			maxDate = Date.now()

		User.getUserTimeline req.requestedUser, { maxDate: maxDate },
			req.handleErr404 (docs, minDate=-1) ->
				res.endJSON(minDate: minDate, data: docs)

	router.get '/:userId/followers', required.login, (req, res) ->
		req.requestedUser.getPopulatedFollowers (err, results) ->
			# Add meta.followed attr to users, with req.user → user follow status
			async.map results, ((person, next) ->
					req.user.doesFollowUser person.id, (err, val) ->
						next(err, _.extend(person.toJSON(),{meta:{followed:val}}))
				), (err, results) ->
					if err
						res.endJSON(error: true)
					else
						res.endJSON(data: results)

	router.get '/:userId/following', required.login, (req, res) ->
		req.requestedUser.getPopulatedFollowing (err, results) ->
			# Add meta.followed attr to users, with req.user → user follow status
			async.map results, ((person, next) ->
					req.user.doesFollowUser person.id, (err, val) ->
						next(err, _.extend(person.toJSON(),{meta:{followed:val}}))
				), (err, results) ->
					if err
						res.endJSON(error: true)
					else
						res.endJSON(data: results)

	router.post '/:userId/follow', required.login, unspam.limit('api_follows', 500), (req, res) ->
		dofollowUser req.user, req.requestedUser, (err) ->
			res.endJSON(error: !!err)

	router.post '/:userId/unfollow', required.login, unspam.limit('api_follows', 500), (req, res) ->
		unfollowUser req.user, req.requestedUser, (err) ->
			res.endJSON(error: !!err)

	return router
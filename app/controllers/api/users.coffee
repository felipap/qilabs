
async = require 'async'
mongoose = require 'mongoose'
_ = require 'lodash'

required = require '../lib/required'
unspam = require '../lib/unspam'
please = require 'app/lib/please.js'
jobs = require 'app/config/kue.js'
redis = require 'app/config/redis.js'
cardsActions = require 'app/actions/cards'

TMERA = require 'app/lib/tmera'

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
		lt = parseInt(req.query.lt)
		if isNaN(lt)
			lt = Date.now()

		mongoose.model('Post')
			.find { 'author.id':''+req.requestedUser.id, created_at: { $lt: lt-1 } }
			.sort '-created_at'
			.limit 7
			.exec TMERA (docs) ->
				minPostDate = 1*(docs.length and docs[docs.length-1].created_at) or 0

				res.endJSON(
					minDate: minPostDate
					eof: minPostDate is 0
					data: cardsActions.workPostCards(req.user, docs)
				)

	##############################################################################
	##############################################################################

	router.get '/:userId/followers', required.login, (req, res) ->
		###*
		 * 1. Get the 10 users who followed most recently after the lt value
		###
		lt = req.params.lt and new Date(req.params.lt) or null
		query = Follow.find { followee: req.requestedUser.id, follower: {$ne: null} }
		query.limit 10
		query.sort 'created_at'
		if lt
			query.find { created_at: { $lt: lt } }
		query.exec TMERA (docs) ->
			###*
			 * 2. Fetch their cached profiles of these users
			###
			userIds = _.map(_.pluck(docs, 'follower'), String)
			profileFields = (User.CacheFields.Profile.replace(/{id}/, i) for i in userIds)
			redisCommands = (['hgetall',field] for field in profileFields)
			redis.multi(redisCommands).exec (err, replies) ->
				# Pair up replies with their ids, please!
				r.id = userIds[i] for r, i in replies
				###*
				 * 3. Check which of these users self follows: intersect these ids with
				 * self's following set.
				###
				r.followed = false # default
				redis.smembers User.CacheFields.Following.replace(/{id}/, req.user.id),
				(err, followingIds) ->
					for uid in _.intersection(userIds, followingIds)
						_.find(replies, { id: uid }).followed = true
					# console.log(replies)
					data = _.map replies, (user, i) -> {
						name: user.name
						username: user.username
						avatarUrl: user.avatar
						profile: {
							bio: user.bio
							location: user.location
							home: user.home
						}
						stats: {
							followers: user.nfollowers
							following: user.nfollowing
							karma: user.karma
							posts: user.nposts
						}
						meta: {
							followed: user.followed
						}
						timestamp: 1*new Date(docs[i].created_at)
					}

					res.endJSON(data: data)

	router.get '/:userId/following', required.login, (req, res) ->
		###*
		 * 1. Get the 10 users who self followed most recently after the lt value
		###
		lt = req.params.lt and new Date(req.params.lt) or null
		query = Follow.find { follower: req.requestedUser.id, followee: {$ne: null} }
		query.limit 10
		query.sort 'created_at'
		if lt
			query.find { created_at: { $lt: lt } }
		query.exec TMERA (docs) ->
			###*
			 * 2. Fetch their cached profiles of these users
			###
			userIds = _.map(_.pluck(docs, 'followee'), String)
			profileFields = (User.CacheFields.Profile.replace(/{id}/, i) for i in userIds)
			redisCommands = (['hgetall',field] for field in profileFields)
			redis.multi(redisCommands).exec (err, replies) ->
				# Pair up replies with their ids, please!
				r.id = userIds[i] for r, i in replies
				data = _.map replies, (user) -> {
					name: user.name
					username: user.username
					avatarUrl: user.avatar
					profile: {
						bio: user.bio
						location: user.location
						home: user.home
					}
					stats: {
						followers: user.nfollowers
						following: user.nfollowing
						karma: user.karma
						posts: user.nposts
					}
					meta: {
						followed: true
					}
					timestamp: 1*new Date(docs[i].created_at)
				}

				res.endJSON(data: data, eof: docs.length < 10)

	##############################################################################
	##############################################################################

	router.post '/:userId/follow', required.login, unspam.limit('api_follows', 500), (req, res) ->
		dofollowUser req.user, req.requestedUser, (err) ->
			res.endJSON(error: !!err)

	router.post '/:userId/unfollow', required.login, unspam.limit('api_follows', 500), (req, res) ->
		unfollowUser req.user, req.requestedUser, (err) ->
			res.endJSON(error: !!err)

	return router
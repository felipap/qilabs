
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

fetchManyCachedUsers = (self, ids, cb) ->

	# Get redis fields for profile data for each id
	profileFields = (User.CacheFields.Profile.replace(/{id}/, i) for i in ids)

	redisCommands = (['hgetall',field] for field in profileFields)
	redis.multi(redisCommands).exec (err, replies) ->
		# Pair up replies with their ids, please!
		for r, i in replies
			r.id = ids[i]
			r.followed = false # default
		# 3. Check which of these users we follow: intersect these ids with
		# self's following set.
		redis.smembers User.CacheFields.Following.replace(/{id}/, self.id),
		(err, followingIds) ->
			for uid in _.intersection(ids, followingIds)
				_.find(replies, { id: uid }).followed = true

			# Structer response data
			data = _.map replies, (user, index) ->
				{
					id: user.id
					name: user.name
					username: user.username
					avatarUrl: user.avatar
					profile:
						bio: user.bio
						location: user.location
						home: user.home
					stats:
						followers: user.nfollowers
						following: user.nfollowing
						karma: user.karma
						posts: user.nposts
					meta:
						followed: user.followed
				}

			cb(null, data)


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
			req.reqUser = user
			next()

	router.param 'username', (req, res, next, username) ->
		User.findOne { username:username }, req.handleErr404 (user) ->
			req.reqUser = user
			next()

	router.get '/:userId', (req, res) ->
		if req.user.flags.admin
			res.endJSON req.reqUser.toObject()
		else
			res.endJSON req.reqUser.toJSON()

	router.get '/u/:username', (req, res) ->
		if req.user.flags.admin
			res.endJSON req.reqUser.toObject()
		else
			res.endJSON req.reqUser.toJSON()

	router.get '/:userId/avatar', (req, res) ->
		res.redirect req.reqUser.avatarUrl

	router.get '/:userId/posts', unspam.limit('api_follows', 500), (req, res) ->
		lt = parseInt(req.query.lt)
		if isNaN(lt)
			lt = Date.now()

		mongoose.model('Post')
			.find { 'author.id':''+req.reqUser.id, created_at: { $lt: lt-1 } }
			.sort '-created_at'
			.limit 7
			.exec TMERA (docs) ->
				res.endJSON(
					eof: not docs[docs.length-1] # Couldn't fill limit: there's no more!
					data: cardsActions.workPostCards(req.user, filterNull(docs))
				)

	filterNull = (list) -> _.filter(list, (i) -> !!i)

	##############################################################################
	##############################################################################

	router.get '/:userId/followers', required.login, (req, res) ->
		limit = 10
		# 1. Get the 10 users who followed most recently before lt
		lt = parseInt(req.query.lt)
		if isNaN(lt)
			lt = Date.now()
		Follow.find { followee: req.reqUser.id, follower: {$ne: null}, created_at: { $lt: lt } }
		.limit limit
		.sort '-created_at'
		.exec TMERA (_docs) ->
			docs = filterNull(_docs)
			ids = _.map(_.pluck(docs, 'follower'), String)

			timestamps = {}
			for follow in docs
				timestamps[''+follow.follower] = 1*new Date(follow.created_at)

			# Fetch cached data for each follower found.
			fetchManyCachedUsers req.user, ids, (err, _data) ->
				if err
					throw err
				# Update user array with a timestamp attribute, with the time they
				# followed req.reqUser
				data = _.map _data, (udata) ->
					timestamp = timestamps[udata.id]
					if not timestamp
						req.logger.warn("WTF?", docs, udata.id)
						return null
					_.extend(udata, { timestamp: timestamp })
				res.endJSON(data: data, eof: _docs.length < limit)

	router.get '/:userId/following', required.login, (req, res) ->
		limit = 10
		# 1. Get the 10 users who self has followed most recently before lt
		lt = parseInt(req.query.lt)
		if isNaN(lt)
			lt = Date.now()
		Follow.find { follower: req.reqUser.id, followee: {$ne: null}, created_at: { $lt: lt } }
		.limit limit
		.sort '-created_at'
		.exec TMERA (_docs) ->
			docs = filterNull(_docs)
			ids = _.map(_.pluck(docs, 'followee'), String)

			timestamps = {}
			for follow in docs
				timestamps[''+follow.followee] = 1*new Date(follow.created_at)

			# Fetch cached data for each followee found.
			fetchManyCachedUsers req.user, ids, (err, _data) ->
				if err
					throw err
				# Update user array with a timestamp attribute, with the time they
				# followed req.reqUser
				data = _.map _data, (udata) ->
					timestamp = timestamps[udata.id]
					if not timestamp
						req.logger.warn("WTF?", docs, udata.id)
						return null
					_.extend(udata, { timestamp: timestamp })
				res.endJSON(data: data, eof: _docs.length < limit)


	##############################################################################
	##############################################################################

	router.post '/:userId/follow', required.login, unspam.limit('api_follows', 500), (req, res) ->
		dofollowUser req.user, req.reqUser, (err) ->
			res.endJSON(error: !!err)

	router.post '/:userId/unfollow', required.login, unspam.limit('api_follows', 500), (req, res) ->
		unfollowUser req.user, req.reqUser, (err) ->
			res.endJSON(error: !!err)

	return router
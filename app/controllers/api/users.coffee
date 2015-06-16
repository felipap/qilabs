
async = require 'async'
mongoose = require 'mongoose'
_ = require 'lodash'

required = require '../lib/required'
unspam = require '../lib/unspam'
please = require 'app/lib/please.js'
cardsActions = require 'app/actions/cards'
usersActions = require 'app/actions/users'

TMERA = require 'app/lib/tmera'

User = mongoose.model 'User'
Follow = mongoose.model 'Follow'

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

	router.get '/:userId/followers', (req, res) ->
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

			timestamps = {}
			for follow in docs
				timestamps[''+follow.follower] = 1*new Date(follow.created_at)

			# Fetch cached data for each follower found.
			ids = _.map(_.pluck(docs, 'follower'), String)
			usersActions.fetchManyCachedUsers req.user, ids, (err, _data) ->
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

	router.get '/:userId/following', (req, res) ->
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

			timestamps = {}
			for follow in docs
				timestamps[''+follow.followee] = 1*new Date(follow.created_at)

			# Fetch cached data for each followee found.
			ids = _.map(_.pluck(docs, 'followee'), String)
			usersActions.fetchManyCachedUsers req.user, ids, (err, _data) ->
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
		usersActions.dofollowUser req.user, req.reqUser, (err) ->
			res.endJSON(error: !!err)

	router.post '/:userId/unfollow', required.login, unspam.limit('api_follows', 500), (req, res) ->
		usersActions.unfollowUser req.user, req.reqUser, (err) ->
			res.endJSON(error: !!err)

	return router
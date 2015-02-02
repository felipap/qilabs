
mongoose = require 'mongoose'
validator = require 'validator'
_ = require 'lodash'
async = require 'async'

required = require '../lib/required'
labs = require 'app/data/labs'
redis = require 'app/config/redis'
unspam = require 'app/controllers/lib/unspam'

User = mongoose.model 'User'
Follow = mongoose.model 'Follow'

fbService = require 'app/services/fb'

module.exports = (app) ->
	router = require('express').Router()
	router.use required.login

	# Friends from facebook
	router.get '/fff', unspam.limit(5000), (req, res) ->
		fbService.getFriendsInQI req.user, (err, d) ->
			# TODO! Optimized is to use redis intersection, with following
			# console.log req.user.getCacheField('Following'), ids
			# redis.sinter req.user.getCacheField('Following'), ids, (err, result) ->
			# 	console.log(err, result)

			# async.map d.data, ((person, done) ->
			# 	id = person.id
			# 	Follow.findOne { follower: req.user._id, followee: mongoose.''+id	},
			# 	(err, follow) ->
			# 		console.log err, follow
			# 		done()
			# ), (err, results) ->
			# 	console.log('ok')
			async.map d.data || [], ((person, done) ->
				redis.get 'user:fbId:'+person.id+':qiId', done
			), (err, results) ->
				console.log('ok', results)
			friends = _.map d.data, (f) ->
				{
					name: f.name
					picture: f.picture.data.url
					id: f.id
				}
			if err
				console.log 'erro, porra', err
				res.endJSON error: true
			else
				res.endJSON data: friends

	router.put '/interests/toggle', (req, res) ->
		console.log(req.body.item)
		if not req.body.item of labs
			return res.endJSON(error:true)

		onUpdate = (err, doc) ->
				if err
					throw err
				res.endJSON(error: false, data: doc.preferences.labs)

		if req.body.item in req.user.preferences.labs
			User.findOneAndUpdate { _id: req.user.id },
			{ $pull: {'preferences.labs':req.body.item} }, onUpdate
		else
			User.findOneAndUpdate { _id: req.user.id },
			{ $addToSet: {'preferences.labs':req.body.item} }, onUpdate

	router.put '/interests/labs', (req, res) ->
		nitems = _.filter(req.body.items, (i) -> i of labs)

		onUpdate = (err, user) ->
			if err
				throw err
			res.endJSON(error: false, data: user.preferences.labs)

		User.findOneAndUpdate { _id: req.user.id },
			{ 'preferences.labs': nitems }, onUpdate

	router.put '/interests/subjects', (req, res) ->
		nitems = _.filter(req.body.items, (i) -> i of labs and labs[i].hasProblems)

		onUpdate = (err, user) ->
			if err
				throw err
			res.endJSON(error: false, data: user.preferences.subjects)

		User.findOneAndUpdate { _id: req.user.id },
			{ 'preferences.subjects': nitems }, onUpdate

	router.put '/profile', (req, res) ->
		trim = (str) ->
			str.replace(/(^\s+)|(\s+$)/gi, '')

		req.logger.info('profile received', req.body.profile)

		bio = validator.stripLow(trim(req.body.profile.bio).slice(0,300))
		home = validator.stripLow(trim(req.body.profile.home).slice(0,50))
		location = validator.stripLow(trim(req.body.profile.location).slice(0,50))

		if req.body.profile.nome1.match(/\w{5}/,'') and req.body.profile.nome1.replace(/\w{2}/,'')
			name = req.body.profile.nome1.replace(/\s/,'')+' '+req.body.profile.nome2.replace(/\s/,'')
			req.user.name = name
		if bio
			req.user.profile.bio = bio
		if home
			req.user.profile.home = home
		if location
			req.user.profile.location = location

		req.user.save ->
		res.endJSON { data: req.user.toJSON(), error: false }

	## Karma

	router.get '/karma', (req, res) ->
		req.user.getKarma 10, req.handleErr (obj) ->
			res.endJSON(obj)

	## Settings

	router.put '/settings/fbnotified', (req, res) ->
		fbNotifiable = false
		if req.body.notifiable is 'on'
			fbNotifiable = true
		req.user.update { 'preferences.fbNotifiable': fbNotifiable },
		(err, user) ->
			if err
				req.logger.error("Erro??", err)
			res.endJSON {
				error: false
				reload: true
				# flashMessage: "Updated! :)"
			}

	## Notifications

	router.get '/notifications', (req, res) ->
		if req.query.limit
			limit = Math.max(0,Math.min(10,parseInt(req.query.limit)))
		else
			limit = 10
		req.user.getNotifications limit, req.handleErr (obj) ->
			res.endJSON(obj)

	router.get '/notifications/since', (req, res) ->
		since = parseInt(req.query.since)
		if new Date(since) < new Date(req.user.meta.last_received_notifications)
			res.endJSON({ hasUpdates: true })
		else
			res.endJSON({ hasUpdates: false })

	router.post '/notifications/see', (req, res) ->
		req.user.seeNotifications (err) ->
			res.endJSON { error: err? }

	##

	router.post '/logout', (req, res) ->
		req.logout()
		res.redirect('/')

	return router
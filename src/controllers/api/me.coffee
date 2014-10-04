
mongoose = require 'mongoose'
validator = require 'validator'

required = require 'src/core/required.js'

Resource = mongoose.model 'Resource'
User = mongoose.model 'User'

NotificationChunk = mongoose.model 'NotificationChunk'

module.exports = (app) ->
	router = require('express').Router()
	router.use required.login
	logger = app.get('logger')

	router.put '/interests/toggle', (req, res) ->
		labs = require('src/core/labs.js').data
		console.log(req.body.item)
		if not req.body.item of labs
			return res.endJSON(error:true)

		onUpdate = (err, doc) ->
				if err
					throw err
				res.endJSON(error: false, data: doc.preferences.interests)

		if req.body.item in req.user.preferences.interests
			User.findOneAndUpdate { _id: req.user.id },
			{ $pull: {'preferences.interests':req.body.item} }, onUpdate
		else
			User.findOneAndUpdate { _id: req.user.id },
			{ $addToSet: {'preferences.interests':req.body.item} }, onUpdate

	router.put '/profile', (req, res) ->
		trim = (str) ->
			str.replace(/(^\s+)|(\s+$)/gi, '')

		logger.info('profile received', req.body.profile)

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

	## Notifications

	router.get '/notifications', (req, res) ->
		if req.query.limit
			limit = Math.max(0,Math.min(10,parseInt(req.query.limit)))
		else
			limit = 10
		req.user.getNotifications limit, req.handleErr (obj) ->
			res.endJSON(obj)

	router.get '/notifications/since', (req, res) ->
		# since = new Date(req.query.since)
		# req.user.meta.last_updated
		# req.user.getNotifications limit, req.handleErr (obj) ->
		# 	res.endJSON(obj)
		# console.log(since)
		res.end()

	router.post '/notifications/see', (req, res) ->
		req.user.seeNotifications (err) ->
			res.endJSON { error: err? }

	## Inbox

	router.get '/inbox/posts', (req, res) ->
		if isNaN(maxDate = parseInt(req.query.maxDate))
			maxDate = Date.now()
		req.user.getTimeline { maxDate: maxDate, source: 'inbox' },
			req.handleErr((docs, minDate=-1) ->
				res.endJSON {
					minDate: minDate
					data: docs
				}
			)

	router.get '/inbox/problems', (req, res) ->
		if isNaN(maxDate = parseInt(req.query.maxDate))
			maxDate = Date.now()
		req.user.getTimeline { maxDate: maxDate, source: 'problems' },
			req.handleErr((docs, minDate=-1) ->
				res.endJSON(minDate: minDate, data: docs)
			)

	router.get '/inbox/posts', (req, res) ->
		if isNaN(maxDate = parseInt(req.query.maxDate))
			maxDate = Date.now()
		req.user.getTimeline { maxDate: maxDate, source: 'global' },
			req.handleErr((docs, minDate=-1) ->
				res.endJSON(minDate: minDate, data: docs)
			)

	router.post '/logout', (req, res) ->
		req.logout()
		res.redirect('/')

	return router

# app/controllers
# for QI Labs
# by @f03lipe

mongoose = require 'mongoose'
_ = require 'lodash'

required = require './lib/required'
labs = require 'app/data/labs'

Post = mongoose.model 'Post'
User = mongoose.model 'User'
Problem = mongoose.model 'Problem'

module.exports = (app) ->
	router = require('express').Router()

	logger = app.get('logger').child(childs: 'APP')

	router.use (req, res, next) ->
		req.logger = logger
		logger.info("<#{req.user and req.user.username or 'anonymous@'+
			req.connection.remoteAddress}>: HTTP #{req.method} #{req.url}")
		next()

	router.use '/signup', (require './signup') app

	# Deal with signups, new sessions, tours and etc.
	router.use (req, res, next) ->
		# meta.registered is true when user has finished /signup form
		if req.user and not req.user.meta.registered
			return res.redirect('/signup')
		next()

		# On purpose
		if req.user
			req.user.meta.last_access = new Date()
			req.user.save()

	router.get '/links/:link', (req, res, next) ->
		if req.params.link of app.locals.urls
			res.redirect(app.locals.urls[req.params.link])
		else
			res.render404()

	router.use (require './labs') app
	router.use (require './ranking') app

	router.use (require './profile') app
	router.get '/login', (req, res) -> res.redirect('/')

	router.get '/entrar', (req, res) -> res.redirect '/auth/facebook'
	router.get '/settings', required.login, (req, res) -> res.render 'app/settings'
	router.get '/sobre', (req, res) -> res.render('about/main')
	router.get '/faq', (req, res) -> res.render('about/faq')
	router.get '/blog', (req, res) -> res.redirect('http://blog.qilabs.org')

	router.use '/auth', require('./passport')(app)
	router.use '/admin', require('./admin')(app)

	return router
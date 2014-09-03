
mongoose = require 'mongoose'
_ = require 'underscore'
winston = require 'winston'
bunyan = require 'bunyan'

required = require 'src/core/required'
pages = require 'src/core/pages'

Resource = mongoose.model 'Resource'

Post = Resource.model 'Post'
User = Resource.model 'User'
Problem = Resource.model 'Problem'

passport = require 'passport'


module.exports = (app) ->
	require('./passport')(app)

	router = require('express').Router()
	
	router.use (req, res, next) ->
		# req.logger = new bunyan.createLogger({ name: 'APP' })
		req.logger.info("<#{req.user and req.user.username or 'anonymous@'+req.connection.remoteAddress}>: HTTP #{req.method} #{req.url}");
		next()

	router.get '/', (req, res, next) ->
		if req.user
			# if req.session.signinUp
			# 	# force redirect to sign up
			# 	return req.res.redirect('/signup/finish/1')
			# req.user.lastUpdate = new Date()
			# req.user.save()
			res.render 'app/aquecimento_main'
		else
			res.render 'app/aquecimento_front'

	router.get('/auth/facebook/callback',
		passport.authenticate('facebook', {
			successRedirect: '/',
			failureRedirect: '/'
		}))

	router.get('/auth/facebook',
		passport.authenticate('facebook', {
			scope: ['email', 'user_likes']
		}))

	return router
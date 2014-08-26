
# src/controllers/api
# Copyright QiLabs.org
# by @f03lipe

express = require('express')
bunyan = require('bunyan')


module.exports = (app) ->
	console.log('porra')
	router = require('../lib/router.js')(app)
	api = express.Router()
	
	api.use (req, res, next) ->
		req.logger = new bunyan.createLogger({ name: 'API' })
		req.logger.info("<#{req.user and req.user.username or 'anonymous@'+req.connection.remoteAddress}>: HTTP #{req.method} #{req.url}")
		req.isAPICall = true;
		next() 

	api.use '/session', require('./session.js')(app)
	api.use '/posts', require('./posts.js')(app)
	# api.use '/problems', require('./problems.js')(app)
	# api.use '/pages', require('./pages.js')(app)
	# api.use '/me', require('./me.js')(app)
	# api.use '/users', require('./users.js')(app)
	# api.use '/auth', require('./auth.js')(app)

	return api

	# router.session = 
	# {
	# 	'/api': {
	# 		use: (req, res, next) ->
	# 			req.logger = new bunyan.createLogger({ name: 'API' })
	# 			req.logger.info("<#{req.user and req.user.username or 'anonymous@'+req.connection.remoteAddress}>: HTTP #{req.method} #{req.url}")
	# 			req.isAPICall = true;
	# 			next()

	# 		children: {
	# 			'session': 	require './session'
	# 			'posts':	require './posts'
	# 			'problems':	require './problems'
	# 			'pages':	require './pages'
	# 			'me': 		require './me'
	# 			'users':	require './api_users'
	# 			'auth': 	require './auth'
	# 		}
	# 	}
	# }
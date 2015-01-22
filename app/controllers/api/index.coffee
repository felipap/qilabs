
# app/controllers/api
# for QI Labs
# by @f03lipe

express = require 'express'
unspam = require '../lib/unspam'
bunyan = require 'app/config/bunyan'
required = require '../lib/required'

module.exports = (app) ->
	api = express.Router()
	logger = app.get('logger').child(child: 'API')

	api.use (req, res, next) ->
		req.logger = logger
		req.logger.info("<#{req.user and req.user.username or 'anonymous@'+req.connection.remoteAddress}>: HTTP #{req.method} #{req.url}")
		req.isAPICall = true
		next()

	api.use unspam

	# A little backdoor for debugging purposes.
	api.get '/logmein/:username', (req, res) ->
		if nconf.get('env') is 'production'
			if not req.user or
			not req.user.flags.mystique or
			not req.user.flags.admin
				return res.status(404).end()
		is_admin = nconf.get('env') is 'development' or req.user.flags.admin
		User = require('mongoose').model('User')
		User.findOne { username: req.params.username }, (err, user) ->
			if err
				return res.endJSON(error:err)
			if not user
				return res.endJSON(error:true, message:'User not found')
			if not user.flags.fake and not is_admin
				return res.endJSON(error:true, message:'Não pode.')
			logger.info 'Logging in as ', user.username
			req.login user, (err) ->
				if err
					return res.endJSON(error:err)
				logger.info 'Success??'
				res.redirect('/')

	api.use '/labs', require('./labs')(app)
	api.use '/users', require('./users')(app)
	api.use '/posts', require('./posts')(app)
	api.use required.login
	api.use '/session', require('./session')(app)
	api.use '/problems', require('./problems')(app)
	api.use '/me', require('./me')(app)

	# Handle 404.
	# Don't 'leak' to other controllers: all /api/ should be satisfied here.
	api.use (req, res) ->
		res.status(404).send(
			error: true
			message: 'Page not found.'
		)

	api

# src/controllers/api
# for QI Labs
# by @f03lipe

express = require 'express'
unspam = require '../lib/unspam'
bunyan = require 'src/core/bunyan'
required = require 'src/core/required'

module.exports = (app) ->
	api = express.Router()
	logger = app.get('logger').child({child: 'API'})

	api.use (req, res, next) ->
		req.logger = logger
		req.logger.info("<#{req.user and req.user.username or 'anonymous@'+req.connection.remoteAddress}>: HTTP #{req.method} #{req.url}")
		req.isAPICall = true
		next()

	api.use(unspam)

	api.use '/session', require('./session')(app)
	api.use '/posts', require('./posts')(app)
	api.use '/problems', require('./problems')(app)
	api.use '/labs', require('./labs')(app)
	api.use '/me', require('./me')(app)
	api.use '/users', require('./users')(app)

	# Handle 404.
	# Don't 'leak' to other controllers: all /api/ should be satisfied here.
	api.use (req, res) ->
		res.status(404).send({
			error: true,
			message: 'Page not found.'
		});

	api
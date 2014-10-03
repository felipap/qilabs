
# src/controllers/api
# for QI Labs
# by @f03lipe

express = require('express')
bunyan = require('bunyan')
limiter = require('connect-ratelimit')
required = require('src/core/required')

module.exports = (app) ->
	api = express.Router()
	logger = app.get('logger').child({child: 'API'})

	api.use (req, res, next) ->
		req.logger = logger
		req.logger.info("<#{req.user and req.user.username or 'anonymous@'+req.connection.remoteAddress}>: HTTP #{req.method} #{req.url}")
		req.isAPICall = true
		next()

	# A little backdoor for debugging purposes.
	api.get '/logmein/:userId', required.isMe, (req, res) ->
		User = require('mongoose').model('User')
		User.findOne { _id: req.params.userId }, (err, user) ->
			if err
				return res.endJSON(error:err)
			if not user
				return res.endJSON(error:true, message:'User not found')
			logger.info 'Logging in as ', user.username
			req.login user, (err) ->
				if err
					return res.endJSON(error:err)
				logger.info 'Success??'
				res.endJSON(error:false)

	api.use(limiter({
		whitelist: ['127.0.0.1'],
		categories: {
			normal: {
				totalRequests: 20,
				every: 60 * 1000,
			}
		}
	})).use (req, res, next) ->
		if res.ratelimit.exceeded
			return res.status(429).endJSON({error:true,limitError:true,message:'Limite de requisições exceedido.'})
		next()

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
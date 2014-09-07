
# src/controllers/api
# Copyright QiLabs.org
# by @f03lipe

express = require('express')
bunyan = require('bunyan')
required = require('src/core/required')
limiter = require('connect-ratelimit')

module.exports = (app) ->
	api = express.Router()
	logger = app.get('logger').child({child: 'API'})

	# A little backdoor for debugging purposes.
	api.get '/logmein/:userId', required.isMe, (req, res) ->
		User = require('mongoose').model('Resource').model('User')
		id = req.paramToObjectId('userId')
		User.findById id, (err, user) ->
			if err
				return res.endJSON(error:err)
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
	}))
	api.use (req, res, next) ->
		console.log 'OIEM', res.ratelimit
		if res.ratelimit.exceeded
			return res.status(429).endJSON({error:true,message:'Limite de requisições exceedido.'})
		next()

	api.use (req, res, next) ->
		req.logger = logger
		req.logger.info("<#{req.user and req.user.username or 'anonymous@'+req.connection.remoteAddress}>: HTTP #{req.method} #{req.url}")
		req.isAPICall = true
		next()
	api.use '/session', require('./session')(app)
	api.use '/posts', require('./posts')(app)
	api.use '/problems', require('./problems')(app)
	api.use '/pages', require('./pages')(app)
	api.use '/me', require('./me')(app)
	api.use '/users', require('./users')(app)
	api
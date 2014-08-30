
# src/controllers/api
# Copyright QiLabs.org
# by @f03lipe

express = require('express')
bunyan = require('bunyan')

module.exports = (app) ->
	api = express.Router()
	logger = app.get('logger').child({child: 'API'})

	# A little backdoor for debugging purposes.
	api.route('/logmein/:userId')
		.all(required.isMe)
		.get (req, res) ->
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

	api.use (req, res, next) ->
		req.logger = logger
		req.logger.info("<#{req.user and req.user.username or 'anonymous@'+req.connection.remoteAddress}>: HTTP #{req.method} #{req.url}")
		req.isAPICall = true
		next()
	api.use '/session', require('./session.js')(app)
	api.use '/posts', require('./posts.js')(app)
	api.use '/problems', require('./problems.js')(app)
	api.use '/pages', require('./pages.js')(app)
	api.use '/me', require('./me.js')(app)
	api.use '/users', require('./users.js')(app)
	api
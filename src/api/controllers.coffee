
# src/controllers/api
# Copyright QiLabs.org
# by @f03lipe

module.exports = (app) ->
	logger = app.get('logger').child({app:'API'})

	return {
		'/api': {
			use: [(req, res, next) ->
				req.logger = logger
				logger.info("<#{req.user and req.user.username or 'anonymous@'+req.connection.remoteAddress}>: HTTP #{req.method} #{req.url}")
				next()
			]

			children: {
				'session': 	require './session'
				'posts':	require './posts'
				'problems':	require './problems'
				'pages':	require './pages'
				'me': 		require './me'
				'users':	require './api_users'
				'auth': 	require './auth'
			}
		}
	}
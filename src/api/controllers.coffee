
# src/controllers/api
# Copyright QiLabs.org
# by @f03lipe

module.exports = {
	'/api': {
		children: {
			'session': 	require './session'
			'posts':	require './posts'
			'problems':	require './problems'
			'users':	require './api_users'
			'tags':		require './api_tags'
			'me': 		require './me'
			'auth': 	require './api_auth'
		}
	}
}
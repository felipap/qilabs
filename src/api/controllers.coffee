
# src/controllers/api
# Copyright QILabs.org
# by @f03lipe

###
The controller for /api/* calls.
###

mongoose = require 'mongoose'

# Starts at '/api'
module.exports = {
	'/api': {
		children: {
			'session': 	require './api_session'
			'posts':	require './posts'
			'problems':	require './problems'
			'users':	require './api_users'
			'tags':		require './api_tags'
			'me': 		require './api_me'
			'auth': 	require './api_auth'
		}
	}
}

passport = require('passport')

module.exports = (app) ->
	router = require('express').Router()

	router.get('/facebook/callback',
		passport.authenticate('facebook', {
			successRedirect: '/',
			failureRedirect: '/'
		}))

	router.get('/facebook',
		passport.authenticate('facebook', {
			scope: [
				'email',
				'user_likes',
				'user_friends',
				'user_activities',
				'publish_actions',
				# 'user_education_history',
				# 'user_hometown',
				'user_interests'
			]
		}))

	router
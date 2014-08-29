
var passport = require('passport');

module.exports = function (app) {
	var router = require('express').Router();

	router.get('/facebook/callback',
		passport.authenticate('facebook', {
			successRedirect: '/',
			failureRedirect: '/'
		}));

	router.get('/facebook',
		passport.authenticate('facebook', {
			scope: ['email', 'user_likes']
		}));
	
	return router;
}
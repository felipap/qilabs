
var passport = require('passport');

module.exports = {
	children: {
		'facebook/callback': {
			methods: {
				get: passport.authenticate('facebook', {
					successRedirect: '/',
					failureRedirect: '/login'
				})
			}
		},
		'/facebook': {
			methods: {
				get: passport.authenticate('facebook', {
					scope: ['email', 'user_likes']
				})
			}
		}
	}
};
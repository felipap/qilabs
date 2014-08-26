
var passport = require('passport');

module.exports = {
	children: {
		'facebook/callback': {
			get: passport.authenticate('facebook', {
				successRedirect: '/',
				failureRedirect: '/'
				})
		},
		'/facebook': {
			get: passport.authenticate('facebook', {
				scope: ['email', 'user_likes']
			})
		}
	}
};
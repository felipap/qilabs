
// config/passport.js
// Copyright QiLabs.org
// by @f03lipe

var passport = require('passport');
var request = require('request');

function setUpPassport() {

	passport.use(new (require('passport-facebook').Strategy)({
			clientID: process.env.facebook_app_id,
			clientSecret: process.env.facebook_secret,
			callbackURL: "/api/auth/facebook/callback",
			passReqToCallback: true,
		},
		function (req, accessToken, refreshToken, profile, done) {
			var User = require('mongoose').model('Resource').model('User');

			User.findOne({ facebookId: profile.id })
				.select('facebookId')
				.exec(function (err, user) {
				if (err) {
					console.warn('Error finding user with profile.id '+profile.id);
					return done(err);
				}
				if (user) { // old user
					user.accessToken = accessToken;
					user.email = profile.emails[0].value;
					user.lastAccess = new Date();
					if (!user.firstAccess) user.firstAccess = new Date();
					user.save();
					done(null, user);
				} else { // new user
					req.session.signinUp = 1;
					// console.log('new user: ', profile.displayName)
					var nome1 = profile.displayName.split(' ')[0],
						nome2 = profile.displayName.split(' ')[profile.displayName.split(' ').length-1];
					user = new User({
						facebookId: profile.id,
						name: nome1+' '+nome2,
						tags: [],
						email: profile.emails[0].value,
						username: profile.username,
						firstAccess: new Date(),
						lastAccess: new Date(),
					});
					user.save(function (err, user) {
						if (err) done(err);
						done(null, user);
					});
				}
			});
		}
	));

	passport.serializeUser(function (user, done) {
		return done(null, user._id);
	});

	passport.deserializeUser(function (id, done) {
		var User = require('mongoose').model('Resource').model('User');
		User.findOne({_id: id}).select('+lastAccess +firstAccess +email').exec(function (err, user) {
			return done(err, user);
		});
	})
}

module.exports = setUpPassport
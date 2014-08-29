
// config/passport.js
// Copyright QiLabs.org
// by @f03lipe

var passport = require('passport');
var request = require('request');

function validProfile (profile) {
	if (!process.env.CAN_ENTER)
		return false;
	var es = process.env.CAN_ENTER.split(',');

	if (es.indexOf(profile.username) == -1 && es.indexOf(profile.id) == -1) {
		return false;
	}
	return true;
}

function setUpPassport(app) {

	var logger = app.get('logger');

	passport.use(new (require('passport-facebook').Strategy)({
			clientID: process.env.facebook_app_id,
			clientSecret: process.env.facebook_secret,
			callbackURL: "/auth/facebook/callback",
			passReqToCallback: true,
		},
		function (req, accessToken, refreshToken, profile, done) {
			var User = require('mongoose').model('Resource').model('User');

			User.findOne({ facebook_id: profile.id })
				.exec(function (err, user) {
				if (err) {
					logger.warn('Error finding user with profile.id '+profile.id);
					return done(err);
				}
				if (user) { // old user
					logger.info("Logging in: ", profile.username)
					var fbName = profile.displayName,
						nome1 = fbName.split(' ')[0],
						nome2 = fbName.split(' ')[fbName.split(' ').length-1];
					user.name = nome1+' '+nome2;
					user.profile.fbName = fbName;
					if (accessToken) {
						user.access_token = accessToken;
					}
					if (!user.avatar_url)
						user.avatar_url = 'https://graph.facebook.com/'+profile.id+'/picture';
					user.email = profile.emails[0].value;
					user.lastAccess = new Date();
					user.meta.sessionCount = user.meta.sessionCount+1 || 1;
					user.save();
					return done(null, user);
				} else { // new user
					if (!validProfile(profile)) {
						logger.info("Unauthorized user.", {id:profile.id, name:profile.name, username:profile.username})
						done({permission:'not_on_list'});
						return;
					}
					req.session.signinUp = 1;
					logger.info('New user: ', profile)
					var fbName = profile.displayName,
						nome1 = fbName.split(' ')[0],
						nome2 = fbName.split(' ')[profile.displayName.split(' ').length-1];
					user = new User({
						access_token: accessToken,
						facebook_id: profile.id,
						avatar_url: 'https://graph.facebook.com/'+profile.id+'/picture',
						name: nome1+' '+nome2,
						profile: {
							fbName: fbName,
						},
						email: profile.emails[0].value,
						username: profile.username,
					});
					user.save(function (err, user) {
						if (err)
							done(err);
						else
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
		User.findOne({_id: id}, function (err, user) {
			return done(err, user);
		});
	})
}

module.exports = setUpPassport
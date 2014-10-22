
// src/core/passport.js
// for QI Labs
// by @f03lipe

var passport = require('passport');
var nconf = require('nconf');

function authorized (profile) {
	return true;
	if (!nconf.get('CAN_ENTER'))
		return false;
	var es = nconf.get('CAN_ENTER').split(',');

	if (es.indexOf(profile.username) == -1 && es.indexOf(profile.id) == -1) {
		return false;
	}
	return true;
}

function genUsername (profile) {
	return profile.displayName.replace(/\s/gi, '.').toLowerCase();
}

function setUpPassport(app) {

	var logger = app.get('logger');

	passport.use(new (require('passport-facebook').Strategy)({
			clientID: nconf.get('facebook_app_id'),
			clientSecret: nconf.get('facebook_secret'),
			callbackURL: "/auth/facebook/callback",
			passReqToCallback: true,
		},
		function (req, accessToken, refreshToken, profile, done) {
			var User = require('mongoose').model('User');

			User.findOne({ facebook_id: profile.id }, function (err, user) {
				if (err) {
					logger.warn('Error finding user with profile.id '+profile.id);
					return done(err);
				}

				if (user) { // old user
					logger.info("Logging in: ", profile.username)

					var fbName = profile.displayName,
						nome1 = fbName.split(' ')[0],
						nome2 = fbName.split(' ')[fbName.split(' ').length-1];

					// Update Facebook Name
					if (fbName !== user.profile.fbName) {
						user.profile.fbName = fbName;
					}
					if (accessToken !== user.access_token) {
						user.access_token = accessToken;
					}
					if (profile.emails[0].value !== user.email) {
						user.email = profile.emails[0].value;
					}

					user.meta.last_access = Date.now();
					user.meta.session_count = user.meta.session_count?user.meta.session_count+1:1;
					var thisIp = req.connection.remoteAddress;
					user.meta.last_signin_ip = user.meta.current_signin_ip || thisIp;
					user.meta.current_signin_ip = thisIp;

					user.save(function (err) {
						if (err) {
							logger.error("Failed to save user in passport.", err);
						}
					});
					return done(null, user);
				} else { // new user
					if (profile.username) {
						var username = profile.username;
					} else {
						var username = genUsername(profile);
					}

					if (!authorized(profile)) {
						logger.info("Unauthorized user.", {id:profile.id, name:profile.name, username:profile.username})
						done({permission:'not_on_list'});
						return;
					}

					logger.info('New user: ', profile)

					var fbName = profile.displayName;
					var name1 = fbName.split(' ')[0],
						name2 = fbName.split(' ')[fbName.split(' ').length-1];

					user = new User({
						access_token: accessToken,
						facebook_id: profile.id,
						avatar_url: 'https://graph.facebook.com/'+profile.id+'/picture',
						name: name1+' '+name2,
						email: profile.emails[0].value,
						username: username,
						slug: [username],
						profile: {
							fbName: profile.displayName,
						},
						meta: {
							session_count: 0,
							last_signin_ip: req.connection.remoteAddress,
							current_signin_ip: req.connection.remoteAddress,
						}
					});
					user.save(function (err, user) {
						if (err) {
							logger.error("Failed to save new user", user);
							done(err);
						} else {
							req.session.signinUp = 1;
							done(null, user);
						}
					});
				}
			});
		}
	));

	passport.serializeUser(function (user, done) {
		return done(null, user._id);
	});

	passport.deserializeUser(function (id, done) {
		var User = require('mongoose').model('User');
		User.findOne({_id: id}, function (err, user) {
			return done(err, user);
		});
	})
}

module.exports = setUpPassport
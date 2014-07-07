
// config/passport.js
// Copyright QiLabs.org
// by @f03lipe

var passport = require('passport');
var request = require('request');

function setUpPassport() {

	passport.use(new (require('passport-facebook').Strategy)({
			clientID: process.env.facebook_app_id,
			clientSecret: process.env.facebook_secret,
			callbackURL: "/api/auth/facebook/callback"
		},
		function (accessToken, refreshToken, profile, done) {
			var User = require('mongoose').model('Resource').model('User');

			User.findOne({ facebookId: profile.id })
				.select('facebookId')
				.exec(function (err, user) {
				if (err)
				 	return done(err);
				// console.log('user:', profile)
				if (user) { // old user
					user.accessToken = accessToken;
					user.name = profile.displayName;
					// user.username = user.username || profile.username;
					user.lastAccess = new Date();
					if (!user.firstAccess) user.firstAccess = new Date();
					user.save();
					done(null, user);
				} else { // new user
					// return "GET out";
					// console.log('new user: ', profile.displayName)
					user = new User({
						facebookId: profile.id,
						name: profile.displayName,
						tags: [],
						username: profile.username,
						firstAccess: new Date(),
						lastAccess: new Date(),
					});
					user.save(function (err, user) {
						if (err) done(err);
						done(null, user);
					});
				}
				// request({url:'https://graph.facebook.com/'+profile.id+'?fields=likes.limit(1000)&access_token='+accessToken, json:true}, function (error, response, body) {
				// 		if (!error && response.statusCode == 200) {
				// 			for (var i = body.likes.data.length - 1; i >= 0; i--) {
				// 				var regexp = /paper/;
				// 				if (body.likes.data[i].name.match(regexp)) {
				// 					console.log(body.likes.data[i]);
				// 				}
				// 			};
				// 			// console.log(body.likes); // iei
				// 		}
				// })
			});
		}
	));

	passport.serializeUser(function (user, done) {
		return done(null, user._id);
	});

	passport.deserializeUser(function (id, done) {
		var User = require('mongoose').model('Resource').model('User');
		User.findOne({_id: id}).select('+lastAccess +firstAccess').exec(function (err, user) {
			return done(err, user);
		});
	})
}

module.exports = setUpPassport
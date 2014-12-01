
var passport = require('passport');
var nconf = require('nconf');
var actions = require('app/actions/passport');

function setUpPassport(app) {

	passport.use(new (require('passport-facebook').Strategy)({
			clientID: nconf.get('facebook_app_id'),
			clientSecret: nconf.get('facebook_secret'),
			callbackURL: "/auth/facebook/callback",
			passReqToCallback: true,
		},
		actions.loginPassportUser
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

module.exports = setUpPassport;
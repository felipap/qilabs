
var mongoose = require('mongoose')
var unportuguesizer = require('app/lib/unportuguesizer')
var jobs = require('app/config/kue')

var User = mongoose.model('User')
var logger = global.logger.mchild()

function isAuthorizedSignin(profile) {
	return true
}

function isAuthorizedLogin(user) {
	return !user.meta.banned;
}

function genUsernameFromFbProfile(profile) {
	return unportuguesizer(
		profile.displayName.replace(/\s/gi, '_').replace(/\./g, '_').toLowerCase())
}

module.exports.loginPassportUser = function (req, accessToken, refreshToken, profile, done) {
	console.log('profile from fb', profile)

	function onNewUser() {
		// Generate from fb profile
		logger.info("Generating new user from fb profile: ", profile)
		var fbName = profile.displayName

		user = new User({
			access_token: accessToken,
			facebook_id: profile.id,
			avatar_url: "https://graph.facebook.com/" + profile.id + "/picture",
			name: fbName.split(" ")[0] + " " + fbName.split(" ")[fbName.split(" ").length - 1],
			email: profile.emails[0].value,
			username: profile.username || genUsernameFromFbProfile(profile),
			profile: {
				fbName: profile.displayName,
			},
			meta: {
				session_count: 0,
				last_signin_ip: req.connection.remoteAddress,
				current_signin_ip: req.connection.remoteAddress,
			},
		})

		user.save((err, user) => {
			if (err) {
				throw err
			}

			jobs.create('userCreated', {
				userId: user.id,
			}).save()

			req.session.signinUp = 1
			done(null, user)
		})
	}

	function onOldUser(user) {
		logger.info("Logging in: ", user.username, user)

		// Make sure fb info is utd
		user.profile.fbName = profile.displayName
		if (accessToken !== user.access_token) {
			user.access_token = accessToken
		}
		if (profile.emails[0].value !== user.email) {
			user.email = profile.emails[0].value
		}
		user.meta.last_access = Date.now()
		user.meta.session_count = (user.meta.session_count || 0) + 1

		thisIp = req.connection.remoteAddress
		user.meta.last_signin_ip = user.meta.current_signin_ip || thisIp
		user.meta.current_signin_ip = thisIp
		user.save((err) => {
			if (err) {
				throw err
			}
			done(null, user)
		})
	}

	User.findOne({ facebook_id: profile.id }, (err, user) => {
		if (err) {
			throw err
		}
		if (user) {
			onOldUser(user)
		} else {
			onNewUser()
		}
	})
}
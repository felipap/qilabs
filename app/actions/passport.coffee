
mongoose = require 'mongoose'
unportuguesizer = require 'app/lib/unportuguesizer'

User = mongoose.model('User')
logger = global.logger.mchild()

isAuthorizedSignin = (profile) ->
	return true

isAuthorizedLogin = (user) ->
	if user.meta.banned
		return false
	return true

genUsernameFromFbProfile = (profile) ->
	unportuguesizer(profile.displayName.replace(/\s/gi, '_').replace(/\./g, '_').toLowerCase())

module.exports.loginPassportUser = (req, accessToken, refreshToken, profile, done) ->

	onNewUser = () ->
		# 'O
		if not isAuthorizedSignin profile
			logger.info "Unauthorized user.", {
				id: profile.id
				name: profile.name
				username: profile.username
			}
			return done(permission: "not_on_list")

		# Generate from fb profile
		logger.info "Generating new user from fb profile: ", profile
		fbName = profile.displayName
		user = new User (
			access_token: accessToken
			facebook_id: profile.id
			avatar_url: "https://graph.facebook.com/" + profile.id + "/picture"
			name: fbName.split(" ")[0] + " " + fbName.split(" ")[fbName.split(" ").length - 1]
			email: profile.emails[0].value
			username: profile.username or genUsernameFromFbProfile(profile)
			profile: {
				fbName: profile.displayName
			}
			meta: {
				session_count: 0
				last_signin_ip: req.connection.remoteAddress
				current_signin_ip: req.connection.remoteAddress
			}
		)
		user.save (err, user) ->
			if err
				logger.error "Failed to save new user", user
				done(err)
			else
				req.session.signinUp = 1
				done(null, user)
			return

	onOldUser = (user) ->
		logger.info "Logging in: ", profile.username

		# Make sure fb info is utd
		user.profile.fbName = profile.displayName
		user.access_token = accessToken if accessToken isnt user.access_token
		user.email = profile.emails[0].value if profile.emails[0].value isnt user.email
		user.meta.last_access = Date.now()
		user.meta.session_count = (user.meta.session_count or 0) + 1

		thisIp = req.connection.remoteAddress
		user.meta.last_signin_ip = user.meta.current_signin_ip or thisIp
		user.meta.current_signin_ip = thisIp
		user.save (err) ->
			if err
				logger.error "Failed to save user in passport.", err
				throw err
			done(null, user)

	User.findOne { facebook_id: profile.id }, (err, user) ->
		if err
			logger.warn "Error finding user with profile.id " + profile.id
			return done(err)
		if user
			onOldUser(user)
		else
			onNewUser()
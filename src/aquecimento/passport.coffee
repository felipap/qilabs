
passport = require 'passport'

module.exports = (app) ->
	logger = app.get("logger")

	passport.use new (require("passport-facebook").Strategy)({
		clientID: process.env.facebook_app_id
		clientSecret: process.env.facebook_secret
		callbackURL: "/aquecimento/auth/facebook/callback"
		passReqToCallback: true
	}, (req, accessToken, refreshToken, profile, done) ->
		# User = require("mongoose").model("Resource").model("User")
		logger.info('tô aque, querido')
		# User.findOne(facebook_id: profile.id).exec (err, user) ->
		# 	if err
		# 		logger.warn "Error finding user with profile.id " + profile.id
		# 		return done(err)
		# 	if user # old user
		# 		logger.info "Logging in: ", profile.username
		# 		fbName = profile.displayName
		# 		nome1 = fbName.split(" ")[0]
		# 		nome2 = fbName.split(" ")[fbName.split(" ").length - 1]
		# 		user.name = nome1 + " " + nome2
		# 		user.profile.fbName = fbName
		# 		user.access_token = accessToken  if accessToken
		# 		user.avatar_url = "https://graph.facebook.com/" + profile.id + "/picture"  unless user.avatar_url
		# 		user.email = profile.emails[0].value
		# 		user.lastAccess = new Date()
		# 		user.meta.sessionCount = user.meta.sessionCount + 1 or 1
		# 		user.save()
		# 		done null, user
		# 	else # new user
		# 		username = profile.username or genUsername(profile)
		# 		console.log genUsername(profile)
		# 		unless nameIsOnTheList(profile)
		# 			logger.info "Unauthorized user.",
		# 				id: profile.id
		# 				name: profile.name
		# 				username: profile.username

		# 			done permission: "not_on_list"
		# 			return
		# 		req.session.signinUp = 1
		# 		logger.info "New user: ", profile
		# 		fbName = profile.displayName
		# 		nome1 = fbName.split(" ")[0]
		# 		nome2 = fbName.split(" ")[profile.displayName.split(" ").length - 1]
		# 		user = new User(
		# 			access_token: accessToken
		# 			facebook_id: profile.id
		# 			avatar_url: "https://graph.facebook.com/" + profile.id + "/picture"
		# 			name: nome1 + " " + nome2
		# 			profile:
		# 				fbName: fbName

		# 			email: profile.emails[0].value
		# 			username: username
		# 		)
		# 		user.save (err, user) ->
		# 			if err
		# 				done err
		# 			else
		# 				done null, user
		# 			return
	)

	passport.serializeUser (user, done) ->
		done null, user._id

	passport.deserializeUser (id, done) ->
		User = require("mongoose").model("Resource").model("User")
		User.findOne
			_id: id
		, (err, user) ->
			done err, user
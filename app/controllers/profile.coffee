
mongoose = require 'mongoose'
redis = require 'app/config/redis'

User = mongoose.model 'User'

module.exports = (app) ->
	router = require('express').Router()

	router.param 'username', (req, res, next, username) ->
		User.findOne {username:username}, (err, user) ->
			if err
				req.logger.error("WTF")
				return res.renderError(500)
			if not user
				return res.render404({ msg: "Usuário não encontrado." })
			if user.username isnt username
				return res.redirect(user.path)
			req.requestedUser = user
			next()

	getProfile = (req, res) ->
		redis.hgetall req.requestedUser.getCacheField('Profile'), (err, hash) ->
			req.requestedUser.redis = hash or {}
			if req.user
				req.user.doesFollowUserId req.requestedUser.id, (err, bool) ->
					res.render 'app/profile', {
						pUser: req.requestedUser
						follows: bool
						pageUrl: '/@'+req.requestedUser.username
					}
			else
				res.render 'app/profile', {
					pUser: req.requestedUser
					pageUrl: '/@'+req.params.username
				}

	# router.get [path1,path2,...] isn't working with router.param
	router.get '/@:username', getProfile
	router.get '/@:username/seguindo', getProfile
	router.get '/@:username/seguidores', getProfile

	return router
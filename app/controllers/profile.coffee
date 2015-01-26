
mongoose = require 'mongoose'

User = mongoose.model 'User'

module.exports = (app) ->
	router = require('express').Router()

	router.param 'username', (req, res, next, username) ->
		User.findOne {username:username}, (err, user) ->
			if err
				req.logger.error("WTF")
				return res.renderError(err)
			if not user
				return res.render404({ msg: "Usuário não encontrado." })
			if user.username isnt username
				return res.redirect(user.path)
			req.requestedUser = user
			next()

	getProfile = (req, res) ->
		if req.user
			req.user.doesFollowUser req.requestedUser, (err, bool) ->
				res.render 'app/profile', {
					pUser: req.requestedUser
					follows: bool
					pageUrl: '/@'+req.params.username
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

	# router.get '/@:username/notas', (req, res) ->
	# 	page = parseInt(req.params.p)
	# 	if isNaN(page)
	# 		page = 0
	# 	page = Math.max(Math.min(1000, page), 0)
	# 	Post.find { 'author.id': req.requestedUser.id }
	# 		.skip 10*page
	# 		.limit 10
	# 		.select 'created_at updated_at content.title'
	# 		.exec (err, docs) ->
	# 			res.render 'app/open_notes', {
	# 				pUser: req.requestedUser,
	# 				posts: docs,
	# 				# pagination: {
	# 				# 	nextPage: if page is 0 then undefined else page-1
	# 				# 	previousPage: null
	# 				# }
	# 			}

	return router
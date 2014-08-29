
# app/controllers
# for QiLabs.org

mongoose = require 'mongoose'
_ = require 'underscore'
winston = require 'winston'
bunyan = require 'bunyan'

required = require 'src/lib/required'
pages = require 'src/core/pages'

Resource = mongoose.model 'Resource'

Post = Resource.model 'Post'
User = Resource.model 'User'
Problem = Resource.model 'Problem'

module.exports = (app) ->
	router = require('express').Router()
	
	router.use (req, res, next) ->
		# req.logger = new bunyan.createLogger({ name: 'APP' })
		req.logger.info("<#{req.user and req.user.username or 'anonymous@'+req.connection.remoteAddress}>: HTTP #{req.method} #{req.url}");
		next()

	router.get '/', (req, res, next) ->
		if req.user
			if req.session.signinUp
				# force redirect to sign up
				return req.res.redirect('/signup/finish/1')
			req.user.lastUpdate = new Date()
			req.user.save()
			res.render 'app/main'
		else
			res.render 'app/front'

	router.use '/signup', require('./signup.js')(app)

	# Register route for communities/pages/...
	for tag, data of pages.data
		do (tag, data) ->
			if data.path[0] isnt '/'
				data.path = '/'+data.path
			router.get data.path, required.login, (req, res) ->
				data.id = tag
				res.render('app/community', {tag: data})

	# These correspond to SAP pages, and therefore mustn't return 404.
	for n in ['/novo', '/posts/:postId/edit', '/novo-problema', '/problems/:postId/edit']
		router.get n, required.login, (req, res, next) -> res.render('app/main')

	router.get '/entrar', (req, res) -> res.redirect '/auth/facebook'
	router.get '/settings', required.login, (req, res) -> res.render 'app/settings'
	router.get '/sobre', (req, res) -> res.render('about/main')
	router.get '/faq', (req, res) -> res.render('about/faq')
	router.get '/blog', (req, res) -> res.redirect('http://blog.qilabs.org')
	router.use '/auth', require('./auth.js')(app)

	router.param 'username', (req, res, next, username) ->
		User.findOne {username:username},
			# unless req.params.username
			# 	return res.render404()
			req.handleErrResult (user) ->
				req.requestedUser = user
				next()

	router.get '/@:username', (req, res) ->
		if req.user
			req.user.doesFollowUser req.requestedUser, (err, bool) ->
				res.render 'app/profile', {pUser:req.requestedUser,follows:bool}
		else
			res.render 'app/open_profile', {pUser:req.requestedUser}

	router.get '/@:username/notas', (req, res) ->
		page = parseInt(req.params.p)
		if isNaN(page)
			page = 0
		page = Math.max(Math.min(1000, page), 0)
		Post.find { 'author.id': req.requestedUser.id, parent: null }
			.skip 10*page
			.limit 10
			.select 'created_at updated_at content.title'
			.exec (err, docs) ->
				res.render 'app/open_notes',
					pUser: pUser,
					posts: docs,
					# pagination: {
					# 	nextPage: if page is 0 then undefined else page-1
					# 	previousPage: null
					# }

	router.get '/problems/:problemId', required.login,
		(req, res) ->
			return unless problemId = req.paramToObjectId('problemId')
			Problem.findOne { _id:problemId }
				.exec req.handleErrResult((doc) ->
					resourceObj = { data: _.extend(doc.toJSON(), { _meta: {} }), type: 'problem' }
					if req.user
						req.user.doesFollowUser doc.author.id, (err, val) ->
							if err
								console.error("PQP1", err)
							resourceObj.data._meta.authorFollowed = val
							if doc.hasAnswered.indexOf(''+req.user.id) is -1
								resourceObj.data._meta.userAnswered = false
								res.render('app/main', { resource: resourceObj })
							else
								resourceObj.data._meta.userAnswered = true
								doc.getFilledAnswers (err, children) ->
									if err
										console.error("PQP2", err, children)
									resourceObj.children = children
									res.render('app/main', { resource: resourceObj })
					else
						res.render('app/main', { resource: resourceObj })
			)

	router.get '/posts/:postId', (req, res) ->
		return unless postId = req.paramToObjectId('postId')
		Post.findOne { _id:postId }
			.exec req.handleErrResult (post) ->
				if post.parent
					return res.render404()
				if req.user
					post.stuff req.handleErrResult((stuffedPost) ->
						console.log('stuff', stuffedPost.author.id)
						req.user.doesFollowUser stuffedPost.author.id,
							req.handleErrValue((val) ->
								console.log('follows', val)
								res.render 'app/main',
									resource: {
										data: _.extend(stuffedPost, { _meta: { authorFollowed: val } })
										type: 'post'
									}
							)
					)
				else
					post.stuff req.handleErrResult (post) ->
						res.render 'app/open_post.html',
							post: post

	return router
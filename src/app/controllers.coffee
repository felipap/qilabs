
# src/app/controllers
# for QI Labs
# by @f03lipe

mongoose = require 'mongoose'
_ = require 'underscore'

required = require 'src/core/required'
labs = require 'src/core/labs'
redis = require 'src/config/redis.js'

Resource = mongoose.model 'Resource'

Post = Resource.model 'Post'
User = Resource.model 'User'
Problem = Resource.model 'Problem'

stuffGetPost = require('src/api/posts').stuffGetPost

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

	router.use '/signup', require('./signup')(app)

	# Register route for communities/labs/...
	for tag, data of labs.data
		do (tag, data) ->
			if data.path[0] isnt '/'
				data.path = '/'+data.path
			router.get data.path, (req, res) ->
				if req.user
					data.id = tag
					res.render('app/lab', {tag: data})
				else
					req.logger.debug('IP '+req.connection.remoteAddress+' can\'t '+req.method+' path '+req.url);
					res.redirect('/#auth-page')

	# These correspond to SAP pages, and therefore mustn't return 404.
	for n in ['/novo', '/posts/:postId/edit', '/novo-problema', '/problems/:postId/edit', '/interesses']
		router.get n, required.login, (req, res, next) -> res.render('app/main')

	router.get '/entrar', (req, res) -> res.redirect '/auth/facebook'
	router.get '/settings', required.login, (req, res) -> res.render 'app/settings'
	router.get '/sobre', (req, res) -> res.render('about/main')
	router.get '/faq', (req, res) -> res.render('about/faq')
	router.get '/blog', (req, res) -> res.redirect('http://blog.qilabs.org')
	router.use '/auth', require('./auth')(app)

	router.param 'username', (req, res, next, username) ->
		User.findOne {username:username},
			# unless req.params.username
			# 	return res.render404()
			req.handleErr404 (user) ->
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
					pUser: req.requestedUser,
					posts: docs,
					# pagination: {
					# 	nextPage: if page is 0 then undefined else page-1
					# 	previousPage: null
					# }

	router.get '/problems/:problemId', required.login,
		(req, res) ->
			return unless problemId = req.paramToObjectId('problemId')
			Problem.findOne { _id:problemId }
				.exec req.handleErr404((doc) ->
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
		Post.findOne { _id:postId }, req.handleErr404 (post) ->
			if req.user
				stuffGetPost req.user, post, (err, data) ->
					res.render 'app/main', resource: { data: data, type: 'post' }
			else
				post.stuff req.handleErr (post) ->
					User.findOne { _id: ''+post.author.id }, req.handleErr404 (author) ->
						res.render 'app/open_post.html',
							post: post
							author: author

	return router
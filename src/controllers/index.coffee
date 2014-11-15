
# src/controllers
# for QI Labs
# by @f03lipe

mongoose = require 'mongoose'
_ = require 'lodash'

required = require './lib/required'
labs = require 'src/core/labs'
redis = require 'src/config/redis.js'
stuffGetPost = require('./api/posts').stuffGetPost

Post = mongoose.model 'Post'
User = mongoose.model 'User'
Problem = mongoose.model 'Problem'

logger = null

globalPosts = []
minDate = null

updateGlobal = ->
	logger.debug 'Fetching posts for front page'
	mongoose.model('Post')
		.find { created_at:{ $lt:Date.now() } }
		.or [{ 'content.link_image': { $ne: null } }, { 'content.image': { $ne: null } }]
		.sort '-created_at'
		.select '-content.body -participations -type -author.id'
		.limit 40
		.exec (err, docs) ->
			throw err if err
			if not docs.length or not docs[docs.length-1]
				minDate = 0
			else
				minDate = docs[docs.length-1].created_at
			globalPosts = docs

module.exports = (app) ->
	router = require('express').Router()

	logger = app.get('logger').child({ childs: 'APP' })
	updateGlobal()

	router.use (req, res, next) ->
		req.logger = logger
		logger.info("<#{req.user and req.user.username or
			'anonymous@'+req.connection.remoteAddress}>: HTTP #{req.method} #{req.url}");
		next()

	router.use '/signup', require('./signup')(app)

	###*
	 * Deal with signups, new sessions (show worklog), tours and etc.
	###
	router.use (req, res, next) ->
		if req.user and not req.user.meta.registered
			return res.redirect('/signup')
		if req.user
			# Checking if tour is to be shown here is useless now, because
			# the new users are being redirected to /#tour page in order to
			# see the tour.

			# if req.user.meta.sessionCount is 1 and not req.session.tourShown
			# 	req.session.tourShown = true
			# 	res.locals.showTour = true
			# else if not req.session.worklogShown # Don't show both tour and worklog

			if not req.session.worklogShown # Don't show both tour and worklog
				req.session.worklogShown = true
				res.locals.showWorklog = true
		next()

	router.get '/', (req, res, next) ->
		if req.user
			if req.user.lastUpdate < new Date()
			req.user.lastUpdate = new Date()
			req.user.save()
			res.render 'app/main', { pageUrl: '/' }
		else
			res.render 'app/front', { docs: _.shuffle(globalPosts).slice(0,20) }

	router.get '/login', (req, res) ->
		res.redirect('/')

	###*
	 * Register labs.
	###
	for tag, data of labs
		do (tag, data) ->
			if data.path[0] isnt '/'
				data.path = '/'+data.path
			router.get data.path, required.login, (req, res) ->
				data.id = tag
				res.render('app/lab', {lab: data, pageUrl:data.path })
				return
				if req.user
				else
					logger.debug('IP '+req.connection.remoteAddress+' can\'t '+req.method+' path '+req.url);
					res.redirect('/#auth-page')

	router.get '/problemas', required.login, (req, res) ->
		res.render('app/problems', { pageUrl:'/problemas' })

	# These correspond to SAP pages, and therefore mustn't return 404.
	for n in [
		'/novo',
		'/interesses',
		'/posts/:postId/editar'
	]
		router.get n, required.login, (req, res, next) ->
			res.render('app/main', { pageUrl: '/' })

	router.get '/labs', required.login, (req, res, next) ->
		res.render('app/labs', { pageUrl: '/labs' })

	router.get '/entrar', (req, res) -> res.redirect '/auth/facebook'
	router.get '/settings', required.login, (req, res) -> res.render 'app/settings'
	router.get '/sobre', (req, res) -> res.render('about/main')
	router.get '/faq', (req, res) -> res.render('about/faq')
	router.get '/blog', (req, res) -> res.redirect('http://blog.qilabs.org')
	router.use '/auth', require('./auth')(app)
	router.use '/admin', require('./admin')(app)

	router.param 'uslug', (req, res, next, uslug) ->
		User.findOne {username:uslug}, (err, user) ->
			if err
				logger.error("WTF")
				return res.renderError(err)
			if not user
				return res.render404({ msg: "Usuário não encontrado." })
			if user.username isnt uslug
				return res.redirect(user.path)
			req.requestedUser = user
			next()

	getProfile = (req, res) ->
		if req.user
			req.user.doesFollowUser req.requestedUser, (err, bool) ->
				res.render 'app/profile', { pUser: req.requestedUser, follows: bool, pageUrl: '/' }
		else
			res.render 'app/profile', { pUser: req.requestedUser }

	# router.get [path1,path2,...] isn't working with router.param
	router.get '/@:uslug', getProfile
	router.get '/@:uslug/seguindo', getProfile
	router.get '/@:uslug/seguidores', getProfile

	router.get '/@:uslug/notas', (req, res) ->
		page = parseInt(req.params.p)
		if isNaN(page)
			page = 0
		page = Math.max(Math.min(1000, page), 0)
		Post.find { 'author.id': req.requestedUser.id }
			.skip 10*page
			.limit 10
			.select 'created_at updated_at content.title'
			.exec (err, docs) ->
				res.render 'app/open_notes', {
					pUser: req.requestedUser,
					posts: docs,
					# pagination: {
					# 	nextPage: if page is 0 then undefined else page-1
					# 	previousPage: null
					# }
				}

	router.get '/problemas/novo', required.login,
		(req, res) -> res.render('app/problems', { pageUrl: '/problemas', })
	router.get '/problemas/:problemId/editar', required.login,
		(req, res) -> res.render('app/problems', { pageUrl: '/problemas', })

	router.get '/problemas/:problemId',
		(req, res) ->
			Problem.findOne { _id: req.params.problemId }, req.handleErr404 (doc) ->
				if req.user
					resourceObj = { data: _.extend(doc.toJSON(), { _meta: {} }) }
					res.render 'app/problems', { pageUrl: '/problemas' }
				else
					res.render 'app/open_problem',
						problem: doc.toJSON()
						author: doc.author

	router.get '/posts/:postId', (req, res) ->
		Post.findOne { _id: req.params.postId }, req.handleErr404 (post) ->
			if req.user
				stuffGetPost req.user, post, (err, data) ->
					res.render 'app/main', resource: { data: data, type: 'post', pageUrl: '/' }
			else
				stuffedPost = post.toJSON()

				# post.getCommentTree (err, tree) ->
				# 	if err
				# 		console.log('ERRO???', err)
				# 		return cb(err)
				# 	if tree
				# 		stuffedPost.comments = tree.toJSON().docs.slice()
				# 	else
				# 		stuffedPost.comments = []

				User.findOne { _id: ''+stuffedPost.author.id }, req.handleErr404 (author) ->
					res.render 'app/open_post.html',
						post: stuffedPost
						author: author
						thumbnail: stuffedPost.content.image or stuffedPost.content.link_image or author.avatarUrl

	router.get '/p/:post64Id', (req, res) ->
		id = new Buffer(req.params.post64Id, 'base64').toString('hex')
		res.redirect('/posts/'+id)

	return router
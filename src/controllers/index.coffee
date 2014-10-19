
# src/controllers
# for QI Labs
# by @f03lipe

mongoose = require 'mongoose'
_ = require 'underscore'

required = require './lib/required'
labs = require 'src/core/labs'
redis = require 'src/config/redis.js'
stuffGetPost = require('./api/posts').stuffGetPost

##

Resource = mongoose.model 'Resource'
Post = Resource.model 'Post'
User = mongoose.model 'User'
Problem = mongoose.model 'Problem'

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
			res.render 'app/main', { pageUrl: '/' }
		else
			res.render 'app/front'

	router.get '/login', (req, res) ->
		res.redirect('/')
	router.use '/signup', require('./signup')(app)

	# Register route for communities/labs/...
	for tag, data of labs
		do (tag, data) ->
			if data.path[0] isnt '/'
				data.path = '/'+data.path
			router.get data.path, (req, res) ->
				if req.user
					data.id = tag
					res.render('app/lab', {lab: data, pageUrl:data.path })
				else
					req.logger.debug('IP '+req.connection.remoteAddress+' can\'t '+req.method+' path '+req.url);
					res.redirect('/#auth-page')

	router.get '/problemas', (req, res) ->
		res.render('app/problems', {})

	# These correspond to SAP pages, and therefore mustn't return 404.
	for n in [
		'/novo',
		'/interesses',
		'/posts/:postId/editar'
	]
		router.get n, required.login, (req, res, next) ->
			res.render('app/main', { pageUrl: '/' })

	router.get '/entrar', (req, res) -> res.redirect '/auth/facebook'
	router.get '/settings', required.login, (req, res) -> res.render 'app/settings'
	router.get '/sobre', (req, res) -> res.render('about/main')
	router.get '/faq', (req, res) -> res.render('about/faq')
	router.get '/blog', (req, res) -> res.redirect('http://blog.qilabs.org')
	router.use '/auth', require('./auth')(app)

	router.param 'userSlug', (req, res, next, userSlug) ->
		User.findOne {username:userSlug}, (err, user) ->
			if err
				logger.error("WTF")
				return res.renderError(err)
			if not user
				return res.render404({ msg: "Usuário não encontrado." })
			if user.username isnt userSlug
				return res.redirect(user.path)
			req.requestedUser = user
			next()

	getProfile = (req, res) ->
		if req.user
			req.user.doesFollowUser req.requestedUser, (err, bool) ->
				res.render 'app/profile', { pUser: req.requestedUser, follows: bool, pageUrl: '/' }
		else
			res.render 'app/open_profile', { pUser: req.requestedUser }

	# router.get [path1,path2,...] isn't working with router.param
	router.get '/@:userSlug', getProfile
	router.get '/@:userSlug/seguindo', getProfile
	router.get '/@:userSlug/seguidores', getProfile

	router.get '/@:userSlug/notas', (req, res) ->
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

	router.get '/problemas/novo', required.login,
		(req, res) -> res.render('app/problems.html', { })
	router.get '/problemas/:problemId/editar', required.login,
		(req, res) -> res.render('app/problems.html', { })

	router.get '/problemas/:problemId', required.login,
		(req, res) ->
			Problem.findOne { _id: req.params.problemId }, req.handleErr404 (doc) ->
				resourceObj = { data: _.extend(doc.toJSON(), { _meta: {} }), type: 'problem' }
				if req.user
					req.user.doesFollowUser doc.author.id, (err, val) ->
						if err
							console.error("PQP1", err)
						resourceObj.data._meta.authorFollowed = val
						if doc.hasAnswered.indexOf(''+req.user.id) is -1
							resourceObj.data._meta.userAnswered = false
							res.render('app/problems.html', { resource: resourceObj })
						else
							resourceObj.data._meta.userAnswered = true
							doc.getFilledAnswers (err, children) ->
								if err
									console.error("PQP2", err, children)
								resourceObj.children = children
								res.render('app/problems.html', { resource: resourceObj })
				else
					res.render('app/problems.html', { resource: resourceObj })

	router.get '/posts/:postId', (req, res) ->
		Post.findOne { _id: req.params.postId }, req.handleErr404 (post) ->
			if req.user
				stuffGetPost req.user, post, (err, data) ->
					res.render 'app/main', resource: { data: data, type: 'post', pageUrl: '/' }
			else
				post.getCommentTree (err, tree) ->
					if err
						console.log('ERRO???', err)
						return cb(err)

					stuffedPost = post.toJSON()
					if tree
						stuffedPost.children = tree.toJSON().docs.slice()
					else
						stuffedPost.children = []

					User.findOne { _id: ''+stuffedPost.author.id }, req.handleErr404 (author) ->
						res.render 'app/open_post.html',
							post: stuffedPost
							author: author
							thumbnail: stuffedPost.content.image or stuffedPost.content.link_image or author.avatarUrl

	router.get '/p/:post64Id', (req, res) ->
		id = new Buffer(req.params.post64Id, 'base64').toString('hex')
		res.redirect('/posts/'+id)

	return router
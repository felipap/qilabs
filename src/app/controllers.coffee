
# app/controllers.coffee
# for QiLabs.org

mongoose = require 'mongoose'
_ = require 'underscore'
winston = require 'winston'
bunyan = require 'bunyan'

required = require 'src/lib/required'
redis = require 'src/config/redis'
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

	router.get '/entrar', (req, res) -> res.redirect '/api/auth/facebook'
	router.get '/settings', required.login, (req, res) -> res.render 'app/settings'
	router.get '/sobre', (req, res) -> res.render('about/main')
	router.get '/faq', (req, res) -> res.render('about/faq')
	router.get '/blog', (req, res) -> res.redirect('http://blog.qilabs.org')

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

	router.post '/problems/:problemId', required.login,
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

	router.get '/signup/finish',
		required.login, (req, res) ->
			res.redirect('/signup/finish/1')

	router.route('/signup/finish/1')
		.all required.login
		.get (req, res) ->
			unless req.session.signinUp
				return res.redirect('/')
			res.render('app/signup_1')
		.put (req, res) ->
			validator = require('validator')

			fields = 'nome sobrenome email school-year b-day b-month b-year'.split(' ')

			for field in fields
				if typeof req.body[field] isnt 'string'
					return res.endJSON { error: true, message: "Formulário incompleto." }

			nome = validator.trim(req.body.nome).split(' ')[0]
			sobrenome = validator.trim(req.body.sobrenome).split(' ')[0]
			email = validator.trim(req.body.email)
			serie = validator.trim(req.body['school-year'])
			birthDay = parseInt(req.body['b-day'])
			birthMonth = req.body['b-month']
			birthYear = Math.max(Math.min(2005, parseInt(req.body['b-year'])), 1950)

			if birthMonth not in 'january february march april may june july august september october november december'.split(' ')
				return res.endJSON { error: true, message: "Mês de nascimento inválido."}

			birthday = new Date(birthDay+' '+birthMonth+' '+birthYear)
			req.user.profile.birthday = birthday
			console.log birthday
			# Fill stuff
			# Name
			req.user.name = nome+' '+sobrenome
			# Email
			if validator.isEmail(email)
				req.user.email = email
			# School year
			if not serie in ['6-ef', '7-ef', '8-ef', '9-ef', '1-em', '2-em', '3-em', 'faculdade']
				return res.endJSON { error: true, message: 'Ano inválido.' }
			else
				req.user.profile.serie = serie

			req.user.save (err) ->
				if err
					console.log(err);
					return res.endJSON { error: true }
				res.endJSON { error: false }

	router.route('/signup/finish/2')
		.all required.login
		.get (req, res) ->
			unless req.session.signinUp
				return res.redirect('/')
			res.render('app/signup_2')
		.put (req, res) ->
			trim = (str) -> str.replace(/(^\s+)|(\s+$)/gi, '')

			# console.log('profile received', req.body)
			# do tests 
			# sanitize
			if req.body.bio
				bio = trim(req.body.bio.replace(/^\s+|\s+$/g, '').slice(0,300))
				req.user.profile.bio = bio
			else
				return res.endJSON { error: true, message: 'Escreva uma bio.' }
			if req.body.home
				home = trim(req.body.home.replace(/^\s+|\s+$/g, '').slice(0,35))
				req.user.profile.home = home
			else
				return res.endJSON { error: true, message: 'De onde você é?' }
			if req.body.location
				location = trim(req.body.location.replace(/^\s+|\s+$/g, '').slice(0,35))
				req.user.profile.location = location
			else
				return res.endJSON { error: true, message: 'O que você faz da vida?' }

			req.user.save (err) ->
				if err
					console.log(err);
					return res.endJSON { error: true }
				req.session.signinUp = false
				res.endJSON { error: false }

	# Register route for communities/pages/...
	for tag, data of pages.data
		do (tag, data) ->
			if data.path[0] isnt '/'
				data.path = '/'+data.path
			router.get data.path, required.login, (req, res) ->
				data.id = tag
				res.render('app/community', {tag: data})

	# These correspond to SAP pages, and therefore mustn't return 404.
	for n in ['novo', '/posts/:postId/edit', 'novo-problema', '/problems/:postId/edit']
		router.get '/'+n, required.login, (req, res, next) -> res.render('app/main')

	return router
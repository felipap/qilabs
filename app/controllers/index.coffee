
# app/controllers
# for QI Labs
# by @f03lipe

mongoose = require 'mongoose'
_ = require 'lodash'

required = require './lib/required'
labs = require 'app/data/labs'
redis = require 'app/config/redis.js'
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
		.or [{ 'content.link_image': { $ne: null } }, { 'content.cover': { $ne: null } }]
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
		logger.info("<#{req.user and req.user.username or 'anonymous@'+
			req.connection.remoteAddress}>: HTTP #{req.method} #{req.url}")
		next()

	router.use '/signup', (require './signup') app

	# Deal with signups, new sessions, tours and etc.
	router.use (req, res, next) ->
		if req.user and not req.user.meta.registered
			return res.redirect('/signup')
		next()

		# On purpose
		if req.user
			req.user.meta.last_access = new Date()
			req.user.save()

	router.get '/', (req, res, next) ->
		return res.redirect '/labs' if req.user
		res.render 'app/front', { docs: _.shuffle(globalPosts).slice(0,20) }

	router.use (require './profile') app
	router.use (require './labs') app
	router.use (require './ranking') app

	router.get '/login', (req, res) -> res.redirect('/')

	###*
	 * MISC
	###

	router.get '/entrar', (req, res) -> res.redirect '/auth/facebook'
	router.get '/settings', required.login, (req, res) -> res.render 'app/settings'
	router.get '/sobre', (req, res) -> res.render('about/main')
	router.get '/faq', (req, res) -> res.render('about/faq')
	router.get '/blog', (req, res) -> res.redirect('http://blog.qilabs.org')

	router.use '/auth', require('./passport')(app)
	router.use '/admin', require('./admin')(app)

	return router
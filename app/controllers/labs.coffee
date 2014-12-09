
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

module.exports = (app) ->
	router = require('express').Router()

	# SAP pages → render main template
	for n in [
		'/novo',
		'/interesses',
		'/posts/:postId/editar',
	]
		router.get n, required.login, (req, res, next) ->
			res.render 'app/labs', { pageUrl: '/' }

	# LABS

	router.get '/labs/:labSlug', (req, res) ->
		labdata = _.find labs, slug: req.params.labSlug
		if not labdata
			return res.render404()
		res.render 'app/labs', {
			lab: labdata
			pageUrl: '/'+req.params.labSlug
		}

	getLatestLabPosts = (user, cb) ->
		query =	Post.find({}).limit(15).sort('-created_at')

		if user
			query.where { lab: { $in: user.preferences.labs }}
		query.exec (err, docs) ->
				if err
					throw err
				if not docs.length or not docs[docs.length-1]
					minDate = 0
				else
					minDate = docs[docs.length-1].created_at
				cb(null, require('app/actions/cards').workPostCards(user, docs), minDate)

	router.get '/', (req, res, next) ->
		data = {}
		data.pageUrl = '/'
		if req.user
			res.locals.lastAccess = req.user.meta.last_access
			# if req.session.previousLastUpdate
			# 	delete req.session.previousLastUpdate
			# If user didn't enter before 16/11/2014, show tour
			# 	req.session.tourShown = true
			if req.user.meta.last_access < new Date(2014, 10, 14)
				data.showTour = true
				data.showInterestsBox = true
		else
			# Show that every five minutes
			if not req.session.hasSeenIntro or
			1*new Date(req.session.hasSeenIntro) < (Date.now() - 5*60*1000)
				req.session.hasSeenIntro = Date.now()
				data.showIntro = true
		getLatestLabPosts req.user or null, (err, posts, minDate) ->
			data.resource = { type: 'feed', data: posts, minDate: minDate }
			res.render 'app/labs', data

	###*
	 * POSTS
	###

	router.get '/posts/:postId', (req, res) ->
		Post.findOne { _id: req.params.postId }, req.handleErr404 (post) ->
			if true or req.user
				stuffGetPost req.user, post, (err, data) ->
					res.render 'app/labs', resource: { data: data, type: 'post', pageUrl: '/' }
			else
				stuffedPost = post.toJSON()

				User.findOne { _id: ''+stuffedPost.author.id }, req.handleErr404 (author) ->
					res.render 'app/open_post.html',
						post: stuffedPost
						author: author
						thumbnail: stuffedPost.content.cover or stuffedPost.content.link_image or author.avatarUrl

	router.get '/p/:post64Id', (req, res) ->
		id = new Buffer(req.params.post64Id, 'base64').toString('hex')
		res.redirect('/posts/'+id)

	###*
	 * PROBLEMS
	###

	router.get '/problemas', (req, res) ->
		res.render 'app/problems', { pageUrl: '/problems' }

	router.get '/problemas/novo', required.login, (req, res) ->
		res.render 'app/problems', { pageUrl: '/problemas' }

	router.get '/problemas/:problemId/editar', required.login, (req, res) ->
		res.render 'app/problems', { pageUrl: '/problemas' }

	router.get '/problemas/:problemId', (req, res) ->
		Problem.findOne { _id: req.params.problemId }, req.handleErr404 (doc) ->
			if req.user
				resourceObj = { data: _.extend(doc.toJSON(), { _meta: {} }) }
				res.render 'app/problems', { pageUrl: '/problemas' }
			else
				res.render 'app/open_problem',
					problem: doc.toJSON()
					author: doc.author

	return router
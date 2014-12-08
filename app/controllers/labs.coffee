
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

	# LABS

	router.get '/labs/:labSlug', (req, res) ->
		labdata = _.find labs, slug: req.params.labSlug
		if not labdata
			return res.render404()
		res.render 'app/labs', {
			lab: labdata
			pageUrl: '/labs/'+req.params.labSlug
		}

	getLatestLabPosts = (user, cb) ->
		Post.find {}
			.limit 15
			.sort '-created_at'
			.where { lab: { $in: user.preferences.labs }}
			.exec (err, docs) ->
				if err
					throw err
				if not docs.length or not docs[docs.length-1]
					minDate = 0
				else
					minDate = docs[docs.length-1].created_at
				cb(null, require('app/actions/cards').workPostCards(user, docs), minDate)

	router.get '/labs', required.login, (req, res, next) ->
		res.locals.lastAccess = req.user.meta.last_access
		# if req.session.previousLastUpdate
		# 	delete req.session.previousLastUpdate
		# If user didn't enter before 16/11/2014, show tour
		# 	req.session.tourShown = true
		data = { pageUrl: '/labs' }
		if req.user.meta.last_access < new Date(2014, 10, 14)
			data.showTour = true
			data.showInterestsBox = true
		getLatestLabPosts req.user, (err, data, minDate) ->
			data.resource = { data: data, type: 'feed', data: data, minDate: minDate }
			res.render 'app/labs', data

	###*
	 * POSTS
	###

	router.get '/posts/:postId', (req, res) ->
		Post.findOne { _id: req.params.postId }, req.handleErr404 (post) ->
			if req.user
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
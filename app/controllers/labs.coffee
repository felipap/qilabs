
mongoose = require 'mongoose'
_ = require 'lodash'
async = require 'async'

required = require './lib/required'
labs = require 'app/data/labs'
redis = require 'app/config/redis.js'
stuffGetPost = require('app/actions/posts').stuffGetPost
cardActions = require('app/actions/cards')

Post = mongoose.model 'Post'
User = mongoose.model 'User'
Problem = mongoose.model 'Problem'
ProblemSet = mongoose.model 'ProblemSet'

logger = null

module.exports = (app) ->
	router = require('express').Router()

	# SAP pages → render main template
	for n in [
		'/interesses',
		'/posts/:postId/editar',
	]
		router.get n, required.login, (req, res, next) ->
			res.render 'app/labs', { pageUrl: '/' }

	# LABS

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
			cb(null, cardActions.workPostCards(user, docs), minDate)

	router.get '/', (req, res, next) ->
		data = {}
		data.pageUrl = '/'
		if req.user
			res.locals.lastAccess = req.user.meta.last_access
			# if req.session.previousLastUpdate
			# 	delete req.session.previousLastUpdate
			# If user didn't enter before 16/11/2014, show tour
			# 	req.session.tourShown = true
		else
			# Show that every five minutes
			if not req.session.hasSeenIntro or
			1*new Date(req.session.hasSeenIntro) < (Date.now() - 5*60*1000)
				req.session.hasSeenIntro = Date.now()
				data.showIntro = true
		getLatestLabPosts req.user or null, (err, posts, minDate) ->
			data.feed = {
				docs: posts
				minDate: minDate
			}
			res.render 'app/labs', data

	router.get '/labs/:labSlug', (req, res) ->
		labdata = _.find labs, slug: req.params.labSlug
		if not labdata
			return res.render404()
		res.render 'app/labs', {
			lab: labdata
			pageUrl: '/'+req.params.labSlug
			# results: null
		}

	###*
	 * POSTS
	###

	router.get '/posts/:postId', (req, res) ->
		Post.findOne { _id: req.params.postId }, req.handleErr404 (post) ->
			stuffGetPost req.user, post, (err, data) ->
				res.render 'app/labs',  {
					resource: {
						data: data
						type: 'post'
					}
					metaResource: post
					pageUrl: '/'
				}

	router.get '/p/:post64Id', (req, res) ->
		id = new Buffer(req.params.post64Id, 'base64').toString('hex')
		res.redirect('/posts/'+id)

	###*
	 * OLYMPIADS
	###

	for n in [
		'/olimpiadas'
		'/olimpiadas/problemas/novo'
		'/olimpiadas/colecoes/novo'
		'/olimpiadas/colecoes/:psetSlug/editar'
	]
		router.get n, required.login, (req, res) ->
			ProblemSet.find {}, req.handleErr (docs) ->
				res.render 'app/problem_sets', {
					pageUrl: '/olimpiadas'
					psets: docs
				}

	for n in [
		'/olimpiadas/colecoes/:psetSlug'
		'/olimpiadas/colecoes/:psetSlug/:problemIndex',
		'/olimpiadas/colecoes/:psetSlug/editar',
	]
		router.get n, required.login, (req, res) ->
			ProblemSet.findOne { slug: req.params.psetSlug }, req.handleErr404 (pset) ->
				pids = _.map(pset.problemIds, (id) -> ''+id)
				Problem.find { _id: { $in: pids } }, (err, problems) ->
					if err
						throw err
					res.render 'app/problem_sets', {
						pset: pset
						results: {
							docs: problems # cardActions.workPostCards(user, docs)
							minDate: 0
						}
						pageUrl: '/colecoes/'+pset.id
					}

	for n in [
		'/olimpiadas/problemas/:problemId'
		'/olimpiadas/problemas/:problemId/editar',
	]
		router.get n, required.login, (req, res) ->
			Problem.findOne { _id: req.params.problemId }, req.handleErr404 (doc) ->
				if req.user
					res.render 'app/problem_sets', {
						pageUrl: '/problemas'
						resource: {
							data: doc
							type: 'problem'
						}
						metaResource: doc
					}
				else
					res.render 'app/open_problem',
						problem: doc.toJSON()
						author: doc.author

	return router
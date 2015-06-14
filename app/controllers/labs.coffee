
mongoose = require 'mongoose'
_ = require 'lodash'
async = require 'async'

required = require './lib/required'
labs = require 'app/static/labs'
redis = require 'app/config/redis.js'
stuffGetPost = require('app/actions/posts').stuffGetPost
cardActions = require 'app/actions/cards'
psetActions = require 'app/actions/psets'
problemActions = require 'app/actions/problems'

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

	router.param 'problemId', (req, res, next, problemId) ->
		try
			id = mongoose.Types.ObjectId.createFromHexString(problemId);
		catch e
			return next({ type: "InvalidId", args:'problemId', value:problemId});
		Problem.findOne { _id:problemId }, req.handleErr404 (problem) ->
			req.problem = problem
			next()

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

	return router
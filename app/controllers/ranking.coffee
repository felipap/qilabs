
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

	router.get '/ranking', (req, res) ->

		User.find().sort('-stats.karma').limit(10).exec (err, docs) ->
			if err
				throw err

			list = _.map docs, (d) ->
				{
					user: d
				}

			res.render 'app/ranking', {
				ranking: {
					name: "Ranking Publicações"
					list: list
				}
			}

	return router
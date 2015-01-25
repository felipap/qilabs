
mongoose = require 'mongoose'
_ = require 'lodash'

User = mongoose.model 'User'

module.exports = (app) ->
	router = require('express').Router()

	router.get '/ranking', (req, res) ->


		User.find().sort('-stats.qiPoints').limit(10).exec (err, docsProblems) ->
			if err
				throw err
			User.find().sort('-stats.karma').limit(10).exec (err, docsPosts) ->
				if err
					throw err

				listPosts = _.map docsPosts, (d) ->
					{
						user: _.extend(d, { points: d.stats.karma })
					}
				listProblems = _.map docsProblems, (d) ->
					{
						user: _.extend(d, { points: d.stats.qiPoints })
					}

				res.render 'app/ranking', {
					rankingPosts: {
						list: listPosts
					}
					rankingProblems: {
						list: listProblems
					}
				}


	router.get '/ranking/problemas', (req, res) ->

		User.find().sort('-stats.qiPoints').limit(10).exec (err, docs) ->
			if err
				throw err

			list = _.map docs, (d) ->
				{
					user: _.extend(d, { points: d.stats.qiPoints })
				}

			res.render 'app/ranking', {
				ranking: {
					name: "Ranking Problemas"
					list: list
				}
			}

	return router
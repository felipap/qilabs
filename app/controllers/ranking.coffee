
mongoose = require 'mongoose'
_ = require 'lodash'

User = mongoose.model 'User'

module.exports = (app) ->
	router = require('express').Router()

	router.get '/ranking', (req, res) ->

		User.find().sort('-stats.karma').limit(10).exec (err, docs) ->
			if err
				throw err

			list = _.map docs, (d) ->
				{
					user: _.extend(d, { points: d.stats.karma })
				}

			res.render 'app/ranking', {
				ranking: {
					name: "Ranking Publicações"
					list: list
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
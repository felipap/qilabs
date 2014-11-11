
async = require 'async'
mongoose = require 'mongoose'
_ = require 'lodash'

required = require '../lib/required'
labs = require 'src/core/labs'

Resource = mongoose.model 'Resource'
User = mongoose.model 'User'
Post = Resource.model 'Post'

module.exports = (app) ->
	router = require('express').Router()

	router.param 'lab', (req, res, next) ->
		lab = req.params.lab
		if not lab of labs
			return res.status(404).endJSON { error: true }
		req.lab = lab
		next()

	workPostCards = (user, _docs) ->
		docs = []
		_docs.forEach (i) ->
			if i
				docs.push(_.extend(i.toJSON(), {
					_meta: {
						liked: user and !!~i.votes.indexOf(user.id)
						watching: user and !!~i.users_watching.indexOf(user.id)
					}
				}))
		return docs

	router.get '/all', (req, res) ->
		if isNaN(maxDate = parseInt(req.query.maxDate))
			maxDate = Date.now()

		Post
			.find { created_at:{ $lt:maxDate } }
			.limit 10
			.sort '-created_at'
			.select '-content.body'
			.exec (err, docs) =>
				if err
					throw err
				if not docs.length or not docs[docs.length-1]
					minDate = 0
				else
					minDate = docs[docs.length-1].created_at
				res.endJSON { minDate: minDate, data: workPostCards(req.user, docs) }

	router.get '/:lab/all', (req, res, next) ->
		if isNaN(maxDate = parseInt(req.query.maxDate))
			maxDate = Date.now()

		Post
			.find { created_at:{ $lt:maxDate }, subject: req.lab }
			.limit 10
			.sort '-created_at'
			.select '-content.body'
			.exec (err, docs) =>
				if err
					throw err
				if not docs.length or not docs[docs.length-1]
					minDate = 0
				else
					minDate = docs[docs.length-1].created_at
				res.endJSON { minDate: minDate, data: workPostCards(req.user, docs) }

	return router

async = require 'async'
mongoose = require 'mongoose'
_ = require 'underscore'

required = require '../lib/required'
labs = require 'src/core/labs'

Resource = mongoose.model 'Resource'
User = mongoose.model 'User'
Post = Resource.model 'Post'

module.exports = (app) ->
	router = require('express').Router()
	router.use required.login
	router.param 'tag', (req, res, next) ->
		tag = req.params.tag
		if not tag of labs
			return res.status(404).endJSON { error: true }
		req.tag = tag
		next()


	workPostCards = (user, _docs) ->
		docs = []
		_docs.forEach (i) ->
			if i
				docs.push(_.extend(i.toJSON(), {
					_meta: {
						liked: !!~i.votes.indexOf(user.id)
					}
				}))
		return docs

	router.get '/:tag/all', (req, res, next) ->
		if isNaN(maxDate = parseInt(req.query.maxDate))
			maxDate = Date.now()
		Post.find { parent: null, created_at:{ $lt:maxDate }, subject: req.tag }
			.limit 10
			.exec (err, docs) =>
				return next(err) if err
				if not docs.length or not docs[docs.length-1]
					minDate = 0
				else
					minDate = docs[docs.length-1].created_at
				res.endJSON { minDate: minDate, data: workPostCards(req.user, docs) }

	return router
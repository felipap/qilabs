
async = require 'async'
mongoose = require 'mongoose'
_ = require 'underscore'
required = require 'src/core/required.js'

Resource = mongoose.model 'Resource'
User = mongoose.model 'User'
Post = Resource.model 'Post'

labs = require('src/core/labs.js').data

module.exports = (app) ->
	router = require('express').Router()
	router.use required.login
	router.param 'tag', (req, res, next) ->
		tag = req.params.tag
		if not tag of labs
			return res.status(404).endJSON { error: true }
		req.tag = tag
		next()

	router.get '/:tag/all', (req, res, next) ->
		if isNaN(maxDate = parseInt(req.query.maxDate))
			maxDate = Date.now()
		Post.find { parent: null, created_at:{ $lt:maxDate }, subject: req.tag }
			.exec (err, docs) =>
				return next(err) if err
				if not docs.length or not docs[docs.length]
					minDate = 0
				else
					minDate = docs[docs.length-1].created_at
				res.endJSON { minDate: minDate, data: docs }

	router.get '/:tag/notes', (req, res, next) ->
		if isNaN(maxDate = parseInt(req.query.maxDate))
			maxDate = Date.now()
		Post.find { type: 'Note', parent: null, created_at:{ $lt:maxDate }, subject: req.tag }
			.exec (err, docs) =>
				return next(err) if err
				if not docs.length or not docs[docs.length]
					minDate = 0
				else
					minDate = docs[docs.length-1].created_at
				res.endJSON { minDate: minDate, data: docs }

	router.get '/:tag/discussions', (req, res, next) ->
		if isNaN(maxDate = parseInt(req.query.maxDate))
			maxDate = Date.now()
		Post.find { type: 'Discussion', parent: null, created_at:{ $lt:maxDate }, subject: req.tag }
			.exec (err, docs) =>
				return next(err) if err
				if not docs.length or not docs[docs.length]
					minDate = 0
				else
					minDate = docs[docs.length-1].created_at
				res.endJSON { minDate: minDate, data: docs }

	return router
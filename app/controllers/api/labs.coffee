
async = require 'async'
mongoose = require 'mongoose'
_ = require 'lodash'

required = require '../lib/required'
labs = require 'app/data/labs'
cardsActions = require 'app/actions/cards'

User 	= mongoose.model 'User'
Post  = mongoose.model 'Post'
Inbox = mongoose.model 'Inbox'
Problem = mongoose.model 'Problem'

module.exports = (app) ->
	router = require('express').Router()

	router.param 'lab', (req, res, next) ->
		lab = req.params.lab
		if not lab of labs
			return res.status(404).endJSON { error: true }
		req.lab = lab
		next()

	sendAfterFind = (user, cb) ->
		return (err, docs) ->
			if err
				throw err
			if not docs.length or not docs[docs.length-1]
				minDate = 0
			else
				minDate = docs[docs.length-1].created_at
			cb(
				minDate: minDate
				eof: minDate is 0
				data: cardsActions.workPostCards(user, docs)
			)

	router.get '/hot', (req, res, next) ->
		maxDate = parseInt(req.query.lt)
		query = Post.find { $where: 'this.votes.length > 4' }
		if maxDate and not isNaN(maxDate)
			query.where created_at: { $lt:maxDate }
		query
			.sort '-created_at'
			.limit 15
			.exec sendAfterFind(req.user, (obj) -> res.endJSON(obj))

	router.get '/all', (req, res, next) ->
		maxDate = parseInt(req.query.lt)
		query = Post.find {}
		if maxDate and not isNaN(maxDate)
			query.where created_at: { $lt:maxDate }
		if req.user
			query.where { lab: { $in: req.user.preferences.labs }}
		query
			.sort '-created_at'
			.limit 15
			.exec sendAfterFind(req.user, (obj) -> res.endJSON(obj))

	router.get '/inbox', required.login, (req, res) ->
		maxDate = parseInt(req.query.lt)
		query = Inbox.find { recipient: ''+req.user.id, type: 'Post' }
		# Get inboxed posts older than the maxDate determined by the client.
		if maxDate and not isNaN(maxDate)
			query.where dateSent: { $lt:maxDate }
		query
			.sort '-dateSent'
			.populate path: 'resource', model: 'Post'
			.limit 25
			.exec (err, docs) =>
				if err
					throw err
				# Pluck resources from inbox docs.
				posts = _.filter(_.pluck(docs, 'resource'), (i)->i)	# Remove null (deleted) resources
				console.log "#{posts.length} posts gathered from inbox"
				if not posts.length or posts.length < docs.length
					minDate = 0
				else
					minDate = posts[posts.length-1].created_at

				res.endJSON(
					minDate: 1*minDate
					eof: minDate is 0
					data: cardsActions.workPostCards(req.user, posts)
				)

	router.get '/problems/all', (req, res) ->
		maxDate = parseInt(req.query.lt)

		query = Problem.find {}
		if req.user
			query.where { subject: { $in: req.user.preferences.subjects } }

		if maxDate and not isNaN(maxDate)
			query.where created_at: { $lt:maxDate }

		if req.query.topic
			topics = (topic for topic in req.query.topic when topic in Problem.Topics)
			query.where({ topic: {$in: topics} })
			console.log('topics', topics)

		if req.query.level
			levels = (level for level in req.query.level when parseInt(level) in [1,2,3,4,5])
			console.log('levels', levels)
			query.where({ level: {$in: levels} })

		query
			.sort '-created_at'
			.limit 20
			.exec (err, docs) ->
				throw err if err
				if not docs.length or not docs[docs.length-1]
					minDate = 0
				else
					minDate = docs[docs.length-1].created_at

				res.endJSON(
					minDate: 1*minDate
					eof: minDate is 0
					data: cardsActions.workProblemCards(req.user, docs)
				)

	router.get '/problems/:lab', (req, res) ->
		maxDate = parseInt(req.query.lt)

		if not req.lab of labs or not labs[req.lab].hasProblems
			return res.endJSON()

		query = Problem.find { subject: req.lab }

		if maxDate and not isNaN(maxDate)
			query.where created_at: { $lt:maxDate }

		if req.query.level
			levels = (level for level in req.query.level when parseInt(level) in [1,2,3,4,5])
			console.log('levels', levels)
			query.where({ level: {$in: levels} })

		query
			.sort '-created_at'
			.limit 20
			.exec (err, docs) ->
				throw err if err
				if not docs.length or not docs[docs.length-1]
					minDate = 0
				else
					minDate = docs[docs.length-1].created_at

				res.endJSON(
					minDate: 1*minDate
					eof: minDate is 0
					data: cardsActions.workProblemCards(req.user, docs)
				)

	router.get '/:lab/all', (req, res, next) ->
		maxDate = parseInt(req.query.lt)
		if not req.lab of labs
			return res.endJSON()
		query = Post.find { lab: req.lab }
		if maxDate and not isNaN(maxDate)
			query.where created_at: { $lt:maxDate }
		query
			.limit 15
			.sort '-created_at'
			.exec sendAfterFind(req.user, (obj) -> res.endJSON(obj))

	router.get '/:lab/hot', (req, res, next) ->
		maxDate = parseInt(req.query.lt)
		query = Post.find { lab: req.lab, $where: 'this.votes.length > 5' }
		if maxDate and not isNaN(maxDate)
			query.where created_at: { $lt:maxDate }
		query
			.sort '-created_at'
			.limit 40
			.exec sendAfterFind(req.user, (obj) -> res.endJSON(obj))

	return router
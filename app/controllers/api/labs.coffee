
async = require 'async'
mongoose = require 'mongoose'
_ = require 'lodash'

required = require '../lib/required'
labs = require 'app/data/labs'

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

	workPostCards = (user, _docs) ->
		docs = []
		_docs.forEach (i) ->
			if i
				i.content.body = i.content.body.slice(0,300)
				docs.push(_.extend(i.toJSON(), {
					_meta: {
						liked: user and !!~i.votes.indexOf(user.id)
						watching: user and !!~i.users_watching.indexOf(user.id)
					}
				}))
		return docs

	sendAfterFind = (user, cb) ->
		return (err, docs) ->
			if err
				throw err
			if not docs.length or not docs[docs.length-1]
				minDate = 0
			else
				minDate = docs[docs.length-1].created_at
			cb({ minDate: minDate, data: workPostCards(user, docs) })

	router.get '/hot', (req, res, next) ->
		if isNaN(maxDate = parseInt(req.query.maxDate))
			maxDate = Date.now()

		Post.find { created_at:{ $lt:maxDate }, $where: 'this.votes.length > 5' }
			.sort '-created_at'
			# .select '-content.body'
			.limit 40
			.exec sendAfterFind(req.user, (obj) -> res.endJSON(obj))


	router.get '/all', (req, res, next) ->
		if isNaN(maxDate = parseInt(req.query.maxDate))
			maxDate = Date.now()

		Post
			.find { created_at:{ $lt:maxDate } }
			.limit 15
			.sort '-created_at'
			# .select '-content.body'
			.exec sendAfterFind(req.user, (obj) -> res.endJSON(obj))


	router.get '/:lab/all', (req, res, next) ->
		if isNaN(maxDate = parseInt(req.query.maxDate))
			maxDate = Date.now()

		Post
			.find { created_at:{ $lt:maxDate }, lab: req.lab }
			.limit 15
			.sort '-created_at'
			# .select '-content.body'
			.exec sendAfterFind(req.user, (obj) -> res.endJSON(obj))


	router.get '/:lab/hot', (req, res, next) ->
		if isNaN(maxDate = parseInt(req.query.maxDate))
			maxDate = Date.now()

		Post.find { created_at:{ $lt:maxDate }, lab: req.lab, $where: 'this.votes.length > 5' }
			.sort '-created_at'
			# .select '-content.body'
			.limit 40
			.exec sendAfterFind(req.user, (obj) -> res.endJSON(obj))


	router.get '/:lab/following', (req, res, next) ->
		if isNaN(maxDate = parseInt(req.query.maxDate))
			maxDate = Date.now()

		Inbox
			.find { recipient: req.user.id, lab: req.lab, dateSent: { $lt:maxDate }}
			.sort '-dateSent' # tied to selection of oldest post below
			.populate 'resource'
			# .populate 'problem'
			.limit 25
			.exec (err, docs) =>
				if err
					throw err
				# Pluck resources from inbox docs.
				# Remove null (deleted) resources.
				posts = _.filter(_.pluck(docs, 'resource'), (i)->i)
				console.log "#{posts.length} posts gathered from inbox"
				if posts.length or not posts[docs.length-1]
					minDate = 0
				else
					minDate = posts[posts.length-1].created_at
				callback(null, docs, minDate)


	workProblemCards = (user, _docs) ->
		formatBody = (text) ->
			noimg = text.replace(/(?:!\[.*?\]\()(.+?)\)/gi, '')
			if noimg.length < 200
				return noimg
			for i in [200..0]
				if /\s/.test(noimg[i])
					return noimg.slice(0,i)+'...'
			console.log("what the actual fuck")
			return noimg.slice(0, 200)

		docs = []
		_docs.forEach (i) ->
			if i
				data = _.extend(i.toJSON(), {
					_meta: {
						liked: user and !!~i.votes.indexOf(user.id)
						tries: user and _.find(i.userTries, { user: user.id })?.tries or 0
						solved: user and !!_.find(i.hasAnswered, { user: user.id })
						watching: user and !!~i.users_watching.indexOf(user.id)
					}
				})
				delete data.content.body
				data.content.cardBody = formatBody(i.content.body)
				docs.push(data)
		return docs

	router.get '/all/problems', (req, res) ->
		console.log(req.query)

		if isNaN(maxDate = parseInt(req.query.maxDate))
			maxDate = Date.now()

		query = Problem.find { created_at: { $lt:maxDate } }
		if req.query.topic
			# topics =
			topics = (topic for topic in req.query.topic when topic in Problem.Topics)
			query.where({ topic: {$in: topics} })
			console.log('topics', topics)
		if req.query.level
			levels = (level for level in req.query.level when parseInt(level) in [1,2,3])
			console.log('levels', levels)
			query.where({ level: {$in: levels} })

		query.exec (err, docs) ->
			throw err if err
			if not docs.length or not docs[docs.length-1]
				minDate = 0
			else
				minDate = docs[docs.length-1].created_at
			res.endJSON(minDate: 1*minDate, data: workProblemCards(req.user, docs))


	return router
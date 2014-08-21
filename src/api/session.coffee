
mongoose = require 'mongoose'
required = require 'src/lib/required.js'
async = require 'async'

Resource = mongoose.model 'Resource'
Garbage = mongoose.model 'Garbage'

User = Resource.model 'User'
Post = Resource.model 'Post'
Inbox = mongoose.model 'Inbox'
Follow = Resource.model 'Follow'
Problem = Resource.model 'Problem'
Activity = Resource.model 'Activity'
Notification = mongoose.model 'Notification'

module.exports = {
	permissions: [required.login, required.isStaff]
	get: (req, res) ->
		models = [[Activity, 'actor'], [Inbox, 'resource'], User, Notification, Post, Problem, Follow, Garbage]

		if req.query.session?
			return res.endJson { ip: req.ip, session: req.session }

		for e in models
			if e instanceof Array
				if req.query[e[0].modelName.toLowerCase()]?
					e[0].find({})
						.populate(e[1])
						.exec (err, docs) ->
							res.endJson { model: e[0].modelName, err: err, docs: docs }
					return
			else if req.query[e.modelName.toLowerCase()]?
				e.find {}, (err, docs) ->
					res.endJson { model: e.modelName, err: err, docs: docs }
				return
		console.log "Celeuma", Post.modelName.toLowerCase(), req.query, Post.modelName.toLowerCase() in req.query, 'post' in req.query, typeof req.query['post'] is 'undefined', typeof req.query['post']

		res.status(404).endJson({ error: "Cadê?" })
		return
}
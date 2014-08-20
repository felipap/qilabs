
mongoose = require 'mongoose'
required = require 'src/lib/required.js'

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
	permissions: [required.isStaff]
	methods: {
		get: (req, res) ->
			# This be ugly but me don't care.
			console.log req.query
			if req.query.user?
				User.find {}, (err, docs) ->
					res.endJson { users:docs }
			else if req.query.activity?
				Activity.find {}
					.populate 'actor'
					.exec (err, docs) ->
						res.endJson { activities:docs }
			else if req.query.inbox?
				Inbox.find {}
					.populate 'resource'
					.exec (err, inboxs) ->
						res.endJson { err:err, inboxs:inboxs } 
			else if req.query.notification?
				Notification.find {}, (err, notifics) ->
					res.endJson { notifics:notifics } 
			else if req.query.post?
				Post.find {}, (err, posts) ->
					res.endJson { posts:posts } 
			else if req.query.problem?
				Problem.find {}, (err, docs) ->
					res.endJson { docs:docs } 
			else if req.query.follow?
				Follow.find {}, (err, follows) ->
					res.endJson { follows:follows } 
			else if req.query.note?
				Activity.find {}, (err, notes) ->
					res.endJson { notes:notes }
			else if req.query.garbage?
				Garbage.find {}, (err, trash) ->
					res.endJson { trash:trash }
			else if req.query.session?
				res.endJson { ip: req.ip, session: req.session } 
			else
				# This could be much better with icedcoffeescript
				User.find {}, (err, users) ->
					Post.find {}, (err, posts) ->
						Inbox.find {}, (err, inboxs) ->
							Follow.find {}, (err, follows) ->
								Notification.find {}, (err, notifics) ->
									Activity.find {}, (err, notes) ->
										obj =
											ip: req.ip
											inboxs: inboxs
											notifics: notifics
											session: req.session
											users: users
											posts: posts
											follows: follows
											notes: notes
										res.endJson obj
	}
}
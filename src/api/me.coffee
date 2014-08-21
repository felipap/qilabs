
mongoose = require 'mongoose'

required = require 'src/lib/required.js'

Activity = mongoose.model 'Activity'
Inbox = mongoose.model 'Inbox'
Notification = mongoose.model 'Notification'

Resource = mongoose.model 'Resource'
Post = Resource.model 'Post'

module.exports = {
	permissions: [required.login]
	children: {
		'profile':
			put: (req, res) ->
				trim = (str) ->
					str.replace(/(^\s+)|(\s+$)/gi, '')

				console.log('profile received', req.body.profile)
				# do tests
				# sanitize
				name = req.body.profile.nome1.replace(/\s/,'')+' '+req.body.profile.nome2.replace(/\s/,'')
				bio = trim(req.body.profile.bio).slice(0,300)
				home = trim(req.body.profile.home).slice(0,37)
				location = trim(req.body.profile.location).slice(0,37)

				if name
					req.user.name = name
				if bio
					req.user.profile.bio = bio
				if home
					req.user.profile.home = home
				if location
					req.user.profile.location = location

				req.user.save () ->
				res.endJson { data: req.user.toJSON(), error: false }

		'notifications': {
			permissions: [required.login]
			get: (req, res) ->
				if req.query.limit
					limit = Math.max(0,Math.min(10,parseInt(req.query.limit)))
				else
					limit = 6
				req.user.getNotifications limit, req.handleErrResult((notes) ->
					res.endJson {
						data: notes
						error: false
					}
				)
			children: {
				':id/access':
					get: (req, res) ->
						return unless nId = req.paramToObjectId('id')
						Notification.update { recipient: req.user.id, _id: nId },
							{ accessed: true, seen: true }, { multi:false }, (err) ->
								res.endJson {
									error: !!err
								}
				'seen':
					post: (req, res) ->
						Notification.update { recipient: req.user.id },
							{ seen:true }, { multi:true }, (err) ->
								res.endJson {
									error: !!err
								}
			}
		}
		'inbox/posts': 
			get: (req, res) ->
				if isNaN(maxDate = parseInt(req.query.maxDate))
					maxDate = Date.now()
				req.user.getTimeline { maxDate: maxDate, source: 'inbox' },
					req.handleErrResult((docs, minDate=-1) ->
						res.endJson {
							minDate: minDate
							data: docs
						}
					)
		'problems': 
			get: (req, res) ->
				if isNaN(maxDate = parseInt(req.query.maxDate))
					maxDate = Date.now()
				req.user.getTimeline { maxDate: maxDate, source: 'problems' },
					req.handleErrResult((docs, minDate=-1) ->
						res.endJson {
							minDate: minDate
							data: docs
						}
					)
		'global/posts': 
			get: (req, res) ->
				if isNaN(maxDate = parseInt(req.query.maxDate))
					maxDate = Date.now()
				req.user.getTimeline { maxDate: maxDate, source: 'global' },
					req.handleErrResult((docs, minDate=-1) ->
						res.endJson {
							minDate: minDate
							data: docs
						}
					)

		# 'leave': {
		# 	name: 'user_quit'
		# 	post: (req, res) -> # Deletes user account.
		# 		req.user.remove (err, data) ->
		# 			if err then throw err
		# 			req.logout()
		# 			res.redirect('/')
		# }
		'logout': {
			name: 'logout',
			post: (req, res) ->
					req.logout()
					res.redirect('/')
		}
	}
}
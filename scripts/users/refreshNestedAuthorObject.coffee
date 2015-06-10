
async = require 'async'
mongoose = require 'mongoose'
_ = require 'lodash'

jobber = require('../lib/jobber.js')((e) ->

	User = mongoose.model 'User'

	workUser = (user, cb) ->

	targetUserId = process.argv[2]
	if targetUserId
		User.findOne {_id: targetUserId}, (err, user) ->
			workUser(user, e.quit)
	else
		console.warn "No target user id supplied."
		User.find {}, (err, users) ->
			async.map users, workUser, e.quit

).start()

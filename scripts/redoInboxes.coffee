
async = require 'async'
mongoose = require 'mongoose'
_ = require 'lodash'

jobber = require('./lib/jobber.js')((e) ->

	InboxService = require 'app/services/inbox'
	User = mongoose.model 'User'

	workUser = (followee, done) ->
		InboxService.RedoInboxesFromUser(followee, done)

	targetUserId = process.argv[2]
	if targetUserId
		User.findOne { _id: targetUserId }, (err, user) ->
			workUser user, e.quit
	else
		console.warn 'No target user id supplied. Doing all.'
		User.find {}, (err, users) ->
			async.map users, workUser, e.quit

).start()

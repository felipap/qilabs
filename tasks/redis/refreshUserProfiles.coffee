
async = require 'async'
mongoose = require 'mongoose'
_ = require 'lodash'

jobber = require('../lib/jobber.js')((e) ->
	redis = require 'app/config/redis'
	User = mongoose.model 'User'
	Follow = mongoose.model 'Follow'
	Post = mongoose.model 'Post'

	workUser = (user, done) ->
		user.updateCachedProfile(done)

	targetUserId = process.argv[2]
	if targetUserId
		User.findOne { _id: targetUserId }, (err, user) ->
			workUser(user, e.quit)
	else
		console.warn 'No target user id supplied. Doing all.'
		User.find {}, (err, users) ->
			async.map(users, workUser, e.quit)

).start()
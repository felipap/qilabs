
var async = require('async')
var mongoose = require('mongoose')
var _ = require('lodash')

jobber = require('../lib/jobber.js')((e) => {
	var User = mongoose.model('User')

	workUser = (user, done) => {
		user.updateCachedProfile(done)
	}

	targetUserId = process.argv[2]
	if (targetUserId) {
		User.findOne({ _id: targetUserId }, (err, user) => {
			workUser(user, e.quit)
		})
	} else {
		console.warn('No target user id supplied. Doing all.')
		User.find({}, (err, users) => {
			async.map(users, workUser, e.quit)
		})
	}

}).start()
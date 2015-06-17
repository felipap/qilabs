
var async = require('async')
var mongoose = require('mongoose')
var _ = require('lodash')

jobber = require('../lib/jobber.js')(function (e) {
	var User = mongoose.model('User')

	function workUser(user, done) {
		require('app/jobs/refreshNestedAuthor')(user, done)
	}

	var targetUserId = process.argv[2]
	if (targetUserId) {
		User.findOne({ _id: targetUserId }, (err, user) => {
			workUser(user, e.quit)
		})
	} else {
		console.warn("No target user id supplied.")
		User.find({}, (err, users) => {
			async.map(users, workUser, e.quit)
		})
	}

}).start()
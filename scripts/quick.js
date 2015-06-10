
var async = require('async')
var mongoose = require('mongoose')
var _ = require('lodash')


jobber = require('./lib/jobber.js')(function (e) {
	var notification = require('app/services/notification')
	var User = mongoose.model('User')
	var Follow = mongoose.model('Follow')

	User.findOne({ username: 'felipe' }, (err, user) => {
		notification.redoUser(user, function () {
			console.log('FINALLY!', arguments)
			e.quit();
		})
	})

	// function workUser(user, done) {
	// 	console.log('\n\n\n\n\n\ndoing', user.username, '\n>>>')
	// 	notification.redoUser(user, function () {
	// 		console.log('FINALLY!', arguments)
	// 		done()
	// 	})
	// }

	// var targetUserId = process.argv[2]
	// if (targetUserId) {
	// 	User.findOne({ _id: targetUserId }, (err, user) => {
	// 		workUser(user, e.quit)
	// 	})
	// } else {
	// 	console.warn('No target user id supplied. Doing all.')
	// 	User.find({}, (err, users) => {
	// 		async.map(users, workUser, e.quit)
	// 	})
	// }
}).start()
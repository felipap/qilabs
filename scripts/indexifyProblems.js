
var async = require('async')
var mongoose = require('mongoose')
var _ = require('lodash')

jobber = require('./lib/jobber.js')(function (e) {
	var Problem = mongoose.model('Problem')
	var ProblemSet = mongoose.model('ProblemSet')

	ProblemSet.findOne({ id: '54c67aec9364942b2177eca4' }, (err, pset) => {
		if (err) {
			throw err
		}

		var pids = _.map(pset.problem_ids, (i) => ''+i)

		Problem.find({ _id: { $in: pids } }, (err, problems) => {
			if (err) {
				throw err
			}

			console.log('problems', problems)
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

var async = require('async')
var mongoose = require('mongoose')
var _ = require('lodash')
var ObjectId = mongoose.Types.ObjectId

// how is migration gonna work?

jobber = require('./jobber.js')(function (e) {

	var User = mongoose.model('User')
	var unportuguesizer = require('app/lib/unportuguesizer');

	function workUser (user, done) {
			// console.log(user.username, unportuguesizer(user.username).replace(/\s+/g, '_'))
		// if (user.username !== unportuguesizer(user.username)) {
			var newun = unportuguesizer(user.username).replace(/\s+/g, '').replace(/\./g, '');
			console.log(user.username, newun)
			user.username = newun;
			user.save(function () { console.log(arguments) });
		// }
		done();
	}

	var targetUserId = process.argv[2]
	if (targetUserId) {
		User.findOne({_id: targetUserId}, function (err, user) {
			workUser(user, e.quit)
		});
	} else {
		console.warn('No target user id supplied. Doing all.');
		User.find({}, function (err, users) {
			async.map(users, workUser, e.quit)
		});
	}
}).start()
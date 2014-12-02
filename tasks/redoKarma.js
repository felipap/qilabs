
var async = require('async')
var mongoose = require('mongoose')
var KarmaService = require('app/services/karma')
var User = mongoose.model('User')

jobber = require('./jobber.js')(function (e) {

	function workUser (user, done) {
		console.log('Redoing user', user.name)
		KarmaService.redoUserKarma(user, function (err) {
			done()
		})
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
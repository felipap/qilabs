
var async = require('async')
var mongoose = require('mongoose')
var _ = require('lodash')
var ObjectId = mongoose.Types.ObjectId

// how is migration gonna work?

jobber = require('./jobber.js')(function (e) {

	var NotificationService = require('src/core/notification')
	var User = mongoose.model("User");

	User.find({}, function (err, docs) {

		async.map(docs, function(user, done) {
			console.log("Redoing user", user.name)
			NotificationService.RedoUserNotifications(user, function (err) {
				done()
			})
		}, function (err, results) {
			e.quit(err)
		});

	});
}).start()
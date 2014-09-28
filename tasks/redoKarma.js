
var async = require('async')
var mongoose = require('mongoose')
var _ = require('lodash')
var ObjectId = mongoose.Types.ObjectId

// how is migration gonna work?

jobber = require('./jobber.js')(function (e) {

	var KarmaService = require('src/core/karma')
	var User = mongoose.model("User");

	User.find({}, function (err, docs) {

		async.map(docs, function(user, done) {
			console.log("Redoing user", user.name)
			KarmaService.RedoUserKarma(user, function (err) {
				done()
			})
		}, function (err, results) {
			e.quit(err)
		});

	});
}).start()
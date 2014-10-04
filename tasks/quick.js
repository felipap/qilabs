
var async = require('async')
var mongoose = require('mongoose')
var _ = require('lodash')
var ObjectId = mongoose.Types.ObjectId

// how is migration gonna work?

jobber = require('./jobber.js')(function (e) {

	var KarmaService = require('src/core/karma')
	var User = mongoose.model("User");

	User.find({}, function (err, docs) {
		async.map(docs, function (user, done) {
			user.slug = [user.username];
			console.log("User "+user.name+" → "+user.slug)
			user.save(done);
		}, function (err, results) {
			e.quit();
		})
	});

}).start()

var async = require('async')
var mongoose = require('mongoose')
var _ = require('lodash')
var ObjectId = mongoose.Types.ObjectId

// how is migration gonna work?

jobber = require('./jobber.js')(function (e) {

	var KarmaService = require('src/core/karma')
	var User = mongoose.model("Resource").model("User");

	User.find({ avatar_url: "https://graph.facebook.com/luizfelipe.gomes.37/picture" }, function (err, docs) {

		async.map(docs, function(user, done) {
			console.log("Redoing user", user.name, user.avatar_url)
			user.avatar_url = "https://graph.facebook.com/"+user.facebook_id+"/picture";
			user.save(function () {
				console.log("OK?")
			});
		}, function (err, results) {
			e.quit(err)
		});
	});
}).start()
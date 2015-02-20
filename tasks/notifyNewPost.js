
var async = require('async')
var mongoose = require('mongoose')
var _ = require('lodash')
var ObjectId = mongoose.Types.ObjectId

// how is migration gonna work?

jobber = require('./lib/jobber.js')(function (e) {

	var fbService = require('app/services/fb')
	// var User = mongoose.model("User");
	var Post = mongoose.model("Post");

	var index = 0;
	function workUser (user, done) {
		// console.log("Redoing user", user.name, user.meta.last_access)

		Post.count({ 'created_at': { $gt: user.meta.last_access } }, function (err, count) {
			if (err)
				throw err;
			if (count > 17) {
				return done();
			}

			var spaces = user.name;

			// if ([''].indexOf(user.username) !== -1) {
			// if (true) {
				// if (count==1)
				// 	var text = "Existe uma nova publicação para você no QI Labs.";
				// else
				// 	var text = "Existem "+count+" novas publicações para você no QI Labs.";
				// console.log(count+'.', user.name, '\t\t', new Date(user.meta.last_access), '#'+(++index));
				// console.log(text)
				// fbService.notifyUser(user, text, function (err, d) {
				// 	console.log(arguments)
				// 	done();
				// })
			// }
		});
	}

	// var targetUserId = process.argv[2]
	// if (targetUserId) {
	// 	User.findOne({_id: targetUserId}, function (err, user) {
	// 		workUser(user, e.quit)
	// 	});
	// } else {
	// 	console.warn("No target user id supplied. Doing all.");
	// 	User.find({}, function (err, users) {
	// 		async.map(users, workUser, e.quit)
	// 	});
	// }
}).start()
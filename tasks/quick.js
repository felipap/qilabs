
var async = require('async')
var mongoose = require('mongoose')
var _ = require('lodash')
var ObjectId = mongoose.Types.ObjectId

jobber = require('./jobber.js')(function (e) {

	Post = mongoose.model('Post');

	Post.find({ participations: { $ne: null } }, function (err, posts) {

		async.map(posts.slice(0,1), function (post, done) {
			var participations = post.participations.slice();
			console.log('post', participations)
			post.participations = [];
			post.update({ participations: participations });
			post.save(function () {
				console.log("SAVED?", arguments)
				console.log(post)
				done();
			})
		}, function (err, results) {
			e.quit();
		});
	});

}).start()

var async = require('async')
var mongoose = require('mongoose')
var _ = require('lodash')
var ObjectId = mongoose.Types.ObjectId

// how is migration gonna work?

jobber = require('./lib/jobber.js')(function (e) {

	var InboxService = require('app/services/inbox')
	var User = mongoose.model("User");
	var Post = mongoose.model("Post");
	var Inbox = mongoose.model("Inbox");
	var Follow = mongoose.model("Follow");

	function workFollowee (user, done) {
		console.log("Redoing user", user.name)

		function getFollowers (cb) {
			user.getFollowersIds(function (err, doc) {
				cb(doc)
			})
		}

		Inbox.remove({
			author: user.id,
		}, function (err, docs) {
			console.log('Reset for', user.id, err)
			getFollowers(function (followers) {
				followers.push(user.id)
				Post.find({ 'author.id': user.id }, function (err, docs) {
					async.map(docs, function (post, done) {
						async.map(followers, function (follower, done) {
							console.log('inboxing post \''+post.content.title+'\' from '+user.name+' to user '+follower)
							var inbox = new Inbox({
								resource: ''+post.id,
								recipient: ''+follower,
								lab: ''+post.lab,
								type: 'Post',
								author: user.id,
								dateSent: post.created_at,
							})
							inbox.save(function (err) {
								if (err)
									console.log('err', err)
								done()
							})
							// console.log(inbox)
						}, function (err) {
							if (err) throw err;
							done();
						})
					}, function (err, results) {
						done()
					})
				})
			})
		})


	}

	var targetUserId = process.argv[2]
	if (targetUserId) {
		User.findOne({_id: targetUserId}, function (err, user) {
			workFollowee(user, e.quit)
		});
	} else {
		console.warn("No target user id supplied. Doing all.");
		User.find({}, function (err, users) {
			async.map(users, workFollowee, e.quit)
		});
	}
}).start()
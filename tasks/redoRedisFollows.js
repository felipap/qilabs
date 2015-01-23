
var async = require('async')
var mongoose = require('mongoose')


jobber = require('./jobber.js')(function (e) {
	redis = require('../app/config/redis.js')
	var User = mongoose.model('User')

	function workUser (user, done) {
		// user.getFollowersIds(function (err, ids) {
		user.getFollowingIds(function (err, followingIds) {
			user.getFollowersIds(function (err, followersIds) {

				console.log('Redoing user', user.name)
				console.log('followingIds', followingIds)
				var q = redis.multi()
				q.del(user.getCacheField('Following'))
				q.del(user.getCacheField('Followers'))

				if (followingIds.length)
					q.sadd(user.getCacheField('Following'), followingIds)
				if (followersIds.length)
					q.sadd(user.getCacheField('Followers'), followersIds)

				q.exec(function (err, replies) {
					if (err)
						console.log(err, followingIds, followersIds)
					console.log("MULTI got " + replies.length + " replies");
					replies.forEach(function (reply, index) {
					console.log("Reply " + index + ": " + reply.toString());
					});
					done();
				})
			});
		});
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
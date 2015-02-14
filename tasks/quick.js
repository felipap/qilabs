
var async = require('async')
var mongoose = require('mongoose')
var _ = require('lodash')

jobber = require('./jobber.js')(function (e) {
	var redis = require('app/config/redis')
	var User = mongoose.model('User')

	function workUser (user, done) {
		nfollowers = nfollowing = 0
		async.parallel [
			(cb) -> Follow.count { follower: @.id },
							(err, count) -> nfollowing = count; cb()
			(cb) -> Follow.count { followee: @.id },
							(err, count) -> nfollowers = count; cb()
			(cb) ->
		], (err) ->
			console.log 'Name: '+user.name+' ('+user.id+')'
			console.log '# Followers: '+nfollowers
			console.log '# Following: '+nfollowing
			console.log '\n'
			// redis.hmset(user.getCacheField('Profile'), {
			// 	nfollowers: user.stats
			// })
			done()
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
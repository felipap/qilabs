
var async = require('async')
var mongoose = require('mongoose')
var _ = require('lodash')


jobber = require('./lib/jobber.js')(function (e) {
	var notification2 = require('app/services/notification2')
	var User = mongoose.model('User')
	var Follow = mongoose.model('Follow')

	User.findOne({ username: 'felipe' }, (err, user) => {
		User.findOne({ username: 'michelle' }, (err, user2) => {
			Follow.findOne({ followee: user._id, follower: user2._id }, (err, follow) => {
			// Follow.findOne({ followee: user._id }, (err, follow) => {
				notification2.undo(user2, user, 'Follow', { follow: follow }, function () {
					console.log('FINALLY!', arguments)
					e.quit();
				})
			})
		})
	})

	// User.findOne({ username: 'felipe' }, (err, user) => {
	// 	notification2.undo(user, user, 'Welcome', {}, function () {
	// 		console.log('FINALLY!', arguments)
	// 		e.quit();
	// 	})
	// })

	// workUser = (user, done) ->
	// 	// if user.profile.bgUrl is '/static/images/rio.jpg'
	// 	// redis.hget [User.CacheFields.Profile.replace(/{id}/, user.id), 'nposts'],
	// 	// (err, num) ->
	// 	// 	if parseInt(num)
	// 	// 		console.log user.name
	// 	// 		console.log parseInt(num)
	// 	// 		console.log user.profile.bgUrl, '\n'
	// 	// 		done()
	// 	// 	else
	// 	// 		user.update { $unset: { 'profile.bgUrl': 1 } }, done

	// targetUserId = process.argv[2]
	// if targetUserId
	// 	User.findOne { _id: targetUserId }, (err, user) ->
	// 		workUser user, e.quit
	// else
	// 	console.warn 'No target user id supplied. Doing all.'
	// 	User.find {}, (err, users) ->
			// async.map users, workUser, e.quit
}).start()
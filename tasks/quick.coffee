
async = require('async')
mongoose = require('mongoose')
_ = require('lodash')

jobber = require('./lib/jobber.js')((e) ->
	redis = require('app/config/redis')
	User = mongoose.model('User')

	workUser = (user, done) ->
		# if user.profile.bgUrl is '/static/images/rio.jpg'
		redis.hget [User.CacheFields.Profile.replace(/{id}/, user.id), 'nposts'],
		(err, num) ->
			if parseInt(num)
				console.log user.name
				console.log parseInt(num)
				console.log user.profile.bgUrl, '\n'
				done()
			else
				user.update { $unset: { 'profile.bgUrl': 1 } }, done

	targetUserId = process.argv[2]
	if targetUserId
		User.findOne { _id: targetUserId }, (err, user) ->
			workUser user, e.quit
	else
		console.warn 'No target user id supplied. Doing all.'
		User.find {}, (err, users) ->
			async.map users, workUser, e.quit
).start()
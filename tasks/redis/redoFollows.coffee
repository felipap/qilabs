
async = require('async')
mongoose = require('mongoose')

jobber = require('./lib/jobber.js')((e) ->

	redis = require('../app/config/redis.js')
	User = mongoose.model('User')

	workUser = (user, done) ->

		user.getFollowingIds (err, followingIds) ->
			user.getFollowersIds (err, followersIds) ->

				console.log 'Redoing user', user.name
				console.log 'followingIds', followingIds

				q = redis.multi()
				q.del user.getCacheField('Following')
				q.del user.getCacheField('Followers')

				if followingIds.length
					q.sadd user.getCacheField('Following'), followingIds
				if followersIds.length
					q.sadd user.getCacheField('Followers'), followersIds

				q.exec (err, replies) ->
					if err
						console.log err, followingIds, followersIds
					console.log "MULTI got " + replies.length + " replies"
					replies.forEach (reply, index) ->
						console.log "Reply " + index + ": " + reply.toString()
					done()

	targetUserId = process.argv[2]
	if targetUserId
		User.findOne { _id: targetUserId }, (err, user) ->
			workUser user, e.quit
	else
		console.warn 'No target user id supplied. Doing all.'
		User.find {}, (err, users) ->
			async.map users, workUser, e.quit

).start()
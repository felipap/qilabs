
async = require('async')
mongoose = require('mongoose')
_ = require('lodash')

jobber = require('./lib/jobber.js')((e) ->
	redis = require('app/config/redis')
	User = mongoose.model 'User'
	Follow = mongoose.model 'Follow'
	Post = mongoose.model 'Post'

	workUser = (user, done) ->
		status = {
			bio: user.profile.bio
			home: user.profile.home
			location: user.profile.location
			name: user.name
			avatar: user.avatarUrl
			karma: user.stats.karma
			username: user.username
		}
		async.parallel [
			(cb) -> Follow.count { follower: user.id }, (err, count) ->
				status.nfollowing = count
				cb()
			(cb) -> Follow.count { followee: user.id }, (err, count) ->
				status.nfollowers = count
				cb()
			(cb) -> Post.count { 'author.id': user.id }, (err, count) ->
				status.nposts = count
				cb()
		], (err) ->
			console.log 'Name: '+user.name+' ('+user.id+')'
			console.log JSON.stringify(status, undefined, 2)
			console.log '\n'
			redis.hmset(user.getCacheField('Profile'), status, done)

	targetUserId = process.argv[2]
	if targetUserId
		User.findOne { _id: targetUserId }, (err, user) ->
			workUser(user, e.quit)
	else
		console.warn 'No target user id supplied. Doing all.'
		User.find {}, (err, users) ->
			async.map(users, workUser, e.quit)

).start()
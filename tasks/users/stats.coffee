
# tasks/users/stats
# Refresh user stats.

async = require 'async'
_ = require 'lodash'
mongoose = require 'mongoose'

jobber = require('../jobber.js')((e) ->

	Post = mongoose.model 'Post'
	User = mongoose.model 'User'
	Follow = mongoose.model 'Follow'

	workUser = (user, cb) ->
		console.log "Refreshing status for #{user.id} aka #{user.username}"
		Follow.count { follower: user, followee: { $ne: null } }, (err, cfollowing) ->
			Follow.count { followee: user, follower: { $ne: null } }, (err, cfollowers) ->
				Post.find { 'author.id': ''+user.id }, (err, posts) ->
					if err
						console.error(err)

					user.stats.following = cfollowing
					user.stats.followers = cfollowers
					# user.stats.posts = posts.length
					# votes = 0
					# for post in posts
					# 	votes += post.votes.length
					# user.stats.votes = votes
					console.log "Saving #{user.username}'s new stats: ", user.stats
					user.save () ->
						cb()

	targetUserId = process.argv[2]
	if targetUserId
		User.findOne {_id: targetUserId}, (err, user) ->
			workUser(user, e.quit)
	else
		console.warn "No target user id supplied."
		User.find {}, (err, users) ->
			async.map users, workUser, e.quit

).start()

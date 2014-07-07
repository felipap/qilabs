
# users/stats.coffee
# Refresh user stats.

async = require 'async'
_ = require 'underscore'

jobber = require('../jobber.js')((e) ->
	mongoose = require('../../src/config/mongoose.js')

	Resource = mongoose.model 'Resource'
	Post = Resource.model 'Post'
	User = Resource.model 'User'
	Follow = Resource.model 'Follow'

	targetUserId = process.argv[2]
	if not targetUserId
		console.warn "No target user id supplied."
		e.quit(1)

	console.log "Refreshing status for #{targetUserId}"

	User.findOne {_id: targetUserId}, (err, user) ->
		Follow.count {follower: user, followee: {$ne: null}}, (err, cfollowing) ->
			Follow.count {followee: user, follower: {$ne: null}}, (err, cfollowers) ->
				Post.find {author: user, parentPost: null}, (err, posts) ->
					user.stats.following = cfollowing
					user.stats.followers = cfollowers
					user.stats.posts = posts.length
					votes = 0
					for post in posts
						votes += post.votes.length
					user.stats.votes = votes
					console.log "Saving new user stats: ", user.stats
					user.save () ->
						e.quit()

).start()


# src/core/notification
# for QI Labs
# by @f03lipe

mongoose = require 'mongoose'
async = require 'async'
_ = require 'lodash'
assert = require 'assert'

please = require 'src/lib/please.js'
logger = require('src/core/bunyan')({ service: 'NotificationService '})

##

Resource = mongoose.model 'Resource'
ObjectId = mongoose.Schema.ObjectId

User = mongoose.model 'User'
Notification = mongoose.model 'Notification'
NotificationList = mongoose.model 'NotificationList'

RedoUserNotification = (user, cb) ->
	throw new Error("You wish.")

#
#

Handlers = {
	'PostUpvote': (data) ->
		return (post, cb) ->
			please.args({$isModel:'Post'},'$isFn')
			# Find post's author and notify him.
			User.findOne {_id: ''+post.author.id }, (err, parentAuthor)  ->
				if parentAuthor and not err
					notifyUser agent, parentAuthor, {
						type: Types.PostUpvote
						url: post.path
						resources: [post.id]
					}, (err, res) ->
						if err
							console.warn 'ERR:', err, err and err.errors
							cb(false)
				else
					console.warn("err: #{err} or parentAuthor (id:#{post.author.id}) not found")
					cb(true)
	'PostComment': (data) ->
		return (commentObj, parentObj, cb) ->
			please.args({$isModel:'Comment'},{$isModel:'Post'},'$isFn')
			cb ?= ->
			if ''+parentObj.author.id is ''+agent.id
				return cb(false)
			parentAuthorId = ''+parentObj.author.id
			# Find author of parent post and notify him.
			User.findOne {_id: parentAuthorId}, (err, parentAuthor) ->
				if parentAuthor and not err
					notifyUser agent, parentAuthor, {
						type: Types.PostComment
						url: commentObj.path
						resources: [parentObj.id, commentObj.id]
					}, cb
				else
					console.warn("err: #{err} or parentAuthor (id:#{parentAuthorId}) not found")
	'NewFollower': (data) ->
		return (followerObj, followeeObj, follow, cb) ->
			# assert
			cb ?= ->
			# Find and delete older notifications from the same follower.
			cb()
			Notification.findOne {
				type:Types.NewFollower,
				agent:followerObj,
				recipient:followeeObj
				}, (err, doc) ->
					if doc #
						doc.remove(()->)
					notifyUser followerObj, followeeObj, {
						type: Types.NewFollower
						# resources: []
						url: followerObj.path
}

##########################################################################################
##########################################################################################

module.exports = new NotificationService
module.exports.RedoUserNotification = RedoUserNotification
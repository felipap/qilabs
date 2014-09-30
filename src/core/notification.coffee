
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
	'ReplyComment': (data) ->
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
					}, cb
}

##########################################################################################
##########################################################################################

class NotificationService

	Types: Notification.Types

	createList = (user, cb) ->
		please.args({$isModel:'User'}, '$isFn')

		logger.debug('Creating notification list for user %s', user._id)
		list = new NotificationList {
			user: user._id
		}
		list.save (err, list) ->
			if err
				return cb(err)
			cb(false, list)

	notifyUser = (agent, recipient, data, cb) ->
		please.args {$isModel:'User'},{$isModel:'User'},{$contains:['url','type']},'$isFn'

		addNotificationToList = (list) ->
			please.args({$isModel:NotificationList})

			# Using new Notification({...}) might lead to RangeError on server.
			_notification = list.docs.create({
				agent: agent._id
				agentName: agent.name
				recipient: recipient._id
				type: data.type
				url: data.url
				thumbnailUrl: data.thumbnailUrl or agent.avatarUrl
				resources: data.resources || []
			})

			# The expected object (without those crazy __parentArray, __$, ... properties)
			notification = new Notification(_notification)
			logger.debug('addNotificationToList(%s) with list(%s)', notification._id, list._id)

			# Atomically push comment to commentTree
			# BEWARE: the comment object won't be validated, since we're not pushing it to the tree object and saving.
			# logger.debug('pre:findOneAndUpdate _id: %s call', parent.comment_tree)
			# CommentTree.findOneAndUpdate { _id: tree._id }, {$push: { docs : comment }}, (err, tree) ->

			# Non-atomically saving notification to notification list
			# Atomic version is leading to "RangeError: Maximum call stack size exceeded" on heroku.
			list.docs.push(_notification) # Push the weird object.
			list.save (err) ->
				if err
					logger.error('Failed to push notification to NotificationList', err)
					return cb(err)
				# logger.info("Notification pushed to list", recipient.name, list.docs)
				cb(null, notification)

		NotificationList.findOne { user: recipient._id }, (err, list) ->
			if err
				logger.error(err, 'Failed trying to find notification list for user(%s)', recipient._id)
				return cb(err)
			if not list
				createList recipient, (err, list) ->
					if err
						logger.error(err, 'Failed to create list for user(%s)', recipient._id)
						return cb(err)
					if not list
						throw new Error('WTF! list object is null')
					addNotificationToList(list)
			else
				addNotificationToList(list)

	# PUBLIC BELOW

	constructor: () ->
		for type of @Types
			assert typeof Handlers[type] isnt 'undefined',
				"Handler for Karma of type #{type} is not registered."
			assert typeof Handlers[type] is 'function',
				"Handler for Karma of type #{type} is not a function."

	create: (agent, type, data, cb = () ->) ->
		please.args {$isModel:'User'}
		assert type of @Types, "Unrecognized Karma Type."

	invalidate = (resource, callback) ->
		# NotificationList.remove { 'docs.' }, (err, results) ->
		# Notification.remove {
		# 	# type:Notification.Types.NewFollower,
		# 	# agent:@follower,
		# 	# recipient:@followee,
		# }, (err, result) ->
		# 	console.log "Removing #{err} #{result} notifications on unfollow."
		# 	next()
		callback()

module.exports = new NotificationService
module.exports.RedoUserNotification = RedoUserNotification

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
NotificationChunk = mongoose.model 'NotificationChunk'

RedoUserNotification = (user, cb) ->
	throw new Error("You wish.")

Handlers = {
	'ReplyComment': (data) ->
	'PostComment': (agent, data) ->
		please.args {$isModel:'User'}, {parent:{$isModel:'Post'},comment:{$isModel:'Comment'}}
		assert agent isnt data.parent.author.id, "I refuse to notify the parent's author"

		return {
			identifier: 'postcomment_'+data.parent._id
			resource: data.parent._id
			type: 'PostComment'
			path: data.parent.path # data.comment.path
			object: {
				name: data.parent.content.title
				identifier: data.parent._id
				lab: data.parent.subject
			}
			receiver: data.parent.author.id
			instances: [{
				name: agent.name
				path: agent.path
				identifier: agent._id
				created_at: Date.now()
			}]
		}
	'NewFollower': (agent, data) ->
		please.args {$isModel:'User'}, {follow:{$isModel:'Follow'},followee:{$isModel:'User'}}

		return {
			identifier: 'newfollower'
			resource: data.follow._id
			type: 'NewFollower'
			# path: data.parent.path # data.comment.path
			object: {
				# name: data.parent.content.title
				# identifier: data.parent._id
				# lab: data.parent.subject
			}
			receiver: data.followee._id
			instances: [{
				path: agent.path
				identifier: agent._id
				created_at: Date.now()
				object: {
					name: agent.name
					avatarUrl: agent.avatarUrl
				}
			}]
		}
}

##########################################################################################
##########################################################################################

class NotificationService

	Types: Notification.Types

	# Fix a situtation when the last object in user.notification_chunks doesn't exist.
	fixAndGetNotificationChunk = (user, cb) ->
		please.args {$isModel:'User'}, '$isFn'
		# Identify next logs.
		fixLogger = logger.child({ attemptFix: Math.ceil(Math.random()*100) })
		fixLogger.error('[0] User(%s) supposed NotificationChunk(%s) doesn\'t exist.
			Attempting to fix it.', user._id,
			user.notification_chunks[user.notification_chunks.length-1])
		# Find NotificationChunks related to the user.
		NotificationChunk
			.find({ user: user._id })
			.sort('updated_at')
			.select('updated_at _id')
			.exec (err, docs) ->
				if err
					fixLogger.error(err, 'Failed finding NotificationChunks for user(%s)', user._id)
					throw err
				if docs.length
				# There are real chunks related to that user. These may or may not have been in
				# the user.notification_chunks array.
					fixLogger.error('[1] %s NotificationChunks found for user.', docs.length)
					# Update user's notification_chunks with correct data.
					console.log(_.pluck(docs, '_id'))
					User.findOneAndUpdate { _id: user._id },
					{ $set: { notification_chunks: _.pluck(docs, '_id') } },
					(err, doc) ->
						if err
							fixLogger.error(err, '[3] Attempted fix: Failed to
								update notification_chunks for user(%s).', user._id)
							return
						fixLogger.error('[3] Attempted fix: Fixed notification_chunks attribute
							for user(%s).', user._id, doc.notification_chunks)
						# Get the last chunk (all of it, now)
						NotificationChunk.findOne { _id: docs[docs.length-1] }, (err, chunk) ->
							if err or not doc
								throw err or new Error('Kill yourself. Really.')
							cb(null, chunk)
				else
				# No chunks related to the user exist? WTF
					fixLogger.error("[1] No NotificationChunk found for user. Creating.")
					newAttr = _.pluck(docs, '_id')
					createNotificationChunk user, false, (err, chunk) ->
						if err
							fixLogger.error(err, '2. Failed to create chunk for user(%s)', user._id)
							return cb(err)
						if not chunk
							throw new Error('WTF! created NotificationChunk object is
							 null')
						cb(null, chunk)

	createNotificationChunk = (user, push=false, cb) ->
		please.args {$isModel:'User'}, {$is:false}, '$isFn'
		logger.debug('Creating notification chunk for user %s', user._id)
		chunk = new NotificationChunk {
			user: user._id
		}
		chunk.save (err, chunk) ->
			if err
				logger.error(err, 'Failed to create notification chunk for user(%s)', user._id)
				return cb(err)
			if push
				action = { $push: { notification_chunks: chunk._id } }
			else
				action = { notification_chunks: [chunk._id] }
			User.findOneAndUpdate { _id: user._id }, action, (err) ->
				if err
					logger.error(err,
						'Failed to save notification_chunks (=%s) attribute to user (%s)',
						chunk._id, user._id)
			cb(null, chunk)

	getUserNotificationChunk = (user, cb) ->
		please.args {$isModel:'User'}, '$isFn'
		#
		if user.notification_chunks and user.notification_chunks.length
			# notification_chunks is an array of NotificationChunks objects: bundles of
			# notification updates, the last of which is currently active and holds the latest
			# updates.
			latest = user.notification_chunks[user.notification_chunks.length-1]
			NotificationChunk.findOne { _id: latest }, (err, chunk) ->
				if err
					logger.error(err, 'Failed finding NotificationChunk(%s) for user(%s)',
						latest, user._id)
					throw err
				if chunk
					return cb(null, chunk)
				else
					# OPS! This shouldn't be happening.
					# Log as error and try to fix it.
					# Don't try other ids in notification_chunks.
					fixAndGetNotificationChunk(user, cb)
		else
			# NotificationChunks must be created when they're needed for the first time.
			logger.debug("User (%s) has no notification_chunks.", user._id)
			createNotificationChunk user, false, (err, chunk) ->
				if err
					logger.error(err, 'Failed to create chunk for user(%s)', user._id)
					return cb(err)
				if not chunk
					throw new Error('WTF! created NotificationChunk object is null')
				cb(null, chunk)

	addNotificationToChunk = (item, chunk, cb) ->
		please.args {$isModel:'Notification'}, {$isModel:'NotificationChunk'}, '$isFn'
		NotificationChunk.findOneAndUpdate {
			_id: chunk._id
		}, {
			$push: { items: item }
			$set: {
				updated_at: Date.now()
			}
		}, (err, doc) ->
			cb(err, doc)

	updateNotificationInChunk = (item, chunk, cb) ->
		please.args {$isModel:'Notification'}, {$isModel:'NotificationChunk'}, '$isFn'
		console.log("UPDATE")
		NotificationChunk.findOneAndUpdate {
			_id: chunk._id
			'items.identifier': item.identifier
			$ne: { 'items.instances.identifier': item.instances[0].identifier }
		}, {
			$set: {
				updated_at: Date.now()
				'items.$.updated_at': Date.now()
				'items.$.object': item.object # Update object, just in case
			},
			$push: {
				'items.$.instances': item.instances[0]
			},
			$inc: {
				'items.$.multiplier': 1,
			}
		}, (err, doc) ->
			cb(err, doc)

	# PUBLIC BELOW

	constructor: () ->
		for type of @Types
			assert typeof Handlers[type] isnt 'undefined',
				"Handler for Notification of type #{type} is not registered."
			assert typeof Handlers[type] is 'function',
				"Handler for Notification of type #{type} is not a function."

	create: (agent, type, data, cb = () ->) ->
		please.args {$isModel:'User'}
		assert type of @Types, "Unrecognized Notification Type."

		object = Handlers[type](agent, data)
		# logger.debug("Notification data", object)
		console.log(agent, object)

		User.findOne { _id: object.receiver }, (err, user) ->
			if err
				throw err
			if not user
				return cb(new Error("User "+object.receiver+" not found."))

			onAdded = (err, doc) ->
				User.findOneAndUpdate { _id: object.receiver },
				{ 'meta.last_received_notification': Date.now() }, (err, doc) ->
					if err
						logger.error("Failed to update user meta.last_received_notification")
						throw err
					logger.info("User %s(%s) meta.last_received_notification updated",
						doc.name, doc.id)
					cb(null)

			getUserNotificationChunk user, (err, chunk) ->
				# logger.debug("Chunk found (%s)", chunk._id)
				same = _.findWhere(chunk.items, { identifier: object.identifier })
				if same # Notification Object for resource already exists. Aggregate!
					# logger.debug("Aggregating to NotificationChunk", object.instances[0])
					logger.debug("AGGREGATE")
					item = new Notification(object)
					updateNotificationInChunk item, chunk, (err, doc) ->
						# console.log("FOI????", arguments)
						onAdded(err, doc)
				else
					item = new Notification(object)
					addNotificationToChunk item, chunk, (err, doc) ->
						# console.log("FOI????", arguments)
						onAdded(err, doc)

	invalidate = (resource, callback) ->
		# NotificationChunk.remove { 'docs.' }, (err, results) ->
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
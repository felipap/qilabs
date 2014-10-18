
# src/core/notification
# for QI Labs
# by @f03lipe

mongoose = require 'mongoose'
async = require 'async'
_ = require 'lodash'
assert = require 'assert'

please = require 'src/lib/please.js'
logger = require('src/core/bunyan')({ service: 'NotificationService' })

##

Resource = mongoose.model 'Resource'
ObjectId = mongoose.Schema.ObjectId

User = mongoose.model 'User'
Notification = mongoose.model 'Notification'
NotificationChunk = mongoose.model 'NotificationChunk'

# Throw Mongodb Errors Right Away
TMERA = (call) ->
	if typeof call is 'string'
		message = [].slice.call(arguments)
		return (call) ->
			return (err) ->
				if err
					message.push(err)
					logger.error.apply(logger, message)
					console.trace()
					throw err
				call.apply(this, [].slice.call(arguments, 1))
	else
		return (err) ->
			if err
				logger.error("TMERA:", err)
				console.trace()
				throw err
			call.apply(this, [].slice.call(arguments, 1))

Handlers = {
	'NewFollower': {
		instance: (agent, data) ->
			please {$model:'User'}, {follow:{$model:'Follow'},followee:{$model:'User'}}

			return {
				path: agent.path
				key: 'newfollower_'+data.followee._id+'_'+agent._id
				created_at: data.follow.dateBegin
				updated_at: data.follow.dateBegin
				object: {
					follow: data.follow._id
					name: agent.name
					avatarUrl: agent.avatarUrl
				}
			}
		item: (data) ->
			please {followee:{$model:'User'}}

			return {
				identifier: 'newfollower_'+data.followee._id
				resource: data.followee._id
				type: 'NewFollower'
				object: { }
				receiver: data.followee._id
				instances: []
			}
	},
	'PostComment': {
		instance: (agent, data) ->
			please {$model:'User'}, {parent:{$model:'Post'},comment:{$model:'Comment'}}
			assert agent isnt data.parent.author._id, "I refuse to notify the parent's author"

			return {
				object: {
					name: data.comment.author.name
					path: data.comment.author.path
					date: data.comment.created_at
					avatarUrl: data.comment.author.avatarUrl
					commentId: data.comment._id
				}
				path: agent.path
				key: 'post_comment:tree:'+data.comment.tree+':agent:'+agent._id
				created_at: data.comment.created_at
			}
		item: (data) ->
			please {parent:{$model:'Post'}}

			return {
				identifier: 'postcomment_'+data.parent._id
				resource: data.parent._id
				type: 'PostComment'
				path: data.parent.path # data.comment.path
				object: {
					name: data.parent.content.title
					parentType: data.parent.type
					thumbnail: data.parent.content.image or data.parent.content.link_image
					id: data.parent._id
					lab: data.parent.subject
				}
				receiver: data.parent.author.id
				instances: []
			}
	},
	'CommentReply': {
		instance: (agent, data) ->
			please {$model:'User'},
				{parent:{$model:'Post'},replied:{$model:'Comment'},comment:{$model:'Comment'}}
			assert agent isnt data.parent.author._id, "I refuse to notify the parent's author"

			return {
				object: {
					name: data.comment.author.name
					path: data.comment.author.path
					date: data.comment.created_at
					excerpt: data.comment.content.body.slice(0,100)
					avatarUrl: data.comment.author.avatarUrl
					commentId: data.comment._id
				}
				path: agent.path
				key: 'post_comment:tree:'+data.comment.tree+':replied:'+data.replied._id+':agent:'+agent._id
				created_at: data.comment.created_at
			}
		item: (data) ->
			please {parent:{$model:'Post'},replied:{$model:'Comment'}}

			return {
				identifier: 'commentreply:'+data.replied._id
				resource: data.replied._id
				type: 'CommentReply'
				path: data.replied.path
				object: {
					title: data.parent.content.title
					excerpt: data.replied.content.body.slice(0,100)
					parentType: data.parent.type
					thumbnail: data.parent.content.image or data.parent.content.link_image
					id: data.parent._id
					lab: data.parent.subject
				}
				receiver: data.replied.author.id
				instances: []
			}
	}
}

Generators = {
	CommentReply: (user, cb) ->
		logger = logger.child({ generator: 'CommentReply' })
		Post = mongoose.model('Resource').model('Post')
		User = mongoose.model('User')
		CommentTree = mongoose.model('CommentTree')
		Comment = mongoose.model('Comment')

		Post
			.find { }
			.populate { path: 'comment_tree', model: CommentTree }
			.exec TMERA (docs) ->
				items = []

				# Loop through all posts from that user
				forEachPost = (post, done) ->
					if not post.comment_tree or not post.comment_tree.docs.length
						# logger.debug("No comment_tree or comments for post '%s'", post.content.title)
						return done()
					author_comments = _.filter(post.comment_tree.docs, (i) -> i.author.id is user.id)
					if not author_comments.length
						return done()
					console.log('author comments', author_comments.length, post.content.title)

					forEachComment = (comment, done) ->
						replies_to_that = _.filter(post.comment_tree.docs,
							(i) -> ''+i.replies_to is ''+comment.id)
						if not replies_to_that.length
							return done()

						skin = Handlers.CommentReply.item({
							parent: _.extend(post.toObject(), { comment_tree: post.comment_tree._id }),
							replied: new Comment(comment)
						})
						instances = []
						uniqueAuthors = {}

						forEachReply = (reply, done) ->
							if uniqueAuthors[reply.author.id]
								return done()
							uniqueAuthors[reply.author.id] = true

							User.findOne { _id: reply.author.id }, TMERA (cauthor) ->
								if not cauthor
									logger.error("Author of comment %s of comment_tree %s not found.",
										comment.author.id, post.comment_tree)
									return done()

								console.log("generating instance", reply.content.body.slice(0,100))
								inst = Handlers.CommentReply.instance(cauthor, {
									# Generate unpopulated parent
									parent: _.extend(post, { comment_tree: post.comment_tree._id }),
									# Generate clean comment (without those crazy subdoc attributes like __$)
									replied: new Comment(comment)
									comment: new Comment(reply)
								})
								instances.push(inst)
								done()

						async.map replies_to_that, forEachReply, (err) ->
							if err
								throw err
							if not instances.length
								return done()
							oldest = _.min(instances, 'created_at')
							latest = _.max(instances, 'created_at')
							console.log('oldest', oldest.created_at)
							items.push(new Notification(_.extend(skin, {
								instances: instances
								multiplier: instances.length
								updated_at: latest.created_at
								created_at: oldest.created_at
							})))
							done()

					async.map author_comments, forEachComment, (err) ->
						if err
							throw err
						console.log "forEachComment"
							# logger.warn("Post has comments but no instance was returned.")
						done()

				async.map docs, forEachPost, (err) ->
					if err
						throw err
					console.log "forEachPost"
					cb(null, items)

	PostComment: (user, cb) ->
		logger = logger.child({ generator: 'PostComment' })
		Post = mongoose.model('Resource').model('Post')
		User = mongoose.model('User')
		CommentTree = mongoose.model('CommentTree')
		Comment = mongoose.model('Comment')

		Post
			# .find { 'author.id': user._id, type: Post.Types.Note }
			.find { 'author.id': user._id }
			.populate { path: 'comment_tree', model: CommentTree }
			.exec TMERA (docs) ->
				notifications = []

				forEachPost = (post, done) ->
					instances = []
					if not post.comment_tree or not post.comment_tree.docs.length
						logger.debug("No comment_tree or comments for post '%s'", post.content.title)
						return done()
					skin = Handlers.PostComment.item({
						# Send in unpopulated parent
						parent: _.extend(post.toObject(), { comment_tree: post.comment_tree._id }),
					})
					uniqueAuthors = {}
					# Loop comment_tree entries
					async.map post.comment_tree.docs, ((comment, done) ->
						# Ignore replies to other comments, comments the author made, and authors
						# we already created instances for.
						if comment.thread_root or
						comment.author.id is post.author.id or # 'O
						uniqueAuthors[comment.author.id]
							return done()

						uniqueAuthors[comment.author.id] = true

						User.findOne { _id: comment.author.id }, TMERA (cauthor) ->
							if not cauthor
								logger.error("Author of comment %s of comment_tree %s not found.",
									comment.author.id, post.comment_tree)
								return done()

							inst = Handlers.PostComment.instance(cauthor, {
								# Generate unpopulated parent
								parent: _.extend(post, { comment_tree: post.comment_tree._id }),
								# Generate clean comment (without those crazy subdoc attributes like __$)
								comment: new Comment(comment)
							})
							instances.push(inst)
							done()
					), (err) ->
						if not instances.length
							logger.warn("Post has comments but no instance was returned.")
							return done()
						oldest = _.min(instances, 'created_at')
						latest = _.max(instances, 'created_at')
						console.log('oldest', oldest.created_at)
						notifications.push(new Notification(_.extend(skin, {
							instances: instances
							multiplier: instances.length
							updated_at: latest.created_at
							created_at: oldest.created_at
						})))
						done()

				# Loop through all posts from that user
				async.map docs, forEachPost, (err, results) ->
					cb(null, notifications)
	NewFollower: (user, cb) ->
		logger = logger.child({ generator: 'NewFollower' })
		Follow = mongoose.model('Follow')
		User = mongoose.model('User')

		Follow
			.find { 'followee': user._id }
			.populate { path: 'follower', model: User }
			.exec TMERA (docs) ->
				if docs.length is 0
					return cb(null, [])

				# console.log('docs', docs)
				instances = []
				skin = Handlers.NewFollower.item({ followee: user })
				docs.forEach (follow) ->
					# Get unpopulated follow
					ofollow = new Follow(follow)
					ofollow.follower = follow.follower._id
					data = { follow: ofollow, followee: user }
					instances.push(Handlers.NewFollower.instance(follow.follower, data))
				# console.log("INSTANCES",instances)
				oldest = _.min(instances, 'created_at')
				latest = _.max(instances, 'created_at')
				cb(null, [new Notification(_.extend(skin, {
					instances: instances
					multiplier: instances.length
					updated_at: latest.created_at
					created_at: oldest.created_at # Date of the oldest follow
				}))])
}

##########################################################################################
##########################################################################################

# TODO: Update to only remove notifications of the type we're redoing.

# Create all Notifications for a user, then divide them into Chunks if necessary.
RedoUserNotifications = (user, cb) ->
	please {$model:'User'}, '$isFn'

	logger = logger.child({
		domain: 'RedoUserNotifications',
		# user: { name: user.name, id: user._id }
	})

	async.map _.pairs(Generators), ((pair, done) ->
		generator = pair[1]
		logger.info('Calling generator '+pair[0])
		generator user, (err, items) ->
			done(null, items)
	), (err, _results) ->
		# Chew Notifications that we get as the result
		results = _.sortBy(_.flatten(_.flatten(_results)), 'updated_at')
		latest_update = _.max(results, 'updated_at').updated_at or Date.now()

		logger.debug('Creating new NotificationChunk')
		chunk = new NotificationChunk {
			user: user
			items: results
			updated_at: latest_update
		}
		logger.debug('Saving new Chunk', chunk._id)
		chunk.save TMERA (doc) ->
			# console.log("CHUNK", doc)
			logger.debug('Removing old NotificationChunks')
			NotificationChunk.remove {
				user: user._id
				_id: { $ne: chunk._id }
			}, TMERA (olds) ->
				if olds is 0
					logger.error("No notification chunks were removed")
				logger.debug('Saving user notification_chunks')
				User.findOneAndUpdate {
					_id: user._id
				}, {
					notification_chunks: [chunk._id],
					'meta.last_received_notification': latest_update
				}, TMERA (doc) ->
					cb()


##########################################################################################
##########################################################################################

class NotificationService

	Types: Notification.Types

	## Chunk related.

	# Fix a situtation when the last object in user.notification_chunks doesn't exist.
	fixUserAndGetNotificationChunk = (user, cb) ->
		please {$model:'User'}, '$isFn'
		# Identify next logs.
		fixLogger = logger.child({ attemptFix: Math.ceil(Math.random()*100) })
		fixLogger.error('[0] User(%s) supposed NotificationChunk(%s) doesn\'t exist. Attempting
			to fix it.', user._id, user.notification_chunks[user.notification_chunks.length-1])
		# Find NotificationChunks related to the user.
		NotificationChunk
			.find({ user: user._id })
			.sort('updated_at')
			.select('updated_at _id')
			.exec TMERA (docs) ->
				if docs.length
				# There are real chunks related to that user. These may or may not have
				# been in the user.notification_chunks array.
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
		please {$model:'User'}, {$is:false}, '$isFn'
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
		please {$model:'User'}, '$isFn'
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
					fixUserAndGetNotificationChunk(user, cb)
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

	# Instance related.

	###*
	 * Fixes duplicate instances of a NotificationChunk item.
	 * @param  {ObjectId} chunkId			[description]
	 * @param  {String} 	instanceKey	[description]
	###
	fixChunkInstance = (chunkId, instanceKey, cb = () ->) ->
		please '$ObjectId', '$skip', '$isFn'
		console.log "WTF, Programmer???"
		cb()
		return
		jobs.create({}).delay(3000)

	## Item related.

	# Add
	addNewNotificationToChunk = (item, chunk, cb) ->
		please {$model:'Notification'}, {$model:'NotificationChunk'}, '$isFn'
		NotificationChunk.findOneAndUpdate {
			_id: chunk._id
		}, {
			$push: 	{ items: item }
			$set: 	{	updated_at: Date.now() }
		}, TMERA (doc) ->
			cb(null, doc)

	updateNotificationInChunk = (item, instance, chunk, cb) ->
		please {$model:'Notification'}, '$skip', {$model:'NotificationChunk'}, '$isFn'
		# logger.trace("UPDATE", chunk._id, item)

		NotificationChunk.findOneAndUpdate {
			_id: chunk._id
			'items.identifier': item.identifier
			# 'items.instances.key': { $ne: instance.key } # IDK if this does anything
		}, {
			$set: {
				updated_at: Date.now()
				'items.$.updated_at': Date.now()
				'items.$.object': item.object # Update object, just in case
			}
			$inc: { 'items.$.multiplier': 1 }
			$push: { 'items.$.instances': instance }
		}, cb

	# PUBLIC BELOW

	constructor: () ->
		for type of @Types
			assert typeof Handlers[type].instance isnt 'undefined',
				"Handler for instance of Notification of type #{type} is not registered."
			assert typeof Handlers[type].instance is 'function',
				"Handler for instance of Notification of type #{type} is not a function."
			assert typeof Handlers[type].item isnt 'undefined',
				"Handler for item of Notification of type #{type} is not registered."
			assert typeof Handlers[type].item is 'function',
				"Handler for item of Notification of type #{type} is not a function."

	create: (agent, type, data, cb = () ->) ->
		assert type of @Types, "Unrecognized Notification Type."

		object = Handlers[type].item(data)
		object_inst = Handlers[type].instance(agent, data)
		# logger.debug("Notification data", object)

		User.findOne { _id: object.receiver }, TMERA (user) ->
			if not user
				logger.error("Receiver user %s was not found.", object.receiver)
				return cb(new Error("User "+object.receiver+" not found."))

			onAdded = (err, doc) ->
				if err
					return cb(err)

				if not doc
					return cb(null)
				User.findOneAndUpdate { _id: object.receiver },
				{ 'meta.last_received_notification': Date.now() }, (err, doc) ->
					if err
						logger.error("Failed to update user meta.last_received_notification")
						throw err
					logger.info("User %s(%s) meta.last_received_notification updated",
						doc.name, doc.id)
					cb(null)

			getUserNotificationChunk user, (err, chunk) ->
				logger.debug("Chunk found (%s)", chunk._id)
				item = _.findWhere(chunk.items, { identifier: object.identifier })
				if item
				# Notification Object for resource already exists. Aggregate instance!
					# Check if item is already in the item (race condition?)
					console.log('key', object_inst.key)
					console.log(_.pluck(item.instances, 'key'))
					if _.find(item.instances, { key: object_inst.key })
						logger.warn("Instance with key %s was already in chunk %s (user=%s).",
							object_inst.key, chunk._id, chunk.user)
						return cb(null, null) # No object was/should be added

					ninstance = new Notification(object)
					updateNotificationInChunk ninstance, object_inst, chunk, TMERA (doc, info) ->
						# What the fuck happened?
						if not doc
							logger.error("Doc returned from updateNotificationInChunk is null", object,
								object_inst)
							return cb(null, null)

						# Check if doc returned has more than one of the instance we added (likely a
						# race problem).
						item = _.findWhere(doc.items, { identifier: object.identifier })
						try # Hack to use forEach. U mad?
							count = 0
							item.instances.forEach (inst) ->
								if inst.key is object_inst.key
									if count is 1 # This is the second we found
										console.log "ORIGINAL:", object_inst.key
										console.log "SECOND FOUND:", inst.key
										throw new Error("THEHEHEHE")
									count += 1
						catch e
							console.log(e, _.keys(e))
							# More than one instances found
							logger.error("Instance with key %s not unique in chunk %s (user=%s).",
								object_inst.key, chunk._id, chunk.user)
							# Trigger fixChunkInstance
							fixChunkInstance chunk._id, object.identifier, () ->
							return cb(null, null) # As if no object has been added, because

						onAdded(null, doc)
				else
				# Make new instance.
					ninstance = new Notification(_.extend(object, { instances: [object_inst]}))
					addNewNotificationToChunk ninstance, chunk, (err, doc) ->
						if err
							logger.error("Failed to addNewNotificationToChunk", { instance: ninstance })
							return cb(err)
						onAdded(null, doc)

	undo: (agent, type, data, cb = () ->) ->
		assert type of @Types, "Unrecognized Notification Type."

		console.log("UNDO")
		object = Handlers[type].item(data)
		object_inst = Handlers[type].instance(agent, data)
		# logger.trace("Notification data", object)

		User.findOne { _id: object.receiver }, TMERA("Failed to find receiver") (user) ->
			if not user
				return cb(new Error("User "+object.receiver+" not found."))

			count = 0
			onRemovedAll = () ->
					cb(null)

			# Mongo will only take one item at a time in the following update (because $
			# matches only the first array). T'will be necessary to call this until
			# nothing item is removed. (ie. num == 1)
			# see http://stackoverflow.com/questions/21637772
			removeAllItems = () ->
				data = {
					user: user._id
					'items.identifier': object.identifier
					'items.instances.key': object_inst.key
				}
				logger.debug("Attempting to remove. count: #{count}.", data)

				NotificationChunk.update data, {
					$pull: { 'items.$.instances': { key: object_inst.key } }
					$inc: { 'items.$.multiplier': -1 }
				}, TMERA (num, info) ->
					if num is 1
						count += 1
						if count > 1
							logger.error("Removed more than one item: "+count)
						return removeAllItems()
					else
						onRemovedAll()

			removeAllItems()

module.exports = new NotificationService
module.exports.RedoUserNotifications = RedoUserNotifications
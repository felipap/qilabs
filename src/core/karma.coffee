
# src/core/karma
# for QI Labs
# by @f03lipe

mongoose = require 'mongoose'
async = require 'async'
_ = require 'lodash'
assert = require 'assert'

please = require 'src/lib/please.js'
logger = require('src/core/bunyan')({ service: 'KarmaService' })

Resource = mongoose.model 'Resource'
ObjectId = mongoose.Schema.ObjectId

KarmaItem = mongoose.model 'KarmaItem'
KarmaChunk = mongoose.model 'KarmaChunk'
User = mongoose.model 'User'

##
##

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

Points = KarmaItem.Points

Handlers = {
	PostUpvote: (agent, data) ->
		please {$model:'User'}, {post:{$model:'Post'}}

		return {
			identifier: 'upvote_'+data.post._id
			resource: data.post._id # MUST BE .id, not ._id
			type: 'PostUpvote'
			path: data.post.path
			object: {
				name: data.post.content.title
				postType: data.post.type
				lab: data.post.subject
			}
			receiver: data.post.author.id
			instances: [{ # One specific to the current event
				name: agent.name
				path: agent.path
				key: 'upvote_'+data.post._id+'_'+agent._id
				# created_at: Date.now() # Remove so addToSet can be used?
			}]
		}
}

Generators = {
	PostUpvote: (user, cb) ->
		logger = logger.child({ generator: 'PostUpvote' })
		Post = Resource.model 'Post'

		onGetDocs = (docs) ->
			karmas = []
			async.map docs, ((post, done) ->
				# Arrange votes into instances of the same KarmaItem
				instances = []
				object = null
				# Don't create karma items when post has no votes
				if post.votes.length is 0
						return done()

				async.map post.votes, ((_user, done) ->
					logger.debug("Post \""+post.content.title+"\"")
					User.findOne { _id: _user }, (err, agent) ->
						instances.push(Handlers.PostUpvote(agent, {post:post}).instances[0])
						if not object
							object = Handlers.PostUpvote(agent, {post:post})
						logger.debug("vote by "+agent.name)
						done()
				), (err, results) ->
					if err
						console.log("ERRR", err)
						throw err
					karmas.push(new KarmaItem(_.extend(object, {
						instances: instances
						multiplier: instances.length
					})))
					done()
			), (err, results) ->
				cb(null, karmas)

		Post
			.find { 'author.id': user._id }
			.sort 'updated_at'
			.exec TMERA (docs) ->
				onGetDocs(docs)
}

##########################################################################################
##########################################################################################

# Create all KarmaItems for a user, then divide them into Chunks if necessary.
RedoUserKarma = (user, cb) ->
	please {$model:'User'}, '$isFn'

	logger = logger.child({
		domain: 'RedoUserKarma',
		user: { name: user.name, id: user._id }
	})

	async.map _.pairs(Generators), ((pair, done) ->
		generator = pair[1]
		logger.info('Calling generator '+pair[0])
		generator user, (err, items) ->
			done(null, items)
	), (err, _results) ->
		# Aggregate karma items from all generators (flatten)
		results = _.flatten(_.flatten(_results))

		delta = 0
		async.map results, ((item, done) ->
			delta += item.multiplier*Points[item.type]
			logger.debug("item", item)
			done(null, item)
		), (err, results) ->
			logger.debug('Creating new KarmaChunk for user')
			chunk = new KarmaChunk {
				user: user
				items: results
			}
			chunk.save()
			logger.debug("Final delta for user: %s", delta)
			KarmaChunk.remove {
				user: user._id
				_id: { $ne: chunk._id }
			}, (err, olds) ->
				# logger.debug("User's old KarmaChunks removed")
				User.findOneAndUpdate { _id: user._id },
				{ karma_chunks: [chunk._id], 'stats.karma': delta },
				(doc) ->
					if err
						logger.debug("DOC", doc)
						logger.error("Failed to replace karma_chunks. Leaks?")
						throw err
					cb()

class KarmaService

	Types: KarmaItem.Types

	## Chunk related.

	# Fix a situtation when the last object in user.karma_chunks doesn't exist.
	fixUserAndGetKarmaChunk = (user, cb) ->
		please {$model:'User'}, '$isFn'
		# Identify next logs.
		fixLogger = logger.child({ attemptFix: Math.ceil(Math.random()*100) })
		fixLogger.error('[0] User(%s) supposed KarmaChunk(%s) doesn\'t exist. Attempting
			to fix it.', user._id, user.karma_chunks[user.karma_chunks.length-1])
		# Find KarmaChunks related to the user.
		KarmaChunk
			.find({ user: user._id })
			.sort('updated_at')
			.select('updated_at _id')
			.exec (err, docs) ->
				if err
					fixLogger.error(err, 'Failed finding KarmaChunks for user(%s)', user._id)
					throw err
				if docs.length
				# There are real chunks related to that user. These may or may not have
				# been in the user.karma_chunks array.
					fixLogger.error('[1] %s KarmaChunks found for user.', docs.length)
					# Update user's karma_chunks with correct data.
					console.log(_.pluck(docs, '_id'))
					User.findOneAndUpdate { _id: user._id },
					{ $set: { karma_chunks: _.pluck(docs, '_id') } },
					(err, doc) ->
						if err
							fixLogger.error(err, '[3] Attempted fix: Failed to
								update karma_chunks for user(%s).', user._id)
							return
						fixLogger.error('[3] Attempted fix: Fixed karma_chunks attribute
							for user(%s).', user._id, doc.karma_chunks)
						# Get the last chunk (all of it, now)
						KarmaChunk.findOne { _id: docs[docs.length-1] }, (err, chunk) ->
							if err or not doc
								throw err or new Error('Kill yourself. Really.')
							cb(null, chunk)
				else
				# No chunks related to the user exist? WTF
					fixLogger.error("[1] No KarmaChunk found for user. Creating.")
					newAttr = _.pluck(docs, '_id')
					createKarmaChunk user, false, (err, chunk) ->
						if err
							fixLogger.error(err, '2. Failed to create chunk for user(%s)', user._id)
							return cb(err)
						if not chunk
							throw new Error('WTF! created KarmaChunk object is
							 null')
						cb(null, chunk)

	createKarmaChunk = (user, push=false, cb) ->
		please {$model:'User'}, {$is:false}, '$isFn'
		logger.debug('Creating karma chunk for user %s', user._id)
		chunk = new KarmaChunk {
			user: user._id
		}
		chunk.save (err, chunk) ->
			if err
				logger.error(err, 'Failed to create karma chunk for user(%s)', user._id)
				return cb(err)
			if push
				action = { $push: { karma_chunks: chunk._id } }
			else
				action = { karma_chunks: [chunk._id] }
			User.findOneAndUpdate { _id: user._id }, action, (err) ->
				if err
					logger.error(err,
						'Failed to save karma_chunks (=%s) attribute to user (%s)',
						chunk._id, user._id)
			cb(null, chunk)

	getUserKarmaChunk = (user, cb) ->
		please {$model:'User'}, '$isFn'
		#
		if user.karma_chunks and user.karma_chunks.length
			# karma_chunks is an array of KarmaChunks objects: bundles of karma updates,
			# the last of which is currently active and holds the latest updates.
			latest = user.karma_chunks[user.karma_chunks.length-1]
			KarmaChunk.findOne { _id: latest }, (err, chunk) ->
				if err
					logger.error(err, 'Failed finding KarmaChunk(%s) for user(%s)',
						latest, user._id)
					throw err
				if chunk
					return cb(null, chunk)
				else
					# OPS! This shouldn't be happening.
					# Log as error and try to fix it.
					# Don't try other ids in karma_chunks.
					fixUserAndGetKarmaChunk(user, cb)
		else
			# KarmaChunks must be created when they're needed for the first time.
			logger.debug("User (%s) has no karma_chunks.", user._id)
			createKarmaChunk user, false, (err, chunk) ->
				if err
					logger.error(err, 'Failed to create chunk for user(%s)', user._id)
					return cb(err)
				if not chunk
					throw new Error('WTF! created KarmaChunk object is null')
				cb(null, chunk)

	# Instance related.

	###*
	 * Fixes duplicate instances of a KarmaChunk item.
	 * @param  {ObjectId} chunkId			[description]
	 * @param  {String} 	instanceKey	[description]
	###
	fixChunkInstance = (chunkId, instanceKey, cb = () ->) ->
		please '$ObjectId', '$skip', '$isFn'
		console.log "WTF, Programmer???"
		cb()
		return
		jobs.create({
		}).delay(3000)

	## Item related.

	# Add
	addNewKarmaToChunk = (item, chunk, cb) ->
		please {$model:'KarmaItem'}, {$model:'KarmaChunk'}, '$isFn'
		KarmaChunk.findOneAndUpdate {
			_id: chunk._id
		}, {
			$push: 	{ items: item }
			$set: 	{	updated_at: Date.now() }
		}, TMERA (doc) ->
			cb(null, doc)

	updateKarmaInChunk = (item, chunk, cb) ->
		please {$model:'KarmaItem'}, {$model:'KarmaChunk'}, '$isFn'
		# logger.trace("UPDATE", chunk._id, item)

		KarmaChunk.findOneAndUpdate {
			_id: chunk._id
			'items.identifier': item.identifier
			'items.instances.key': { $ne: item.instances[0].key }
		}, {
			$set: {
				updated_at: Date.now()
				'items.$.updated_at': Date.now()
				'items.$.object': item.object # Update object, just in case
			}
			$inc: { 'items.$.multiplier': 1 }
			$push: { 'items.$.instances': item.instances[0] }
		}, cb

	calculateKarmaFromChunk = (chunk, cb) ->
		please {$model:'KarmaChunk'}, '$isFn'

		# It might be old?
		# KarmaChunk.findOne { _id: chunk._id }, (err, chunk) ->
			# if err
			# 	throw err # TMERA(err)
		total = 0
		for i in chunk.items
			total += Points[i.type]*i.instances.length
		cb(null, total)

	## PUBLIC BELOW

	constructor: () ->
		for type of @Types
			assert typeof Handlers[type] isnt 'undefined',
				"Handler for Karma of type #{type} is not registered."
			assert typeof Handlers[type] is 'function',
				"Handler for Karma of type #{type} is not a function."
			assert typeof Points[type] isnt 'undefined',
				"Points for Karma of type #{type} is not registered."

	send: (agent, type, data, cb = () ->) ->
		assert type of @Types, "Unrecognized Karma Type."

		object = Handlers[type](agent, data)
		# logger.debug("Karma data", object)

		User.findOne { _id: object.receiver }, TMERA (user) ->
			if not user
				logger.error("Receiver user %s was not found.", object.receiver)
				return cb(new Error("User "+object.receiver+" not found."))

			onAdded = (err, doc) ->
				if err
					return cb(err)

				if not doc
					return cb(null)

				# calculateKarmaFromChunk object.receiver, doc, (err, total) ->
				# 	console.log('total!!!', total)
				# 	previous = user.stats.karma
				# 	User.findOneAndUpdate { _id: object.receiver },
				# 	{ 'stats.karma': user.karma_from_previous_chunks+total },
				# 	(err, doc) ->

				# Ok to calculate karma here.
				# Only one object is assumed to have been created.
				deltaKarma = Points[type]
				User.findOneAndUpdate {
					_id: object.receiver
				}, {
					'meta.last_received_notification': Date.now()
					$inc: { 'stats.karma': deltaKarma }
				}, TMERA("Failed to update user karma") (doc) ->
						logger.info("User %s(%s) karma updated to %s (+%s)", doc.name,
							doc.id, doc.stats.karma, deltaKarma)
						cb(null)

			getUserKarmaChunk user, (err, chunk) ->
				logger.debug("Chunk found (%s)", chunk._id)
				item = _.findWhere(chunk.items, { identifier: object.identifier })
				if item
				# Karma Object for resource already exists. Aggregate valor!
					# Check if item is already in the item (race condition?)
					if _.findWhere(item.instances, { key: object.instances[0].key })
						logger.warn("Instance with key %s was already in chunk %s (user=%s).",
							item.instances[0].key, chunk._id, chunk.user)
						return cb(null, null) # No object was/should be added

					ninstance = new KarmaItem(object)
					updateKarmaInChunk ninstance, chunk,
					TMERA("Failed to updateKarmaInChunk", { instance: ninstance }) (doc, info) ->
						# What the fuck happened?
						if not doc
							logger.error("Doc returned from updateKarmaInChunk is null", object)
							return cb(null, null)

						# Check if doc returned has more than one of the instance we added (likely a
						# race problem).
						console.log "ORIGINAL:", object.instances[0].key
						item = _.findWhere(doc.items, { identifier: object.identifier })
						try # Hack to use forEach. U mad?
							count = 0
							item.instances.forEach (inst) ->
								if inst.key is object.instances[0].key
									console.log "ONE FOUND:", inst.key
									if count is 1 # This is the second we found
										throw new Error("THEHEHEHE")
									count += 1
						catch e
							console.log(e, _.keys(e))
							# More than one instances found
							logger.error("Instance with key %s not unique in chunk %s (user=%s).",
								ninstance.instances[0].key, chunk._id, chunk.user)
							# Trigger fixChunkInstance
							fixChunkInstance chunk._id, object.identifier, () ->
							return cb(null, null) # As if no object has been added, because

						onAdded(null, doc)
				else
				# Make new instance.
					ninstance = new KarmaItem(object)
					addNewKarmaToChunk ninstance, chunk, (err, doc) ->
						if err
							logger.error("Failed to addNewKarmaToChunk", { instance: ninstance })
							return cb(err)
						onAdded(null, doc)

	undo: (agent, type, data, cb = () ->) ->
		assert type of @Types, "Unrecognized Karma Type."

		object = Handlers[type](agent, data)
		# logger.trace("Karma data", object)

		User.findOne { _id: object.receiver }, TMERA (user) ->
			if not user
				return cb(new Error("User "+object.receiver+" not found."))

			count = 0
			onRemovedAll = () ->
				deltaKarma = count*-Points[type]
				User.findOneAndUpdate { _id: object.receiver },
				{ $inc: { 'stats.karma': deltaKarma } },
				TMERA("Failed to update user karma") (doc) ->
					logger.info("User %s(%s) karma updated to %s (%s)", doc.name,
						doc.id, doc.stats.karma, deltaKarma)
					cb(null)

			# Mongo will only take one item at a time in the following update (because $
			# matches only the first array). T'will be necessary to call this until
			# nothing item is removed. (ie. num == 1)
			# see http://stackoverflow.com/questions/21637772
			removeAllItems = () ->
				logger.debug("Attempting to remove. count: #{count}")

				KarmaChunk.update {
					user: user._id
					'items.identifier': object.identifier
					'items.instances.key': object.instances[0].key
				}, {
					$pull: { 'items.$.instances': { key: object.instances[0].key } }
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

module.exports = new KarmaService
module.exports.RedoUserKarma = RedoUserKarma
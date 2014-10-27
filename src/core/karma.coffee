
# src/core/karma
# for QI Labs
# by @f03lipe

mongoose = require 'mongoose'
async = require 'async'
_ = require 'lodash'
assert = require 'assert'

please = require 'src/lib/please'
Chunker = require './chunker'
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
	PostUpvote: {
		instance: (agent, data) ->
			please {$model:'User'}, {post:{$model:'Post'}}

			{ # One specific to the current event
				name: agent.name
				path: agent.path
				key: 'upvote_'+data.post._id+'_'+agent._id
				# created_at: Date.now() # Remove so addToSet can be used?
			}
		item: (data) ->
			please {post:{$model:'Post'}}

			{
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
				instances: []
			}
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

	chunker = new Chunker('karma_chunks', KarmaChunk, KarmaItem, KarmaItem.Types, Handlers)

	## Instance related.

	###*
	 * Fixes duplicate instances of a KarmaChunk item.
	 * @param  {ObjectId} chunkId			[description]
	 * @param  {String} 	instanceKey	[description]
	###
	fixDuplicateChunkInstance = (chunkId, instanceKey, cb = () ->) ->
		please '$ObjectId', '$skip', '$isFn'
		console.log "WTF, Programmer???"
		cb()
		return
		jobs.create({
		}).delay(3000)

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

	constructor: () ->

	create: (agent, type, data, cb = () ->) ->
		assert type of @Types, "Unrecognized Karma Type."

		onAdded = (err, object, instance, chunk) ->
			if err
				return cb(err)

			if not chunk
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

		chunker.add(agent, type, data, onAdded)

	undo: (agent, type, data, cb = () ->) ->

		onRemovedAll = (err, count, object, object_inst) ->
			deltaKarma = count*-Points[type]
			User.findOneAndUpdate { _id: object.receiver },
			{ $inc: { 'stats.karma': deltaKarma } },
			TMERA("Failed to update user karma") (doc) ->
				logger.info("User %s(%s) karma updated to %s (%s)", doc.name,
					doc.id, doc.stats.karma, deltaKarma)
			cb(null)

		chunker.remove(agent, type, data, onRemovedAll)

module.exports = new KarmaService
module.exports.RedoUserKarma = RedoUserKarma
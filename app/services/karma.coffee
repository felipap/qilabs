
mongoose = require 'mongoose'
async = require 'async'
_ = require 'lodash'
assert = require 'assert'

please = require 'app/lib/please'
Chunker = require './chunker'
logger = require('app/config/bunyan')({ service: 'KarmaService' })
TMERA = require 'app/lib/tmera'

KarmaItem = mongoose.model 'KarmaItem'
KarmaChunk = mongoose.model 'KarmaChunk'
User = mongoose.model 'User'


Handlers = {
	PostUpvote: {
		instance: (agent, data) ->
			please {$model:'User'}, {post:{$model:'Post'}}

			{ # One specific to the current event
				name: agent.name
				path: agent.path
				key: 'upvote_'+data.post._id+'_'+agent._id
				created_at: Date.now() # Remove so addToSet can be used?
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
					lab: data.post.lab
				}
				receiver: data.post.author.id
				instances: []
			}
	}
}

Generators = {
	PostUpvote: (user, cb) ->
		logger = logger.child({ generator: 'PostUpvote' })
		Post = mongoose.model('Post')

		onGetDocs = (docs) ->
			karmas = []
			async.map docs, ((post, done) ->
				# Arrange votes into instances of the same KarmaItem
				instances = []
				object = Handlers.PostUpvote.item({post:post})
				# Don't create karma items when post has no votes
				if post.votes.length is 0
						return done()

				async.map post.votes, ((_user, done) ->
					logger.debug("Post \""+post.content.title+"\"")
					User.findOne { _id: _user }, (err, agent) ->
						instances.push(Handlers.PostUpvote.instance(agent, {post:post}))
						logger.debug("vote by "+agent.name)
						done()
				), (err, results) ->
					if err
						console.log("ERRR", err)
						throw err
					created_at = _.min(_.pluck(instances, 'created_at')) or new Date()
					updated_at = _.max(_.pluck(instances, 'created_at')) or created_at
					karmas.push(new KarmaItem(_.extend(object, {
						instances: instances
						multiplier: instances.length
						updated_at: updated_at
						created_at: created_at
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

################################################################################
################################################################################

class KarmaService

	Types: KarmaItem.Types
	Points = KarmaItem.Points

	chunker = new Chunker('karma_chunks', KarmaChunk, KarmaItem, KarmaItem.Types, Handlers,
		Generators)

	# fixDuplicateChunkInstance = (chunkId, instanceKey, cb = () ->) ->
	# 	please '$ObjectId', '$skip', '$isFn'
	# 	console.log "WTF, Programmer???"
	# 	cb()
	# 	return
	# 	jobs.create({}).delay(3000)

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

	redoUserKarma: (user, cb = () ->) ->
		chunker.redoUser user, (err, chunk) ->

			delta = 0
			for item in chunk.items
				delta += item.multiplier*Points[item.type]
			User.findOneAndUpdate {
 				_id: user._id
 			}, {
 				'meta.last_received_karma': chunk.updated_at
 				'stats.karma': delta
 			}, (err, doc) ->
 				cb()

module.exports = new KarmaService
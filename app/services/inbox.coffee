
mongoose = require 'mongoose'
async = require 'async'
_ = require 'lodash'
assert = require 'assert'

please = require 'app/lib/please.js'
logger = require('app/config/bunyan')({ service: 'InboxService' })

ObjectId = mongoose.Schema.ObjectId

User = mongoose.model 'User'
Post = mongoose.model 'Post'
Inbox = mongoose.model 'Inbox'

# Throw Mongodb Errors Right Away
TMERA = require 'app/lib/tmera'

Generators = {
	PostsFromFollowing: (user, cb) ->
		logger = logger.child({ generator: 'PostsFromFollowing' })
		Post = mongoose.model 'Post'
		Follow = mongoose.model 'Follow'

		onGetFollowing = (docs) ->

		Follow
			.find { 'follower': user._id }
			.exec TMERA (docs) ->
				onGetFollowing(docs)
}

################################################################################
################################################################################

RedoUserInbox = (user, cb) ->
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
		# Aggregate inbox items from all generators
		#

class InboxService

	## PUBLIC BELOW

	fillInboxes: (recipients, opts, cb) ->
		please {'$instance':Array}, {$contains:['resource','author']}, '$isFn'

		if not recipients.length
			return cb(false, [])

		async.mapLimit(recipients, 5, ((rec, done) ->
			inbox = new Inbox {
				resource: opts.resource
				recipient: rec
				author: opts.author
			}
			inbox.save(done)
		), cb)

	createAfterFollow: (follower, followee, cb) ->
		please {'$model':'User'}, {'$model':'User'}, '$isFn'

		Post.find { 'author.id': followee._id }, TMERA (docs) ->
			logger.info('Resources found:', docs.length)

			async.mapLimit docs, 5, ((resource, done) ->
				inbox = new Inbox({
					resource: resource,
					recipient: follower,
					type: 'Post',
					author: resource.author or resource.actor,
					dateSent: resource.created_at # or should it be 'updated'?
				})
				inbox.save (err, doc) ->
					logger.info 'Resource '+resource._id+' sent on '+resource.created_at+' added'
					done(err,doc)
			), () ->
				cb()

	removeAfterUnfollow: (follower, followee, cb) ->
		please {'$model':'User'}, {'$model':'User'}, '$isFn'

		Inbox.remove {
			recipient: follower._id,
			author: followee._id,
		}, TMERA (num) ->
			cb(null, num)

	fillUserInboxWithResources = (recipient, resources, cb) ->
		please {'$model':'User'}, {'$isA':Array}, '$isFn'

		if not resources.length
			return cb(false, [])

		console.log 'Resources found:', resources.length
		async.mapLimit(resources, 5, ((resource, done) ->
			inbox = new Inbox {
				resource: resource
				recipient: recipient
				author: resource.author or resource.actor
				dateSent: resource.created_at # or should it be 'updated'?
			}
			inbox.save (err, doc) ->
				logger.info 'Resource '+resource.id+' sent on '+resource.created_at+' added'
				done(err,doc)
		), cb)

module.exports = new InboxService
module.exports.RedoUserInbox = RedoUserInbox

# src/core/inbox
# for QI Labs
# by @f03lipe

mongoose = require 'mongoose'
async = require 'async'
_ = require 'lodash'
assert = require 'assert'

please = require 'src/lib/please.js'
logger = require('src/core/bunyan')({ service: 'InboxService' })

Resource = mongoose.model 'Resource'
ObjectId = mongoose.Schema.ObjectId

User = mongoose.model 'User'
Post = Resource.model 'Post'
Inbox = mongoose.model 'Inbox'

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

Generators = {
	PostsFromFollowing: (user, cb) ->
		logger = logger.child({ generator: 'PostsFromFollowing' })
		Post = Resource.model 'Post'
		Follow = Resource.model 'Follow'

		onGetFollowing = (docs) ->

		Follow
			.find { 'follower': user._id }
			.exec TMERA (docs) ->
				onGetFollowing(docs)
}

##########################################################################################
##########################################################################################

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
					author: resource.author || resource.actor,
					dateSent: resource.created_at # or should it be 'updated'?
				})
				inbox.save (err, doc) ->
					logger.info('Resource '+resource._id+'of type '+resource.__t+
						' sent on '+resource.created_at+' added')
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
				console.log "Resource #{resource.id} of type #{resource.__t}
				sent on #{resource.created_at} added"
				done(err,doc)
		), cb)

module.exports = new InboxService
module.exports.RedoUserInbox = RedoUserInbox
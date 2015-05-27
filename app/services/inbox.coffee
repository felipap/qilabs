
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

RedoInboxesToUser = (follower, cb) ->
	please {$model:User}, '$fn'

	Inbox.remove (recipient: follower.id), TMERA ->
		logger.debug 'Reset inbox of', follower.id

	follower.getFollowingIds TMERA (followingIds) ->
		async.map followingIds, ((id, done) ->
			User.findOne (_id: id), TMERA (followee) ->
				logger.debug 'Creating inboxes to '+follower.user+' from '+followee.name
				inboxService.createAfterFollow(follower, followee, done)
		), cb

RedoInboxesFromUser = (followee, cb) ->
	please {$model: User}, '$fn'

	Inbox.remove (author: followee.id), TMERA ->
		logger.debug 'Reset inbox of', followee.id

	followee.getFollowersIds TMERA (followerIds) ->
		Post.find ('author.id': followee.id), TMERA (posts) ->
			async.map posts, ((post, done) ->
				inboxService.fillInboxes post, [followee.id].concat(followerIds), done
			), cb

class InboxService

	## PUBLIC BELOW

	fillInboxes: (post, recipientIds, cb) ->
		please { $model: Post }, { $instance: Array }, '$fn'

		if not recipientIds.length
			return cb(false, [])

		async.mapLimit(recipientIds, 5, ((rec, done) ->
			inbox = new Inbox {
				resource: post.id
				author: post.author.id
				lab: post.lab
				type: 'Post'
				recipient: rec
			}
			inbox.save(done)
		), cb)

	createAfterFollow: (follower, followee, cb) ->
		please {'$model':'User'}, {'$model':'User'}, '$fn'

		# Make sure none exist before.
		Inbox.remove (recipient: follower.id, author: followee.id), ->

			Post.find { 'author.id': followee._id }, TMERA (docs) ->
				logger.info('Resources found:', docs.length)

				async.mapLimit docs, 5, ((post, done) ->
					inbox = new Inbox {
						resource: post.id
						recipient: follower.id
						type: 'Post'
						lab: post.lab
						author: post.author.id
						dateSent: post.created_at # or should it be 'updated'?
					}
					inbox.save TMERA (doc) ->
						logger.info 'Resource '+post._id+' sent on '+
							post.created_at+' added'
						done(null, doc)
				), () ->
					cb()

	removeAfterUnfollow: (follower, followee, cb) ->
		please {'$model':'User'}, {'$model':'User'}, '$fn'

		Inbox.remove {
			recipient: follower._id
			author: followee._id
		}, TMERA (num) ->
			cb(null, num)

	fillUserInboxWithResources = (recipient, resources, cb) ->
		please {'$model':'User'}, {'$isA':Array}, '$fn'

		if not resources.length
			return cb(false, [])

		logger.info 'Resources found:', resources.length
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

module.exports = inboxService = new InboxService
module.exports.RedoInboxesToUser = RedoInboxesToUser
module.exports.RedoInboxesFromUser = RedoInboxesFromUser
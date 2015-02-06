
bunyan = require 'bunyan'
kue = require 'kue'
assert = require 'assert'
_ = require 'lodash'
mongoose = require 'mongoose'

please = require 'app/lib/please.js'
KarmaService = require '../services/karma'
NotificationService = require '../services/notification'
InboxService = require '../services/inbox'

Post = mongoose.model('Post')
User = mongoose.model('User')
Inbox = mongoose.model('Inbox')
Follow = mongoose.model('Follow')
Comment = mongoose.model('Comment')
# Activity = mongoose.model('Activity')
CommentTree = mongoose.model('CommentTree')

logger = null

module.exports = class Jobs

	constructor: (_logger) ->
		logger = _logger or global.logger.mchild()

	# Cron jobs below
	createCronJob = (fn, wait, name) ->
		jobQueue.process 'cron-' + name, (job, done) ->
			milisecondsTillThurs = wait
			jobQueue.create('cron-' + name).delay(wait).save()
			done

		# Check if the job exists yet, and create it otherwise
		kue.Job.rangeByType 'cron-' + name, 'delayed', 0, 10, '', (err, jobs) ->
			if err
				return handleErr(err)
			if not jobs.length
				jobQueue.create('cron-' + name).save()

			# Start checking for delayed jobs.
			# This defaults to checking every 5 seconds
			jobQueue.promote()

	# Normal jobs below

	updateFollowStats = (follower, followee, cb) ->
		please {$model: 'User'}, {$model: 'User'}, '$isFn'
		console.log 'followee', follower._id, follower.id

		# Follow.count({ follower: @_id, follower: {$ne: null}}
		Follow.count { follower: follower._id }, (err, num) ->
			throw err if err
			User.findOneAndUpdate { _id: follower._id }, {
				'stats.following': num
			}, (err, follower) ->
				throw err if err
				if not follower
					logger.error 'Failed to find and update follower.', follower._id
				Follow.count {
					followee: followee._id
				}, (err, num) ->
					throw err if err
					User.findOneAndUpdate { _id: followee._id	}, { 'stats.followers': num	},
					(err, followee) ->
						throw err if err
						if followee
							logger.error 'Failed to find and update followee.', followee._id
						cb()

	# Get Follower, Followee and Follow, from data object
	getFFF = (data, cb) ->
		please { $contains: ['followerId','followeeId','followId'] }

		User.findOne { _id: data.followeeId }, (err, followee) ->
			if err
				return cb(err)
			if not followee
				logger.warn "Failed to find followee "+data.followeeId
				return cb(true)

			User.findOne { _id: data.followerId }, (err, follower) ->
				if err
					return cb(err)
				if not follower
					logger.warn "Failed to find follower "+data.followeeId
					return cb(true)

				Follow.findOne { _id: data.followId }, (err, follow) ->
					if err
						return cb(err)
					if not follow
						logger.warn "Failed to find follow "+data.followId
						return cb(true)

					cb(false, follower, followee, follow)

	userFollow: (job, done) ->
		please { data: { $contains: ['followerId','followeeId','followId'] } }

		getFFF job.data, (err, follower, followee, follow) ->

			# Notify followed user
			NotificationService.create follower, NotificationService.Types.NewFollower, {
				follow: follow
				followee: followee
			}, ->

			# Trigger creation of activity to timeline
			# ActivityService.create(follower, Notification.Types.NewFollower)({
			# 	follow: follow,
			# 	follower: follower,
			# 	followee: followee,
			# }, function () {
			# })

			done()
			# Populate followers' (& author's) inboxes
			InboxService.createAfterFollow follower, followee, ->

			updateFollowStats follower, followee, ->

	userUnfollow: (job, done) ->
		please { data: { $contains: ['followerId','followeeId','followId'] } }

		getFFF job.data, (err, follower, followee, follow) ->

			done()
			InboxService.removeAfterUnfollow follower, followee, (err, result) ->
				logger.info 'Removing (err:' + err + ') ' + result + ' inboxes on unfollow.'

			NotificationService.undo follower, NotificationService.Types.NewFollower, {
				follow: follow
				followee: followee
			}, ->

			updateFollowStats follower, followee, ->

	##############################################################################
	##############################################################################

	postUpvote: (job, done) ->
		please { data: { $contains: ['agentId','postId'] } }

		Post.findOne { _id: job.data.postId }, (err, post) ->
			if err
				return done(err)
			if not post
				logger.warn "Failed to find post "+data.postId
				return done()

			User.findOne { _id: job.data.agentId }, (err, agent) ->
				if err
					return done(err)
				if not agent
					logger.warn "Failed to find agent "+data.agentId
					return done()

				KarmaService.create agent, KarmaService.Types.PostUpvote, {
					post: post
				}, ->

				console.log("Finished upvote", job.data.title)
				done()

	postUnupvote: (job, done) ->
		please { data: { $contains: ['agentId','postId'] } }

		Post.findOne { _id: job.data.postId }, (err, post) ->
			if err
				return done(err)
			if not post
				logger.warn "Failed to find post "+data.postId
				return done()

			User.findOne { _id: job.data.agentId }, (err, agent) ->
				if err
					return done(err)
				if not agent
					logger.warn "Failed to find agent "+data.agentId
					return done()

				KarmaService.undo agent, KarmaService.Types.PostUpvote, {
					post: post
				}, ->

				done()

	##############################################################################
	##############################################################################

	getTreeAndPost = (job, cb) ->
		please { data: { $contains: ['treeId'] } }

		CommentTree.findOne { _id: job.data.treeId }, (err, tree) ->
			if err
				logger.error "Mongo error:", err
				return cb(err)

			if not tree
				logger.error 'Failed to find tree %s', job.data.treeId
				return cb(new Error('Failed to find tree '+job.data.treeId))

			Post.findOne { _id: tree.parent }, (err, parent) ->
				if err
					logger.error "Mongo error:", err
					return cb(err)

				if not parent
					logger.error 'Failed to find parent %s', tree.parent
					return cb(new Error('Failed to find parent '+tree.parent))

				cb(false, tree, parent)

	###
	Updates post count.children and list of participations.
	###
	updatePostParticipations: (job, done) ->
		please { data: { $contains: ['commentId','treeId','parentId'] } }
		logger.info "newComment"

		getTreeAndPost job, (err, tree, parent) ->
			comment = tree.docs.id(job.data.commentId)
			if not comment
				logger.error "WTF DUEDE COMMENT DOESNT EXIST HOW DO YOU MEAN????", job.data.commentId, job.data.treeId
				return done()
			User.findOne { _id: comment.author.id }, (err, agent) ->
				throw err if err

				if not agent
					logger.error 'Failed to find author %s', comment.author.id
					return done()

				parts = parent.participations
				participation = _.find(parent.participations, (one) ->
					'' + one.user.id is '' + agent._id
				)

				if participation
					participation.count += 1
				else
					console.log 'participation not found'
					parts.push {
						user: User.toAuthorObject(agent)
						count: 1
					}

				_.sortBy parts, '-count'
				parent.participations = parts
				parent.counts.children += 1
				parent.save (err, _doc) ->
					if err
						logger.error 'Error saving post object', err
						return done(err)
					done()

	notifyRepliedUser: (job, done) ->
		please { data: { $contains: ['repliedId','treeId','commentId','parentId'] } }

		getTreeAndPost job, (err, tree, parent) ->
			replied = tree.docs.id(job.data.repliedId)
			comment = tree.docs.id(job.data.commentId)
			assert replied and comment

			User.findOne { _id: comment.author.id }, (err, agent) ->
				throw err if err

				if not agent
					logger.error 'Failed to find author %s', comment.author.id
					return done()

				if agent.id is replied.author.id
					console.log('no thanks')
					return done()

				NotificationService.create agent, NotificationService.Types.CommentReply,
					comment: new Comment(comment)
					replied: new Comment(replied)
					parent: parent
				, ->
					done()

	notifyMentionedUsers: (job, done) ->
		please { data: { $contains: ['mentionedUsernames','treeId','commentId','parentId'] } }
		console.log('new Comment mentione')

		getTreeAndPost job, (err, tree, parent) ->
			comment = tree.docs.id(job.data.commentId)
			User.findOne { _id: comment.author.id }, (err, agent) ->
				throw err if err

				if not agent
					logger.error 'Failed to find author %s', comment.author.id
					return done()

				async.map job.data.mentionedUsernames, ((mentionedUname, done) ->
					User.findOne { username: mentionedUname } , (err, mentioned) ->
						throw err if err

						if not mentioned
							logger.error 'Failed to find mentioned user', mentionedUname, comment.author.id
							return done()

						NotificationService.create agent, NotificationService.Types.CommentMention,
							comment: new Comment(comment)
							mentioned: mentioned
							parent: parent
						, ->
							done()
				), (err, results) ->
					done()

	notifyRepliedPostAuthor: (job, done) ->
		please { data: { $contains: ['treeId','commentId'] } }
		console.log('new Comment mentione')

		getTreeAndPost job, (err, tree, parent) ->
			comment = tree.docs.id(job.data.commentId)

			if not comment
				logger.warn "Failed to find comment.", job.data.commentId, tree.id
				return done()

			User.findOne { _id: comment.author.id }, (err, agent) ->
				if err
					return done(err)

				if not agent
					logger.error 'Failed to find author %s', comment.author.id
					return done()

				# if agent.id is replied.author.id
				# 	console.log('no thanks')
				# 	return done()

				if parent.author.id isnt comment.author.id
					logger.info "newComment postcomment"
					NotificationService.create agent, NotificationService.Types.PostComment, {
						comment: new Comment(comment)
						parent: parent
					}, -> done

	##############################################################################
	##############################################################################

	###
	- Saves new post count of children
	- Undoes PostComment and CommentReply notifications
	###

	# Undo postcomment notification
	deleteComment: (job, done) ->
		please { data: { $contains: [ 'comment' ] } }

		comment = Comment.fromObject(job.data.comment)
		Post.findOneAndUpdate { _id: job.data.comment.parent },
		{ $inc: 'counts.children': -1 },
		(err, parent) ->
			if err
				return done(err)

			User.findOne { _id: '' + job.data.comment.author.id }, (err, author) ->
				if err
					logger.error err, 'Failed to find user %s', job.data.comment.author.id
					throw err
					return done(err)

				NotificationService.undo author, NotificationService.Types.PostComment,
					comment: comment
					parent: parent
				, -> done

	newPost: (job, done) ->
		please { data: { $contains: [ 'postId', 'authorId' ] } }

		Inbox = mongoose.model('Inbox')
		Post = mongoose.model('Post')
		User = mongoose.model('User')

		logger.info "newPost", job.data

		Post.findOne { _id: job.data.postId }, (err, post) ->
			if err
				return done(err)
			if not post
				logger.warn "Failed to find post "+job.data.postId
				return done()

			User.findOne { _id: job.data.authorId }, (err, author) ->
				if err
					return done(err)
				if not author
					logger.warn "Failed to find user "+job.data.authorId
					return done()

				author.getPopulatedFollowers (err, followers) ->
					if err
						return done(err)
					InboxService.fillInboxes [author].concat(followers), {
						resourceId: post.id
						type: Inbox.Types.Post
						author: author.id
					}, (err) ->
						done(err)

	##############################################################################
	##############################################################################

	###
	Fix karmachunk object: caps instances object and removes duplicates.
	###
	# fixKarmaChunk: (job, done) ->
	# 	please({data:{$contains:['kcId']}})
	# 	var KarmaChunk = mongoose.model('KarmaChunk')
	# 	KarmaChunk.find({ _id: job.data.kcId }, function (err, doc) {
	# 		if (err) {
	# 			logger.error(err, 'Failed to find KarmaChunk (%s)', job.data.kcId)
	# 			throw errUm texot de texte
	# 		}
	# 		// Let us see what we have here...
	# 	})
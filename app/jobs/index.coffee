
bunyan = require 'bunyan'
kue = require 'kue'
async = require 'async'
assert = require 'assert'
_ = require 'lodash'
mongoose = require 'mongoose'
bluebird = require 'bluebird'

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

	params: {
		author: User
		agent: User
		user: User
		post: Post
		tree: CommentTree
		follower: User
		followee: User
		follow: Follow
	}

	# Cron jobs below
	# createCronJob = (fn, wait, name) ->
	# 	jobQueue.process 'cron-' + name, (job, done) ->
	# 		milisecondsTillThurs = wait
	# 		jobQueue.create('cron-' + name).delay(wait).save()
	# 		done()

	# 	# Check if the job exists yet, and create it otherwise
	# 	kue.Job.rangeByType 'cron-' + name, 'delayed', 0, 10, '', (err, jobs) ->
	# 		if err
	# 			return handleErr(err)
	# 		if not jobs.length
	# 			jobQueue.create('cron-' + name).save()

	# 		# Start checking for delayed jobs.
	# 		# This defaults to checking every 5 seconds
	# 		jobQueue.promote()

	# Normal jobs below

	userCreated: (job, done) ->
		please { r: { $contains: ['user'] } }
		NotificationService.create null, NotificationService.Types.WelcomeToQi, {
			user: job.r.user
		}, done

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

	userFollow: (job, done) ->
		please { r: { $contains: ['follower','followee','follow'] } }

		async.parallel [
			(c) -> updateFollowStats job.r.follower, job.r.followee, c
			(c) -> InboxService.createAfterFollow job.r.follower, job.r.followee, c
			(c) ->
				NotificationService.create job.r.follower,
				NotificationService.Types.NewFollower, {
					follow: job.r.follow
					followee: job.r.followee
				}, c
		], done

	userUnfollow: (job, done) ->
		please { r: { $contains: ['follower','followee','follow'] } }

		async.parallel [
			(c) -> updateFollowStats job.r.follower, job.r.followee, c
			(c) -> InboxService.removeAfterUnfollow job.r.follower, job.r.followee, c
			(c) ->
				NotificationService.undo job.r.follower,
				NotificationService.Types.NewFollower, {
					follow: job.r.follow
					followee: job.r.followee
				}, c
		], done

	##############################################################################
	##############################################################################

	postUpvote: (job, done) ->
		please { r: { $contains: ['agent','post'] } }

		KarmaService.create job.r.agent, KarmaService.Types.PostUpvote, {
			post: job.r.post
		}, done

	postUnupvote: (job, done) ->
		please { r: { $contains: ['agent','post'] } }

		KarmaService.undo job.r.agent, KarmaService.Types.PostUpvote, {
			post: job.r.post
		}, done

	##############################################################################
	##############################################################################

	###
	Updates post count.children and list of participations.
	###
	updatePostParticipations: (job, done) ->
		please {
			r: { $contains: ['tree','post'] },
			data: { $contains: 'commentId' }
		}

		tree = job.r.tree
		parent = job.r.post
		comment = tree.docs.id(job.data.commentId)

		if not comment
			logger.error "WTF DUEDE COMMENT DOESNT EXIST HOW DO YOU MEAN????",
				job.data.commentId, job.data.treeId
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

	notifyAuthorRepliedComment: (job, done) ->
		please {
			r: { $contains: ['tree', 'post'] },
			data: { $contains: ['repliedId','commentId'] }
		}

		tree = job.r.tree
		parent = job.r.post

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
				console.log('notification service ended')
				done()

	notifyMentionedUsers: (job, done) ->
		please {
			r: { $contains: ['tree', 'post'] },
			data: { $contains: ['mentionedUsernames'] }
		}

		console.log('new Comment mentione')

		tree = job.r.tree
		parent = job.r.post

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
					, done
			), (err, results) ->
				done()

	notifyRepliedPostAuthor: (job, done) ->
		please { r: { $contains: ['tree', 'post'] } }

		tree = job.r.tree
		parent = job.r.post
		comment = tree.docs.id(job.data.commentId)

		if not comment
			return done(new Error('Failed to find comment '+job.data.commentId+
				' in tree '+tree.id))

		User.findOne { _id: comment.author.id }, (err, agent) ->
			throw err if err

			if not agent
				return done(new Error('Failed to find author '+comment.author.id))

			if parent.author.id is comment.author.id
				return done()

			NotificationService.create agent, NotificationService.Types.PostComment, {
				comment: new Comment(comment)
				parent: parent
			}, done

	##############################################################################
	##############################################################################

	###
	- Saves new post count of children
	- Undoes PostComment and CommentReply notifications
	###

	# Undo postcomment notification
	undoNotificationsFromDeletedComment: (job, done) ->
		please { r: { $contains: ['tree', 'post'] }, data: { $contains: [ 'jsonComment' ] } }

		tree = job.r.tree
		parent = job.r.post

		#
		comment = Comment.fromObject(job.data.jsonComment)

		Post.findOneAndUpdate { _id: parent._id }, { $inc: 'counts.children': -1 },
		(err, parent) ->
			throw err if err

			User.findOne { _id: '' + comment.author.id }, (err, author) ->
				throw err if err

				NotificationService.undo author, NotificationService.Types.PostComment,
					comment: comment
					parent: parent
				, done

	newPost: (job, done) ->
		please { r: { $contains: [ 'post', 'author' ] } }

		Inbox = mongoose.model('Inbox')

		job.r.author.getPopulatedFollowers (err, followers) ->
			throw err if err

			InboxService.fillInboxes job.r.post, [job.r.author].concat(followers), done

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
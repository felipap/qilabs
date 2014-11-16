
# jobs.coffee
# Script to consume kue jobs.

# Absolute imports. See https://gist.github.com/branneman/8048520#6-the-hack
process.env.NODE_PATH = '.'
require('module').Module._initPaths()

require 'coffee-script/register'

bunyan = require('bunyan')
kue = require('kue')
nconf = require('nconf')
express = require('express')
assert = require('assert')
_ = require('lodash')

please = require('src/lib/please.js')
jobs = require('src/config/kue.js')
mongoose = require('src/config/mongoose.js')()
KarmaService = require('src/core/karma')
NotificationService = require('src/core/notification')
InboxService = require('src/core/inbox')

Post = mongoose.model('Post')
User = mongoose.model('User')
Inbox = mongoose.model('Inbox')
Follow = mongoose.model('Follow')
Comment = mongoose.model('Comment')
Activity = mongoose.model('Activity')
CommentTree = mongoose.model('CommentTree')

ObjectId = mongoose.Types.ObjectId

logger = require('src/core/bunyan.js')(name: 'JOBS')

module.exports = class Jobs

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

	logger.info 'Jobs queue started. Listening on port', jobs.client.port

	# Fill follower's inboxes
	# Notify followed user
	# Populate followers' (& author's) inboxes
	userFollow: (job, done) ->
		follower = User.fromObject(job.data.follower)
		followee = User.fromObject(job.data.followee)
		follow = Follow.fromObject(job.data.follow)

		NotificationService.create follower, NotificationService.Types.NewFollower,
			follow: follow
			followee: followee
		, ->

		# Trigger creation of activity to timeline
		# ActivityService.create(follower, Notification.Types.NewFollower)({
		# 	follow: follow,
		# 	follower: follower,
		# 	followee: followee,
		# }, function () {
		# })

		InboxService.createAfterFollow follower, followee, ->
			done()

		updateFollowStats follower, followee, ->

	userUnfollow: (job, done) ->
		follower = User.fromObject(job.data.follower)
		followee = User.fromObject(job.data.followee)
		follow = Follow.fromObject(job.data.follow)

		InboxService.removeAfterUnfollow follower, followee, (err, result) ->
			logger.info 'Removing (err:' + err + ') ' + result + ' inboxes on unfollow.'
			done()

		NotificationService.undo follower, NotificationService.Types.NewFollower, {
			follow: follow
			followee: followee
		}, ->

		updateFollowStats follower, followee, ->

	#//////////////////////////////////////////////////////////////////////////////
	#//////////////////////////////////////////////////////////////////////////////

	postUpvote: (job, done) ->
		please { data: { $contains: ['agent','post'] } }
		agent = User.fromObject(job.data.agent)
		post = Post.fromObject(job.data.post)

		KarmaService.create agent, KarmaService.Types.PostUpvote, {
			post: post
		}, ->

		done()

	postUnupvote: (job, done) ->
		please { data: { $contains: ['authorId'] } }

		agent = User.fromObject(job.data.agent)
		post = Post.fromObject(job.data.post)

		KarmaService.undo agent, KarmaService.Types.PostUpvote, {
			post: post
		}, ->

		done()

	#//////////////////////////////////////////////////////////////////////////////
	#//////////////////////////////////////////////////////////////////////////////

	###
	Updates post count.children and list of participants.
	###
	newComment: (job, done) ->
		please { data: { $contains: ['commentId','treeId','parentId'] } }

		CommentTree.findOne { _id: job.data.treeId }, (err, tree) ->
			throw err if err

			if not tree
				logger.error 'Failed to find tree %s', job.data.treeId
				return done()

			assert '' + tree.parent is '' + job.data.parentId

			Post.findOne { _id: tree.parent }, (err, parent) ->
				throw err if err

				if not parent
					logger.error 'Failed to find parent %s', job.data.parentId
					return done()

				comment = tree.docs.id(job.data.commentId)
				assert comment

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

					if parent.author.id isnt comment.author.id
						NotificationService.create agent, NotificationService.Types.PostComment, {
							comment: new Comment(comment)
							parent: parent
						}, ->

	newCommentReply: (job, done) ->
		please { data: { $contains: ['repliedId','treeId','commentId','parentId'] } }

		CommentTree.findOne {
			_id: job.data.treeId
		}, (err, tree) ->
			throw err if err

			if not tree
				logger.error 'Failed to find tree %s', job.data.treeId
				done()

			assert '' + tree.parent is '' + job.data.parentId

			Post.findOne {
				_id: tree.parent
			}, (err, parent) ->
				throw err if err

				if not parent
					logger.error 'Failed to find parent %s', job.data.parentId
					return done()

				replied = tree.docs.id(job.data.repliedId)
				comment = tree.docs.id(job.data.commentId)
				assert replied and comment

				User.findOne {
					_id: comment.author.id
				}, (err, agent) ->
					throw err if err

					if not agent
						logger.error 'Failed to find author %s', comment.author.id
						return done()

					NotificationService.create agent, NotificationService.Types.CommentReply,
						comment: new Comment(comment)
						replied: new Comment(replied)
						parent: parent
					, ->

	newCommentMention: (job, done) ->
		please { data: { $contains: ['mentionedId','treeId','commentId','parentId'] } }

		CommentTree.findOne {
			_id: job.data.treeId
		}, (err, tree) ->
			throw err if err

			if not tree
				logger.error 'Failed to find tree %s', job.data.treeId
				return done()

			assert '' + tree.parent is '' + job.data.parentId

			Post.findOne {
				_id: tree.parent
			}, (err, parent) ->
				throw err if err

				if not parent
					logger.error 'Failed to find parent %s', job.data.parentId
					return done()

				comment = tree.docs.id(job.data.commentId)

				User.findOne {
					_id: comment.author.id
				}, (err, agent) ->
					throw err if err

					if not agent
						logger.error 'Failed to find author %s', comment.author.id
						return done()

					User.findOne {
						_id: job.data.mentionedId
					} , (err, mentioned) ->
						throw err if err

						if not mentioned
							logger.error 'Failed to find mentioned user %s', comment.author.id
							return done()

						NotificationService.create agent, NotificationService.Types.CommentMention,
							comment: new Comment(comment)
							mentioned: mentioned
							parent: parent
						, ->

	#//////////////////////////////////////////////////////////////////////////////
	#//////////////////////////////////////////////////////////////////////////////

	###
	- Saves new post count of children
	- Undoes PostComment and CommentReply notifications
	###

	# Undo postcomment notification
	deleteComment: (job, done) ->
		please { data: { $contains: [ 'comment' ] } }

		comment = Comment.fromObject(job.data.comment)
		Post.findOneAndUpdate {
			_id: job.data.comment.parent
		}, {
			$inc: 'counts.children': -1
		}, (err, parent) ->
			User.findOne {
				_id: '' + job.data.comment.author.id
			}, (err, author) ->
				if err
					logger.error err, 'Failed to find user %s', job.data.comment.author.id
					throw err

				NotificationService.undo author, NotificationService.Types.PostComment,
					comment: comment
					parent: parent
				, ->

	newPost: (job, done) ->
		please { data: { $contains: [ 'post', 'author' ] } }

		Inbox = mongoose.model('Inbox')
		Post = mongoose.model('Post')
		User = mongoose.model('User')
		author = User.fromObject(job.data.author)

		author.getPopulatedFollowers (err, followers) ->
			InboxService.fillInboxes [author].concat(followers), {
				resource: Post.fromObject(job.data.post)._id
				type: Inbox.Types.Post
				author: author._id
			}, (err) ->
				done(err)

	#//////////////////////////////////////////////////////////////////////////////
	#//////////////////////////////////////////////////////////////////////////////

	###
	Fix karmachunk object: caps instances object and removes duplicates.
	###
	fixKarmaChunk: (job, done) ->
		# please({data:{$contains:['kcId']}})
		# var KarmaChunk = mongoose.model('KarmaChunk')
		# KarmaChunk.find({ _id: job.data.kcId }, function (err, doc) {
		# 	if (err) {
		# 		logger.error(err, 'Failed to find KarmaChunk (%s)', job.data.kcId)
		# 		throw err
		# 	}
		# 	// Let us see what we have here...
		# })
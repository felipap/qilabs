
bunyan = require 'bunyan'
kue = require 'kue'
async = require 'async'
assert = require 'assert'
_ = require 'lodash'
mongoose = require 'mongoose'
bluebird = require 'bluebird'

redis = require 'app/config/redis'
please = require 'app/lib/please.js'
KarmaService = require '../services/karma'
NotificationService = require '../services/notification'
NotificationService2 = require '../services/notification2'
InboxService = require '../services/inbox'
FacebookService = require '../services/fb'

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
		author: User,
		agent: User,
		repliedAuthor: User,
		user: User,
		post: Post,
		tree: CommentTree,
		follower: User,
		followee: User,
		follow: Follow,
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

	userCreated: `function (job, done) {
		please({ r: { $contains: ['user'] } })
		NotificationService2.create(null, job.r.user, 'Welcome', {}, done)
	}`

	`
	function updateFollowStats(follower, followee, cb) {
		please({$model: User}, {$model: User}, '$fn')

		async.parallel([
			follower.updateCachedProfile.bind(follower),
			followee.updateCachedProfile.bind(followee)
		], (err, results) => {
			if (err) {
				throw err
			}
			cb()
		})
	}
	`

	userFollow: `function (job, done) {
		please({ r: { $contains: ['follower','followee','follow'] } })

		function createNotification(cb) {
			NotificationService2.create(job.r.follower, job.r.followee,
			'Follow', {
				follow: job.r.follow
			}, cb)
		}

		function updateInbox(cb) {
			InboxService.createAfterFollow(job.r.follower, job.r.followee, cb)
		}

		function updateStats(cb) {
			updateFollowStats(job.r.follower, job.r.followee, cb)
		}

		async.parallel([updateStats, updateInbox, createNotification], (err) => {
			if (err) {
				throw err
			}

			done()
		})
	}`

	userUnfollow: `function (job, done) {
		please({ r: { $contains: ['follower','followee'] } })

		function undoNotification(cb) {
			NotificationService2.undo(job.r.follower, job.r.followee,
			'Follow', {
				follow: new Follow(job.data.follow)
			}, cb)
		}

		function updateInbox(cb) {
			InboxService.removeAfterUnfollow(job.r.follower, job.r.followee, cb)
		}

		function updateStats(cb) {
			updateFollowStats(job.r.follower, job.r.followee, cb)
		}

		async.parallel([updateStats, updateInbox, undoNotification], done)
	}`

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

	reticentSlice = (str, max) ->
		if str.length <= max
			return str
		last = str.match(/\s?(.+)\s*$/)[1]
		if last.length > 20
			return str.slice(0, max-3)+"..."
		else
			words = str.slice(0, max-3).split(/\s/);
			return words.slice(0,words.length-2).join(' ')+"...";

	###
	Updates post count.children and list of participations.
	###
	updatePostParticipations: (job, done) ->
		please {
			r: { $contains: ['post'] },
		}

		require('./refreshPostParticipations') job.r.post, (err, result) ->
			done()

	notifyWatchingReplyTree: (job, done) ->
		please {
			r: { $contains: ['tree', 'post', 'repliedAuthor'] },
			data: { $contains: ['replyTreeRootId','replyId'] }
		}

		tree = job.r.tree
		parent = job.r.post

		replied = tree.docs.id(job.data.replyTreeRootId)
		comment = tree.docs.id(job.data.replyId)
		assert replied and comment

		User.findOne { _id: comment.author.id }, (err, agent) ->
			throw err if err

			if not agent
				logger.error 'Failed to find author %s', comment.author.id
				return done()

			if agent.id is replied.author.id
				console.log('no thanks')
				return done()

			NotificationService2.create(agent, job.r.repliedAuthor, 'CommentReply',
				reply: new Comment(comment)
				comment: new Comment(replied)
				post: parent
			, () =>
				console.log('notification service ended')
				done()
			)

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

					console.log('trust', agent.flags.trust)
					if agent.flags.trust >= 3
						console.log('try')
						FacebookService.notifyUser mentioned,
							'Você foi mencionado por @'+agent.username+' na discussão do post "'+
							reticentSlice(parent.content.title, 200)
							'cmention',
							parent.shortPath
							(err, result) ->
								console.log('reuslt', result)

					NotificationService2.create agent, mentioned, 'CommentMention', {
						mention: new Comment(mention)
						post: post
					}, done
			), (err, results) ->
				done()

	notifyWatchingComments: (job, done) ->
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

			User.findOne { _id: parent.author.id }, (err, author) ->
				throw err if err
				if not author
					console.log "PUTA QUE PA*"
					return
				console.log('trust', author.flags.trust)

				if agent.flags.trust >= 3
					FacebookService.notifyUser author,
						'Seu post "'+reticentSlice(parent.content.title, 200)+
						'" recebeu uma resposta de @'+agent.username,
						'canswer',
						parent.shortPath
						(err, result) ->
							console.log('reuslt', result)

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
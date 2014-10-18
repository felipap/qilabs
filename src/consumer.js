
// consumer.js
// Script to consume kue jobs.

var bunyan = require('bunyan')
var kue = require('kue')
var nconf = require('nconf')
var express = require('express')
var assert = require('assert')
var _ = require('lodash')

var please = require('./lib/please.js')
var jobs = require('./config/kue.js') // get kue (redis) connection
var mongoose = require('./config/mongoose.js')()

var KarmaService = require('./core/karma')
var NotificationService = require('./core/notification')
var InboxService = require('./core/inbox')

var Resource = mongoose.model('Resource')
var Post = Resource.model('Post')

var User = mongoose.model('User')
var Inbox = mongoose.model('Inbox')
var Follow = mongoose.model('Follow')
var Comment = mongoose.model('Comment')
var Activity = mongoose.model('Activity')
var CommentTree = mongoose.model('CommentTree')

var ObjectId = mongoose.Types.ObjectId
var logger

function main () {
	logger.info('Jobs queue started. Listening on port', jobs.client.port)

	process.once('SIGTERM', function (sig) {
		jobs.shutdown(function(err) {
			logger.info('Kue is shutting down.', err||'')
			process.exit(0)
		}, 5000)
	})

	jobs.on('job complete', function (id, result) {
		kue.Job.get(id, function (err, job) {
			if (err || !job) {
				logger.warn("[consumer::on job completed] fail to get job: "+id+
					". error:"+err)
				return
			}
			logger.info("Job completed", { type: job.type, title: job.data.title })
			if (job && _.isFunction(job.remove)) {
				job.remove()
			} else {
				logger.error("[consumer::removeKueJob] bad argument, "+job)
			}
		})
	})

	// Normal jobs below

	jobs.process('user follow', function (job, done) {
		var Follow = mongoose.model('Follow')
		var async = require('async')

		var follower = User.fromObject(job.data.follower)
		var followee = User.fromObject(job.data.followee)
		var follow = Follow.fromObject(job.data.follow)

		// Notify followed user
		NotificationService.create(follower, NotificationService.Types.NewFollower, {
			follow: follow,
			followee: followee
		}, function () {})

		// Trigger creation of activity to timeline
		// ActivityService.create(follower, Notification.Types.NewFollower)({
		// 	follow: follow,
		// 	follower: follower,
		// 	followee: followee,
		// }, function () {
		// })

		// Fill follower's inboxes
		InboxService.createAfterFollow(follower, followee, function () {
			done()
		})

		// Update followee and follower stats
		// Shouldn't this be nested and done() only called after all were executed?
		followee.update({$inc: {'stats.followers': 1}}, function () {})
		follower.update({$inc: {'stats.following': 1}}, function () {})
	})

	jobs.process('user unfollow', function (job, done) {
		var follower = User.fromObject(job.data.follower)
		var followee = User.fromObject(job.data.followee)
		var follow = Follow.fromObject(job.data.follow)

		InboxService.removeAfterUnfollow(follower, followee, function (err, result) {
			logger.info("Removing (err:"+err+") "+result+" inboxes on unfollow.")
			done()
		})

		// Notify followed user
		NotificationService.undo(follower, NotificationService.Types.NewFollower, {
			follow: follow,
			followee: followee
		}, function () {})

		// Update followee and follower stats
		// Shouldn't this be nested and done() only called after all were executed?
		followee.update({$inc: {'stats.followers': -1}}, function () {})
		follower.update({$inc: {'stats.following': -1}}, function () {})
	})

	jobs.process('post upvote', function (job, done) {
		please({data:{$contains:['agent','post']}})

		var agent = User.fromObject(job.data.agent)
		var post = Post.fromObject(job.data.post)

		KarmaService.send(agent, KarmaService.Types.PostUpvote, {
			post: post,
		}, function () {
		})

		done()
	})

	jobs.process('post unupvote', function (job, done) {
		please({data:{$contains:['authorId']}})

		var agent = User.fromObject(job.data.agent)
		var post = Post.fromObject(job.data.post)

		assert(post._id, "Post object without id.")

		KarmaService.undo(agent, KarmaService.Types.PostUpvote, {
			post: post,
		}, function () {
		})

		done()
	})

	////////////////////////////////////////////////////////////////////////////////
	////////////////////////////////////////////////////////////////////////////////

	/**
	 * Updates discussion count.children and list of participants.
	 */
	jobs.process('NEW discussion exchange', function (job, done) {
		please({data:{$contains:['exchange']}})

		var Post = mongoose.model('Resource').model('Post')
		var User = mongoose.model('User')
		var author = job.data.exchange.author

		Post.findOne({ _id: job.data.exchange.parent }, function (err, doc) {
			if (err) {
				logger.error("ERRO!?", err)
				logger.trace()
				done(err)
			}
			if (!doc) {
				logger.error("Exchange(id=%s) parent(id=%s) not found.",
					job.data.exchange._id, job.data.exchange.parent)
				done()
			}

			var parts = doc.participations
			var participation = _.findWhere(parts, function (one) {
				return author._id === one.user._id
			})
			console.log('participation', participation)

			if (participation) {
				participation.count += 1
			} else {
				console.log('participation not found')
				parts.push({
					user: User.toAuthorObject(author),
					count: 1,
				})
			}
			_.sortBy(parts, '-count')
			// console.log('parts', parts)

			doc.participations = parts
			doc.counts.children += 1

			doc.save(function (err, _doc) {
				if (err) {
					logger.error("Error saving post object", err)
					done(err)
				}
				console.log("doc?", _doc)
				done()
			})
		})
	})

	jobs.process('NEW note comment', function (job, done) {
		please({data:{$contains:['comment']}})

		var comment = Comment.fromObject(job.data.comment)

		Post.findOneAndUpdate({
			_id: job.data.comment.parent
		}, {
			$inc: { 'counts.children': 1 }
		},
		function (err, parent) {
			User.findOne({ _id: ''+job.data.comment.author.id }, function (err, author) {
				if (err) {
					logger.error(err, "Failed to find user %s", job.data.comment.author.id)
					throw err
				}
				NotificationService.create(author, NotificationService.Types.PostComment, {
					comment: comment,
					parent: parent,
				}, function () {})
				done(err)
			})
		})
	})

	////////////////////////////////////////////////////////////////////////////////
	////////////////////////////////////////////////////////////////////////////////

	jobs.process('DELETE post comment', function (job, done) {
		please({data:{$contains:['comment']}})

		var comment = Comment.fromObject(job.data.comment)

		Post.findOneAndUpdate({
			_id: job.data.comment.parent
		}, {
			$inc: { 'counts.children': -1 }
		},
		function (err, parent) {
			User.findOne({ _id: ''+job.data.comment.author.id }, function (err, author) {
				if (err) {
					logger.error(err, "Failed to find user %s", job.data.comment.author.id)
					throw err
				}
				NotificationService.undo(author, NotificationService.Types.PostComment, {
					comment: comment,
					parent: parent,
				}, function () {})
				done(err)
			})
		})

	})

	////////////////////////////////////////////////////////////////////////////////
	////////////////////////////////////////////////////////////////////////////////

	jobs.process('NEW post', function (job, done) {
		please({data:{$contains:['post', 'author']}})

		var Resource = mongoose.model('Resource')
		var Inbox = mongoose.model('Inbox')
		var Post = Resource.model('Post')
		var User = mongoose.model('User')

		var author = User.fromObject(job.data.author)
		// Populate followers' (& author's) inboxes
		author.getPopulatedFollowers(function (err, followers) {
			InboxService.fillInboxes([author].concat(followers), {
				resource: Post.fromObject(job.data.post)._id,
				type: Inbox.Types.Post,
				author: author._id,
			}, function (err) {
				done(err)
			})
		})
	})

	////////////////////////////////////////////////////////////////////////////////
	////////////////////////////////////////////////////////////////////////////////

	/**
	 * Fix karmachunk object: caps instances object and removes duplicates.
	 */
	jobs.process('FIX karmachunk', function (job, done) {
		// please({data:{$contains:['kcId']}})
		// var KarmaChunk = mongoose.model('KarmaChunk')
		// KarmaChunk.find({ _id: job.data.kcId }, function (err, doc) {
		// 	if (err) {
		// 		logger.error(err, "Failed to find KarmaChunk (%s)", job.data.kcId)
		// 		throw err
		// 	}
		// 	// Let us see what we have here...
		// })
	})

	////////////////////////////////////////////////////////////////////////////////
	////////////////////////////////////////////////////////////////////////////////

	// Cron jobs below

	function createCronJob (fn, wait, name) {
		jobQueue.process('cron-'+name, function (job, done) {
		  var milisecondsTillThurs = wait
		  jobQueue.create('cron-'+name).delay(wait).save()
		  fb(done)
		})
		// Check if the job exists yet, and create it otherwise
		kue.Job.rangeByType('cron-'+name,'delayed', 0, 10, '', function (err, jobs) {
		    if (err)
		    	return handleErr(err)
		    if (!jobs.length)
		        jobQueue.create('cron-'+name).save()
		    // Start checking for delayed jobs.
		    // This defaults to checking every 5 seconds
		    jobQueue.promote()
		})
	}
}

// Server.

exports.basicAuth = function(username, password) {
  return function(req, res, next) {
    var user = basicAuth(req)

    if (!user || user.name !== username || user.pass !== password) {
      res.set('WWW-Authenticate', 'Basic realm=Authorization Required')
      return res.send(401)
    }

    next()
  }
}

function startServer() {
	if (nconf.get('KUE_SERVER_PASS')) {
		var app = express() // no tls for now
		var basicAuth = require('basic-auth')
		app.use(function (req, res, next) {
			var user = basicAuth(req)
			if (!user || user.name !== 'admin' ||
			user.pass !== nconf.get('KUE_SERVER_PASS')) {
				res.set('WWW-Authenticate', 'Basic realm=Authorization Required')
				return res.send(401)
			}
			next()
		})
		app.use(kue.app)
		var s = app.listen(nconf.get('KUE_SERVER_PORT') || 4000)
		logger.info("Kue server listening on port "+s.address().port)
	} else {
		throw new Error("Server pass not found. Add KUE_SERVER_PASS to your env.")
	}
}

if (require.main === module) {
	logger = require('./core/bunyan.js')()
	// startServer()
	process.on('uncaughtException', function (error) {
		logger.error("[consumer::uncaughtException] "+error+", stack:"+error.stack)
	})
	main()
} else {
	logger = require('./core/bunyan.js')({ name: 'JOBS' })
	startServer()

	// Start processing jobs only after mongose is connected
	if (mongoose.connection.readyState == 2) { // connecting → wait
		mongoose.connection.once('connected', main)
	} else if (mongoose.connection.readyState == 1)
		main()
	else
		throw "Unexpected mongo readyState of "+mongoose.connection.readyState
}
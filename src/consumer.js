
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
var KarmaService = new require('./core/karma')
var NotificationService = new require('./core/notification')

var Resource = mongoose.model('Resource')
var Post = Resource.model('Post')

var User = mongoose.model('User')
var Inbox = mongoose.model('Inbox')
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
		NotificationService.create(follower, NotificationService.Types.NewFollower,
			{
				follow: follow,
				followee: followee
			}, function () {})

		// Trigger creation of activity to timeline
		// Activity.Trigger(follower, Notification.Types.NewFollower)({
		// 	follow: follow,
		// 	follower: follower,
		// 	followee: followee,
		// }, function () {
		// })

		// Create new inboxes
		Resource.find()
			.or([{__t: 'Post', parent: null, author: followee._id},
				{__t: 'Activity', actor: followee._id}])
			.limit(100)
			.exec(function (err, docs) {
				if (err || !docs) {
					logger.error('Something isn\'t right: '+err)
					return done(err || {message: 'post is '+post})
				}

				logger.info('Resources found:', err, docs && docs.length)

				async.mapLimit(docs, 5, function (resource, done) {
					inbox = new Inbox({
						resource: resource,
						recipient: follower,
						type: 'Post',
						author: resource.author || resource.actor,
						dateSent: resource.created_at // or should it be 'updated'?
					})
					inbox.save(function (err, doc) {
						logger.info('Resource '+resource._id+'of type '+resource.__t+
							' sent on '+resource.created_at+' added')
						done(err,doc)
					})
				}, function cb () {
					done()
				})
			})

		// Update followee and follower stats
		// Shouldn't this be nested and done() only called after all were executed?
		followee.update({$inc: {'stats.followers': 1}}, function () {})
		follower.update({$inc: {'stats.following': 1}}, function () {})
	})

	jobs.process('user unfollow', function (job, done) {
		var follower = User.fromObject(job.data.follower)
		var followee = User.fromObject(job.data.followee)

		Inbox.remove({
			recipient: follower._id,
			author: followee._id,
		}, function (err, result) {
			logger.info("Removing (err:"+err+") "+result+" inboxes on unfollow.")
			done()
		})

		// Update followee and follower stats
		// Shouldn't this be nested and done() only called after all were executed?
		followee.update({$inc: {'stats.followers': -1}}, function () {})
		follower.update({$inc: {'stats.following': -1}}, function () {})
	})

	jobs.process('post upvote', function (job, done) {
		please.args({data:{$contains:['authorId']}})

		var agent = User.fromObject(job.data.agent)
		var post = Post.fromObject(job.data.post)

		assert(post._id, "Post object without id.")

		KarmaService.send(agent, KarmaService.Types.PostUpvote, {
			post: post,
		}, function () {
		})

		// Notification.Trigger(agent, Notification.Types.PostUpvote)(post,
		// 	function () {
		// 	})

		// var post = Post.fromObject(job.data.resource)
		// Don't count upvotes on comments?
		// if (!post.parent || post.type === Post.Types.Comment) {
		// 	User.findById(ObjectId(job.data.authorId), function (err, author) {
		// 		author.update({$inc: {'stats.votes': 1}}, done)
		// 	})
		// }
		done()
	})

	jobs.process('post unupvote', function (job, done) {
		please.args({data:{$contains:['authorId']}})

		var agent = User.fromObject(job.data.agent)
		var post = Post.fromObject(job.data.post)

		assert(post._id, "Post object without id.")

		KarmaService.undo(agent, KarmaService.Types.PostUpvote, {
			post: post,
		}, function () {
		})

		// var post = Post.fromObject(job.data.resource)
		// Don't count upvotes on comments?
		// if (!post.parent || post.type === Post.Types.Comment) {
		// 	User.findById(ObjectId(job.data.authorId), function (err, author) {
		// 		author.update({$inc: {'stats.votes': -1}}, done)
		// 	})
		// }
		done()
	})

////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////

	/**
	 * Updates discussion count.children and list of participants.
	 */
	jobs.process('NEW discussion exchange', function (job, done) {
		please.args({data:{$contains:['exchange']}})

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
			console.log('parts', parts)
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
			console.log('parts', parts)

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
		please.args({data:{$contains:['comment']}})

		var comment = Comment.fromObject(job.data.comment)

		Post.findOneAndUpdate({
			_id: job.data.comment.parent
		}, {
			$inc: {'counts.children':1}
		},
		function (err, parent) {
			User.findOne({ _id: ''+job.data.comment.author.id }, function (err, author) {
				if (err)
					throw err;
				console.log("Aproveitando.")
				NotificationService.create(author, NotificationService.Types.PostComment,
					{
						comment: comment,
						parent: parent,
					}, function () {})
				done(err)
			});
		})
	})

////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////

	jobs.process('DELETE post child', function (job, done) {
		please.args({data:{$contains:['child']}})
		var Post = mongoose.model('Resource').model('Post')
		Post.findOneAndUpdate({ _id: job.data.child.parent },
			{ $inc: {'counts.children':-1} },
			function (err, n) {
				done(err)
			})
	})

////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////

	jobs.process('post new', function (job, done) {
		please.args({data:{$contains:['post', 'author']}})

		var Resource = mongoose.model('Resource')
		var Inbox = mongoose.model('Inbox')
		var Post = Resource.model('Post')
		var User = mongoose.model('User')

		var author = User.fromObject(job.data.author)
		// Populate followers' (& author's) inboxes
		author.getPopulatedFollowers(function (err, followers) {
			Inbox.fillInboxes([author].concat(followers), {
				resource: Post.fromObject(job.data.post)._id,
				type: Inbox.Types.Post,
				author: author._id,
			}, function (err) {
				done(err)
			})
		})

		// Update author's status here?
	})

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

// Server

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
	main()
	startServer()
}
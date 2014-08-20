
// consumer.js
// for QILabs.org
// Scrip to consume kue jobs.

var mongoose = require('./config/mongoose.js')
var please = require('./lib/please.js')
var ObjectId = mongoose.Types.ObjectId

function main (app) {
	var jobs = require('./config/kue.js') // get kue (redis) connection

	console.log('Jobs queue started. Listening on port', jobs.client.port)

	jobs.process('user follow', function (job, done) {

		var Resource = mongoose.model('Resource')
		var Inbox = mongoose.model('Inbox')
		var async = require('async')
		var User = Resource.model('User')

		var follower = User.fromObject(job.data.follower)
		var followee = User.fromObject(job.data.followee)

		// Create new inboxes
		Resource.find()
			.or([{__t: 'Post', parentPost: null, author: followee._id},{__t: 'Activity', actor: followee._id}])
			.limit(100)
			.exec(function (err, docs) {
				if (err || !docs) {
					console.error('Something isn\'t right: '+err)
					return done(err || {message: 'post is '+post})
				}

				console.log('Resources found:', err, docs && docs.length)

				async.mapLimit(docs, 5, function (resource, done) {
					inbox = new Inbox({
						resource: resource,
						recipient: follower,
						type: 'Post',
						author: resource.author || resource.actor,
						dateSent: resource.created_at // or should it be 'updated'?
					})
					inbox.save(function (err, doc) {
						console.log('Resource '+resource.id+'of type '+resource.__t+' sent on '+resource.created_at+' added')
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

		var Resource = mongoose.model('Resource')
		var Inbox = mongoose.model('Inbox')
		var User = Resource.model('User')

		var follower = User.fromObject(job.data.follower)
		var followee = User.fromObject(job.data.followee)

		Inbox.remove({
			recipient: follower.id,
			author: followee.id,
		}, function (err, result) {
			console.log("Removing (err:"+err+") "+result+" inboxes on unfollow.")
			done()
		})

		// Update followee and follower stats
		// Shouldn't this be nested and done() only called after all were executed?
		followee.update({$inc: {'stats.followers': -1}}, function () {})
		follower.update({$inc: {'stats.following': -1}}, function () {})
	})

	jobs.process('post upvote', function (job, done) {
		please.args({data:{$contains:['authorId']}})

		var Resource = mongoose.model('Resource')
		var Post = Resource.model('Post')
		var User = Resource.model('User')

		var post = Post.fromObject(job.data.post)

		// Don't count upvotes on comments?
		if (!post.parentPost || post.type === Post.Types.Comment) {
			User.findById(ObjectId(job.data.authorId), function (err, author) {
				author.update({$inc: {'stats.votes': 1}}, done)
			})
		}
	})

	jobs.process('post unupvote', function (job, done) {
		please.args({data:{$contains:['authorId']}})

		var Resource = mongoose.model('Resource')
		var Post = Resource.model('Post')
		var User = Resource.model('User')

		var post = Post.fromObject(job.data.post)

		// Don't count upvotes on comments?
		if (!post.parentPost || post.type === Post.Types.Comment) {
			User.findById(ObjectId(job.data.authorId), function (err, author) {
				author.update({$inc: {'stats.votes': -1}}, done)
			})
		}
	})

	jobs.process('post new', function (job, done) {
		please.args({data:{$contains:['post', 'author']}})

		var Resource = mongoose.model('Resource')
		var Inbox = mongoose.model('Inbox')
		var Post = Resource.model('Post')
		var User = Resource.model('User')

		var author = User.fromObject(job.data.author)
		// Populate followers' (& author's) inboxes
		author.getPopulatedFollowers(function (err, followers) {
			Inbox.fillInboxes([author].concat(followers), {
				resource: Post.fromObject(job.data.post).id,
				type: Inbox.Types.Post,
				author: author.id,
			}, function (err) {
				done(err)
			})
		})

		// Update author's status here?
	})
}

if (require.main === module)
	main()
else
	module.exports = main 
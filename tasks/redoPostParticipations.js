
var async = require('async')
var mongoose = require('mongoose')
var _ = require('lodash')
var ObjectId = mongoose.Types.ObjectId

jobber = require('./jobber.js')(function (e) {

	var Post = mongoose.model("Post");
	var User = mongoose.model("User");
	var CommentTree = mongoose.model("CommentTree");
	var Comment = mongoose.model("Comment");

	function workPost (post, done) {
		if (!post.comment_tree)
			return done();
		CommentTree.findOne({ _id: post.comment_tree }, function (err, tree) {
			if (err)
				throw err;

			var counts = {};
			// console.log(tree, _.keys(tree))
			async.map(tree.docs, function (comment, done) {
				if (counts[comment.author.id])
					counts[comment.author.id].count += 1
				else
					counts[comment.author.id] = {
						count: 1,
						user: comment.author,
					}
				done()
			}, function (err, results) {
				console.log("Comments done for post", post.content.title, post._id);
				var o = _.toArray(counts);
				_.sortBy('parts', o);
				post.participations = o;
				post.save(function (err, post) {
					if (err)
						throw err;
					console.log(post.participations)
					done();
				})
			});
		});
	}

	var targetPostId = process.argv[2]
	if (targetPostId) {
		Post.findOne({_id: targetPostId}, function (err, post) {
			workPost(post, e.quit)
		});
	} else {
		console.warn("No target post id supplied. Doing all.");
		Post.find({}, function (err, posts) {
			async.map(posts, workPost, e.quit)
		});
	}
}).start()
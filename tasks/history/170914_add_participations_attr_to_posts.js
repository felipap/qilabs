
var async = require('async')
var mongoose = require('mongoose')
var _ = require('lodash')
var ObjectId = mongoose.Types.ObjectId

// how is migration gonna work?

// Add participations

jobber = require('../lib/jobber.js')(function (e) {

	var Post = mongoose.model("Resource").model("Post");
	var User = mongoose.model("Resource").model("User");
	var CommentTree = mongoose.model("Resource").model("CommentTree");
	var Comment = mongoose.model("Resource").model("Comment");

	Post.find({type:'Discussion'}, function (err, docs) {

		async.map(docs, function (post, done) {
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
		}, function (err, results) {
			e.quit();
		});

	});

}).start()
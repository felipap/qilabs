
var async = require('async')
var mongoose = require('mongoose')
var _ = require('lodash')
var ObjectId = mongoose.Types.ObjectId

// how is migration gonna work?

// Add participations

jobber = require('../jobber.js')(function (e) {

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
					counts[JSON.stringify(comment.author)] = (counts[comment.author] || 0) + 1;
					done()
				}, function (err, results) {
					console.log("Comments done for post", post.content.title, post._id);
					// console.log(counts)
					console.log("\n\n--------------------------------------------\n\n")
					var o = _.map(counts, function (val, key) {
						return {
							user: JSON.parse(key),
							count: val
						}
					});
					delete post.contributions
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
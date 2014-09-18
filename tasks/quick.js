
var async = require('async')
var mongoose = require('mongoose')
var _ = require('lodash')
var ObjectId = mongoose.Types.ObjectId

// how is migration gonna work?

jobber = require('./jobber.js')(function (e) {

	var Post = mongoose.model("Resource").model("Post");
	var User = mongoose.model("Resource").model("User");
	var CommentTree = mongoose.model("Resource").model("CommentTree");
	var Comment = mongoose.model("Resource").model("Comment");

	Post.update({subject:'olimpiada-de-matematica'}, {subject:'mathematics'}, {multi:true}, function (err, docs) {
		console.log(arguments)

	});

}).start()
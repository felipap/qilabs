
var async = require('async')
var mongoose = require('mongoose')
var _ = require('lodash')
var ObjectId = mongoose.Types.ObjectId

// how is migration gonna work?

jobber = require('./jobber.js')(function (e) {

	var KarmaService = require('src/core/karma')
	var User = mongoose.model("User");
	var Comment = mongoose.model("Resource").model("Comment");
	var CommentTree = mongoose.model("CommentTree");

	Comment.find({  }).exec(function (err, docs) {
		console.log(err, docs)
		for (var i=0; i<docs.length; ++i) {
			console.log(docs[i].docs)
		}
	});
}).start()
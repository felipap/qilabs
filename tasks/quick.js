
var async = require('async')
var mongoose = require('mongoose')
var _ = require('lodash')
var ObjectId = mongoose.Types.ObjectId

jobber = require('./jobber.js')(function (e) {

	Post = mongoose.model('Post');
	Problem = mongoose.model('Problem');

	// User.find({ participations: { $ne: null } }, function (err, posts) {
	// });

	Problem.remove({}, function () {

	})

}).start()
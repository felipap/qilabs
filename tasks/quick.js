
var async = require('async')
var mongoose = require('mongoose')
var _ = require('lodash')
var ObjectId = mongoose.Types.ObjectId

jobber = require('./jobber.js')(function (e) {

	Post = mongoose.model('Post');
	Problem = mongoose.model('Problem');
	User = mongoose.model('User');

	// User.find({}, function (err, users) {

	// 	for (var i=0; i<users.length; ++i) {

	// 		users[i].meta.last_access = users[i].meta.last_signin;
	// 		users[i].save();
	// 	}

	// });
	Problem.update({ topic: 'Mecânica' }, { topic: 'mechanics' }, { multi: true }, function () {
		console.log(arguments);
	})

	// Problem.remove({}, function () {

	// })

}).start()
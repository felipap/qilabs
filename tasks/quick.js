
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
	Problem.find({}, function (err, all) {
		if (err)
			throw err;
		function getImg (post) {
			var body = post.content.body;
			return /(?:!\[.*?\]\()(.+?)\)/g.exec(body);
		}
		async.map(all, function (item, done) {
			if (item.content.cover)
				return done();
			var url = getImg(item)
			if (!url) {
				done();
				return;
			}
			Problem.findOneAndUpdate({ _id: item.id }, { 'content.cover': url[1]  }, function (err, doc) {
				console.log('\nitem', item.id, url[1])
				if (!doc) {
					console.log('no content', doc, item.id, arguments)
				} else {
					console.log('done?', err, doc)
				}
				done();
			});
		}, function (err, results) {
		})
	})

}).start()
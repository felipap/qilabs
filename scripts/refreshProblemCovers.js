
var async = require('async')
var mongoose = require('mongoose')

jobber = require('./lib/jobber.js')(function (e) {

	Post = mongoose.model('Post');
	Problem = mongoose.model('Problem');
	User = mongoose.model('User');

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
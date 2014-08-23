
var async = require('async')

jobber = require('./jobber.js')(function (e) {
	var mongoose = require('mongoose')
	var Post = mongoose.model('Resource').model('Post')

	var Post = mongoose.model('Resource').model('Post')

	Post.find({ parentPost: {$ne: null} }, function (err, docs) {
		if (err) {
			console.log("ERRO:", err);
		}

		// console.log(docs.length)
		// async.map(docs, function (doc, done) {
		// 	if (doc.parent) {
		// 		console.log(doc.id, doc.parent, doc.parentPost)
		// 	} else {
		// 		console.log(doc.id)
		// 	}
		// 	doc.update({parent:doc.parentPost},)
		// 	doc.id.parent
		// 	done()
		// }, function (err, results) {
		// })
	});
}).start()
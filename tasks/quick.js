
var async = require('async')
var mongoose = require('mongoose')
var _ = require('lodash')
var ObjectId = mongoose.Types.ObjectId

// how is migration gonna work?

jobber = require('./jobber.js')(function (e) {

	var KarmaService = require('src/core/karma')
	var User = mongoose.model("User");
	var KarmaChunk = mongoose.model("KarmaChunk");

	KarmaChunk.find({  }).exec(function (err, docs) {
		async.map(docs, function (e, done) {
			console.log(e)
			for (var i=0; i<e.items.length; i++) {
				e.items[i].updated_at = e.items[i].last_update;
			}
			e.save(function (err) {
				console.log(e)
				done(err);
			})
		}, function (err, results) {
			console.log("Quitting", err)
			e.quit();
		})
	});
}).start()
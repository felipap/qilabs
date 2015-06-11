
var async = require('async')
var mongoose = require('mongoose')
var _ = require('lodash')

jobber = require('./lib/jobber.js')(function (e) {
	var Post = mongoose.model('Post')

	function workPost(user, done) {
		require('app/jobs/refreshPostParticipations')(post, done)
	}

	var targetId = process.argv[2]
	if (targetId) {
		Post.findOne({ _id: targetId }, (err, doc) => {
			workPost(doc, e.quit)
		})
	} else {
		console.warn('No target user id supplied. Doing all.')
		Post.find({}, (err, docs) => {
			async.mapSeries(docs, workPost, e.quit)
		})
	}
}).start()

var async = require('async')
var mongoose = require('mongoose')
var _ = require('lodash')

jobber = require('./lib/jobber.js')(function (e) {
	var User = mongoose.model('User')
	var jobs = require('app/config/kue')

	function workUser(user, done) {
		jobs.create('userCreated', {
			userId: user.id,
		}).save(() => {
			console.log('created')
			done()
		})
	}

	var targetId = process.argv[2]
	targetId = '55778905c474fa03007d61c1'

	if (targetId) {
		User.findOne({ _id: targetId }, (err, doc) => {
			workUser(doc, e.quit)
		})
	} else {
		console.warn('No target user id supplied. Doing all.')
		User.find({}, (err, docs) => {
			async.mapSeries(docs, workUser, e.quit)
		})
	}
}).start()
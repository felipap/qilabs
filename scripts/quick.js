
var async = require('async')
var mongoose = require('mongoose')
var _ = require('lodash')

jobber = require('./lib/jobber.js')(function (e) {
	var ProblemSet = mongoose.model('ProblemSet')
	var jobs = require('app/config/kue')

	var count = 0;

	function workItem(pset, done) {
	}

	var targetId = process.argv[2]
	if (targetId) {
		ProblemSet.findOne({ _id: targetId }, (err, doc) => {
			workItem(doc, e.quit)
		})
	} else {
		console.warn('No target pset id supplied. Doing all.')
		ProblemSet.find({}, (err, docs) => {
			async.mapSeries(docs, workItem, e.quit)
		})
	}
}).start()
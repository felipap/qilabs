
var async = require('async')
var mongoose = require('mongoose')
var _ = require('lodash')

jobber = require('./lib/jobber.js')(function (e) {
	var Problem = mongoose.model('Problem')
	var ProblemSet = mongoose.model('ProblemSet')
	var ProblemCore = mongoose.model('ProblemCore')
	var jobs = require('app/config/kue')

	var count = 0;

	function workProblem(problem, done) {
	}

	var targetId = process.argv[2]
	if (targetId) {
		Problem.findOne({ _id: targetId }, (err, doc) => {
			workProblem(doc, e.quit)
		})
	} else {
		console.warn('No target problem id supplied. Doing all.')
		Problem.find({}, (err, docs) => {
			async.mapSeries(docs, workProblem, e.quit)
		})
	}
}).start()
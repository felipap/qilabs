
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
		console.log('-------------------')

		function getImages(text) {
			var images = text.match(/!\[.*?\]\(.+?\)/g)
			return _.map(images, (i) => i.match(/^!\[.*?\]\((.+?)\)$/)[1])
		}

		if (problem.answer.is_mc) {
			var answer = problem.answer.option;
		} else {
			var answer = problem.answer.value;
		}

		var core = new ProblemCore({
			name: problem.title,
			body: problem.body,

			level: problem.level,
			topic: problem.topic,
			subject: problem.subject,

			topic: problem.topic,
			images: getImages(problem.body),

			isMultipleChoice: problem.answer.is_mc,
			answer: answer,

			// author: undefined,

			solution: problem.solution,
			pset: '',
		})

		// console.log(getImages(problem.body))
		if (!problem._set) {
			// console.log(problem)
		}

		ProblemSet.findOne({ problem_ids: ''+problem.id }, (err, pset) => {
			if (err) {
				throw err
			}
			if (!pset) {
				console.warn('couldn\'t find pset for problem', problem)
			}
			done()
		})

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
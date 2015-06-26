
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
		console.log()

		function getImages(text) {
			var images = text.match(/!\[.*?\]\(.+?\)/g)
			return _.map(images, (i) => i.match(/^!\[.*?\]\((.+?)\)$/)[1])
		}

		if (problem.answer.is_mc) {
			var answer = problem.answer.options;
		} else {
			var answer = problem.answer.value;
		}

		var core = new ProblemCore({
			name: problem.title,
			body: problem.body,
			source: problem.source,

			level: problem.level,
			topic: problem.topic,
			subject: problem.subject,

			topic: problem.topic,
			images: getImages(problem.body),

			isMultipleChoice: problem.answer.is_mc,
			answer: answer,
		})

		if (problem.solution) {
			core.solution = problem.solution
		}

		if (problem.pset) {
			core.pset = problem.pset
			core.localIndex = problem.localIndex
		}

		// console.log(getImages(problem.body))
		if (!problem.pset && problem.localIndex) {
			console.log(problem.title)
		}

		console.log(core)
		done()

		// ProblemSet.findOne({ problem_ids: ''+problem.id }, (err, pset) => {
		// 	if (err) {
		// 		throw err
		// 	}
		// 	if (!pset) {
		// 		if (!problem.source) {
		// 			console.log(problem.title)
		// 		}
		// 		console.log(problem.source, problem.id)
		// 		// console.log(JSON.stringify(problem), ',')
		// 		// console.log(count++)
		// 		// console.warn('couldn\'t find pset for problem', problem)
		// 	}
		// 	Problem.findOneAndUpdate({ _id: problem.id }, { pset: pset?''+pset.id:null }, (err, doc) => {
		// 		if (err) {
		// 			throw err
		// 		}
		// 		console.log('doc?', doc.pset)
		// 		done()
		// 	})
		// })

	}

	function main() {
		Problem.find({}, (err, docs) => {
			async.mapSeries(docs, workProblem, e.quit)
		})
	}

	ProblemSet.find({}, (err, docs) => {
		if (err) {
			throw err
		}

		var pids = [];
		docs.forEach((d) => {
			// console.log(d.problem_ids)
			d.problem_ids.forEach((pid) => {
				if (pids.indexOf(pid) !== -1) {
					throw new Error('what the fuck')
				}
			})
			pids = pids.concat(d.problem_ids);
		})
		// console.log(pids, pids.length)
	})

	Problem.count({pset:null}, (err, doc) => {
		console.log(doc)
	})

	main()

}).start()
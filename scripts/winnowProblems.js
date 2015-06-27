
var async = require('async')
var mongoose = require('mongoose')
var _ = require('lodash')

jobber = require('./lib/jobber.js')(function (e) {
	var Problem = mongoose.model('Problem')
	var ProblemSet = mongoose.model('ProblemSet')
	var ProblemCore = mongoose.model('ProblemCore')
	var ProblemCache = mongoose.model('ProblemCache')
	var jobs = require('app/config/kue')

	var count = 0;

	function updatePsetsWithNewIds(translation, done) {
		ProblemSet.find({}, (err, psets) => {
			if (err) {
				throw err
			}

			async.map(psets, (pset, done) => {
				console.log(_.sortBy(translation[pset.id], 'index'), _.pluck(_.sortBy(translation[pset.id], 'index'), 'id'))
				var oldIds = _.pluck(_.sortBy(translation[pset.id], 'index'), 'id');
				// var newIds = [];

				// var newIds = _.map(pset.problem_ids, (i) => translation[i])
				// console.log(pset.id, '\n', pset.problem_ids, newIds, '\n')

				ProblemSet.findOneAndUpdate({ _id: pset.id }, { problem_ids: oldIds },
					(err, pset) => {
						if (err) {
							throw err
						}

						if (!pset) {
							throw new Error('pqp não encontrado!', pset.id)
						}
						console.log('pset atualizado', pset.id)
						done()
					})
				done()
			}, done)
		})
	}

	var setChildren = {};

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

		var name = null;
		if (problem.title) {
			if (!problem.source || problem.title.toLowerCase() !== problem.source.toLowerCase()) {
				name = problem.title;
			}
		}

		var core = new ProblemCore({
			name: name,
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

		core.originalIndex = problem.localIndex
		if (problem.pset) {
			core.originalPset = problem.pset
			console.log('------------------------------------------')
		}

		// console.log(getImages(problem.body))
		if (!problem.pset && problem.localIndex) {
			console.log(problem.title)
		}

		core.save((err, core) => {
			if (err) {
				throw err
			}

			var tries = problem.userTries;
			tries.forEach((i) => {
				i.lastTry = i.last_try;
				delete i.last_try
			})

			var cache = new ProblemCache({
				problem: core.id,
				hasAnswered: problem.hasAnswered,
				hasSeenAnswers: problem.hasSeenAnswers,
				userTries: tries,
				likes: problem.votes,
			})

			cache.save((err, doc) => {
				if (err) {
					throw err
				}

				if (problem.pset) {
					if (!setChildren[problem.pset]) {
						setChildren[problem.pset] = []
					}
					setChildren[problem.pset].push({ id: core.id, index: parseInt(problem.localIndex) })
				}
				done()
			})

		})

		console.log(core)

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
			async.mapLimit(docs, 20, workProblem, (err) => {
				if (err) {
					throw err
				}

				console.log(setChildren)
				updatePsetsWithNewIds(setChildren, (err) => {
					e.quit()
				})
			})
		})
	}

	// ProblemSet.find({}, (err, docs) => {
	// 	if (err) {
	// 		throw err
	// 	}

	// 	var pids = [];
	// 	docs.forEach((d) => {
	// 		d.problem_ids.forEach((pid) => {
	// 			if (pids.indexOf(pid) !== -1) {
	// 				throw new Error('what the fuck')
	// 			}
	// 		})
	// 		pids = pids.concat(d.problem_ids);
	// 	})
	// })

	Problem.count({pset:null}, (err, doc) => {
		console.log(doc)
	})

	main()

}).start()
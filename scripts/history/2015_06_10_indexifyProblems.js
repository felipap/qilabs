
// code bellow is not my proudest achievement

var async = require('async')
var mongoose = require('mongoose')
var _ = require('lodash')

jobber = require('./lib/jobber.js')(function (e) {
	var Problem = mongoose.model('Problem')
	var ProblemSet = mongoose.model('ProblemSet')

	function findIndex (problem, cb) {
		console.log('-----------------------------------')

		if (problem.localIndex) {
			console.log('localIndex '+problem.localIndex+' already here. skipping')
			cb()
			return
		}

		if (!problem.source) {
			console.warn(problem.id, "!!!!!!!!!!!!!!NO SOURCE!!!!!!!!!!!!!")
			cb(true)
			return
		}

		var match = problem.source.match(/n[úu]mero 0?(\d+)/i)
		var index = match[1]
		if (index) {
			console.log(problem.source, '→', parseInt(index))
			return cb(null, parseInt(index))
		} else {
			console.warn('failed '+problem.source)
			cb(true)
		}

		cb()
	}

	function workPset(pset, done) {
		var pids = _.map(pset.problemIds, (i) => ''+i)

		function findAndUpdate(problem, cb) {
			findIndex(problem, (err, index) => {
				if (err) {
					throw err
				}

				Problem.findOneAndUpdate({ _id: problem.id }, { localIndex: index },
					(err, doc) => {
						console.log('DONEENNENENE')
						cb()
					})
			})
		}

		Problem.find({ _id: { $in: pids } }, (err, problems) => {
			if (err) {
				throw err
			}

			async.mapSeries(problems, findIndex, (err, results) => {
				if (err) {
					throw err
				}
				console.log('results!', results)
				console.log('\n')
				console.log('about to substitute indeces')
				e.checkContinue(() => {
					async.mapSeries(problems, findAndUpdate, (err, results) => {
						console.log("substituted all")
						done()
					})
				})
			})
		})
	}

	var targetId = process.argv[2]
	// targetId = '54c67aec9364942b2177eca4'
	if (targetId) {
		ProblemSet.findOne({ _id: targetId }, (err, doc) => {
			workPset(doc, e.quit)
		})
	} else {
		console.warn('No target user id supplied. Doing all.')
		ProblemSet.find({}, (err, docs) => {
			async.mapSeries(docs, workPset, e.quit)
		})
	}
}).start()
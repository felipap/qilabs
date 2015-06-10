
// code bellow is not my proudest achievement

var async = require('async')
var mongoose = require('mongoose')
var _ = require('lodash')

jobber = require('./lib/jobber.js')(function (e) {
	var Problem = mongoose.model('Problem')
	var ProblemSet = mongoose.model('ProblemSet')

	function workPset(pset, done) {
		function makeSlug() {
			var year = pset.year
			var round = pset.round.split('-')[1]
			var level = pset.level.split('-')[1]
			return pset.name.toLowerCase()+year+'-nivel-'+level+'-fase-'+round
		}

		var slug = makeSlug()

		ProblemSet.findOneAndUpdate({ _id: pset.id }, { slug: slug },
		(err, doc) => {
			if (err) {
				throw err
			}
			done()
		})

		// console.log('pset', pset.slug, ' → ', pset.slug)
		// done()
	}

	var targetId = process.argv[2]
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
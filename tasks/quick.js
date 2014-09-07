
var async = require('async')
var mongoose = require('mongoose')
var ObjectId = mongoose.Types.ObjectId

// how is migration gonna work?

jobber = require('./jobber.js')(function (e) {

	var jobs = require('src/config/kue.js') // get kue (redis) connection
	var kue = require('kue')

	kue.Job.rangeByType('job', 'completed', 0, 1000000000, 'asc', function (err, selectedJobs) {
		console.log(selectedJobs)

	})

}).start()
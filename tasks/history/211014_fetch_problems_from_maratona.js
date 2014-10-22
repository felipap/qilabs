
var async = require('async')
var mongoose = require('mongoose')
var _ = require('lodash')
var ObjectId = mongoose.Types.ObjectId

// how is migration gonna work?

jobber = require('../jobber.js')(function (e) {

	var KarmaService = require('src/core/karma')
	var User = mongoose.model("User")
	var Problem = mongoose.model("Problem")
	var maratonas = require('ignore/maratona.json').them
	var actions = require('src/core/actions/problems')

	function format (data, level) {
		return {
			subject: 'mathematics',
			// topics: ['combinatorics']
			level: level,
			topic: data.topic,
			content: {
				title: data.content.source, // data.content.title,
				body: data.content.body+ (data.content.image && " !["+data.content.image+"]()" || ''),
				solution: data.content.solution,
				source: data.content.source,
			},
			answer: {
				is_mc: false,
				options: null,
				value: data.content.answer,
			}
		}
	}

	User.findOne({ _id: "533791d92fcb660200efcb49" }, function (err, user) {
		if (err)
			throw err
		//
		console.log("NOME:", maratonas[1].names)
		for (var i=0; i<maratonas[1].docs.length; ++i) {
			var form = format(maratonas[1].docs[i],2)
			// console.log(form)
			// Problem.remove({ 'author.id': user._id }, function () { console.log("DONE?", arguments)})
			actions.createProblem(user, form, function () {
				console.log("CREATED?", arguments)
			})
		}
		// console.log("NOME:", maratonas[1].names)
		// for (var i=0; i<maratonas[1].docs.length; ++i) {
		// 	console.log(format(maratonas[1].docs[i], 2))
		// }
	})

	// actions.createProblem

}).start()
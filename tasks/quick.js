
var async = require('async')
var mongoose = require('mongoose')
var _ = require('lodash')
var ObjectId = mongoose.Types.ObjectId

// how is migration gonna work?

jobber = require('./jobber.js')(function (e) {

	var User = mongoose.model("User")
	var Problem = mongoose.model("Problem")
	var docs = require('ignore/ombMichelle.json')
	// var docs = require('ignore/obmLuiz.json')
	var actions = require('app/actions/problems')

	function format (data, level) {
		console.assert(data.corpoDoProblema, data.matria, data.fonte)
		console.assert(['combinatorics', 'geometry', 'number-theory', 'algebra'].indexOf(data.matria) != -1, data.matria)
		console.assert(data.gabarito && !isNaN(parseInt(data.gabarito)))

		return {
			subject: 'mathematics',
			level: level,
			topic: data.matria,
			content: {
				title: data.fonte, // data.content.title,
				body: data.corpoDoProblema+ (data.urlDaImagem && " ![]("+data.urlDaImagem+")" || ''),
				// solution: data.content.solution,
				source: data.fonte,
			},
			answer: {
				is_mc: false,
				options: null,
				value: data.gabarito,
			},
			_set: 2,
		}
	}

	// Problem.find({ created_at: { $gt: Date.now()-1000*60*60*30 } }, function (err, docs) {
	// 	console.log("DONE?", arguments)
	// 	if (err) {
	// 		throw err;
	// 	}
	// 	async.map(docs, function (doc, done) {
	// 		doc.remove(done);
	// 	}, function(err, results) {
	// 		console.log("err?", err, results);
	// 	})
	// })
	// return;

	var author = "michelle"
	User.findOne({ username: author }, function (err, user) {
		if (err)
			throw err
		if (!user)
			throw new Error("Author not found.");
		//
		// console.log("NOME:", docs)
		var forms = [];
		for (var i=0; i<docs.length; ++i) {
			var form = format(docs[i],3)
			console.log(form)
			forms.push(form);
		}
		for (var i=0; i<forms.length; ++i) {
			actions.createProblem(user, forms[i], function () {
				console.log("CREATED?", arguments)
			})
		}
		// console.log("NOME:", maratonas[1].names)
		// for (var i=0; i<maratonas[1].docs.length; ++i) {
		// 	console.log(format(maratonas[1].docs[i], 3))
		// }
	})

	// actions.createProblem

}).start()
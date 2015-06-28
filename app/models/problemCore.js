
'use strict'

var mongoose = require('mongoose')

var config = require('app/static/config')

/*
 * Problems don't have authors if they're taken from lists.
 */

var Schema = new mongoose.Schema({
	author: { type: String, ref: 'User', required: false },
	//
	name: { type: String },
	body: { type: String, required: true },
	source: { type: String },
	images: [{ type: String }], // a list of image paths in the problem body
	//
	level: { type: Number },
	subject: { type: String },
	topic: { type: String },
	//
	// solution: { type: String }, // README. Needed?
	answer: {},
	// If isMultipleChoice, answer is an array, the first element being
	// the right choice. Otherwise, it's a string representing the right answer.
	isMultipleChoice: { type: Boolean, required: true },
	// Identify the problem's index in its original index.
	originalIndex: { type: Number },
	originalPset: { type: String, ref: 'ProblemSet' },
	//
	updated: { type: Date },
	created: { type: Date },
}, {
	toObject: { virtuals: true },
	toJSON: 	{ virtuals: true },
})

Schema.pre('save', function (next) {
	if (!this.created) {
		this.created = new Date()
	}
	if (!this.updated) {
		this.updated = this.created
	}
	next()
})

Schema.virtual('path').get(function() {
	return "/olimpiadas/problemas/{id}".replace(/{id}/, this.id)
})

Schema.virtual('thumbnail').get(function() {
	return this.image || this.author && this.author.avatarUrl
})

Schema.virtual('maxTries').get(function() {
	return this.isMultipleChoice ? 1 : config.problemMultChoiceChances
})

Schema.virtual('apiPath').get(function() {
	return "/api/problems/{id}".replace(/{id}/, this.id)
})

//

Schema.virtual('materia').get(function () {
	return require('app/static/i18')[this.subject] || '?'
})

Schema.virtual('topico').get(function () {
	return require('app/static/i18')[this.topic] || '?'
})

Schema.methods.toMetaObject = function () {
	return {
		title: this.name,
		description: this.body.slice(0, 300),
		image: this.images[0] || (this.author && this.author.avatarUrl),
		url: 'http:\/\/www.qilabs.org'+this.path,
		ogType: 'article',
	}
}

Schema.methods.getShuffledMCOptions = function () {
	// http://stackoverflow.com/a/12646864
	// Randomize array element order in-place.
	// Using Fisher-Yates shuffle algorithm.
	function shuffleArray(array) {
		for (var i=array.length-1; i>0; i--) {
			var j = Math.floor(Math.random() * (i + 1))
			var temp = array[i]
			array[i] = array[j]
			array[j] = temp
		}
		return array
	}

	shuffleArray(this.answer)
}

Schema.methods.hasValidAnswer = function (test) {
	console.log(test, this.isMultipleChoice, this.answer, ''+this.answer === test)
	if (this.isMultipleChoice) {
		return this.answer[0] === test
	} else {
		return ''+this.answer === ''+test
	}
}

Schema.statics.Topics = config.problemTopics
Schema.statics.Subjects = config.problemSubjects
Schema.statics.Levels = config.problemLevels

module.exports = Schema
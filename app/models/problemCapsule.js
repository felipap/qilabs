
var validator = require('validator')
var mongoose = require('mongoose')
var async = require('async')
var _ = require('lodash')

var labs = require('app/static/labs')

var CommentTree = mongoose.model('CommentTree')

var AuthorSchema = require('./user').statics.AuthorSchema

ProblemSchema = new mongoose.Schema({
	author: AuthorSchema,
	edits: {},

	updated:	{ type: Date },
	created:	{ type: Date },

	problem: { type: String, ref: 'Problem' },

	_set: 	{ type: Number, default: 0 },

	title:		{ type: String },
	localIndex:{ type: String },

	image:  	{ type: String },
	cover:  	{ type: String },

	counts: {
		// votes: 		{ type: Number, default: 0 },
		children:	{ type: Number, default: 0 },
	},

	hasAnswered: [],
	hasSeenAnswers: [],
	userTries: [],

	votes: 		{ type: [{ type: String, ref: 'User', required: true }], default: [] },
	comments: { type: String, ref: 'CommentTree' },
}, {
	toObject:	{ virtuals: true },
	toJSON: 	{ virtuals: true },
})

ProblemSchema.statics.APISelect = '-hasAnswered -canSeeAnswers -hasSeenAnswers -watching -userTries'
ProblemSchema.statics.APISelectAuthor = '-hasAnswered -canSeeAnswers -hasSeenAnswers -watching -userTries'

ProblemSchema.virtual('counts.votes').get(function () {
	return this.votes.length
})

ProblemSchema.virtual('counts.solved').get(function () {
	return this.hasAnswered.length
})


ProblemSchema.virtual('path').get(function () {
	return "/olimpiadas/problemas/{id}".replace(/{id}/, this.id)
})

ProblemSchema.virtual('thumbnail').get(function () {
	this.image || this.author.avatarUrl
})

ProblemSchema.virtual('apiPath').get(function () {
	return "/api/problems/{id}".replace(/{id}/, this.id)
})

// translation

ProblemSchema.virtual('materia').get(function () {
	return i18.Materias[this.subject]
})

ProblemSchema.virtual('topico').get(function () {
	var pool = labs[this.subject].topics

	for (var i=0; i<pool.length; ++i) {
		if (pool[i].id === this.topic) {
			return pool[i].name
		}
	}

	return '?'
})

ProblemSchema.virtual('path').get(function () {
	return "/olimpiadas/problemas/{id}".replace(/{id}/, this.id)
})

ProblemSchema.virtual('thumbnail').get(function () {
	return this.image || this.author.avatarUrl
})

ProblemSchema.virtual('apiPath').get(function () {
	return "/api/problems/{id}".replace(/{id}/, this.id)
})

ProblemSchema.methods.toMetaObject = function () {
	return {
		title: this.title,
		description: this.body.slice(0, 300),
		image: this.thumbnail,
		url: 'http:\/\/www.qilabs.org'+this.path,
		ogType: 'article',
	}
}

ProblemSchema.plugin(require('./lib/hookedModelPlugin'))
ProblemSchema.plugin(require('./lib/fromObjectPlugin'))
ProblemSchema.plugin(require('./lib/trashablePlugin'))
ProblemSchema.plugin(require('./lib/selectiveJSON'), ProblemSchema.statics.APISelect)

module.exports = ProblemSchema
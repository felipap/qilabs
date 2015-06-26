

validator = require('validator')
mongoose = require('mongoose')
async = require('async')
_ = require('lodash')

labs = require('app/static/labs')

AuthorSchema = require('./user').statics.AuthorSchema

ProblemCacheSchema = new mongoose.Schema({
	problem: { type: String, ref: 'Problem' },

	hasAnswered: [],
	hasSeenAnswers: [],
	userTries: [],

	likes: { type: [{ type: String, ref: 'User', required: true }], default: [] },
}, {
	toObject:	{ virtuals: true }
	toJSON: 	{ virtuals: true }
})

ProblemCacheSchema.statics.APISelect = '-hasAnswered -canSeeAnswers -hasSeenAnswers -watching -userTries -comment_tree -answer.value -answer.options'
ProblemCacheSchema.statics.APISelectAuthor = '-hasAnswered -canSeeAnswers -hasSeenAnswers -watching -userTries -comment_tree'

`
ProblemCacheSchema.virtual('counts.votes').get(function () {
	return this.likes.length
})

ProblemCacheSchema.virtual('counts.solved').get(function () {
	return this.hasAnswered.length
})
`

ProblemCacheSchema.plugin(require('./lib/hookedModelPlugin'))
ProblemCacheSchema.plugin(require('./lib/fromObjectPlugin'))
ProblemCacheSchema.plugin(require('./lib/trashablePlugin'))
ProblemCacheSchema.plugin(require('./lib/selectiveJSON'), ProblemCacheSchema.statics.APISelect)

module.exports = ProblemCacheSchema
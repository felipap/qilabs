
var mongoose = require('mongoose')

Schema = new mongoose.Schema({
	problem: { type: String, ref: 'Problem', index: 1 },

	hasAnswered: [],
	hasSeenAnswers: [],
	userTries: [],
	likes: { type: [{ type: String, ref: 'User', required: true }], default: [] },
}, {
	toObject:	{ virtuals: true },
	toJSON: 	{ virtuals: true },
})

Schema.plugin(require('./lib/hookedModelPlugin'))
Schema.plugin(require('./lib/fromObjectPlugin'))
Schema.plugin(require('./lib/trashablePlugin'))
Schema.plugin(require('./lib/selectiveJSON'), Schema.statics.APISelect)

module.exports = Schema
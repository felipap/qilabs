
var mongoose = require('mongoose')
var _ = require('lodash')

var Types = {
	'PostUpvote': 'PostUpvote',
	// CommentUpvote: 'CommentUpvote',
}

var Points = {
	PostUpvote: 10,
}

var KarmaItemSchema = new mongoose.Schema({
	identifier: { type: String, required: true }, // Identifies actions of same nature
	type:				{ type: String, enum: _.values(Types), required: true },
	resource: 	{ type: mongoose.Schema.ObjectId, required: true },
	path: 			{ type: String, required: false },
	object: 		{ }, // name, thumbnail...
	instances: [{
		key: 			{ type: String, required: true },
		name:			{ type: String, required: true },
		path:			{ type: String },
		created_at: { type: Date, default: Date.now },
		// _id:	false
	}],
	multiplier: { type: Number, default: 1 },
	created_at: { type: Date, default: Date.now },
	updated_at:	{ type: Date, default: Date.now, index: 1 },
})

KarmaItemSchema.statics.Types = Types
KarmaItemSchema.statics.Points = Points

module.exports = KarmaItemSchema
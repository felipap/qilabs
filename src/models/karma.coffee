
# src/models/karma
# for QI Labs
# by @f03lipe

mongoose = require 'mongoose'
_ = require 'lodash'

ObjectId = mongoose.Schema.ObjectId

Types =
	PostUpvote: 'PostUpvote'
	# CommentUpvote: 'CommentUpvote'

Points = {
	PostUpvote: 10
}

module.exports = ->
module.exports.start = () ->

################################################################################
## Schema ######################################################################

KarmaItemSchema = new mongoose.Schema {
	identifier: { type: String, required: true } # Identifies actions of same nature
	type:				{ type: String, enum: _.values(Types), required: true }
	resource: 	{ type: ObjectId, required: true }
	path: 			{ type: String, required: false }
	object: 		{ } # name, thumbnail...
	instances: [{
		key: 			{ type: String, required: true }
		name: 		{ type: String, required: true }
		path: 		{ type: String }
		created_at: { type: Date, default: Date.now }
		# _id:	false
	}]
	multiplier: { type: Number, default: 1 }
	created_at: { type: Date, default: Date.now }
	updated_at:	{ type: Date, default: Date.now, index: 1 }
}

KarmaChunkSchema = new mongoose.Schema {
	user: 			{ type: ObjectId, ref: 'User', required: true, index: 1 }
	items: 			[KarmaItemSchema]
	updated_at: { type: Date, default: Date.now, index: 1 }
	started_at: { type: Date, default: Date.now }
	last_seen: 	{ type: Date, default: Date.now }
}

KarmaChunkSchema.statics.APISelect = '-items.identifier -items.resource -items.id
-items._id -items.instances.key -items.instances.id -items.instances._id'
KarmaItemSchema.statics.Types = Types
KarmaItemSchema.statics.Points = Points

KarmaChunkSchema.plugin(require('./lib/trashablePlugin'))
KarmaChunkSchema.plugin(require('./lib/selectiveJSON'), KarmaChunkSchema.statics.APISelect)

KarmaItem = mongoose.model 'KarmaItem', KarmaItemSchema
KarmaChunk = mongoose.model 'KarmaChunk', KarmaChunkSchema
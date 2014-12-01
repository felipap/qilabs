
# app/models/karma_chunk
# for QI Labs
# by @f03lipe

mongoose = require 'mongoose'
KarmaItemSchema = require './karma'

KarmaChunkSchema = new mongoose.Schema {
	user: 			{ type: mongoose.Schema.ObjectId, ref: 'User', required: true, index: 1 }
	items: 			[KarmaItemSchema]
	updated_at: { type: Date, default: 0, index: 1 }
	started_at: { type: Date, default: 0 }
	last_seen: 	{ type: Date, default: Date.now }
}

KarmaChunkSchema.statics.APISelect = '
	-items.identifier
	-items.resource
	-items._id
	-items.instances.key
	-items.instances.id
	-items.instances._id'

KarmaChunkSchema.plugin(require('./lib/trashablePlugin'))
KarmaChunkSchema.plugin(require('./lib/selectiveJSON'), KarmaChunkSchema.statics.APISelect)

module.exports = KarmaChunkSchema



# app/models/notification_chunk
# for QI Labs
# by @f03lipe

mongoose = require 'mongoose'
NotificationItemSchema = require './notification'

NotificationChunkSchema = new mongoose.Schema {
	user:		 		{ type: mongoose.Schema.ObjectId, ref: 'User', required: true, index: 1 }
	items:			[NotificationItemSchema]
	updated_at: { type: Date, default: Date.now, index: 1 }
	started_at: { type: Date, default: Date.now }
	last_seen: 	{ type: Date, default: 0 }
}

NotificationChunkSchema.statics.APISelect = '-items.resource -items.identifier
-items._id -items.instances.id -items.instances._id -items.instances.key'

NotificationChunkSchema.plugin(require('./lib/selectiveJSON'), NotificationChunkSchema.statics.APISelect)
NotificationChunkSchema.plugin(require('./lib/trashablePlugin'))

module.exports = NotificationChunkSchema
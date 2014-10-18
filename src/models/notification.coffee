
# src/models/notification
# for QI Labs
# by @f03lipe

mongoose = require 'mongoose'
_ = require 'lodash'

ObjectId = mongoose.Schema.ObjectId

Types =
	PostComment: 'PostComment'
	NewFollower: 'NewFollower'
	CommentReply: 'CommentReply'
	# SharedPost: 'SharedPost'

module.exports = () ->
module.exports.start = () ->

################################################################################
## Schema ######################################################################

NotificationItemSchema = new mongoose.Schema {
	identifier: { type: String, required: true } # Identifies actions of same nature
	type:				{ type: String, enum: _.values(Types), required: true }
	resource:		{ type: ObjectId, required: true }
	path:				{ type: String, required: false }
	object: 		{ } # name, thumbnail...
	instances: [{
		key: 			{ type: String, required: true }
		path: 		{ type: String, required: true }
		object: 	{ } # name, avatarUrl?
		created_at: { type: Date, default: Date.now, index: 1 }
		# _id:	false
	}]
	multiplier: { type: Number, default: 1 }
	created_at: { type: Date, default: Date.now }
	updated_at: { type: Date, default: Date.now }
}

NotificationChunkSchema = new mongoose.Schema {
	user:		 		{ type: ObjectId, ref: 'User', required: true, index: 1 }
	items:			[NotificationItemSchema]
	updated_at: { type: Date, default: Date.now, index: 1 }
	started_at: { type: Date, default: Date.now }
	last_seen: 	{ type: Date, default: 0 }
}

NotificationChunkSchema.statics.APISelect = '-items.resource -items.identifier
-items._id -items.instances.id -items.instances._id -items.instances.key'
NotificationItemSchema.statics.Types = Types

NotificationChunkSchema.plugin(require('./lib/selectiveJSON'), NotificationChunkSchema.statics.APISelect)
NotificationChunkSchema.plugin(require('./lib/trashablePlugin'))

Notification = mongoose.model 'Notification', NotificationItemSchema
NotificationChunk = mongoose.model 'NotificationChunk', NotificationChunkSchema
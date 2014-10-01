
# src/models/notification
# for QI Labs
# by @f03lipe

mongoose = require 'mongoose'
async = require 'async'
_ = require 'lodash'

please = require 'src/lib/please.js'
logger = require('src/core/bunyan')()

ObjectId = mongoose.Schema.ObjectId

Types =
	PostComment: 'PostComment'
	NewFollower: 'NewFollower'
	# SharedPost: 'SharedPost'
	ReplyComment: 'ReplyComment'

module.exports = () ->
module.exports.start = () ->

################################################################################
## Schema ######################################################################

NotificationSchema = new mongoose.Schema {
	identifier: { type: String, required: true } # Identifies actions of same nature
	type:		{ type: String, enum: _.values(Types), required: true }
	resource:	{ type: ObjectId, required: true }
	path:		{ type: String, required: false }
	object: 	{ } # name, thumbnail...
	instances: [{
		identifier: { type: String }
		created_at: { type: Date, default: Date.now, index: 1 }
		name: 	{ type: String, required: true }
		path: 	{ type: String }
		_id:	false
	}]

	multiplier: { type: Number, default: 1 }
	created_at: { type: Date, default: Date.now }
	updated_at: { type: Date, default: Date.now }
}
NotificationSchema.statics.APISelect = '__t __v _id resource identifier'

NotificationChunkSchema = new mongoose.Schema {
	user:	 	{ type: ObjectId, ref: 'User', required: true, index: 1 }
	items:		[NotificationSchema]
	updated_at: { type: Date, default: Date.now, index: 1 }
	started_at: { type: Date, default: Date.now }
	last_seen: 	{ type: Date, default: 0 }
}

NotificationSchema.statics.Types = Types
NotificationSchema.plugin(require('./lib/hookedModelPlugin'));
Notification = mongoose.model 'Notification', NotificationSchema

NotificationChunkSchema.plugin(require('./lib/trashablePlugin'))
NotificationSchema.plugin(require('./lib/selectiveJSON'), NotificationSchema.statics.APISelect)
NotificationChunk = mongoose.model 'NotificationChunk', NotificationChunkSchema
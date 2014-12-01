
# app/models/notification
# for QI Labs
# by @f03lipe

mongoose = require 'mongoose'
_ = require 'lodash'

Types =
	PostComment: 'PostComment'
	NewFollower: 'NewFollower'
	CommentReply: 'CommentReply'
	CommentMention: 'CommentMention'
	# SharedPost: 'SharedPost'

NotificationItemSchema = new mongoose.Schema {
	identifier: { type: String, required: true } # Identifies actions of same nature
	type:				{ type: String, enum: _.values(Types), required: true }
	resource:		{ type: mongoose.Schema.ObjectId, required: true }
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

NotificationItemSchema.statics.Types = Types

module.exports = NotificationItemSchema
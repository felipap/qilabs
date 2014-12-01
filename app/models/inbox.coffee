
# app/models/inbox
# for QI Labs
# by @f03lipe

mongoose = require 'mongoose'

Types =
	Post: 'Post'
	Activity: 'Activity'

InboxSchema = new mongoose.Schema {
	dateSent:		{ type: Date, index: 1, default: Date.now }
	recipient:	{ type: String, ref: 'User', index: 1, required: true }
	author:			{ type: String, ref: 'User', index: 1, required: true }
	resource:		{ type: String, required: true }
	lab:				{ type: String, required: true }
	type:				{ type: String, required: true } # type of the resource
	# problem:	{ type: mongoose.Schema.ObjectId, ref: 'Resource', required: true }
	# shared_by: 	{ type: Boolean, default: false }
}

InboxSchema.statics.Types = Types
InboxSchema.plugin(require('./lib/hookedModelPlugin'))

module.exports = InboxSchema
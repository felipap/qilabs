
# src/models/inbox
# for QI Labs
# by @f03lipe

mongoose = require 'mongoose'
async 	 = require 'async'

please = require 'src/lib/please.js'

Types =
	Post: 'Post'
	Activity: 'Activity'

InboxSchema = new mongoose.Schema {
	dateSent:		{ type: Date, index: 1, default: Date.now }
	# restype:		{ type: String }
	recipient:	{ type: mongoose.Schema.ObjectId, ref: 'User', index: 1, required: true }
	author:			{ type: mongoose.Schema.ObjectId, ref: 'User', index: 1, required: true }
	resource:		{ type: mongoose.Schema.ObjectId, ref: 'Resource', required: true }
	# problem:	{ type: mongoose.Schema.ObjectId, ref: 'Resource', required: true }
	# shared_by: 	{ type: Boolean, default: false }
}

InboxSchema.statics.Types = Types
InboxSchema.plugin(require('./lib/hookedModelPlugin'))

Inbox = mongoose.model "Inbox", InboxSchema
module.exports = (app) ->
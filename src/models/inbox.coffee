
# src/models/inbox
# for QI Labs
# by @f03lipe

mongoose = require 'mongoose'
async 	 = require 'async'

please = require 'src/lib/please.js'

Types =
	Post: 'Post'
	Activity: 'Activity'

## Schema ######################################################################

InboxSchema = new mongoose.Schema {
	dateSent:	{ type: Date, index: 1, default: Date.now }
	resourceType:{ type: String }
	recipient:	{ type: mongoose.Schema.ObjectId, ref: 'User', index: 1, required: true }
	author:		{ type: mongoose.Schema.ObjectId, ref: 'User', index: 1, required: true }
	resource:	{ type: mongoose.Schema.ObjectId, ref: 'Resource', required: true }
	# problem:	{ type: mongoose.Schema.ObjectId, ref: 'Resource', required: true }
}

## Statics #####################################################################

InboxSchema.statics.fillInboxes = (recipients, opts, cb) ->
	please({'$isA':Array}, {$contains:['resource','author']}, '$isFn')

	if not recipients.length
		return cb(false, [])

	async.mapLimit(recipients, 5, ((rec, done) ->
		inbox = new Inbox {
			resource: opts.resource
			recipient: rec
			author: opts.author
		}
		inbox.save(done)
	), cb)

InboxSchema.statics.fillUserInboxWithResources = (recipient, resources, cb) ->
	please({'$model':'User'},{'$isA':Array},'$isFn')

	if not resources.length
		return cb(false, [])

	console.log 'Resources found:', resources.length
	async.mapLimit(resources, 5, ((resource, done) ->
		inbox = new Inbox {
			resource: resource
			recipient: recipient
			author: resource.author or resource.actor
			dateSent: resource.created_at # or should it be 'updated'?
		}
		inbox.save (err, doc) ->
			console.log "Resource #{resource.id} of type #{resource.__t}
			sent on #{resource.created_at} added"
			done(err,doc)
	), cb)

InboxSchema.statics.Types = Types
InboxSchema.plugin(require('./lib/hookedModelPlugin'))

Inbox = mongoose.model "Inbox", InboxSchema
module.exports = (app) ->
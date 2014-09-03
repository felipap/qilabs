
# src/models/post
# Copyright QiLabs.org

mongoose = require 'mongoose'
assert = require 'assert'
_ = require 'underscore'
async = require 'async'
jobs = require 'src/config/kue.js'

please = require 'src/lib/please.js'
please.args.extend(require('./lib/pleaseModels.js'))

Notification = mongoose.model 'Notification'
Resource = mongoose.model 'Resource'
Inbox = mongoose.model 'Inbox'
Comment = Resource.model 'Comment'
CommentTree = Resource.model 'CommentTree'

Types = 
	Note: 'Note'
	Discussion: 'Discussion'

TransTypes = {}
TransTypes[Types.Discussion] = 'Discussão'
TransTypes[Types.Note] = 'Nota'

################################################################################
## Schema ######################################################################

ObjectId = mongoose.Schema.ObjectId

PostSchema = new Resource.Schema {
	author: {
		id: String,
		username: String,
		path: String,
		avatarUrl: String,
		name: String,
	}

	type: 		{ type: String, required: true, enum:_.values(Types) }
	updated_at:	{ type: Date }
	created_at:	{ type: Date, indexed: 1, default: Date.now }
	
	subject:	{ type: String }
	tags: 		[{ type: String }]
	content: {
		title:	{ type: String }
		body:	{ type: String, required: true }
		image:	{ type: String }
	}

	counts: {
		# votes: 		{ type: Number, default: 0 }
		children:	{ type: Number, default: 0 }
	}

	comment_tree: { type: String, ref: 'CommentTree', required: true },
	users_watching:[{ type: String, ref: 'User' }] # list of users watching this thread
	votes: 		{ type: [{ type: String, ref: 'User', required: true }],  default: [] }
}, {
	toObject:	{ virtuals: true }
	toJSON: 	{ virtuals: true }
}

PostSchema.statics.APISelect = '-users_watching -comment_tree' # -votes won't work right now

################################################################################
## Virtuals ####################################################################

PostSchema.virtual('translatedType').get ->
	TransTypes[@type] or 'Publicação'

PostSchema.virtual('counts.votes').get ->
	@votes and @votes.length

PostSchema.virtual('path').get ->
	"/posts/{id}".replace(/{id}/, @id)

PostSchema.virtual('apiPath').get ->
	"/api/posts/{id}".replace(/{id}/, @id)

################################################################################
## Middlewares #################################################################

PostSchema.pre 'remove', (next) ->
	next()
	Notification.find { resources: @ }, (err, docs) =>
		console.log "Removing #{err} #{docs.length} notifications of post #{@id}"
		docs.forEach (doc) ->
			doc.remove()

PostSchema.pre 'remove', (next) ->
	next()
	Inbox.remove { resource: @id }, (err, doc) =>
		console.log "Removing err:#{err} #{doc} inbox of post #{@id}"

################################################################################
## Methods #####################################################################

PostSchema.methods.getComments = (cb) ->
	if @comment_tree
		CommentTree.findById @comment_tree, (err, tree) ->
			cb(err, tree and tree.docs)
	else
		cb(null, [])
		
PostSchema.methods.stuff = (cb) ->
	@getComments (err, docs) =>
		if err
			console.warn(err)
		cb(err, _.extend(@toJSON(), { children: docs or [] }))

################################################################################
## Statics #####################################################################

PostSchema.statics.fromObject = (object) ->
	new Post(undefined, undefined, true).init(object)

PostSchema.statics.Types = Types

PostSchema.plugin(require('./lib/hookedModelPlugin'))
PostSchema.plugin(require('./lib/trashablePlugin'))
PostSchema.plugin(require('./lib/selectiveJSON'), PostSchema.statics.APISelect)

Post = Resource.discriminator('Post', PostSchema)

module.exports = (app) ->
	# logger = app.get('logger')

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

Types = 
	Note: 'Note'
	Discussion: 'Discussion'
	Comment: 'Comment'
	# Answer: 'Answer'
	Problem: 'Problem'

TransTypes = {}
TransTypes[Types.Discussion] = 'Discussão'
TransTypes[Types.Note] = 'Nota'
# TransTypes[Types.Answer] = 'Resposta'
TransTypes[Types.Comment] = 'Comentário'

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

	parent:	{ type: ObjectId, ref: 'Resource', required: false }
	
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

	users_watching:[{ type: String, ref: 'User' }] # list of users watching this thread
	replies_user:	{ type: String, ref: 'User' } # user that this replies to
	replies_post:	{ type: String, ref: 'User' } # post that this replies to
	votes: 		{ type: [{ type: String, ref: 'User', required: true }],  default: [] }
}, {
	toObject:	{ virtuals: true }
	toJSON: 	{ virtuals: true }
}

PostSchema.statics.APISelect = '-users_watching' # -votes won't work right now

################################################################################
## Virtuals ####################################################################

PostSchema.virtual('translatedType').get ->
	TransTypes[@type] or 'Publicação'

PostSchema.virtual('counts.votes').get ->
	@votes and @votes.length

PostSchema.virtual('path').get ->
	if @parent
		"/posts/"+@parent+"#"+@id
	else
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
	Post.find { parent: @ }, (err, docs) ->
		docs.forEach (doc) ->
			doc.remove()

PostSchema.pre 'remove', (next) ->
	next()
	Inbox.remove { resource: @id }, (err, doc) =>
		console.log "Removing err:#{err} #{doc} inbox of post #{@id}"

# https://github.com/LearnBoost/mongoose/issues/1474
PostSchema.pre 'save', (next) ->
	@wasNew = @isNew
	next()

PostSchema.post 'save', () ->
	if @wasNew
		if @parent
			jobs.create('post children', {
				title: "New post comment: #{@.author.name} posted #{@id} to #{@parent}",
				post: @,
			}).save()

PostSchema.pre 'remove', (next) ->
	next()
	# Do this last, so that the status isn't rem
	# Decrease author stats.
	if @parent
		jobs.create('delete children', {
			title: "Delete post children: #{@.author.name} deleted #{@id} from #{@parent}",
			post: @,
		}).save()
	else
		# jobs.create('delete post', {
		# 	title: "New post comment: #{self.name} posted #{comment.id} to #{parent.id}",
		# 	author: self,
		# 	parent: parent,
		# 	post: comment,
		# }).save()

################################################################################
## Methods #####################################################################

PostSchema.methods.getComments = (cb) ->
	Post.find { parent: @id }, cb

PostSchema.methods.stuff = (cb) ->
	@getComments (err, docs) =>
		cb(err, _.extend(@toJSON(), { children: docs }))

################################################################################
## Statics #####################################################################

PostSchema.statics.fromObject = (object) ->
	new Post(undefined, undefined, true).init(object)

PostSchema.statics.Types = Types

PostSchema.plugin(require('./lib/hookedModelPlugin'))
PostSchema.plugin(require('./lib/trashablePlugin'))
PostSchema.plugin(require('./lib/selectiveJSON'), PostSchema.statics.APISelect)

module.exports = Post = Resource.discriminator('Post', PostSchema)
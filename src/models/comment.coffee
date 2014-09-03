
# src/models/comment
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

ObjectId = mongoose.Schema.ObjectId

authorObject = {
	id: String,
	username: String,
	path: String,
	avatarUrl: String,
	name: String,
}

################################################################################
## Schema ######################################################################

CommentSchema = new Resource.Schema {
	author:			authorObject
	replies_to:		{ type: ObjectId, ref: 'Comment', indexed: 1 }
	replied_users:	[authorObject]
	parent:			{ type: ObjectId, ref: 'Post', indexed: 1 }	# parent comment
	tree: 			{ type: ObjectId, ref: 'CommentTree', indexed: 1 } # not sure if necessary

	content: {
		body: { type: String, required: true }
	}

	votes: [{ type: String, ref: 'User', required: true }]
	meta: {
		updated_at:	{ type: Date }
		created_at:	{ type: Date, default: Date.now }
	}
}, {
	toObject:	{ virtuals: true }
	toJSON: 	{ virtuals: true }
}

CommentTreeSchema = new Resource.Schema {
	parent: { type: ObjectId, ref: 'Resource', required: true, indexed: 1 } # may be Post or Question
	docs:	[CommentSchema]
	# max_depth: 1,
	# next:
}, {
	toObject:	{ virtuals: true }
	toJSON: 	{ virtuals: true }
}

################################################################################
## Virtuals ####################################################################

CommentSchema.virtual('counts.votes').get ->
	@votes and @votes.length

CommentSchema.virtual('path').get ->
	"/posts/"+@parent+"#"+@id

CommentSchema.virtual('apiPath').get ->
	"/api/posts/{parentId}/{id}"
		.replace(/{parentId}/, @parent)
		.replace(/{id}/, @id)

################################################################################
## Middlewares #################################################################

CommentSchema.pre 'remove', (next) ->
	next()
	Notification.find { resources: @ }, (err, docs) =>
		console.log "Removing #{err} #{docs.length} notifications of comment #{@id}"
		docs.forEach (doc) ->
			doc.remove()

# https://github.com/LearnBoost/mongoose/issues/1474
CommentSchema.pre 'save', (next) ->
	@wasNew = @isNew
	next()

CommentSchema.post 'save', () ->
	if @wasNew
		jobs.create('post children', {
			title: "New comment: #{@.author.name} posted #{@id} to #{@parent}",
			post: @,
		}).save()

CommentSchema.pre 'remove', (next) ->
	next()
	# Do this last, so that the status isn't rem
	# Decrease author stats.
	jobs.create('delete children', {
		title: "Delete post children: #{@.author.name} deleted #{@id} from #{@parent}",
		post: @,
	}).save()

################################################################################
## Methods #####################################################################

# CommentSchema.methods.getComments = (cb) -> # get replies, may be?
# 	Comment.find { parent: @id }, cb

################################################################################
## Statics #####################################################################

CommentSchema.statics.fromObject = (object) ->
	new Comment(undefined, undefined, true).init(object)

CommentSchema.plugin(require('./lib/hookedModelPlugin'))
CommentSchema.plugin(require('./lib/trashablePlugin'))
CommentSchema.plugin(require('./lib/selectiveJSON'), CommentSchema.statics.APISelect)

CommentSchema.plugin(require('./lib/hookedModelPlugin'))

CommentTree = mongoose.model('CommentTree', CommentTreeSchema)
Comment = Resource.discriminator('Comment', CommentSchema)

module.exports = (app) ->

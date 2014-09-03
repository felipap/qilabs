
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

################################################################################
## Schema ######################################################################

ObjectId = mongoose.Schema.ObjectId

CommentSchema = new Resource.Schema {
	author: {
		id: String,
		username: String,
		path: String,
		avatarUrl: String,
		name: String,
	}
	
	content: {
		body:	{ type: String, required: true }
	}

	parent:	{ type: ObjectId, ref: 'Resource', required: true, indexed: 1 } # may be Post or Question
	children: ['Comment']
	replies_comment:{ type: String, ref: 'Comment' } # post that this replies to
	replies_user:	{ type: String, ref: 'User' } # user that this replies to (only one? why?)

	votes: { type: [{ type: String, ref: 'User', required: true }],  default: [] }
	meta: {
		updated_at:	{ type: Date }
		created_at:	{ type: Date, default: Date.now }
	}
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

module.exports = Comment = Resource.discriminator('Comment', CommentSchema)
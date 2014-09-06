
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

logger = require('src/core/bunyan')()

################################################################################
## Schema ######################################################################

CommentSchema = new mongoose.Schema {
	author:			authorObject
	replies_to:		{ type: ObjectId, ref: 'Comment', indexed: 1 }
	replied_users:	[authorObject]
	parent:			{ type: ObjectId, ref: 'Post', required: true }	# parent comment
	tree: 			{ type: ObjectId, ref: 'CommentTree', indexed: 1, required: true } # not sure if necessary

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
CommentTreeSchema.statics.APISelect = "-docs.tree -docs.parent -docs.__t"

################################################################################
## Virtuals ####################################################################

CommentSchema.virtual('counts.votes').get ->
	@votes and @votes.length

CommentSchema.virtual('path').get ->
	"/posts/"+@parent+"#"+@id

CommentSchema.virtual('apiPath').get ->
	"/api/posts/{tree}/{id}"
		.replace(/{tree}/, @tree)
		.replace(/{id}/, @id)

################################################################################
## Middlewares #################################################################

CommentSchema.pre 'remove', (next) ->
	Notification.find { resources: @._id }, (err, docs) =>
		if err
			logger.error("Err finding notifications: ", err)
			next(err)
			return
		console.log "Removing #{err} #{docs.length} notifications of comment #{@id}"
		docs.forEach (doc) ->
			doc.remove()
		next()

# TODO do post???
CommentSchema.pre 'remove', (next) ->
	next()
	# Do this last, so that the status isn't removed.?
	# Decrease author stats.
	jobs.create('delete children', {
		title: "Delete post children: #{@.author.name} deleted #{@id} from #{@parent}",
		post: @,
	}).save()

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
CommentTreeSchema.plugin(require('./lib/selectiveJSON'), CommentTreeSchema.statics.APISelect)

CommentSchema.plugin(require('./lib/hookedModelPlugin'))

CommentTree = mongoose.model('CommentTree', CommentTreeSchema)
Comment = Resource.discriminator('Comment', CommentSchema)

module.exports = () ->
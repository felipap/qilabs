
# src/models/comment
# Copyright QiLabs.org

mongoose = require 'mongoose'
assert = require 'assert'
_ = require 'underscore'
async = require 'async'
jobs = require 'src/config/kue.js'

please = require 'src/lib/please.js'
please.args.extend require('./lib/pleaseModels.js')

Notification = mongoose.model 'Notification'
Resource = mongoose.model 'Resource'

validator = require 'validator'

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

# Beware: validation errors are likely only going

CommentSchema = new mongoose.Schema {
	author:			authorObject
	replies_to:		{ type: ObjectId, ref: 'Comment', indexed: 1 }
	replied_users:	[authorObject]
	parent:			{ type: ObjectId, ref: 'Post' }	# parent comment
	tree: 			{ type: ObjectId, ref: 'CommentTree', indexed: 1 } # not sure if necessary

	content: {
		body: { type: String }
	}

	votes: [{ type: String, ref: 'User' }]
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

CommentTreeSchema.statics.APISelect = "-docs.tree -docs.parent -docs.__t -docs.__v -docs._id"

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

# Comment middlewares won't be triggered when the comments are created by
# updating the tree object with pull/push requests, because these go straight to
# mongo. Prefer doing work in the controllers, or be responsible for the
# consequences.

# To trigger these

CommentSchema.post 'remove', (comment) ->
	Notification.find { resources: comment._id }, (err, docs) =>
		if err
			logger.error("Err finding notifications: ", err)
			return
		console.log "Removing #{err} #{docs.length} notifications of comment #{comment.id}"
		docs.forEach (doc) ->
			doc.remove()

CommentSchema.post 'remove', (comment) ->
	jobs.create('delete children', {
		title: "Delete post children: #{comment.author.name} deleted #{comment.id} from #{comment.tree}",
		postId: comment.parent,
		treeId: commen.tree,
		comment: comment,
	}).save()

################################################################################
## Methods #####################################################################

# CommentSchema.methods.getComments = (cb) -> # get replies, may be?
# 	Comment.find { parent: @id }, cb

################################################################################
## Statics #####################################################################

dryText = (str) -> str.replace(/(\s{1})[\s]*/gi, '$1')

COMMENT_MIN = 3
COMMENT_MAX = 1000

CommentSchema.statics.ParseRules = {
	content:
		body:
			$valid: (str) -> validator.isLength(str, COMMENT_MIN, COMMENT_MAX)
			$clean: (str) -> _.escape(dryText(validator.trim(str)))
}

CommentSchema.statics.fromObject = (object) ->
	new Comment(undefined, undefined, true).init(object)

CommentSchema.plugin(require('./lib/hookedModelPlugin'))
CommentSchema.plugin(require('./lib/trashablePlugin'))
CommentTreeSchema.plugin(require('./lib/selectiveJSON'), CommentTreeSchema.statics.APISelect)

CommentSchema.plugin(require('./lib/hookedModelPlugin'))

CommentTree = mongoose.model('CommentTree', CommentTreeSchema)
Comment = Resource.discriminator('Comment', CommentSchema)

module.exports = () ->
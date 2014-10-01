
# src/models/comment
# for QI Labs
# by @f03lipe

mongoose = require 'mongoose'
_ = require 'underscore'
async = require 'async'
validator = require 'validator'

please = require 'src/lib/please.js'
logger = require('src/core/bunyan')()

##

ObjectId = mongoose.Schema.ObjectId
Resource = mongoose.model 'Resource'

User = mongoose.model 'User'
Notification = null

module.exports = () ->

module.exports.start = () ->
	Notification = mongoose.model 'Notification'

################################################################################
## Schema ######################################################################

# Beware: validation errors are likely only going

CommentSchema = new mongoose.Schema {
	author:			User.AuthorSchema
	replies_to:		{ type: ObjectId, ref: 'Comment' }
	replied_users:	[User.AuthorSchema]
	thread_root: 	{ type: ObjectId, ref: 'Comment', index: 1 }
	parent:			{ type: ObjectId, ref: 'Post' }	# parent comment
	tree: 			{ type: ObjectId, ref: 'CommentTree', index: 1 } # not sure if necessary

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
	parent: { type: ObjectId, ref: 'Resource', required: true, index: 1 } # may be Post or Question
	docs:	[CommentSchema]
	# last_update: 	{}
	# max_depth: 1,
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
# updating the tree object with pull/push updates, because these go straight to
# mongo. Prefer doing work in the controllers, or face the consequences.

################################################################################
## Statics #####################################################################

dryText = (str) -> str.replace(/(\s{1})[\s]*/gi, '$1')

COMMENT_MIN = 3
COMMENT_MAX = 1000

CommentSchema.statics.ParseRules = {
	# author: # ignore author
	replies_to:
		$valid: (str) ->
			try
				id = mongoose.Types.ObjectId.createFromHexString(str)
				return true
			catch e
				return false

	content:
		body:
			$valid: (str) ->
				console.log validator.isLength(str, COMMENT_MIN, COMMENT_MAX)
				validator.isLength(str, COMMENT_MIN, COMMENT_MAX)
			$clean: (str) -> _.escape(validator.trim(str))
}

CommentSchema.statics.fromObject = (object) ->
	new Comment(undefined, undefined, true).init(object)

CommentSchema.plugin(require('./lib/hookedModelPlugin'))
CommentSchema.plugin(require('./lib/trashablePlugin'))
CommentSchema.plugin(require('./lib/selectiveJSON'), CommentSchema.statics.APISelect)

CommentTreeSchema.plugin(require('./lib/trashablePlugin'))
CommentTreeSchema.plugin(require('./lib/selectiveJSON'), CommentTreeSchema.statics.APISelect)

CommentTree = mongoose.model('CommentTree', CommentTreeSchema)
Comment = mongoose.model('Comment', CommentSchema)

# app/models/comment
# for QI Labs
# by @f03lipe

mongoose = require 'mongoose'
validator = require 'validator'
sanitizer = require 'sanitizer'

logger = require('app/config/bunyan')()

##

ObjectId = mongoose.Schema.ObjectId
AuthorSchema = (require './user').statics.AuthorSchema

################################################################################
## Schema ######################################################################

# Beware: validation errors are likely only going

CommentSchema = new mongoose.Schema {
	author:				AuthorSchema
	replies_to:		{ type: ObjectId, ref: 'Comment' }
	replied_users:[AuthorSchema]
	thread_root: 	{ type: ObjectId, ref: 'Comment', index: 1 }
	parent:				{ type: ObjectId, ref: 'Post', required: true }	# parent comment
	tree: 				{ type: ObjectId, ref: 'CommentTree', index: 1 } # not sure if necessary
	deleted: 			{ type: Boolean, default: false }

	content: {
		body: { type: String }
		deletedBody: { type: String }
	}

	updated_at:	{ type: Date }
	deleted_at:	{ type: Date }
	created_at:	{ type: Date, default: Date.now }

	votes: [{ type: String, ref: 'User' }]
}, {
	toObject:	{ virtuals: true }
	toJSON: 	{ virtuals: true }
}

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
COMMENT_MAX = 10000

CommentSchema.statics.ParseRules = {
	# author: # ignore author
	replies_to:
		$required: false
		$valid: (str) ->
			try
				id = mongoose.Types.ObjectId.createFromHexString(str)
				return true
			catch e
				return false

	content:
		body:
			$valid: (str) -> validator.isLength(str, COMMENT_MIN, COMMENT_MAX)
			$clean: (str) -> validator.trim(str)
}

CommentSchema.plugin(require('./lib/hookedModelPlugin'))
CommentSchema.plugin(require('./lib/trashablePlugin'))
CommentSchema.plugin(require('./lib/fromObjectPlugin'))
# JSON selection is done in comment_tree
# CommentSchema.plugin(require('./lib/selectiveJSON'), CommentSchema.statics.APISelect)

CommentSchema.statics.modelName = "Comment"

module.exports = CommentSchema
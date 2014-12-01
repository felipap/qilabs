
# app/models/comment_tree
# for QI Labs
# by @f03lipe

mongoose = require 'mongoose'

CommentSchema = require './comment'

CommentTreeSchema = new mongoose.Schema {
	# parent may be Post or Problem
	parent: { type: mongoose.Schema.ObjectId, required: true, index: 1 }
	type: { type: String }
	docs:	[CommentSchema]
	# last_update: 	{}
	# max_depth: 1,
}

CommentTreeSchema.statics.APISelect = "-docs.tree -docs.parent -docs.__v -docs._id"

CommentTreeSchema.plugin(require('./lib/trashablePlugin'))
CommentTreeSchema.plugin(require('./lib/selectiveJSON'), CommentTreeSchema.statics.APISelect)

module.exports = CommentTreeSchema

# src/models/notification
# for QI Labs
# by @f03lipe

# Modify to
#  target_type :string(255)
#  target_id   :integer
#  title       :string(255)
#  data        :text
#  project_id  :integer
#  action      :integer
#  author_id   :integer

mongoose = require 'mongoose'
async = require 'async'
_ = require 'underscore'
assert = require 'assert'

please = require 'src/lib/please.js'
logger = require('src/core/bunyan')()

##

Resource = mongoose.model 'Resource'
ObjectId = mongoose.Schema.ObjectId

Types =
	PostComment: 'PostComment'
	NewFollower: 'NewFollower'
	# SharedPost: 'SharedPost'
	PostUpvote: 'PostUpvote'
	ReplyComment: 'ReplyComment'

# Think internationalization!
MsgTemplates =
	PostComment: '<%= agentName %> comentou na sua publicação.'
	NewFollower: '<%= agentName %> começou a te seguir.'
	PostUpvote: '<%= agentName %> votou na sua publicação.'
	ReplyComment: '<%= agentName %> respondeu ao seu comentário.'

module.exports = () ->
module.exports.start = () ->

################################################################################
## Schema ######################################################################

NotificationSchema = new mongoose.Schema {
	agent:		 	{ type: ObjectId, ref: 'User', required: true }
	agentName:	 	{ type: String }
	recipient:	 	{ type: ObjectId, ref: 'User', required: true, index: 1 }
	dateSent:		{ type: Date, index: 1, default: Date.now }
	# seen:			{ type: Boolean, default: false }
	# accessed:		{ type: Boolean, default: false }
	url:			{ type: String }
	resources:	   [{ type: String }] # used to delete when resources go down
	thumbnailUrl:	{ type: String, required: false }

	type:			{ type: String, required: true }
	thumbnail: 		{ type: String }
	url:			{ type: String }

	created_at: 	{ type: Date, default: Date.now }
	updated_at: 	{ type: Date, default: Date.now }
}, {
	toObject:	{ virtuals: true }
	toJSON: 	{ virtuals: true }
}

NotificationListSchema = new mongoose.Schema {
	user:	 		{ type: ObjectId, ref: 'User', required: true, index: 1 }
	docs:			[NotificationSchema]
	last_seen: 		{ type: Date, default: 0 }
}
NotificationListSchema.statics.APISelect = '-docs.__t -docs.__v -docs._id'

################################################################################
## Virtuals ####################################################################

NotificationSchema.virtual('msg').get ->
	if MsgTemplates[@type]
		return _.template(MsgTemplates[@type], @)
	console.warn "No template found for notification of type #{@type}"
	return "Notificação #{@type}"

NotificationSchema.virtual('msgHtml').get ->
	if MsgTemplates[@type]
		return _.template(MsgTemplates[@type], @)
	console.warn "No html template found for notification of type #{@type}"
	return "Notificação #{@type}"

NotificationSchema.statics.Types = Types
NotificationSchema.plugin(require('./lib/hookedModelPlugin'));
Notification = mongoose.model 'Notification', NotificationSchema

NotificationListSchema.plugin(require('./lib/trashablePlugin'))
# NotificationListSchema.plugin(require('./lib/selectiveJSON'), NotificationListSchema.statics.APISelect)
NotificationList = mongoose.model 'NotificationList', NotificationListSchema

# src/models/notification
# Copyright QILabs.org
# by @f03lipe

mongoose = require 'mongoose'
async = require 'async'
_ = require 'underscore'
assert = require 'assert'

please = require 'src/lib/please.js'
please.args.extend(require('./lib/pleaseModels.js'))

Resource = mongoose.model 'Resource'

Types =
	PostComment: 'PostComment'
	NewFollower: 'NewFollower'
	SharedPost: 'SharedPost'
	PostUpvote: 'PostUpvote'

# Think internationalization!

MsgTemplates = 
	PostComment: '<%= agentName %> comentou na sua publicação.'
	NewFollower: '<%= agentName %> começou a te seguir.'
	PostUpvote: '<%= agentName %> votou na sua publicação.'

MsgHtmlTemplates = 
	PostComment: '<%= agentName %> comentou na sua publicação.'
	NewFollower: '<%= agentName %> começou a te seguir.'
	PostUpvote: '<%= agentName %> votou na sua publicação.'

################################################################################
## Schema ######################################################################

NotificationSchema = new mongoose.Schema {
	agent:		 	{ type: mongoose.Schema.ObjectId, ref: 'User', required: true }
	agentName:	 	{ type: String }
	recipient:	 	{ type: mongoose.Schema.ObjectId, ref: 'User', required: true, index: 1 }
	dateSent:		{ type: Date, index: 1, default: Date.now }
	type:			{ type: String, required: true }
	seen:			{ type: Boolean, default: false }
	accessed:		{ type: Boolean, default: false }
	url:			{ type: String }
	
	# group:			{ type: mongoose.Schema.ObjectId, ref: 'Group', required: false }
	resources:	   [{ type: mongoose.Schema.ObjectId }] # used to delete when resources go down
	thumbnailUrl:	{ type: String, required: false }
}, {
	toObject:	{ virtuals: true }
	toJSON: 	{ virtuals: true }
}

################################################################################
## Virtuals ####################################################################

NotificationSchema.virtual('msg').get ->
	if MsgTemplates[@type]
		return _.template(MsgTemplates[@type], @)
	console.warn "No template found for notification of type"+@type
	return "Notificação "+@type

NotificationSchema.virtual('msgHtml').get ->
	if MsgHtmlTemplates[@type]
		return _.template(MsgHtmlTemplates[@type], @)
	else if MsgTemplates[@type]
		return _.template(MsgTemplates[@type], @)
	console.warn "No html template found for notification of type"+@type
	return "Notificação "+@type

################################################################################
## Middlewares ################################################################
#
################################################################################
## Statics #####################################################################

notifyUser = (recpObj, agentObj, data, cb) ->
	please.args({$isModel:'User'},{$isModel:'User'},{$contains:['url','type']},'$isCb')
	
	User = Resource.model 'User'

	note = new Notification {
		agent: agentObj.id
		agentName: agentObj.name
		recipient: recpObj
		type: data.type
		url: data.url
		thumbnailUrl: data.thumbnailUrl or agentObj.avatarUrl
	}
	if data.resources then note.resources = data.resources 
	note.save (err, doc) ->
		cb?(err,doc)

NotificationSchema.statics.Trigger = (agent, type) ->
	please.args({$isModel:'User'})
	User = Resource.model 'User'

	switch type
		when Types.PostUpvote
			return (post, cb) ->
				please.args({$isModel:'Post'},'$isCb')
				# Find post's author and notify him.
				User.findOne {_id: ''+post.author.id }, (err, parentAuthor)  ->
					if parentAuthor and not err
						notifyUser parentAuthor, agent, {
							type: Types.PostUpvote
							url: post.path
							resources: [post.id]
						}, (err, res) ->
							if err
								console.warn "ERR:", err, err and err.errors
								cb(false)
					else
						console.warn("err: #{err} or parentAuthor (id:#{post.author.id}) not found")
						cb(true)					
		when Types.PostComment
			return (commentObj, parentObj, cb) ->
				please.args({$isModel:'Comment'},{$isModel:'Post'},'$isCb')
				cb ?= ->
				if ''+parentObj.author.id is ''+agent.id
					return cb(false)
				parentAuthorId = ''+parentObj.author.id
				# Find author of parent post and notify him.
				User.findOne {_id: parentAuthorId}, (err, parentAuthor) ->
					if parentAuthor and not err
						notifyUser parentAuthor, agent, {
							type: Types.PostComment
							url: commentObj.path
							resources: [parentObj.id, commentObj.id]
						}, cb
					else
						console.warn("err: #{err} or parentAuthor (id:#{parentAuthorId}) not found")
						cb(true)
		when Types.NewFollower
			return (followerObj, followeeObj, cb) ->
				# assert
				cb ?= ->
				# Find and delete older notifications from the same follower.
				cb()
				Notification.findOne {
					type:Types.NewFollower,
					agent:followerObj,
					recipient:followeeObj
					}, (err, doc) ->
						if doc #
							doc.remove(()->)
						notifyUser followeeObj, followerObj, {
							type: Types.NewFollower
							# resources: []
							url: followerObj.path
						}, cb
		else
			throw "Unexisting notification type."

NotificationSchema.statics.Types = Types

NotificationSchema.plugin(require('./lib/hookedModelPlugin'));

module.exports = Notification = mongoose.model "Notification", NotificationSchema
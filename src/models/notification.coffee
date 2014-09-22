
# src/models/notification
# for QI Labs
# by @f03lipe

# Modify to
#  target_type :string(255)
#  target_id   :integer
#  title       :string(255)
#  data        :text
#  project_id  :integer
#  created_at  :datetime
#  updated_at  :datetime
#  action      :integer
#  author_id   :integer

mongoose = require 'mongoose'
async = require 'async'
_ = require 'underscore'
assert = require 'assert'

please = require 'src/lib/please.js'
please.args.extend(require('./lib/pleaseModels.js'))

Resource = mongoose.model 'Resource'

logger = require('src/core/bunyan')()

Types =
	PostComment: 'PostComment'
	NewFollower: 'NewFollower'
	# SharedPost: 'SharedPost'
	PostUpvote: 'PostUpvote'
	ReplyComment: 'ReplyComment'

# Think internationalization!
ObjectId = mongoose.Schema.ObjectId

MsgTemplates =
	PostComment: '<%= agentName %> comentou na sua publicação.'
	NewFollower: '<%= agentName %> começou a te seguir.'
	PostUpvote: '<%= agentName %> votou na sua publicação.'
	ReplyComment: '<%= agentName %> respondeu ao seu comentário.'

################################################################################
## Schema ######################################################################

NotificationSchema = new mongoose.Schema {
	agent:		 	{ type: ObjectId, ref: 'User', required: true }
	agentName:	 	{ type: String }
	recipient:	 	{ type: ObjectId, ref: 'User', required: true, index: 1 }
	dateSent:		{ type: Date, index: 1, default: Date.now }
	type:			{ type: String, required: true }
	# seen:			{ type: Boolean, default: false }
	# accessed:		{ type: Boolean, default: false }
	url:			{ type: String }
	resources:	   [{ type: String }] # used to delete when resources go down
	thumbnailUrl:	{ type: String, required: false }
}, {
	toObject:	{ virtuals: true }
	toJSON: 	{ virtuals: true }
}

NotificationListSchema = new mongoose.Schema {
	user:	 		{ type: ObjectId, ref: 'User', required: true, indexed: 1 }
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

################################################################################
################################################################################

createList = (user, cb) ->
	please.args({$isModel:'User'}, '$isCb')

	logger.debug('Creating notification list for user %s', user._id)
	list = new NotificationList {
		user: user._id
	}
	list.save (err, list) ->
		if err
			logger.error(err, 'Failed to create notification_list for user(%s)', user._id)
			return cb(err)
		cb(false, list)

notifyUser = (agent, recipient, data, cb) ->
	please.args({$isModel:'User'},{$isModel:'User'},{$contains:['url','type']},'$isCb')

	User = Resource.model 'User'

	addNotificationToList = (list) ->
		please.args({$isModel:NotificationList})

		# Using new Notification({...}) might lead to RangeError on server.
		_notification = list.docs.create({
			agent: agent._id
			agentName: agent.name
			recipient: recipient._id
			type: data.type
			url: data.url
			thumbnailUrl: data.thumbnailUrl or agent.avatarUrl
			resources: data.resources || []
		})

		# The expected object (without those crazy __parentArray, __$, ... properties)
		notification = new Notification(_notification)
		logger.debug('addNotificationToList(%s) with list(%s)', notification._id, list._id)

		# Atomically push comment to commentTree
		# BEWARE: the comment object won't be validated, since we're not pushing it to the tree object and saving.
		# logger.debug('pre:findOneAndUpdate _id: %s call', parent.comment_tree)
		# CommentTree.findOneAndUpdate { _id: tree._id }, {$push: { docs : comment }}, (err, tree) ->

		# Non-atomically saving notification to notification list
		# Atomic version is leading to "RangeError: Maximum call stack size exceeded" on heroku.
		list.docs.push(_notification) # Push the weird object.
		list.save (err) ->
			if err
				logger.error('Failed to push notification to NotificationList', err)
				return cb(err)
			# logger.info("Notification pushed to list", recipient.name, list.docs)
			cb(null, notification)

	NotificationList.findOne { user: recipient._id }, (err, list) ->
		if err
			logger.error(err, 'Failed trying to find notification list for user(%s)', recipient._id)
			cb(err)
		if not list
			createList recipient, (err, list) ->
				if err
					logger.error(err, 'Failed to create list for user(%s)', recipient._id)
					cb(err)
				if not list
					throw new Error('WTF! list object is null')
				addNotificationToList(list)
		else
			addNotificationToList(list)

################################################################################
## Statics #####################################################################

NotificationSchema.statics.invalidateResource = (resource, callback) ->
	# NotificationList.remove { 'docs.' }, (err, results) ->
	# Notification.remove {
	# 	# type:Notification.Types.NewFollower,
	# 	# agent:@follower,
	# 	# recipient:@followee,
	# }, (err, result) ->
	# 	console.log "Removing #{err} #{result} notifications on unfollow."
	# 	next()
	callback()

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
						notifyUser agent, parentAuthor, {
							type: Types.PostUpvote
							url: post.path
							resources: [post.id]
						}, (err, res) ->
							if err
								console.warn 'ERR:', err, err and err.errors
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
						notifyUser agent, parentAuthor, {
							type: Types.PostComment
							url: commentObj.path
							resources: [parentObj.id, commentObj.id]
						}, cb
					else
						console.warn("err: #{err} or parentAuthor (id:#{parentAuthorId}) not found")
						cb(true)
		when Types.NewFollower
			return (followerObj, followeeObj, follow, cb) ->
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
						notifyUser followerObj, followeeObj, {
							type: Types.NewFollower
							# resources: []
							url: followerObj.path
						}, cb
		else
			throw new Error('Unexisting notification type.')

NotificationSchema.statics.Types = Types
NotificationSchema.plugin(require('./lib/hookedModelPlugin'));
Notification = mongoose.model 'Notification', NotificationSchema

NotificationListSchema.plugin(require('./lib/trashablePlugin'))
# NotificationListSchema.plugin(require('./lib/selectiveJSON'), NotificationListSchema.statics.APISelect)
NotificationList = mongoose.model 'NotificationList', NotificationListSchema

module.exports = () ->
	#
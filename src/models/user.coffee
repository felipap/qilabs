
# src/models/user
# for QI Labs
# by @f03lipe

mongoose = require 'mongoose'
_ = require 'underscore'
async = require 'async'
jobs = require 'src/config/kue.js'
please = require 'src/lib/please.js'
please.args.extend(require 'src/models/lib/pleaseModels.js')
redis = require 'src/config/redis.js'

##

ObjectId = mongoose.Types.ObjectId
Resource = mongoose.model 'Resource'

Inbox =
 Follow =
 Problem =
 Activity =
 Notification =
 Post =
 NotificationList = null

module.exports = (app) ->

module.exports.start = ->
	Inbox 	= mongoose.model 'Inbox'
	Follow 	= Resource.model 'Follow'
	Problem = Resource.model 'Problem'
	Post 	= Resource.model 'Post'
	Activity = Resource.model 'Activity'
	Notification = mongoose.model 'Notification'
	NotificationList = mongoose.model 'NotificationList'

################################################################################
## Schema ######################################################################

UserSchema = new mongoose.Schema {
	name:			{ type: String, required: true }
	username:		{ type: String, required: true }
	access_token: 	{ type: String, required: true }
	facebook_id:	{ type: String, required: true, indexed: true }
	email:			{ type: String }
	avatar_url:		{ type: String }

	profile: {
  		isStaff: 	{ type: Boolean, default: false }
		fbName: 	{ type: String }
		location:	{ type: String, default: '' }
		bio: 		{ type: String, default: ''}
		home: 		{ type: String, default: '' }
		bgUrl: 		{ type: String, default: '/static/images/rio.jpg' }
		serie: 		{ type: String }
		avatarUrl: 	''
		birthday:	{ type: Date }
	}

	stats: {
		posts:	{ type: Number, default: 0 }
		votes:	{ type: Number, default: 0 }
		followers:	{ type: Number, default: 0 }
		following:	{ type: Number, default: 0 }
	}

	meta: {
		session_count: Number
		last_signin_ip: String
		current_signin_ip: String
		created_at: { type: Date, default: Date.now }
		updated_at: { type: Date, default: Date.now }
		last_access: { type: Date, default: Date.now }
	}

	preferences: {
		interests: []
	}

	last_activity: {
		# Use to prevent spam?
	}

	flags: {
		banned: false
		admin:  false
	}

	notification_lists: [NotificationList]
}, {
	toObject:	{ virtuals: true }
	toJSON: 	{ virtuals: true }
}

UserSchema.statics.APISelect = 'id name username profile avatar_url path'

################################################################################
## Virtuals ####################################################################

UserSchema.methods.getCacheField = (field) ->
	switch field
		when 'Following'
			return "user:#{@id}:following"
		else
			throw new Error("Field #{field} isn't a valid user cache field.")


UserSchema.virtual('avatarUrl').get ->
	if @avatar_url
		@avatar_url+'?width=200&height=200'
	else
		'https://graph.facebook.com/'+@facebook_id+'/picture?width=200&height=200'

UserSchema.virtual('path').get ->
	'/@'+@username

################################################################################
## Middlewares #################################################################

# Must bind to user removal the deletion of:
# - Follows (@=followee or @=follower)
# - Notification (@=agent or @=recipient)
# - Post (@=author)
# - Activity (@=actor)

# TODO! remove cached keys

UserSchema.pre 'remove', (next) ->
	Follow.find().or([{followee:@}, {follower:@}]).exec (err, docs) =>
		if docs
			for follow in docs
				follow.remove(->)
		console.log "Removing #{err} #{docs.length} follows of #{@username}"
		next()

UserSchema.pre 'remove', (next) ->
	Post.find {'author.id':@}, (err, docs) =>
		if docs
			for doc in docs
				doc.remove(->)
		console.log "Removing #{err} #{docs.length} posts of #{@username}"
		next()

UserSchema.pre 'remove', (next) ->
	Notification.find().or([{agent:@},{recipient:@}]).remove (err, docs) =>
		console.log "Removing #{err} #{docs} notifications related to #{@username}"
		next()

UserSchema.pre 'remove', (next) ->
	Activity.remove {actor:@}, (err, docs) =>
		console.log "Removing #{err} #{docs} activities related to #{@username}"
		next()

################################################################################
## related to Following ########################################################

# Get documents of users that @ follows.
UserSchema.methods.getPopulatedFollowers = (cb) -> # Add opts to prevent getting all?
	Follow.find {followee: @, follower: {$ne: null}}, (err, docs) ->
		return cb(err) if err
		User.populate docs, { path: 'follower' }, (err, popFollows) ->
			cb(err, _.filter(_.pluck(popFollows, 'follower'), (i)->i))

# Get documents of users that follow @.
UserSchema.methods.getPopulatedFollowing = (cb) -> # Add opts to prevent getting all?
	Follow.find {follower: @, followee: {$ne: null}}, (err, docs) ->
		return cb(err) if err
		User.populate docs, { path: 'followee' }, (err, popFollows) ->
			cb(err, _.filter(_.pluck(popFollows, 'followee'), (i)->i))

#

# Get id of users that @ follows.
UserSchema.methods.getFollowersIds = (cb) ->
	Follow.find {followee: @, follower: {$ne: null}}, (err, docs) ->
		cb(err, _.pluck(docs or [], 'follower'))

# Get id of users that follow @.
UserSchema.methods.getFollowingIds = (cb) ->
	Follow.find {follower: @, followee: {$ne: null}}, (err, docs) ->
		cb(err, _.pluck(docs or [], 'followee'))

#### Stats

UserSchema.methods.doesFollowUser = (user, cb) ->
	if user instanceof User
		userId = user.id
	else if typeof user is 'string'
		userId = user
	else
		throw 'Passed argument should be either a User object or a string id.'
	redis.sismember @getCacheField('Following'), ''+userId, (err, val) =>
		if err
			console.log arguments
			Follow.findOne {followee:userId,follower:@id}, (err, doc) ->
				cb(err, !!doc)
		else
			cb(null, !!val)

################################################################################
## related to fetching Timelines and Inboxes ###################################

###
# Behold.
###
UserSchema.methods.getTimeline = (opts, callback) ->
	please.args({
		$contains:'maxDate', $contains:'source',
		source: {$among:['inbox','global','problems']}}, '$isCb')
	self = @

	if opts.source in ['global', 'inbox']
		Post.find { parent: null, created_at:{ $lt:opts.maxDate } }
			.select '-content.body'
			.exec (err, docs) =>
				return callback(err) if err
				if not docs.length or not docs[docs.length]
					minDate = 0
				else
					minDate = docs[docs.length-1].created_at
				callback(null, docs, minDate)
		return
	else if opts.source is 'inbox'
	# Get inboxed posts older than the opts.maxDate determined by the user.
		Inbox
			.find { recipient:self.id, dateSent:{ $lt:opts.maxDate }}
			.sort '-dateSent' # tied to selection of oldest post below
			.populate 'resource'
			.limit 25
			.exec (err, docs) =>
				return cb(err) if err
				# Pluck resources from inbox docs.
				# Remove null (deleted) resources.
				posts = _.filter(_.pluck(docs, 'resource'), (i)->i)
				console.log "#{posts.length} posts gathered from inbox"
				if posts.length or not posts[docs.length-1]
					minDate = 0
				else
					minDate = posts[posts.length-1].created_at
				callback(null, docs, minDate)
		return
	else if opts.source is 'problems'
		Problem.find { created_at: { $lt:opts.maxDate } }, (err, docs) =>
			return callback(err) if err
			if not docs.length or not docs[docs.length]
				minDate = 0
			else
				minDate = docs[docs.length-1].created_at
			callback(err, docs, minDate)
		return
	callback(null, docs, minDate)

fetchTimelinePostAndActivities = (opts, postConds, actvConds, cb) ->
	please.args({$contains:['maxDate']})

	Post
		.find _.extend({parent:null, created_at:{$lt:opts.maxDate-1}}, postConds)
		.sort '-created_at'
		.limit opts.limit or 20
		.exec (err, docs) ->
			return cb(err) if err
			results = _.filter(results, (i) -> i)
			minPostDate = 1*(docs.length and docs[docs.length-1].created_at) or 0
			cb(err, docs, minPostDate)

UserSchema.methods.getNotifications = (limit, cb) ->
	NotificationList.findOne { user: @_id }, (err, list) ->
		if err
			throw err # Programmer Error
		if not list
			return cb(null, {})
		cb(null, {
			docs: _.sortBy(list.docs, (i) -> -i.dateSent)
			last_seen: list.last_seen
		})

UserSchema.statics.getUserTimeline = (user, opts, cb) ->
	please.args({$isModel:User}, {$contains:'maxDate'})
	fetchTimelinePostAndActivities(
		{maxDate: opts.maxDate},
		{'author.id':''+user.id, parent:null},
		{actor:user},
		(err, all, minPostDate) -> cb(err, all, minPostDate)
	)

UserSchema.statics.AuthorSchema = {
		id: String
		username: String
		path: String
		avatarUrl: String
		name: String
	}

UserSchema.statics.toAuthorObject = (user) ->
	{
		id: user.id
		username: user.username
		path: user.path
		avatarUrl: user.avatarUrl
		name: user.name
	}

UserSchema.statics.fromObject = (object) ->
	new User(undefined, undefined, true).init(object)

UserSchema.plugin(require('./lib/hookedModelPlugin'))
UserSchema.plugin(require('./lib/trashablePlugin'))
UserSchema.plugin(require('./lib/selectiveJSON'), UserSchema.statics.APISelect)

User = Resource.discriminator 'User', UserSchema

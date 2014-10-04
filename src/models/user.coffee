
# src/models/user
# for QI Labs
# by @f03lipe

mongoose = require 'mongoose'
_ = require 'underscore'
async = require 'async'
jobs = require 'src/config/kue.js'
please = require 'src/lib/please.js'
redis = require 'src/config/redis.js'

##

ObjectId = mongoose.Types.ObjectId
Resource = mongoose.model 'Resource'

Post =
 Inbox =
 Follow =
 Problem =
 Activity =
 KarmaChunk =
 Notification =
 NotificationChunk = null

module.exports = (app) ->

module.exports.start = ->
	Post = Resource.model 'Post'
	Inbox = mongoose.model 'Inbox'
	Follow = Resource.model 'Follow'
	Problem = mongoose.model 'Problem'
	Activity = mongoose.model 'Activity'
	KarmaChunk = mongoose.model 'KarmaChunk'
	Notification = mongoose.model 'Notification'
	NotificationChunk = mongoose.model 'NotificationChunk'

##########################################################################################
## Schema ################################################################################

UserSchema = new mongoose.Schema {
	name:			{ type: String, required: true }
	username:		{ type: String, required: true, index: true }
	access_token: 	{ type: String, required: true }
	facebook_id:	{ type: String, required: true, index: true }
	email:			{ type: String }
	avatar_url:		{ type: String }

	profile: {
  		isStaff: 	{ type: Boolean, default: false }
		fbName: 	{ type: String }
		location:	{ type: String, default: '' }
		bio: 		{ type: String, default: ''}
		home: 		{ type: String, default: '' }
		bgUrl: 		{ type: String, default: '/static/images/rio.jpg' }
		serie: 		{ type: String, enum: ["6-ef","7-ef","8-ef","9-ef","1-em","2-em","3-em","faculdade","pg","esp"] }
		birthday:	{ type: Date }
	}

	stats: {
		karma: 	{ type: Number, default: 0 }
		# posts:	{ type: Number, default: 0 }
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
		last_seen_notifications: { type: Date, default: 0 }
		last_received_notification: { type: Date, default: 0 }
		karma_from_previous_chunks: { type: Number, default: 0 }
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

	karma_chunks: [KarmaChunk]
	notification_chunks: [NotificationChunk]
}, {
	toObject:	{ virtuals: true }
	toJSON: 	{ virtuals: true }
}

UserSchema.statics.APISelect = 'id name username profile path avatar_url avatarUrl -profile.serie -profile.birthday'
UserSchema.statics.APISelectSelf = 'id _id name username profile path avatar_url avatarUrl
 -profile.serie -profile.birthday profile
 meta.last_seen_notifications
 meta.last_received_notification
 preferences.interests'

##########################################################################################
## Virtuals ##############################################################################

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

##########################################################################################
## Middlewares ###########################################################################

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

##########################################################################################
## related to Following ##################################################################

# Get documents of users that @ follows.
UserSchema.methods.getPopulatedFollowers = (cb) -> # Add opts to prevent getting all?
	Follow.find {followee: @, follower: {$ne: null}}, (err, docs) ->
		return cb(err) if err
		User.populate docs, { path: 'follower' }, (err, popFollows) ->
			if err
				return cb(err)
			cb(null, _.filter(_.pluck(popFollows, 'follower'), (i)->i))

# Get documents of users that follow @.
UserSchema.methods.getPopulatedFollowing = (cb) -> # Add opts to prevent getting all?
	Follow.find {follower: @, followee: {$ne: null}}, (err, docs) ->
		return cb(err) if err
		User.populate docs, { path: 'followee' }, (err, popFollows) ->
			if err
				return cb(err)
			cb(null, _.filter(_.pluck(popFollows, 'followee'), (i)->i))

#

# Get id of users that @ follows.
UserSchema.methods.getFollowersIds = (cb) ->
	Follow.find {followee: @, follower: {$ne: null}}, (err, docs) ->
		if err
			return cb(err)
		cb(null, _.pluck(docs or [], 'follower'))

# Get id of users that follow @.
UserSchema.methods.getFollowingIds = (cb) ->
	Follow.find {follower: @, followee: {$ne: null}}, (err, docs) ->
		if err
			return cb(err)
		cb(null, _.pluck(docs or [], 'followee'))

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

##########################################################################################
## related to fetching Timelines and Inboxes #############################################

###
# Behold.
###
UserSchema.methods.getTimeline = (opts, callback) ->
	please.args {$contains:'maxDate', $contains:'source' }, '$isFn'
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
	# Get inboxed posts older than the opts.maxDate determined by the user.
	else if opts.source is 'inbox'
		Inbox
			.find { recipient:self.id, dateSent:{ $lt:opts.maxDate }}
			.sort '-dateSent' # tied to selection of oldest post below
			.populate 'resource'
			# .populate 'problem'
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
	throw "opts.source #NOT."

fetchTimelinePostAndActivities = (opts, postConds, actvConds, cb) ->
	please.args {$contains:['maxDate']}

	Post
		.find _.extend({parent:null, created_at:{$lt:opts.maxDate-1}}, postConds)
		.sort '-created_at'
		.limit opts.limit or 20
		.exec (err, docs) ->
			return cb(err) if err
			results = _.filter(results, (i) -> i)
			minPostDate = 1*(docs.length and docs[docs.length-1].created_at) or 0
			cb(err, docs, minPostDate)

UserSchema.methods.seeNotifications = (cb) ->
	User.findOneAndUpdate { _id: @_id }, { 'meta.last_seen_notifications': Date.now() },
	(err, save) ->
		if err or not save
			console.log("EROOOOO")
			throw err
		cb(null)

UserSchema.methods.getNotifications = (limit, cb) ->
	self = @
	if @notification_chunks.length is 0
		return cb(null, { items: [], last_seen: Date.now() })
	# TODO: Use cache here if last_sent_notification < last_seen_notifications
	id = @notification_chunks[@notification_chunks.length-1]
	NotificationChunk.findOne { _id: id }, (err, chunk) ->
		if err
			throw err # Programmer Error
		if not chunk
			return cb(null, {})
		_items = _.sortBy(chunk.items, (i) -> -i.updated_at).slice(0,limit)
		cb(null, {
			items: _.map(_items, (i) -> _.extend(i, { instances: i.instances.slice(0,5) }))
			last_seen: self.meta.last_seen_notifications
			last_update: chunk.updated_at
		})

UserSchema.methods.getKarma = (limit, cb) ->
	self = @
	if @karma_chunks.length is 0
		return cb(null, { items: [], last_seen: Date.now() })

	KarmaChunk.findOne { _id: @karma_chunks[@karma_chunks.length-1] }, (err, chunk) ->
		if err
			throw err # Programmer Error
		if not chunk
			return cb(null, {})
		cb(null, {
			items: _.sortBy(chunk.items, (i) -> -i.updated_at)
			last_seen: chunk.last_seen
			karma: self.stats.karma
		})

UserSchema.statics.getUserTimeline = (user, opts, cb) ->
	please.args {$isModel:User}, {$contains:'maxDate'}
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

# Useful inside templates
UserSchema.methods.toSelfJSON = () ->
	@toJSON({
		virtuals: true
		select: UserSchema.statics.APISelectSelf
	})

UserSchema.plugin(require('./lib/hookedModelPlugin'))
UserSchema.plugin(require('./lib/trashablePlugin'))
UserSchema.plugin(require('./lib/fromObjectPlugin'), () -> User)
UserSchema.plugin(require('./lib/selectiveJSON'), UserSchema.statics.APISelect)

User = mongoose.model('User', UserSchema)
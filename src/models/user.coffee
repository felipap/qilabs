
# src/models/user
# Copyright QILabs.org
# by @f03lipe

mongoose = require 'mongoose'
_ = require 'underscore'
async = require 'async'

jobs = require 'src/config/kue.js'
redis = require 'src/config/redis.js'

please = require 'src/lib/please.js'
please.args.extend(require 'src/models/lib/pleaseModels.js')

Resource = mongoose.model 'Resource'

Activity = Resource.model 'Activity'
Notification = mongoose.model 'Notification'

Inbox 	= mongoose.model 'Inbox'
Follow 	= Resource.model 'Follow'
Post 	= Resource.model 'Post'
Problem = Resource.model 'Problem'

ObjectId = mongoose.Types.ObjectId

################################################################################
## Schema ######################################################################

UserSchema = new mongoose.Schema {
	name:			{ type: String, required: true }
	username:		{ type: String, required: true }
	access_token: 	{ type: String, required: true }
	facebook_id:	{ type: String, required: true }
	email:			{ type: String }
	avatar_url:		{ type: String }

	profile: {
  		isStaff: 	{ type: Boolean, default: false }
		fbName: 	{ type: String }
		location:	{ type: String, default: 'Student at Hogwarts School' }
		bio: 		{ type: String, default: 'Lorem ipsum dolor sit amet, consectetur adipisicing elit.'}
		home: 		{ type: String, default: 'Rua dos Alfeneiros, n° 4, Little Whitning' }
		bgUrl: 		{ type: String, default: '/static/images/rio.jpg' }
		serie: 		{ type: String }
		avatarUrl: 	''
		birthday:	{ type: Date }
		anoNascimento: { type: Number }
	},

	stats: {
		posts:	{ type: Number, default: 0 }
		votes:	{ type: Number, default: 0 }
		followers:	{ type: Number, default: 0 }
		following:	{ type: Number, default: 0 }
	},

	preferences: {
		tags: 	[]
	},

	meta: {
		sessionCount: { type: Number, default: 0 }
		created_at: { type: Date, default: Date.now }
		updated_at: { type: Date, default: Date.now }
		last_access: { type: Date, default: Date.now }
	}
}, {
	toObject:	{ virtuals: true }
	toJSON: 	{ virtuals: true }
}

UserSchema.statics.APISelect = 'name username profile'

################################################################################
## Virtuals ####################################################################

UserSchema.methods.getCacheFields = (field) ->
	switch field
		when "Following"
			return "user:#{@id}:following"
		else
			throw "Field #{field} isn't a valid cache field."


UserSchema.virtual('avatarUrl').get ->
	if @facebook_id is process.env.facebook_me
		'http://qilabs.org/static/images/avatar.png'
	else
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

UserSchema.pre 'remove', (next) ->
	Follow.find().or([{followee:@}, {follower:@}]).exec (err, docs) =>
		if docs
			for follow in docs
				follow.remove(() ->)
		console.log "Removing #{err} #{docs.length} follows of #{@username}"
		next()

UserSchema.pre 'remove', (next) ->
	Post.find {'author.id':@}, (err, docs) =>
		if docs
			for doc in docs
				doc.remove(() ->)
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

# Get Follow documents where @ is followee.
UserSchema.methods.getFollowsAsFollowee = (cb) ->
	Follow.find {followee: @, follower: {$ne: null}}, cb

# Get Follow documents where @ is follower.
UserSchema.methods.getFollowsAsFollower = (cb) ->
	Follow.find {follower: @, followee: {$ne: null}}, cb

#

# Get documents of users that @ follows.
UserSchema.methods.getPopulatedFollowers = (cb) -> # Add opts to prevent getting all?
	@getFollowsAsFollowee (err, docs) ->
		return cb(err) if err
		User.populate docs, { path: 'follower' }, (err, popFollows) ->
			cb(err, _.filter(_.pluck(popFollows, 'follower'), (i)->i))

# Get documents of users that follow @.
UserSchema.methods.getPopulatedFollowing = (cb) -> # Add opts to prevent getting all?
	@getFollowsAsFollower (err, docs) ->
		return cb(err) if err
		User.populate docs, { path: 'followee' }, (err, popFollows) ->
			cb(err, _.filter(_.pluck(popFollows, 'followee'), (i)->i))

#

# Get id of users that @ follows.
UserSchema.methods.getFollowersIds = (cb) ->
	@getFollowsAsFollowee (err, docs) ->
		cb(err, _.pluck(docs or [], 'follower'))

# Get id of users that follow @.
UserSchema.methods.getFollowingIds = (cb) ->
	@getFollowsAsFollower (err, docs) ->
		cb(err, _.pluck(docs or [], 'followee'))

#### Stats

UserSchema.methods.doesFollowUser = (user, cb) ->
	if user instanceof User
		userId = user.id
	else if typeof user is "string"
		userId = user
	else
		throw "Passed argument should be either a User object or a string id."
	redis.sismember @getCacheFields("Following"), ""+userId, (err, val) -> 
		if err
			console.log arguments
			Follow.findOne {followee:userId,follower:@id}, (err, doc) -> cb(err, !!doc)
		else
			cb(null, !!val)

#### Actions

UserSchema.methods.dofollowUser = (user, cb) ->
	please.args({$isModel:'User'},'$isCb')
	self = @
	if ''+user.id is ''+self.id # Can't follow myself
		return cb(true)

	Follow.findOne {follower:self, followee:user}, (err, doc) =>
		unless doc
			doc = new Follow {
				follower: self
				followee: user
			}
			doc.save()

			# ACID, please
			redis.sadd @getCacheFields("Following"), ''+user.id, (err, doc) ->
				console.log "sadd on following", arguments
				if err
					console.log err
			
			## These two triggers should be inside a job
			# Notify followed user
			Notification.Trigger(self, Notification.Types.NewFollower)(self, user, ->)
			# Trigger creation of activity to timeline
			Activity.Trigger(self, Notification.Types.NewFollower)({
				follow: doc,
				follower: self,
				followee: user
			}, ->)

			jobs.create('user follow', {
				title: "New follow: #{self.name} → #{user.name}",
				follower: self,
				followee: user,
			}).save()
		cb(err, !!doc)

UserSchema.methods.unfollowUser = (user, cb) ->
	please.args({$isModel:User}, '$isCb')
	self = @

	Follow.findOne { follower:@, followee:user }, (err, doc) =>
		return cb(err) if err
		
		if doc
			doc.remove(cb)
			jobs.create('user unfollow', {
				title: "New unfollow: #{self.name} → #{user.name}",
				followee: user,
				follower: self,
			}).save()

		# remove on redis anyway? or only inside clause?
		redis.srem @getCacheFields("Following"), ''+user.id, (err, doc) ->
			console.log "srem on following", arguments
			if err
				console.log err

################################################################################
## related to fetching Timelines and Inboxes ###################################

###
# Behold.
###
UserSchema.methods.getTimeline = (opts, callback) ->
	please.args({$contains:'maxDate', $contains:'source', source:{$among:['inbox','global','problems']}}, '$isCb')
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

				# async.map docs, (post, done) ->
				# 	if post instanceof Post
				# 		done(err, post.toJSON())
				# 		Post.count {type:'Comment', parent:post}, (err, ccount) ->
				# 			Post.count {type:'Answer', parent:post}, (err, acount) ->
				# 	else done(null, post.toJSON)
				# , (err, results) ->
				callback(null, docs, minDate)
	else if opts.source is 'inbox'
		# Get inboxed posts older than the opts.maxDate determined by the user.
		Inbox
			.find { recipient:self.id, dateSent:{ $lt:opts.maxDate }}
			.sort '-dateSent' # tied to selection of oldest post below
			.populate 'resource'
			.limit 25
			.exec (err, docs) =>
				return cb(err) if err
				# Pluck resources from inbox docs. Remove null (deleted) resources.
				posts = _.filter(_.pluck(docs, 'resource'), (i)->i)

				console.log "#{posts.length} posts gathered from inbox"
				if not posts.length or not docs[docs.length-1]
					# Not even opts.limit inboxed posts exist.
					# Pass minDate=0 to prevent newer fetches.
					minDate = 0
				else# Pass minDate=oldestPostDate, to start newer fetches from there.
					minDate = posts[posts.length-1].created_at

				# Resource
				# 	.populate posts, {
				# 		path: 'actor target object', select: User.APISelect
				# 	}, (err, docs) =>
				# 		return callback(err) if err
				# async.map posts, (post, done) ->
				# 	if post instanceof Post
				# 		Post.count {type:'Comment', parent:post}, (err, ccount) ->
				# 			Post.count {type:'Answer', parent:post}, (err, acount) ->
				# 				done(err, _.extend(post.toJSON(), {childrenCount:{Answer:acount,Comment:ccount}}))
				# 	else done(null, post.toJSON)
				# , (err, results) -> callback(err, results, 1*minDate)
				callback(null, docs, minDate)
	else if opts.source is 'problems'
		Problem.find { created_at: { $lt:opts.maxDate } }, (err, docs) =>
			return callback(err) if err
			if not docs.length or not docs[docs.length]
				minDate = 0
			else
				minDate = docs[docs.length-1].created_at

			callback(err, docs, minDate)

fetchTimelinePostAndActivities = (opts, postConds, actvConds, cb) ->
	please.args({$contains:['maxDate']})

	Post
		.find _.extend({parent:null, created_at:{$lt:opts.maxDate-1}}, postConds)
		.sort '-created_at'
		.limit opts.limit or 20
		.exec (err, docs) ->
			# console.log('oi', err, docs)
			return cb(err) if err
			results = _.filter(results, (i) -> i)
			minPostDate = 1*(docs.length and docs[docs.length-1].created_at) or 0
			# async.parallel [ # Fill post comments and get activities in that time.
			# 	(next) ->
			# 		Activity
			# 			.find _.extend(actvConds, updated:{$lt:opts.maxDate,$gt:minPostDate})
			# 			.populate 'resource actor target object'
			# 			.exec next
			# ], (err, results) -> # Merge results and call back
			# 	return cb(err) if err
			# 	results = _.filter(results, (i) -> i)
			# 	console.log(results)
			# 	if err
			# 		console.log(err)
			# 	all = _.sortBy((results[0]||[]).concat(results[1]), (p) -> -p.created_at)
			# 	cb(err, all, minPostDate)
			cb(err, docs, minPostDate)

UserSchema.statics.getUserTimeline = (user, opts, cb) ->
	please.args({$isModel:User}, {$contains:'maxDate'})
	fetchTimelinePostAndActivities(
		{maxDate: opts.maxDate},
		{'author.id':''+user.id, parent:null},
		{actor:user},
		(err, all, minPostDate) -> cb(err, all, minPostDate)
	)

UserSchema.statics.toAuthorObject = (user) ->
	{
		id: user.id,
		username: user.username,
		path: user.path,
		avatarUrl: user.avatarUrl,
		name: user.name,
	}

################################################################################
## related to the notification #################################################

UserSchema.methods.getNotifications = (limit, cb) ->
	Notification
		.find { recipient:@ }
		.limit limit
		.sort '-dateSent'
		.exec cb

UserSchema.statics.fromObject = (object) ->
	new User(undefined, undefined, true).init(object)

UserSchema.plugin(require('./lib/hookedModelPlugin'));
UserSchema.plugin(require('./lib/trashablePlugin'))
UserSchema.plugin(require('./lib/selectiveJSON'), UserSchema.statics.APISelect)

# module.exports = (app) ->
# 	jobs = require('src/config/kue.js')
# 	return User = Resource.discriminator "User", UserSchema
module.exports = User = Resource.discriminator "User", UserSchema
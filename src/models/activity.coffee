
# src/models/event
# for QI Labs
# by @f03lipe

assert = require 'assert'
_ = require 'underscore'
async = require 'async'
mongoose = require 'mongoose'

please = require 'src/lib/please.js'

##

ObjectId = mongoose.Schema.ObjectId

Inbox = mongoose.model 'Inbox'
Notification = mongoose.model 'Notification'

Types =
	NewFollower: "NewFollower"
	GroupCreated: "GroupCreated"
	GroupMemberAdded: "GroupMemberAdded"

ContentHtmlTemplates =
	NewFollower: '<a href="<%= actor.path %>"><%= actor && actor.name %></a> começou a seguir <a href="<%= target.path %>"><%= target && target.name %></a>.'
	GroupCreated: '<a href="<%= actor.path %>"><%= actor && actor.name %></a> criou o grupo <a href="<%= object && object.path %>"><%= object && object.name %></a>.'
	GroupMemberAdded: '<a href="<%= object.path %>"><%= object && object.name %></a> entrou para o laboratório <a href="<%= target && target.path %>"><%= target && target.name %></a>.'

module.exports = (app) ->

################################################################################
## Schema ######################################################################

# See http://activitystrea.ms/specs/json/1.0/

ActivitySchema = new mongoose.Schema {
	actor:			{ type: ObjectId, ref: 'User', required: true }
	icon: 			{ type: String }
	# object: 		{ type: String, ref: 'Resource' }
	# target: 		{ type: String, ref: 'Resource' }
	verb: 			{ type: String, required: true }

	# event: 		{ type: ObjectId, ref: 'Event', required: false }
	# tags:		   [{ type: ObjectId, ref: 'Tag' }]

	published:		{ type: Date, default: Date.now }
	updated:		{ type: Date, default: Date.now }
}, {
	toObject:	{ virtuals: true }
	toJSON: 	{ virtuals: true }
}

################################################################################
## Virtuals ####################################################################

ActivitySchema.virtual('content').get ->
	if @verb of ContentHtmlTemplates
		return _.template(ContentHtmlTemplates[@verb], @)
	console.warn "No html template found for activity of verb "+@verb
	return "Notificação "+@verb

ActivitySchema.virtual('apiPath').get ->
	'/api/activities/'+@id

################################################################################
## Middlewares #################################################################

ActivitySchema.pre 'save', (next) ->
	@published ?= new Date
	@updated ?= new Date
	next()

ActivitySchema.pre 'remove', (next) ->
	next()
	Inbox.remove { resource: @id }, (err, doc) =>
		console.log "Removing #{err} #{doc} inbox of activity #{@id}"


################################################################################
## Methods #####################################################################

################################################################################
## Statics #####################################################################

createActivityAndInbox = (agentObj, data, cb) ->
	please {$model:'User'}, {$contains:['verb', 'url', 'actor', 'object']}, '$isFn'

	activity = new Activity {
		verb: data.verb
		url: data.url
		actor: data.actor
		object: data.object
		target: data.target
	}

	activity.save (err, doc) ->
		if err then console.log err
		# console.log doc
		agentObj.getFollowersIds (err, followers) ->
			Inbox.fillInboxes([agentObj._id].concat(followers), {
				author: agentObj,
				resource: activity,
			}, cb)

ActivitySchema.statics.Trigger = (agentObj, activityType) ->
	User = mongoose.model 'User'

	switch activityType
		when Types.NewFollower
			return (opts, cb) ->
				please({
					follow:{$model:'Follow'},
					followee:{$model:'User'},
					follower:{$model:'User'}
					}, '$isFn', arguments)

				return

				# Find and delete older notifications with the same follower and followee.
				genericData = {
					verb:activityType,
					actor:opts.follower,
					target:opts.followee
				}
				Activity.remove genericData, (err, count) ->
					if err then console.log 'trigger err:', err
					createActivityAndInbox opts.follower, _.extend(genericData, {
						url: opts.follower.path
						object: opts.follow
					}), ->
		else
			throw "Unrecognized Activity Type passed to Trigger."

ActivitySchema.statics.Types = Types

ActivitySchema.plugin(require('./lib/hookedModelPlugin'))

Activity = mongoose.model("Activity", ActivitySchema)
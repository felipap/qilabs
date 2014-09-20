
# src/models/follow
# Copyright QILabs.org
# by @f03lipe

mongoose = require 'mongoose'

Resource = mongoose.model 'Resource'

Inbox = mongoose.model 'Inbox'
Notification = mongoose.model 'Notification'

################################################################################
## Follow Schema ###############################################################

FollowSchema = new mongoose.Schema {
	dateBegin:	{ type: Date, index: 1 }
	follower: 	{ type: mongoose.Schema.ObjectId, index: 1 }
	followee: 	{ type: mongoose.Schema.ObjectId, index: 1 }
}

################################################################################
## Middlewares #################################################################

FollowSchema.post 'remove', (follow) ->
	Notification.invalidResource(follow, () ->)

FollowSchema.pre 'save', (next) ->
	@dateBegin ?= new Date
	next()

FollowSchema.statics.fromObject = (object) ->
	new Follow(undefined, undefined, true).init(object)

FollowSchema.plugin(require('./lib/hookedModelPlugin'));

Follow = Resource.discriminator "Follow", FollowSchema

module.exports = (app) ->

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

# Remove follow notifications on unfollow
FollowSchema.pre 'remove', (next) ->
	Notification.remove {
		type:Notification.Types.NewFollower,
		agent:@follower,
		recipient:@followee,
	}, (err, result) ->
		console.log "Removing #{err} #{result} notifications on unfollow."
		next()


FollowSchema.pre 'save', (next) ->
	@dateBegin ?= new Date
	next()

FollowSchema.plugin(require('./lib/hookedModelPlugin'));

module.exports = Follow = Resource.discriminator "Follow", FollowSchema

# src/models/answer

mongoose = require 'mongoose'
assert = require 'assert'
_ = require 'underscore'
async = require 'async'

please = require 'src/lib/please.js'
please.args.extend(require('./lib/pleaseModels.js'))

Notification = mongoose.model 'Notification'
Resource = mongoose.model 'Resource'
Inbox = mongoose.model 'Inbox'

################################################################################
## Schema ######################################################################

ObjectId = mongoose.Schema.ObjectId

AnswerSchema = new Resource.Schema {
	author: {
		id: String
		username: String
		path: String
		avatarUrl: String
		name: String
	}
	
	problem: 	{ type: String, ref: 'Problem', required: true }
	updated_at:	{ type: Date }
	created_at:	{ type: Date, indexed: 1, default: Date.now }

	content: {
		body:	{ type: String, required: true }
	}

	votes: 		{ type: [{ type: String, ref: 'User', required: true }], default: [] }
}, {
	toObject:	{ virtuals: true }
	toJSON: 	{ virtuals: true }
}

AnswerSchema.statics.APISelect = ''

################################################################################
## Virtuals ####################################################################

AnswerSchema.virtual('voteSum').get ->
	@votes.length

AnswerSchema.virtual('path').get ->
	if @parentAnswer
		"/problems/"+@parentAnswer+"#"+@id
	else
		"/problems/{id}".replace(/{id}/, @id)

AnswerSchema.virtual('apiPath').get ->
	"/api/problems/{id}".replace(/{id}/, @id)

################################################################################
## Middlewares #################################################################

AnswerSchema.pre 'remove', (next) ->
	next()
	Notification.find { resources: @ }, (err, docs) =>
		console.log "Removing #{err} #{docs.length} notifications of Answer #{@id}"
		docs.forEach (doc) ->
			doc.remove()

# AnswerSchema.pre 'remove', (next) ->
# 	next()
# 	Answer.find { parentAnswer: @ }, (err, docs) ->
# 		docs.forEach (doc) ->
# 			doc.remove()

# AnswerSchema.pre 'remove', (next) ->
# 	next()
# 	Inbox.remove { resource: @id }, (err, doc) =>
# 		console.log "Removing #{err} #{doc} inbox of Answer #{@id}"

AnswerSchema.pre 'remove', (next) ->
	next()
	@addToGarbage (err) ->
		console.log "#{err} - moving Answer #{@id} to garbage"

# AnswerSchema.pre 'remove', (next) ->
# 	next()
# 	# Do this last, so that the status isn't rem
# 	# Decrease author stats.
# 	if not @parentAnswer
# 		User = Resource.model('User')
# 		User.findById @author.id, (err, author) ->
# 			author.update {$inc:{'stats.Answers':-1}}, (err) ->
# 				if err
# 					console.err "Error in decreasing author stats: "+err

################################################################################
## Methods #####################################################################

AnswerSchema.methods.getComments = (cb) ->
	Post.find { parent: @id }, cb

################################################################################
## Statics #####################################################################


AnswerSchema.statics.fromObject = (object) ->
	new Answer(undefined, undefined, true).init(object)

AnswerSchema.plugin(require('./lib/hookedModelPlugin'))
AnswerSchema.plugin(require('./lib/trashablePlugin'))

module.exports = Answer = Resource.discriminator('Answer', AnswerSchema)
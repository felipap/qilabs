
# src/models/problem

mongoose = require 'mongoose'
assert = require 'assert'
_ = require 'underscore'
async = require 'async'

please = require 'src/lib/please.js'
please.args.extend(require('./lib/pleaseModels.js'))

Notification = mongoose.model 'Notification'
Resource = mongoose.model 'Resource'
Garbage = mongoose.model 'Garbage'
Inbox = mongoose.model 'Inbox'

################################################################################
## Schema ######################################################################

ObjectId = mongoose.Schema.ObjectId

AnswerSchema = new Resource.Schema {
	author: {
		id: String,
		username: String,
		path: String,
		avatarUrl: String,
		name: String,
	}
	
	updated:	{ type: Date }
	published:	{ type: Date, indexed: 1, default: Date.now }
	subject:	{ type: String }
	topics:		{ type: [{ type: String }] }

	content: {
		title:	{ type: String }
		body:	{ type: String, required: true }
		source:	{ type: String }
		image:  { type: String }
		answer: {
			value: 0,
			options: [],
			is_mc: { type: Boolean, default: true },
		}
	}

	watching: 	[] # for discussions
	canSeeAnswers: [] # for problems

	votes: 		{ type: [{ type: String, ref: 'User', required: true }], default: [] }
}, {
	toObject:	{ virtuals: true }
	toJSON: 	{ virtuals: true }
}

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

AnswerSchema.pre 'remove', (next) ->
	next()
	Answer.find { parentAnswer: @ }, (err, docs) ->
		docs.forEach (doc) ->
			doc.remove()

# AnswerSchema.pre 'remove', (next) ->
# 	next()
# 	Inbox.remove { resource: @id }, (err, doc) =>
# 		console.log "Removing #{err} #{doc} inbox of Answer #{@id}"

AnswerSchema.pre 'remove', (next) ->
	next()
	@addToGarbage (err) ->
		console.log "#{err} - moving Answer #{@id} to garbage"

AnswerSchema.pre 'remove', (next) ->
	next()
	# Do this last, so that the status isn't rem
	# Decrease author stats.
	if not @parentAnswer
		User = Resource.model('User')
		User.findById @author.id, (err, author) ->
			author.update {$inc:{'stats.Answers':-1}}, (err) ->
				if err
					console.err "Error in decreasing author stats: "+err


################################################################################
## Methods #####################################################################

AnswerSchema.methods.getComments = (cb) ->
	Answer.find { parentAnswer: @id }
		# .populate 'author', '-memberships'
		.exec (err, docs) ->
			cb(err, docs)

AnswerSchema.methods.stuff = (cb) ->
	@fillChildren(cb)

AnswerSchema.methods.fillChildren = (cb) ->
	Post.find {parentAnswer:@}
		# .populate 'author'
		.exec (err, children) =>
			async.map children, ((c, done) =>
				if c.type in [Types.Answer]
					c.fillChildren(done)
				else
					done(null, c)
			), (err, popChildren) =>
				cb(err, _.extend(@toJSON(), {children:_.groupBy(popChildren, (i) -> i.type)}))

################################################################################
## Statics #####################################################################

AnswerSchema.statics.countList = (docs, cb) ->
	please.args({$isA:Array}, '$isCb')

	async.map docs, (Answer, done) ->
		if Answer instanceof Answer
			Answer.count {type:'Comment', parentAnswer:Answer}, (err, ccount) ->
				Answer.count {type:'Answer', parentAnswer:Answer}, (err, acount) ->
					done(err, _.extend(Answer.toJSON(), {childrenCount:{Answer:acount,Comment:ccount}}))
		else done(null, Answer.toJSON)
	, (err, results) ->
		cb(err, results)


AnswerSchema.statics.fromObject = (object) ->
	new Answer(undefined, undefined, true).init(object)

AnswerSchema.plugin(require('./lib/hookedModelPlugin'))
AnswerSchema.plugin(require('./lib/trashablePlugin'))

module.exports = Answer = Resource.discriminator('Answer', AnswerSchema)
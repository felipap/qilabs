
# src/models/problem

mongoose = require 'mongoose'
assert = require 'assert'
_ = require 'underscore'
async = require 'async'

please = require 'src/lib/please.js'

Notification = mongoose.model 'Notification'
Resource = mongoose.model 'Resource'
CommentTree = mongoose.model 'CommentTree'
Inbox = mongoose.model 'Inbox'

################################################################################
## Schema ######################################################################

ObjectId = mongoose.Schema.ObjectId

ProblemSchema = new Resource.Schema {
	author: {
		id: String
		username: String
		path: String
		avatarUrl: String
		name: String
	}

	updated_at:	{ type: Date }
	created_at:	{ type: Date, index: 1, default: Date.now }

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

	counts: {
		# votes: 		{ type: Number, default: 0 }
		children:	{ type: Number, default: 0 }
	}

	hasAnswered: [],
	hasSeenAnswers: [],
	userTries: [],

	comment_tree: { type: String, ref: 'CommentTree' },
	votes: 		{ type: [{ type: String, ref: 'User', required: true }], default: [] }
}, {
	toObject:	{ virtuals: true }
	toJSON: 	{ virtuals: true }
}

ProblemSchema.statics.APISelect = '-hasAnswered -canSeeAnswers -hasSeenAnswers -watching -userTries -comment_tree'

################################################################################
## Virtuals ####################################################################

ProblemSchema.virtual('counts.votes').get ->
	@votes.length

ProblemSchema.virtual('path').get ->
	"/problems/{id}".replace(/{id}/, @id)

ProblemSchema.virtual('apiPath').get ->
	"/api/problems/{id}".replace(/{id}/, @id)

################################################################################
## Middlewares #################################################################

ProblemSchema.pre 'remove', (next) ->
	next()
	Notification.find { resources: @ }, (err, docs) =>
		console.log "Removing #{err} #{docs.length} notifications of Problem #{@id}"
		docs.forEach (doc) ->
			doc.remove()

ProblemSchema.pre 'remove', (next) ->
	next()
	Inbox.remove { resource: @id }, (err, doc) =>
		console.log "Removing #{err} #{doc} inbox of Problem #{@id}"

ProblemSchema.pre 'remove', (next) ->
	CommentTree.findById @comment_tree, (err, tree) ->
		tree.remove (err) ->
			if err
				console.warn('Err removing commentree from post')
			next()

################################################################################
## Methods #####################################################################

ProblemSchema.methods.getAnswers = (cb) ->
	if @comment_tree
		CommentTree.findById @comment_tree, (err, tree) ->
			cb(err, tree and tree.toJSON().docs)
	else
		cb(null, [])

ProblemSchema.methods.getFilledAnswers = (cb) ->
	self = @
	self.getAnswers (err, docs) ->
		return cb(err) if err
		async.map docs, ((ans, done) ->
			ans.getComments (err, docs) ->
				done(err, _.extend(ans.toJSON(), { comments: docs}))
		), cb

################################################################################
## Statics #####################################################################

ProblemSchema.statics.fromObject = (object) ->
	new Problem(undefined, undefined, true).init(object)

ProblemSchema.plugin(require('./lib/hookedModelPlugin'))
ProblemSchema.plugin(require('./lib/trashablePlugin'))
ProblemSchema.plugin(require('./lib/selectiveJSON'), ProblemSchema.statics.APISelect)

module.exports = Problem = Resource.discriminator('Problem', ProblemSchema)
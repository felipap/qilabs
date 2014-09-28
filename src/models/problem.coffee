
# src/models/problem

mongoose = require 'mongoose'
assert = require 'assert'
_ = require 'underscore'
async = require 'async'

please = require 'src/lib/please.js'

Notification = mongoose.model 'Notification'
CommentTree = mongoose.model 'CommentTree'
Inbox = mongoose.model 'Inbox'

################################################################################
## Schema ######################################################################

ObjectId = mongoose.Schema.ObjectId

ProblemSchema = new mongoose.Schema {
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
	}
	answer: {
		value: 0,
		options: [],
		is_mc: { type: Boolean, default: true },
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

ProblemSchema.post 'remove', (object) ->
	Activity = mongoose.model('Activity')
	Activity
		.find()
		.or [{ target: object.id }, { object: object.id }]
		.exec (err, docs) ->
			if err
				console.log("error", err)
				return next(true)
			console.log("Activity " + err + " " + docs.length + " removed bc " + object.id)
			docs.forEach (doc) ->
				doc.remove()

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

TITLE_MIN = 10
TITLE_MAX = 100
BODY_MIN = 20
BODY_MAX = 20*1000
COMMENT_MIN = 3
COMMENT_MAX = 1000

val = require('validator')

dryText = (str) -> str.replace(/(\s{1})[\s]*/gi, '$1')
pureText = (str) -> str.replace(/(<([^>]+)>)/ig,"")

ProblemSchema.statics.ParseRules = {
	# subject:
	# 	$valid: (str) -> str in ['application', 'mathematics']
	answer:
		is_mc:
			$valid: (str) -> str is true or str is false
		options:
			$required: false
			$valid: (array) ->
				if array instanceof Array and array.length is 5
					for e in array
						if e.length >= 40
							return false
					return true
				return false
		value:
			$required: false
			$valid: (str) -> true
	content:
		title:
			$valid: (str) -> val.isLength(str, TITLE_MIN, TITLE_MAX)
			$clean: (str) -> val.stripLow(dryText(str))
		source:
			$valid: (str) -> not str or val.isLength(str, 0, 80)
			$clean: (str) -> val.stripLow(dryText(str))
		body:
			$valid: (str) -> val.isLength(pureText(str), BODY_MIN) and val.isLength(str, 0, BODY_MAX)
			$clean: (str) -> val.stripLow(dryText(str))
}

ProblemSchema.statics.fromObject = (object) ->
	new Problem(undefined, undefined, true).init(object)

ProblemSchema.plugin(require('./lib/hookedModelPlugin'))
ProblemSchema.plugin(require('./lib/trashablePlugin'))
ProblemSchema.plugin(require('./lib/selectiveJSON'), ProblemSchema.statics.APISelect)

module.exports = Problem = mongoose.model('Problem', ProblemSchema)
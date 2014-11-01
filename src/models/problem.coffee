
# src/models/problem

mongoose = require 'mongoose'
assert = require 'assert'
_ = require 'underscore'
async = require 'async'
validator = require 'validator'

please = require 'src/lib/please.js'

Notification = mongoose.model 'Notification'
CommentTree = mongoose.model 'CommentTree'
Inbox = mongoose.model 'Inbox'

################################################################################
## Schema ######################################################################

Topics = ['algebra','number-theory','geometry','combinatorics']

Levels = {1:1,2:2,3:3}

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

	topic:	{ type: String }
	level:	{ type: Number, enum: [1,2,3], default: 1 }

	# topics:		{ type: [{ type: String, enum: _.keys(Topics) }] }

	content: {
		title:	{ type: String }
		body:	{ type: String, required: true }
		source:	{ type: String }
		solution: { type: String }
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

	users_watching:[{ type: String, ref: 'User' }] # list of users watching this thread
	comment_tree: { type: String, ref: 'CommentTree' },
	votes: 		{ type: [{ type: String, ref: 'User', required: true }], default: [] }
}, {
	toObject:	{ virtuals: true }
	toJSON: 	{ virtuals: true }
}

ProblemSchema.statics.APISelect = '-hasAnswered -canSeeAnswers -hasSeenAnswers -watching -userTries -comment_tree -answer.value -answer.options'
ProblemSchema.statics.APISelectAuthor = '-hasAnswered -canSeeAnswers -hasSeenAnswers -watching -userTries -comment_tree'

################################################################################
## Virtuals ####################################################################

# http://stackoverflow.com/a/12646864
# Randomize array element order in-place.
# Using Fisher-Yates shuffle algorithm.
shuffleArray = (array) ->
	for i in [array.length-1...0]
		j = Math.floor(Math.random() * (i + 1))
		temp = array[i]
		[array[i], array[j]] = [array[j], array[i]]
	return array

ProblemSchema.virtual('counts.votes').get ->
	@votes.length

ProblemSchema.virtual('counts.solved').get ->
	@hasAnswered.length

ProblemSchema.virtual('answer.mc_options').get ->
	if @answer.is_mc
		return shuffleArray(@answer.options)

ProblemSchema.virtual('path').get ->
	"/problemas/{id}".replace(/{id}/, @id)

ProblemSchema.virtual('__t').get ->
	return 'Problem'

ProblemSchema.virtual('apiPath').get ->
	"/api/problems/{id}".replace(/{id}/, @id)

ProblemSchema.virtual('translatedTopic').get ->
	return {
		'algebra': 'Álgebra'
		'combinatorics': 'Combinatória'
		'number-theory': 'Teoria dos Números'
		'geometry': 'Geometria'
	}[@topic]


################################################################################
## Middlewares #################################################################

ProblemSchema.post 'remove', (problem) ->
	Notification.find { resources: problem.id }, (err, docs) =>
		console.log "Removing #{err} #{docs.length} notifications of problem
			#{problem.id}"
		docs.forEach (doc) ->
			doc.remove()

ProblemSchema.post 'remove', (problem) ->
	Inbox.remove { problem: problem.id }, (err, doc) =>
		console.log "Removing err:#{err} #{doc} inbox of problem #{problem.id}"

ProblemSchema.post 'remove', (problem) ->
	CommentTree.findById problem.comment_tree, (err, doc) ->
		if doc
			doc.remove (err) ->
				if err
					console.warn('Err removing comment tree', err)

# ProblemSchema.post 'remove', (object) ->
# 	Activity = mongoose.model('Activity')
# 	Activity
# 		.find()
# 		.or [{ target: object.id }, { object: object.id }]
# 		.exec (err, docs) ->
# 			if err
# 				console.log("error", err)
# 				return next(true)
# 			console.log("Activity " + err + " " + docs.length + " removed bc " + object.id)
# 			docs.forEach (doc) ->
# 				doc.remove()

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

ProblemSchema.methods.validAnswer = (test) ->
	if @answer.is_mc
		console.log(test, @answer.options[0])
		return validator.trim(@answer.options[0]) is validator.trim(test)
	else
		return validator.trim(@answer.value) is validator.trim(test)

################################################################################
## Statics #####################################################################

TITLE_MIN = 10
TITLE_MAX = 100
BODY_MIN = 20
BODY_MAX = 20*1000
COMMENT_MIN = 3
COMMENT_MAX = 1000

dryText = (str) -> str.replace(/( {1})[ ]*/gi, '$1')
pureText = (str) -> str.replace(/(<([^>]+)>)/ig,"")

ProblemSchema.statics.ParseRules = {
	topic:
		$valid: (str) -> str in ['algebra', 'number-theory', 'combinatorics', 'geometry']
	level:
		$valid: (str) -> str in [1,2,3]
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
			$valid: (str) -> validator.isLength(str, TITLE_MIN, TITLE_MAX)
			$clean: (str) -> validator.stripLow(dryText(str), true)
		source:
			$valid: (str) -> not str or validator.isLength(str, 0, 80)
			$clean: (str) -> validator.stripLow(dryText(str), true)
		body:
			$valid: (str) -> validator.isLength(pureText(str), BODY_MIN) and validator.isLength(str, 0, BODY_MAX)
			$clean: (str) ->
				console.log("BEFORE", str)
				console.log("AFTER", validator.stripLow(dryText(str), true))
				validator.stripLow(dryText(str), true)
}

ProblemSchema.statics.Topics = Topics
ProblemSchema.statics.Levels = Levels
ProblemSchema.plugin(require('./lib/hookedModelPlugin'))
ProblemSchema.plugin(require('./lib/fromObjectPlugin'), () -> Problem)
ProblemSchema.plugin(require('./lib/trashablePlugin'))
ProblemSchema.plugin(require('./lib/selectiveJSON'), ProblemSchema.statics.APISelect)

module.exports = Problem = mongoose.model('Problem', ProblemSchema)
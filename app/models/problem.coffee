
# app/models/problem

mongoose = require 'mongoose'
_ = require 'lodash'
async = require 'async'
validator = require 'validator'

labs = require 'app/data/labs'

CommentTree = mongoose.model 'CommentTree'

AuthorSchema = (require './user').statics.AuthorSchema

################################################################################
## Schema ######################################################################

module.exports = () ->

Subjects = ['mathematics', 'physics', 'chemistry']
Topics = ['algebra','number-theory','geometry','combinatorics']
Levels = [1,2,3,4,5]

TSubjects = {
	mathematics: 'Matemática',
	physics: 'Física',
	chemistry: 'Química'
}

ProblemSchema = new mongoose.Schema {
	author: AuthorSchema

	updated_at:	{ type: Date }
	created_at:	{ type: Date, index: 1, default: Date.now }

	subject:{ type: String, enum: Subjects, required: true }
	topic:	{ type: String }
	level:	{ type: Number, enum: Levels, required: true }
	_set: 	{ type: Number, default: 0 }

	content: {
		title:		{ type: String }
		body:			{ type: String, required: true }
		source:		{ type: String }
		solution: { type: String }
		image:  	{ type: String }
		cover:  	{ type: String }
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

ProblemSchema.virtual('counts.votes').get ->
	@votes.length

ProblemSchema.virtual('counts.solved').get ->
	@hasAnswered.length

##

ProblemSchema.virtual('path').get ->
	"/problema/{id}".replace(/{id}/, @id)

ProblemSchema.virtual('thumbnail').get ->
	@content.image or @author.avatarUrl

ProblemSchema.virtual('apiPath').get ->
	"/api/problems/{id}".replace(/{id}/, @id)

## translation

ProblemSchema.virtual('materia').get ->
	TSubjects[@subject]

ProblemSchema.virtual('type').get ->
	'Problem'

ProblemSchema.virtual('topico').get ->
	pool = labs[@subject].topics
	for e in pool
		if e.id is @topic
			return e.name
	'?'


################################################################################
## Middlewares #################################################################

# ProblemSchema.post 'remove', (doc) ->
# 	Notification = mongoose.model 'Notification'
# 	Notification.find { resources: doc.id }, (err, docs) =>
# 		console.log "Removing #{err} #{docs.length} notifications of doc
# 			#{doc.id}"
# 		docs.forEach (doc) ->
# 			doc.remove()

# ProblemSchema.post 'remove', (doc) ->
# 	Inbox = mongoose.model 'Inbox'
# 	Inbox.remove { resource: doc.id }, (err, doc) =>
# 		console.log "Removing err:#{err} #{doc} inbox of doc #{doc.id}"

# ProblemSchema.post 'remove', (doc) ->
# 	CommentTree.findById doc.comment_tree, (err, doc) ->
# 		if doc
# 			doc.remove (err) ->
# 				if err
# 					console.warn('Err removing comment tree', err)

################################################################################
## Methods #####################################################################

ProblemSchema.methods.getShuffledMCOptions = ->
	# http://stackoverflow.com/a/12646864
	# Randomize array element order in-place.
	# Using Fisher-Yates shuffle algorithm.
	shuffleArray = (array) ->
		for i in [array.length-1...0]
			j = Math.floor(Math.random() * (i + 1))
			temp = array[i]
			[array[i], array[j]] = [array[j], array[i]]
		return array
	shuffleArray(@answer.options)

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

ProblemSchema.methods.toMetaObject = ->
	{
		title: @content.title
		description: @content.body.slice(0, 300)
		image: @thumbnail
		url: 'http://qilabs.org'+@path
		ogType: 'article'
	}


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

dryText = (str) -> str.replace(/( {1})[ ]*/gi, '$1')
pureText = (str) -> str.replace(/(<([^>]+)>)/ig,"")

ProblemSchema.statics.ParseRules = {
	level:
		$valid: (str) -> str in Levels
	subject:
		$valid: (str) -> str in Subjects
	topic:
		$required: false
		$valid: (str) -> true # str in Topics
	answer:
		is_mc:
			$valid: (str) -> str is true or str is false
		options:
			$required: false
			$valid: (array) ->
				if array instanceof Array and array.length in [4,5]
					for e in array
						if typeof e isnt "string" or e.length >= 100
							return false
					return true
				return false
		value:
			$required: false
			$valid: (str) -> str
			$clean: (str) -> str
			# $msg: (str) -> "A solução única precisa ser um número inteiro."
	content:
		title:
			$required: false
			$valid: (str) -> validator.isLength(str, TITLE_MIN, TITLE_MAX)
			$clean: (str) -> validator.stripLow(dryText(str), true)
		source:
			$valid: (str) -> not str or validator.isLength(str, 0, 100)
			$clean: (str) -> validator.stripLow(dryText(str), true)
		body:
			$valid: (str) -> validator.isLength(pureText(str), BODY_MIN) and validator.isLength(str, 0, BODY_MAX)
			$clean: (str) ->
				str = validator.stripLow(str, true)
				# remove images
				# str = str.replace /(!\[.*?\]\()(.+?)(\))/g, (whole, a, b, c) ->
				# 	return ''
}

ProblemSchema.statics.Topics = Topics
ProblemSchema.statics.Subjects = Subjects

ProblemSchema.plugin(require('./lib/hookedModelPlugin'))
ProblemSchema.plugin(require('./lib/fromObjectPlugin'))
ProblemSchema.plugin(require('./lib/trashablePlugin'))
ProblemSchema.plugin(require('./lib/selectiveJSON'), ProblemSchema.statics.APISelect)

module.exports = ProblemSchema

# Problem = mongoose.model('Problem', ProblemSchema)
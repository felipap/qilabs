
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

ProblemSetSchema = new mongoose.Schema {
	author: { type: AuthorSchema, required: true }

	updated_at:	{ type: Date }
	created_at:	{ type: Date, index: 1, default: Date.now }

	title: { type: String }
	description: { type: String }

	# subject:{ type: String, enum: Subjects, required: true }
	# topic:	{ type: String }
	# level:	{ type: Number, enum: Levels, required: true }

	# users_watching:[{ type: String, ref: 'User' }] # list of users watching this thread
	# comment_tree: { type: String, ref: 'CommentTree' },
	# votes: 		{ type: [{ type: String, ref: 'User', required: true }], default: [] }
}, {
	toObject:	{ virtuals: true }
	toJSON: 	{ virtuals: true }
}

# ProblemSetSchema.statics.APISelect = '-hasAnswered -canSeeAnswers -hasSeenAnswers -watching -userTries -comment_tree -answer.value -answer.options'
# ProblemSetSchema.statics.APISelectAuthor = '-hasAnswered -canSeeAnswers -hasSeenAnswers -watching -userTries -comment_tree'

################################################################################
## Virtuals ####################################################################

# ProblemSchema.virtual('counts.votes').get ->
# 	@votes.length

# ProblemSchema.virtual('counts.solved').get ->
# 	@hasAnswered.length

##

ProblemSetSchema.virtual('path').get ->
	"/pset/{id}".replace(/{id}/, @id)

# ProblemSchema.virtual('thumbnail').get ->
# 	@content.image or @author.avatarUrl

ProblemSetSchema.virtual('apiPath').get ->
	"/api/psets/{id}".replace(/{id}/, @id)

## translation

# ProblemSchema.virtual('materia').get ->
# 	TSubjects[@subject]

################################################################################
## Methods #####################################################################

# ProblemSchema.methods.getShuffledMCOptions = ->
# 	# http://stackoverflow.com/a/12646864
# 	# Randomize array element order in-place.
# 	# Using Fisher-Yates shuffle algorithm.
# 	shuffleArray = (array) ->
# 		for i in [array.length-1...0]
# 			j = Math.floor(Math.random() * (i + 1))
# 			temp = array[i]
# 			[array[i], array[j]] = [array[j], array[i]]
# 		return array
# 	shuffleArray(@answer.options)

# ProblemSchema.methods.getAnswers = (cb) ->
# 	if @comment_tree
# 		CommentTree.findById @comment_tree, (err, tree) ->
# 			cb(err, tree and tree.toJSON().docs)
# 	else
# 		cb(null, [])

# ProblemSchema.methods.getFilledAnswers = (cb) ->
# 	self = @
# 	self.getAnswers (err, docs) ->
# 		return cb(err) if err
# 		async.map docs, ((ans, done) ->
# 			ans.getComments (err, docs) ->
# 				done(err, _.extend(ans.toJSON(), { comments: docs}))
# 		), cb

# ProblemSchema.methods.validAnswer = (test) ->
# 	if @answer.is_mc
# 		console.log(test, @answer.options[0])
# 		return validator.trim(@answer.options[0]) is validator.trim(test)
# 	else
# 		return validator.trim(@answer.value) is validator.trim(test)

################################################################################
## Statics #####################################################################

# TITLE_MIN = 10
# TITLE_MAX = 100
# BODY_MIN = 20
# BODY_MAX = 20*1000

# dryText = (str) -> str.replace(/( {1})[ ]*/gi, '$1')
# pureText = (str) -> str.replace(/(<([^>]+)>)/ig,"")

# ProblemSchema.statics.ParseRules = {
# 	level:
# 		$valid: (str) -> str in Levels
# 	subject:
# 		$valid: (str) -> str in Subjects
# 	topic:
# 		$required: false
# 		$valid: (str) -> true # str in Topics
# 	answer:
# 		is_mc:
# 			$valid: (str) -> str is true or str is false
# 		options:
# 			$required: false
# 			$valid: (array) ->
# 				if array instanceof Array and array.length in [4,5]
# 					for e in array
# 						if typeof e isnt "string" or e.length >= 100
# 							return false
# 					return true
# 				return false
# 		value:
# 			$required: false
# 			$valid: (str) -> str
# 			$clean: (str) -> str
# 			# $msg: (str) -> "A solução única precisa ser um número inteiro."
# 	content:
# 		title:
# 			$required: false
# 			$valid: (str) -> validator.isLength(str, TITLE_MIN, TITLE_MAX)
# 			$clean: (str) -> validator.stripLow(dryText(str), true)
# 		source:
# 			$valid: (str) -> not str or validator.isLength(str, 0, 100)
# 			$clean: (str) -> validator.stripLow(dryText(str), true)
# 		body:
# 			$valid: (str) -> validator.isLength(pureText(str), BODY_MIN) and validator.isLength(str, 0, BODY_MAX)
# 			$clean: (str) ->
# 				str = validator.stripLow(str, true)
# 				# remove images
# 				# str = str.replace /(!\[.*?\]\()(.+?)(\))/g, (whole, a, b, c) ->
# 				# 	return ''
# }

ProblemSetSchema.plugin(require('./lib/hookedModelPlugin'))
ProblemSetSchema.plugin(require('./lib/fromObjectPlugin'))
ProblemSetSchema.plugin(require('./lib/trashablePlugin'))
ProblemSetSchema.plugin(require('./lib/selectiveJSON'), ProblemSetSchema.statics.APISelect)

module.exports = ProblemSetSchema

# Problem = mongoose.model('Problem', ProblemSetSchema)
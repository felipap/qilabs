
mongoose = require 'mongoose'
_ = require 'lodash'
validator = require 'validator'

AuthorSchema = (require './user').statics.AuthorSchema


ProblemSetSchema = new mongoose.Schema {
	author: 		{ type: AuthorSchema, required: true }
	slug: 			{ type: String, required: true, unique: true, index: 1 }
	name: 			{ type: String }
	description:{ type: String }
	subject:		{ type: String, enum: Subjects, required: false }
	updated_at:	{ type: Date }
	created_at:	{ type: Date, index: 1, default: Date.now }
	avg_difficulty:	{ type: Number, default: 5 }
	problems:  [{ type: String, ref: 'Problem', required: true }]
	counts: {
		# votes: 		{ type: Number, default: 0 }
		children:	{ type: Number, default: 0 }
	}
	# users_watching:[{ type: String, ref: 'User' }] # list of users watching this thread
	votes: 		{ type: [{ type: String, ref: 'User', required: true }], default: [] }
}, {
	toObject:	{ virtuals: true }
	toJSON: 	{ virtuals: true }
}

ProblemSetSchema.statics.APISelect = ''
ProblemSetSchema.statics.APISelectAuthor = ''

################################################################################
## Virtuals ####################################################################

ProblemSetSchema.virtual('counts.votes').get ->
	@votes.length

ProblemSetSchema.virtual('path').get ->
	"/colecoes/{slug}".replace(/{slug}/, @slug)

# ProblemSetSchema.virtual('thumbnail').get ->
# 	@content.image or @author.avatarUrl

ProblemSetSchema.virtual('apiPath').get ->
	"/api/psets/{id}".replace(/{id}/, @id)

TITLE_MIN = 10
TITLE_MAX = 100
BODY_MIN = 20
BODY_MAX = 20*1000

Subjects = ['mathematics', 'physics', 'chemistry']

dryText = (str) -> str.replace(/( {1})[ ]*/gi, '$1')
pureText = (str) -> str.replace(/(<([^>]+)>)/ig,"")

ProblemSetSchema.statics.ParseRules = {
	name:
		$required: true
		$test: (str) ->
			unless validator.isLength(str, TITLE_MIN, TITLE_MAX)
				return "Escolha um título com um mínimo de #{TITLE_MIN} e máximo de #{TITLE_MAX} caracteres."
		$clean: (str) ->
			validator.stripLow(dryText(str), true)
	subject:
		required: true
		$test: (str) ->
			if not str
				return "Escolha um assunto."
			if not (str in Subjects)
				return "Assunto inválido."
	slug:
		$required: true
		$test: (str) ->
			if not str
				return "Escolha um slug."
			unless typeof str is 'string' and str.match(/[a-zA-Z0-9-]{5,}/)
				return true
	description:
		$test: (str) ->
			if not validator.isLength(pureText(str), BODY_MIN)
				return "Descrição muito pequena."
			if not validator.isLength(str, 0, BODY_MAX)
				return "Descrição muito grande."
		$clean: (str) ->
			str = validator.stripLow(str, true)
			# remove images
			# str = str.replace /(!\[.*?\]\()(.+?)(\))/g, (whole, a, b, c) ->
			# 	return ''
	problems:
		$test: (pids) ->
			unless pids and pids instanceof Array
				return false
			for p in pids
				if not p.match(/[a-z0-9]{24}/)
					return "Errado, mano!"
}

ProblemSetSchema.plugin(require('./lib/hookedModelPlugin'))
ProblemSetSchema.plugin(require('./lib/fromObjectPlugin'))
ProblemSetSchema.plugin(require('./lib/trashablePlugin'))
ProblemSetSchema.plugin(require('./lib/selectiveJSON'), ProblemSetSchema.statics.APISelect)

module.exports = ProblemSetSchema
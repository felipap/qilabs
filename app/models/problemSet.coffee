
mongoose = require('mongoose')
_ = require('lodash')
validator = require('validator')

AuthorSchema = (require('./user')).statics.AuthorSchema

ProblemSetSchema = new mongoose.Schema {
	name: 	{ type: String }
	level: 	{ type: String }
	round: 	{ type: String }
	year:		{ type: Number }
	slug: 	{ type: String, required: true, unique: true, index: 1 }

	source:	{ type: String }
	description:	{ type: String }

	invisible: { type: Boolean, default: false }

	author: 		{ type: AuthorSchema, required: true }
	subject:		{ type: String, enum: Subjects, required: false }

	updated_at:	{ type: Date }
	created_at:	{ type: Date, index: 1, default: Date.now }

	problemIds:	 [{ type: String, ref: 'Problem', required: true }]

	# avg_difficulty:	{ type: Number, default: 5 }

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

ProblemSetSchema.virtual('nivel').get ->
	{
		'level-1': 'Nível 1',
		'level-2': 'Nível 2',
		'level-3': 'Nível 3',
		'level-4': 'Nível 4',
		'level-5': 'Nível 5',
	}[@level]

ProblemSetSchema.virtual('fase').get ->
	{
		'round-1': 'Fase 1',
		'round-2': 'Fase 2',
		'round-3': 'Fase 3',
		'round-4': 'Fase 4',
		'round-5': 'Fase 5',
	}[@round]

ProblemSetSchema.methods.toMetaObject = ->
	{
		title: "Resolva a "+@fullName
		description: @description.slice(0, 300)
		image: "http://qilabs.org/static/images/bb-square-lb-1024.png"
		url: 'http://www.qilabs.org'+@path
		ogType: 'article'
	}

ProblemSetSchema.virtual('counts.likes').get ->
	@votes.length

ProblemSetSchema.virtual('fullName').get ->
	''+@round.split('-')[1]+'ª fase da '+@name+' '+@year+', Nível '+(@level.split('-')[1])

ProblemSetSchema.virtual('path').get ->
	"/olimpiadas/colecoes/{slug}".replace(/{slug}/, @slug)

ProblemSetSchema.virtual('apiPath').get ->
	"/api/psets/{id}".replace(/{id}/, @id)

BODY_MIN = 20
BODY_MAX = 20*1000

Subjects = ['mathematics', 'physics', 'chemistry']

dryText = (str) -> str.replace(/( {1})[ ]*/gi, '$1')
pureText = (str) -> str.replace(/(<([^>]+)>)/ig,"")

ProblemSetSchema.statics.ParseRules = {
	name:
		$validate: (str) ->
			if not validator.isLength(str, 1, 20)
				return "Escolha um título com um mínimo de #{TITLE_MIN} e máximo de #{TITLE_MAX} caracteres."
		$clean: (str) ->
			validator.stripLow(dryText(str), true)
	level:
		$validate: (str) -> false
		$clean: (str) -> validator.stripLow(dryText(str), true)
	slug:
		$validate: false
		$clean: (str) ->
			validator.stripLow(dryText(str), true)
	round:
		$validate: (str) ->
		$clean: (str) ->
			validator.stripLow(dryText(str), true)
	invisible:
		$required: false
		$valid: validator.isBoolean
	year:
		$validate: (str) ->
			if isNaN(parseInt(str))
				return "Ano inválido."
			if 1990 < parseInt(str) <= new Date().getFullYear()
				return false
			return "Ano errado."
		$clean: (str) -> parseInt(str)
	subject:
		required: true
		$validate: (str) ->
			if not str
				return "Escolha um assunto."
			if not (str in Subjects)
				return "Assunto inválido."
	description:
		$validate: (str) ->
			if not validator.isLength(pureText(str), BODY_MIN)
				return "Descrição muito pequena."
			if not validator.isLength(str, 0, BODY_MAX)
				return "Descrição muito grande."
		$clean: (str) ->
			str = validator.stripLow(str, true)
			# remove images
			# str = str.replace /(!\[.*?\]\()(.+?)(\))/g, (whole, a, b, c) ->
			# 	return ''
	problemIds:
		$validate: (pids) ->
			if not (pids instanceof Array) or not pids
				return false
			for p in pids
				if not p.match(/^[a-z0-9]{24}$/)
					return "Errado, mano!"
}

ProblemSetSchema.plugin(require('./lib/hookedModelPlugin'))
ProblemSetSchema.plugin(require('./lib/fromObjectPlugin'))
ProblemSetSchema.plugin(require('./lib/trashablePlugin'))
ProblemSetSchema.plugin(require('./lib/selectiveJSON'), ProblemSetSchema.statics.APISelect)

module.exports = ProblemSetSchema
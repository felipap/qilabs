
# src/models/post
# for QiLabs.org

mongoose = require 'mongoose'
assert = require 'assert'
_ = require 'underscore'
async = require 'async'
validator = require 'validator'

please = require 'src/lib/please.js'
please.args.extend(require('./lib/pleaseModels.js'))

##

ObjectId = mongoose.Schema.ObjectId
Resource = mongoose.model 'Resource'
User = Resource.model 'User'

Notification =
 Inbox =
 Comment =
 CommentTree = null

module.exports = (app) ->

module.exports.start = () ->
	Notification = mongoose.model 'Notification'
	Inbox = mongoose.model 'Inbox'
	Comment = Resource.model 'Comment'
	CommentTree = Resource.model 'CommentTree'

################################################################################
## Schema ######################################################################

Types = 
	Note: 'Note'
	Discussion: 'Discussion'

PostSchema = new Resource.Schema {
	author: User.AuthorSchema

	type: 		{ type: String, required: true, enum:_.values(Types) }
	updated_at:	{ type: Date }
	created_at:	{ type: Date, indexed: 1, default: Date.now }
	
	subject:	{ type: String }
	tags: 		[{ type: String }]

	content: {
		title:	{ type: String }
		body:	{ type: String, required: true }
		image:	{ type: String }
	}

	counts: {
		# votes: 		{ type: Number, default: 0 }
		# views: 		{ type: Number, default: 0 }
		children:	{ type: Number, default: 0 }
	}

	participations: [{
		user: { type: User.AuthorSchema, required: true } # Removing this is causing issues?
		count: { type: Number, default: 0 }
		_id: false
	}]

	comment_tree: { type: String, ref: 'CommentTree' },
	users_watching:[{ type: String, ref: 'User' }] # list of users watching this thread
	votes: 		{ type: [{ type: String, ref: 'User', required: true }],  default: [] }
}, {
	toObject:	{ virtuals: true }
	toJSON: 	{ virtuals: true }
}

PostSchema.statics.APISelect = '-users_watching -comment_tree -__v -_id -__t' # -votes won't work right now

################################################################################
## Virtuals ####################################################################

PostSchema.methods.getCacheField = (field) ->
	switch field
		when "Views"
			return "post:#{@id}:views"
		else
			throw "Field #{field} isn't a valid post cache field."

PostSchema.virtual('translatedType').get ->
	switch @type
		when Types.Discussion then return 'Discussão'
		when Types.Note then return 'Nota'
	'Publicação'

PostSchema.virtual('counts.votes').get ->
	@votes and @votes.length

PostSchema.virtual('path').get ->
	"/posts/{id}".replace(/{id}/, @id)

PostSchema.virtual('apiPath').get ->
	"/api/posts/{id}".replace(/{id}/, @id)

################################################################################
## Middlewares #################################################################

PostSchema.post 'remove', (post) ->
	Notification.find { resources: post.id }, (err, docs) =>
		console.log "Removing #{err} #{docs.length} notifications of post #{post.id}"
		docs.forEach (doc) ->
			doc.remove()

PostSchema.post 'remove', (post) ->
	Inbox.remove { resource: post.id }, (err, doc) =>
		console.log "Removing err:#{err} #{doc} inbox of post #{post.id}"

PostSchema.post 'remove', (post) ->
	CommentTree.findById post.comment_tree, (err, doc) ->
		if doc
			doc.remove (err) ->
				if err
					console.warn("Err removing comment tree", err)

# # https://github.com/LearnBoost/mongoose/issues/1474
# PostSchema.pre 'save', (next) ->
# 	@wasNew = @isNew
# 	next()

# PostSchema.post 'save', () ->
# 	if @wasNew

################################################################################
## Methods #####################################################################

PostSchema.methods.getComments = (cb) ->
	if @comment_tree
		CommentTree.findById @comment_tree, (err, tree) ->
			cb(err, tree and tree.toJSON().docs)
	else
		cb(null, [])
		
PostSchema.methods.stuff = (cb) ->
	@getComments (err, docs) =>
		if err
			console.warn(err)
		cb(err, _.extend(@toJSON(), { children: docs or [] }))

################################################################################
## Statics #####################################################################

TITLE_MIN = 10
TITLE_MAX = 100
BODY_MIN = 20
BODY_MAX = 20*1000

dryText = (str) -> str.replace(/(\s{1})[\s]*/gi, '$1')
pureText = (str) -> str.replace(/(<([^>]+)>)/ig,"")
labs = require('src/core/labs.js').data

PostSchema.statics.ParseRules = {
	subject:
		$valid: (str) ->
			str in _.keys(labs)
	tags:
		$required: false
	type:
		$valid: (str) -> str.toLowerCase() in ['note','discussion']
		$clean: (str) -> # Camelcasify the type
			str = validator.stripLow(validator.trim(str))
			str[0].toUpperCase()+str.slice(1).toLowerCase()
	content:
		title:
			$valid: (str) -> validator.isLength(str, TITLE_MIN, TITLE_MAX)
			$clean: (str) -> validator.stripLow(dryText(str))
		body:
			$valid: (str) -> validator.isLength(pureText(str), BODY_MIN) and validator.isLength(str, 0, BODY_MAX)
			$clean: (str, body) -> validator.stripLow(dryText(str))
}

PostSchema.statics.fromObject = (object) ->
	new Post(undefined, undefined, true).init(object)

PostSchema.statics.Types = Types

PostSchema.plugin(require('./lib/hookedModelPlugin'))
PostSchema.plugin(require('./lib/trashablePlugin'))
PostSchema.plugin(require('./lib/selectiveJSON'), PostSchema.statics.APISelect)

Post = Resource.discriminator('Post', PostSchema)

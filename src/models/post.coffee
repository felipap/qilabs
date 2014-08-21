
# src/models/post
# Copyright QILabs.org

mongoose = require 'mongoose'
assert = require 'assert'
_ = require 'underscore'
async = require 'async'

please = require 'src/lib/please.js'
please.args.extend(require('./lib/pleaseModels.js'))

Notification = mongoose.model 'Notification'
Resource = mongoose.model 'Resource'
Inbox = mongoose.model 'Inbox'

Types = 
	Note: 'Note'
	Discussion: 'Discussion'
	Comment: 'Comment'
	# Answer: 'Answer'
	Problem: 'Problem'

TransTypes = {}
TransTypes[Types.Discussion] = 'Discussão'
TransTypes[Types.Note] = 'Nota'
# TransTypes[Types.Answer] = 'Resposta'
TransTypes[Types.Comment] = 'Comentário'

################################################################################
## Schema ######################################################################

ObjectId = mongoose.Schema.ObjectId

PostSchema = new Resource.Schema {
	author: {
		id: String,
		username: String,
		path: String,
		avatarUrl: String,
		name: String,
	}

	parent:	{ type: ObjectId, ref: 'Resource', required: false }
	parentPost:	{ type: ObjectId, ref: 'Resource', required: false }
	
	type: 		{ type: String, required: true, enum:_.values(Types), }
	updated_at:	{ type: Date, }
	created_at:	{ type: Date, indexed: 1, default: Date.now }
	
	subject:	{ type: String }
	tags: 		[{ type: String }]

	content: {
		title:	{ type: String, }
		body:	{ type: String, required: true }
	}

	watching: 	[] # for discussions
	canSeeAnswers: [] # for problems

	votes: 		{ type: [{ type: String, ref: 'User', required: true }],  default: [] }
}, {
	toObject:	{ virtuals: true }
	toJSON: 	{ virtuals: true }
}

# PostSchema.statics.APISelect = '-watching -canSeeAnswer' # -votes won't work right now

################################################################################
## Virtuals ####################################################################

PostSchema.virtual('translatedType').get ->
	TransTypes[@type] or 'Publicação'

PostSchema.virtual('voteSum').get ->
	@votes and @votes.length

PostSchema.virtual('path').get ->
	if @parentPost
		"/posts/"+@parentPost+"#"+@id
	else
		"/posts/{id}".replace(/{id}/, @id)

PostSchema.virtual('apiPath').get ->
	"/api/posts/{id}".replace(/{id}/, @id)

################################################################################
## Middlewares #################################################################

PostSchema.pre 'remove', (next) ->
	next()
	Notification.find { resources: @ }, (err, docs) =>
		console.log "Removing #{err} #{docs.length} notifications of post #{@id}"
		docs.forEach (doc) ->
			doc.remove()

PostSchema.pre 'remove', (next) ->
	next()
	Post.find { parentPost: @ }, (err, docs) ->
		docs.forEach (doc) ->
			doc.remove()

PostSchema.pre 'remove', (next) ->
	next()
	Inbox.remove { resource: @id }, (err, doc) =>
		console.log "Removing #{err} #{doc} inbox of post #{@id}"

PostSchema.pre 'remove', (next) ->
	next()
	@addToGarbage (err) ->
		console.log "#{err} - moving post #{@id} to garbage"

PostSchema.pre 'remove', (next) ->
	next()
	# Do this last, so that the status isn't rem
	# Decrease author stats.
	if not @parentPost
		User = Resource.model('User')
		User.findById @author.id, (err, author) ->
			author.update {$inc:{'stats.posts':-1}}, (err) ->
				if err
					console.err "Error in decreasing author stats: "+err


################################################################################
## Methods #####################################################################

PostSchema.methods.getComments = (cb) ->
	Post.find { parentPost: @id }
		.exec (err, docs) ->
			cb(err, docs)

PostSchema.methods.stuff = (cb) ->
	@fillChildren(cb)

PostSchema.methods.fillChildren = (cb) ->
	if @type not in _.values(Types)
		return cb(false, @toJSON())

	Post.find {parentPost:@}
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

PostSchema.statics.countList = (docs, cb) ->
	please.args({$isA:Array}, '$isCb')

	async.map docs, (post, done) ->
		if post instanceof Post
			Post.count {type:'Comment', parentPost:post}, (err, ccount) ->
				Post.count {type:'Answer', parentPost:post}, (err, acount) ->
					done(err, _.extend(post.toJSON(), {childrenCount:{Answer:acount,Comment:ccount}}))
		else done(null, post.toJSON)
	, (err, results) ->
		cb(err, results)


PostSchema.statics.fromObject = (object) ->
	new Post(undefined, undefined, true).init(object)

PostSchema.statics.Types = Types

PostSchema.plugin(require('./lib/hookedModelPlugin'))
PostSchema.plugin(require('./lib/trashablePlugin'))

module.exports = Post = Resource.discriminator('Post', PostSchema)
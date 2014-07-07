
# src/models/post
# Copyright QILabs.org
# by @f03lipe

mongoose = require 'mongoose'
assert = require 'assert'
_ = require 'underscore'
async = require 'async'

please = require 'src/lib/please.js'
please.args.extend(require('./lib/pleaseModels.js'))

Notification = mongoose.model 'Notification'
Resource = mongoose.model 'Resource'

Types = 
	Experience: 'Experience'
	Tip: 'Tip'
	Question: 'Question'
	Comment: 'Comment'
	Answer: 'Answer'

TransTypes = {}
TransTypes[Types.Question] = 'Pergunta'
TransTypes[Types.Experience] = 'Experiência'
TransTypes[Types.Tip] = 'Dica'
TransTypes[Types.Answer] = 'Resposta'
TransTypes[Types.Comment] = 'Comentário'

################################################################################
## Schema ######################################################################

ObjectId = mongoose.Schema.ObjectId

PostSchema = new Resource.Schema {
	author:		{ type: ObjectId, ref: 'User', required: true, indexed: 1 }
	parentPost:	{ type: ObjectId, ref: 'Post', required: false }
	
	updated:	{ type: Date }
	published:	{ type: Date, indexed: 1 }
	
	type: 		{ type: String, required: true, enum:_.values(Types) }
	tags:		[{ type: String }]
	content: {
		title:	{ type: String }
		body:	{ type: String, required: true }
	}
	
	votes: 		{ type: [{ type: String, ref: 'User', required: true }], select: true, default: [] }
}, {
	toObject:	{ virtuals: true }
	toJSON: 	{ virtuals: true }
}

################################################################################
## Virtuals ####################################################################

PostSchema.virtual('translatedType').get ->
	TransTypes[@type] or 'Publicação'

PostSchema.virtual('voteSum').get ->
	@votes.length

PostSchema.virtual('path').get ->
	if @parentPost
		"/posts/"+@parentPost+"#"+@id
	else
		"/posts/{id}".replace(/{id}/, @id)

PostSchema.virtual('apiPath').get ->
	"/api/posts/{id}".replace(/{id}/, @id)

smallify = (url) ->
	if url.length > 50
	# src = /((https?:(?:\/\/)?)(?:www\.)?[A-Za-z0-9\.\-]+).{20}/.exec(url)[0]
	# '...'+src.slice(src.length-30)
		'...'+/https?:(?:\/\/)?[A-Za-z0-9][A-Za-z0-9\-]*([A-Za-z0-9\-]{2}\.[A-Za-z0-9\.\-]+(\/.{0,20})?)/.exec(url)[1]+'...'
	else url

urlify = (text) ->
	urlRegex = /(((https?:(?:\/\/)?)(?:www\.)?[A-Za-z0-9\.\-]+)((?:\/[\+~%\/\.\w\-_]*)?\??(?:[\-\+=&;%@\.\w_]*)#?(?:[\.\!\/\\\w]*))?)/
	return text.replace urlRegex, (url) ->
	    return "<a href=\"#{url}\">#{smallify(url)}</a>"

PostSchema.virtual('content.escapedBody').get ->
	if @type is 'Comment'
		urlify(@content.body)
	else
		@content.body

PostSchema.virtual('content.plainBody').get ->
	@content.body.replace(/(<([^>]+)>)/ig,"")

################################################################################
## Middlewares #################################################################

PostSchema.pre 'remove', (next) ->
	next()
	Notification.find { resources: @ }, (err, docs) =>
		console.log "Removing #{err} #{docs.length} notifications of resource #{@id}"
		docs.forEach (doc) ->
			doc.remove()

PostSchema.pre 'remove', (next) ->
	next()
	Post.find { parentPost: @ }, (err, docs) ->
		docs.forEach (doc) ->
			doc.remove()

PostSchema.pre 'save', (next) ->
	@published ?= new Date
	@updated ?= new Date
	next()

################################################################################
## Methods #####################################################################

PostSchema.methods.getComments = (cb) ->
	Post.find { parentPost: @id }
		.populate 'author', '-memberships'
		.exec (err, docs) ->
			cb(err, docs)

PostSchema.methods.stuff = (cb) ->
	@populate 'author', (err, doc) ->
		if err
			cb(err)
		else if doc
			doc.fillChildren(cb)
		else
			cb(false,null)

PostSchema.methods.fillChildren = (cb) ->

	if @type not in _.values(Types)
		return cb(false, @toJSON())

	Post.find {parentPost:@}
		.populate 'author'
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

# PostSchema.statics.stuffList = (docs, cb) ->
# 	please.args({$isA:Array},'$isCb')
# 	async.map docs, (post, done) ->
# 			if post instanceof Post
# 				post.fillChildren(done)
# 			else done(null, post)
# 		, (err, results) ->
# 			cb(err, results)

PostSchema.statics.countList = (docs, cb) ->
	please.args({$isA:Array},'$isCb')

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

module.exports = Post = Resource.discriminator('Post', PostSchema)

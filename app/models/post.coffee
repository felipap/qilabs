
# app/models/post
# for QI Labs
# by @f03lipe

mongoose = require 'mongoose'
validator = require 'validator'

labs = require 'app/data/labs'

AuthorSchema = (require './user').statics.AuthorSchema

################################################################################
## Schema ######################################################################

PostSchema = new mongoose.Schema {
	author: 		AuthorSchema

	updated_at:	{ type: Date }
	created_at:	{ type: Date, index: 1, default: Date.now }

	lab:	{ type: String, index: 1 }
	tags:[{ type: String }]

	content: {
		title:	{ type: String }
		body:		{ type: String, required: true }
		cover:	{ type: String }
		images: [{ type: String }]
		link:		{ type: String }
		link_type:	{ type: String }
		link_image:	{ type: String }
		link_title:	{ type: String }
		link_updated:	{ type: Date }
		link_description:	{ type: String }
	}

	flags: {
		hot: { type: Boolean, default: false }
	}

	counts: {
		# votes: 		{ type: Number, default: 0 }
		# views: 		{ type: Number, default: 0 }
		children:	{ type: Number, default: 0 }
	}

	participations: [{
		user: 	{ type: AuthorSchema, required: true } # Removing this is causing issues?
		count: 	{ type: Number, default: 0 }
		# _id: false
	}]

	comment_tree: 	{ type: String, ref: 'CommentTree' },
	users_watching:[{ type: String, ref: 'User' }] # list of users watching this thread
	votes: 		{ type: [{ type: String, ref: 'User', required: true }],  default: [] }
}, {
	toObject:	{ virtuals: true }
	toJSON: 	{ virtuals: true }
}

PostSchema.statics.APISelect = '-users_watching -votes -comment_tree -__v -_id
-participations._id'

################################################################################
## Virtuals ####################################################################

PostSchema.methods.getCacheField = (field) ->
	switch field
		when 'Views'
			return "post:#{@id}:views"
		else
			throw new Error("Field #{field} isn\'t a valid post cache field.")

# PostSchema.virtual('translatedType').get ->
# 	switch @type
# 		when Types.Discussion then return 'Discussão'
# 		when Types.Note then return 'Nota'
# 	'Publicação'

PostSchema.virtual('thumbnail').get ->
	@content.cover or @content.link_image or @author.avatarUrl

PostSchema.virtual('counts.votes').get ->
	@votes and @votes.length

PostSchema.virtual('path').get ->
	'/posts/{id}'.replace(/{id}/, @id)

PostSchema.virtual('apiPath').get ->
	'/api/posts/{id}'.replace(/{id}/, @id)

################################################################################
## Middlewares #################################################################

PostSchema.post 'remove', (post) ->
	Notification = mongoose.model 'Notification'
	Notification.find { resources: post.id }, (err, docs) =>
		console.log "Removing #{err} #{docs.length} notifications of post
			#{post.id}"
		docs.forEach (doc) ->
			doc.remove()

PostSchema.post 'remove', (post) ->
	Inbox = mongoose.model 'Inbox'
	Inbox.remove { resource: post.id }, (err, doc) =>
		console.log "Removing err:#{err} #{doc} inbox of post #{post.id}"

PostSchema.post 'remove', (post) ->
	CommentTree = mongoose.model 'CommentTree'
	CommentTree.findById post.comment_tree, (err, doc) ->
		if doc
			doc.remove (err) ->
				if err
					console.warn('Err removing comment tree', err)

# # https://github.com/LearnBoost/mongoose/issues/1474
# PostSchema.pre 'save', (next) ->
# 	@wasNew = @isNew
# 	next()

# PostSchema.post 'save', () ->
# 	if @wasNew

################################################################################
## Methods #####################################################################

PostSchema.methods.getCommentTree = (cb) ->
	if @comment_tree
		CommentTree = mongoose.model 'CommentTree'
		CommentTree.findById @comment_tree, (err, tree) ->
			cb(err, tree)
	else
		cb(null)

PostSchema.methods.toMetaObject = ->
	{
		title: @content.title
		description: @content.body.slice(0, 300)
		image: @thumbnail
		url: 'http://www.qilabs.org'+@path
		ogType: 'article'
	}

################################################################################
## Statics #####################################################################

TITLE_MIN = 10
TITLE_MAX = 100
BODY_MIN = 20
BODY_MAX = 20*1000

dryText = (str) -> str # str.replace(/(\s{1})[\s]*/gi, '$1')
pureText = (str) -> str.replace(/(<([^>]+)>)/ig,'')

PostSchema.statics.ParseRules = {
	lab:
		$valid: (str) ->
			str in Object.keys(labs)
	tags:
		$required: false
	content:
		title:
			$valid: (str) -> validator.isLength(str, TITLE_MIN, TITLE_MAX)
			$clean: (str) -> validator.stripLow(dryText(str))
		link:
			$required: false
			$valid: (str) -> validator.isURL(str)
			$clean: (str) -> validator.stripLow(str)
		body:
			$msg: "O corpo dessa publicação é inválido."
			$valid: (str) -> validator.isLength(pureText(str), BODY_MIN) and validator.isLength(str, 0, BODY_MAX)
			$clean: (str, body, user) ->
				str = validator.stripLow(str, true)
				# remove images

				# Remove excessive space
				str.replace(new RegExp("\n\n(\n)*","gi"), "\n\n")

				unless user.flags.editor
					str = str.replace /(!\[.*?\]\()(.+?)(\))/g, (whole, a, url, c) ->
						console.log whole, url
						# TODO check if user owns this pic
						if url.match(/^https:\/\/qilabs.s3.amazonaws.com\/media\/posts\/uimages\/\w+$/)
							return "![]("+url+")"
						return ''
				str
				# console.log str
				# str
				# str = sanitizer(str, DefaultSanitizerOpts)
				# Don't mind my little hack to remove excessive breaks
				# str.replace(new RegExp("(<br \/>){2,}","gi"), "<br />")
				# 	.replace(/<p>(<br \/>)?<\/p>/gi, '')
				# 	.replace(/<br \/><\/p>/gi, '</p>')
}

PostSchema.plugin(require('./lib/hookedModelPlugin'))
PostSchema.plugin(require('./lib/trashablePlugin'))
PostSchema.plugin(require('./lib/fromObjectPlugin'))
PostSchema.plugin(require('./lib/selectiveJSON'), PostSchema.statics.APISelect)

module.exports = PostSchema
# Post = mongoose.model('Post', PostSchema)
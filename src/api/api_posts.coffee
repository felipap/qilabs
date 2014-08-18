
mongoose = require 'mongoose'
required = require 'src/lib/required.js'

Resource = mongoose.model 'Resource'

_ = require 'underscore'

User = Resource.model 'User'
Post = Resource.model 'Post'

##

defaultSanitizerOptions = {
	# To be added: 'pre', 'caption', 'hr', 'code', 'strike', 
	allowedTags: ['h1','h2','b','em','strong','a','img','u','ul','li', 'blockquote', 'p', 'br', 'i'], 
	allowedAttributes: {
		'a': ['href'],
		'img': ['src'],
	},
	# selfClosing: [ 'img', 'br', 'hr', 'area', 'base', 'basefont', 'input', 'link', 'meta' ],
	selfClosing: ['img', 'br'],
	transformTags: {
		'b': 'strong',
		'i': 'em',
	},
	exclusiveFilter: (frame) ->
		return frame.tag in ['a','span'] and not frame.text.trim()
}

sanitizeBody = (body, type) ->
	sanitizer = require 'sanitize-html'
	getSanitizerOptions = (type) ->
		switch type
			when Post.Types.Question
				return _.extend({}, defaultSanitizerOptions, {
					allowedTags: ['b','em','strong','a','u','ul','blockquote','p','img','br','i','li'],
				})
			when Post.Types.Answer
				return _.extend({}, defaultSanitizerOptions, {
					allowedTags: ['b','em','strong','a','u','ul','blockquote','p','img','br','i','li'],
				})
			else
				return defaultSanitizerOptions
		return defaultSanitizerOptions
	str = sanitizer(body, getSanitizerOptions(type))
	# Nevermind my little hack to remove excessive breaks
	str = str.replace(new RegExp("(<br \/>){2,}","gi"), "<br />")
		.replace(/<p>(<br \/>)?<\/p>/gi, '')
		.replace(/<br \/><\/p>/gi, '</p>')
	console.log(body, str)
	return str

htmlEntities = (str) ->
	String(str)
		.replace(/&/g, '&amp;')
		.replace(/</g, '&lt;')
		.replace(/>/g, '&gt;')
		.replace(/"/g, '&quot;')

trim = (str) ->
	str.replace(/(^\s+)|(\s+$)/gi, '')

dry = (str) ->
	str.replace(/(\s{1})[\s]*/gi, '$1')

######

checks = {
	contentExists: (content, res) ->
		if not content
			res.status(500).endJson({error:true, message:'Ops.'})
			return null
		return content

	tags: (_tags, res) ->
		# Sanitize tags
		if not _tags or not _tags instanceof Array
			res.status(400).endJson(error:true, message:'Selecione pelo menos um assunto relacionado a esse post.')
			return null
		tags = (tag for tag in _tags when tag in _.keys(res.app.locals.tagMap))
		if tags.length == 0
			res.status(400).endJson(error:true, message:'Selecione pelo menos um assunto relacionado a esse post.')
			return null
		return tags

	source: (source, res) ->
		console.log "Checking source", source
		return source

	answers: (answers, res) ->
		console.log "Checking answers", answers
		return answers

	title: (title, res) ->
		if not title or not title.length
			res.status(400).endJson({
				error:true,
				message:'Dê um título para a sua publicação.',
			})
			return null
		if title.length < 10
			res.status(400).endJson({
				error:true,
				message:'Hm... Esse título é muito pequeno. Escreva um com no mínimo 10 caracteres, ok?'
			})
			return null
		if title.length > 100
			res.status(400).endJson({
				error:true,
				message:'Hmm... esse título é muito grande. Escreva um de até 100 caracteres.'
			})
			return null
		title = title.replace('\n', '')
		return title

	body: (body, res, max_length=20*1000, min_length=20) ->
		if not body
			res.status(400).endJson({error:true, message:'Escreva um corpo para a sua publicação.'})
			return null

		if body.length > max_length
			res.status(400).endJson({error:true, message:'Ops. Texto muito grande.'})
			return null

		plainText = body.replace(/(<([^>]+)>)/ig,"")
		if plainText.length < min_length
			res.status(400).endJson({error:true, message:'Ops. Texto muito pequeno.'})
			return null

		return body

	type: (type, res) ->
		if typeof type isnt 'string' or not type.toLowerCase() in _.keys(res.app.locals.postTypes)
			return res.status(400).endJson(error:true, message:'Tipo de publicação inválido.')
		# Camelcasify the type
		return type[0].toUpperCase()+type.slice(1).toLowerCase()
}


module.exports = {

	permissions: [required.login],

	post: (req, res) ->
		data = req.body

		#! TODO
		# - implement error delivery using next()

		return unless content = checks.contentExists(req.body.content, res)
		return unless type = checks.type(req.body.type, res)
		return unless title = checks.title(content.title, res)
		return unless tags = checks.tags(req.body.tags, res)
		return unless _body = checks.body(content.body, res)
		body = sanitizeBody(_body, type)

		req.user.createPost {
			type: type,
			tags: tags,
			content: {
				title: title,
				body: body,
			}
		}, req.handleErrResult((doc) ->
			res.endJson doc
		)

	children: {
		'/:id': {

			get: (req, res) ->
				return unless postId = req.paramToObjectId('id')
				Post.findOne { _id:postId }, req.handleErrResult((post) ->
					post.stuff req.handleErrResult (stuffedPost) ->
						if req.user
							req.user.doesFollowUser stuffedPost.author.id, (err, val) ->
								res.endJson( data: _.extend(stuffedPost, { meta: { followed: val } }))
						else
							res.endJson( data: _.extend(stuffedPost, { meta: null }))
				)

			put: [required.posts.selfOwns('id'),
				(req, res) ->
					return if not postId = req.paramToObjectId('id')
					Post.findById postId, req.handleErrResult (post) =>

						return unless content = checks.contentExists(req.body.content, res)

						if post.parentPost
							if post.type is 'Answer'
								return unless _body = checks.body(content.body, res)
								post.content.body = sanitizeBody(_body, post.type)
							else
								# Prevent edition of comments.
								return res.endJson {error:true, msg:''}
						else
							return unless content.title = checks.title(content.title, res)
							return unless post.tags = checks.tags(req.body.tags, res)
							return unless _body = checks.body(content.body, res)
							content.body = sanitizeBody(_body, post.type)

						_.extend(post.content, content)

						post.updated = Date.now()

						post.save req.handleErrResult((me) ->
							post.stuff req.handleErrResult (stuffedPost) ->
								res.endJson stuffedPost
						)
				]

			delete: [required.posts.selfOwns('id'), (req, res) ->
				return if not postId = req.paramToObjectId('id')
				Post.findOne {_id: postId, 'author.id': req.user.id},
					req.handleErrResult (doc) ->
						doc.remove (err) ->
							console.log('err?', err)
							res.endJson(doc, error: err)
				]

			children: {
				# '/delete':
				# 	get: [required.posts.selfOwns('id'), (req, res) ->
				# 		return if not postId = req.paramToObjectId('id')
				# 		Post.findOne {_id: postId, 'author.id': req.user.id},
				# 			req.handleErrResult (doc) ->
				# 				doc.remove (err) ->
				# 					console.log('err?', err)
				# 					res.endJson(doc, error: err)
				# 		]
				'/upvote':
					# post: [required.posts.selfCanComment('id'),
					post: [required.posts.selfDoesntOwn('id'), (req, res) ->
						return if not postId = req.paramToObjectId('id')
						Post.findById postId, req.handleErrResult (post) =>
							req.user.upvotePost post, (err, doc) ->
								res.endJson { error: err, data: doc }
					]
				'/unupvote':
					post: [required.posts.selfDoesntOwn('id'), (req, res) ->
						return if not postId = req.paramToObjectId('id')
						Post.findById postId, req.handleErrResult (post) =>
							req.user.unupvotePost post, (err, doc) ->
								res.endJson { error: err, data: doc }
					]
				'/comments':
					get: [required.posts.selfCanSee('id'), (req, res) ->
						return if not postId = req.paramToObjectId('id')
						Post.findById postId
							.exec req.handleErrResult (post) ->
								post.getComments req.handleErrResult((comments) =>
									res.endJson {
										data: comments
										error: false
										page: -1 # sending all
									}
								)
					]
					post: [required.posts.selfCanComment('id'), (req, res) ->
						return if not postId = req.paramToObjectId('id')

						if req.body.content.body.length > 1000
							return res.status(400).endJson({error:true,message:'Esse comentário é muito grande.'})
						if req.body.content.body.length < 3
							return res.status(400).endJson({error:true,message:'Esse comentário é muito pequeno.'})

						data = {
							content: {
								body: htmlEntities(dry(trim(req.body.content.body)))
							}
							type: Post.Types.Comment
						}

						Post.findById postId, req.handleErrResult (parentPost) =>
							req.user.postToParentPost parentPost, data,
								req.handleErrResult (doc) =>
									res.endJson(error:false, data:doc)
					]
				'/answers':
					post: [required.posts.selfCanComment('id'), (req, res) ->
						return unless postId = req.paramToObjectId('id')
						Post.findById postId,
							req.handleErrResult (parentPost) =>

								return unless content = checks.contentExists(req.body.content, res)
								return unless _body = checks.body(content.body, res)
								postBody = sanitizeBody(_body, Post.Types.Answer)
								data = {
									content: {
										body: postBody
									}
									type: Post.Types.Answer
								}

								# console.log 'final data:', data
								req.user.postToParentPost parentPost, data,
									req.handleErrResult (doc) =>
										res.endJson doc
					]

			}
		},
	},
}
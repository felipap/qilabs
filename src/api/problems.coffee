
mongoose = require 'mongoose'
required = require 'src/lib/required.js'

Resource = mongoose.model 'Resource'

_ = require 'underscore'

User = Resource.model 'User'
Post = Resource.model 'Post'
Problem = Resource.model 'Problem'

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
	'/:id': {
		get: (req, res) ->
			return unless id = req.paramToObjectId('id')
			console.log 'oi'
			Problem.findOne { _id:id }, req.handleErrResult((doc) ->
				res.endJson(data: doc)
				# res.endJson( data: _.extend(post, { meta: null }))
				# post.stuff req.handleErrResult (stuffedPost) ->
				# 	if req.user
				# 		req.user.doesFollowUser stuffedPost.author.id, (err, val) ->
				# 			res.endJson( data: _.extend(stuffedPost, { meta: { followed: val } }))
				# 	else
				# 		res.endJson( data: _.extend(stuffedPost, { meta: null }))
			)
	},
}
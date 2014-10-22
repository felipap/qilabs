
mongoose = require 'mongoose'
_ = require 'lodash'

please = require 'src/lib/please.js'
jobs = require 'src/config/kue.js'

User = mongoose.model 'User'
Problem = mongoose.model 'Problem'

logger = null

createProblem = (self, data, cb) ->
	please({$model:User}, '$skip', '$isFn')

	problem = new Problem {
		author: User.toAuthorObject(self)
		content: {
			title: data.content.title
			body: data.content.body
		}
		topic: data.topic
		level: data.level
		answer: {
			options: data.answer.options
			value: data.answer.value
			is_mc: data.answer.is_mc
		}
	}

	problem.save (err, doc) ->
		# Callback now, what happens later doesn't concern the user.
		if err
			logger.error("Error creating problem", err)
			return cb(err)
		cb(null, doc)
		# jobs.create('problem new', {
		# 	title: "New problem: #{self.name} posted #{post._id}",
		# 	author: self.toObject(),
		# 	post: post.toObject(),
		# }).save()

upvote = (self, res, cb) ->
	please({$model:User}, {$model:Problem}, '$isFn')
	if ''+res.author._id == ''+self._id
		cb()
		return

	done = (err, doc) ->
		if err
			return cb(err)
		if not doc
			logger.debug('Vote already there?', res._id)
			return cb(null)
		cb(null, doc)
		# jobs.create('problem upvote', {
		# 	title: "New upvote: #{self.name} → #{res._id}",
		# 	authorId: res.author._id,
		# 	resource: res.toObject(),
		# 	agent: self.toObject(),
		# }).save()
	Problem.findOneAndUpdate {
		_id: ''+res._id, votes: { $ne: self._id }
	}, {
		$push: { votes: self._id }
	}, done

unupvote = (self, res, cb) ->
	please({$model:User}, {$model:Problem}, '$isFn')
	if ''+res.author._id == ''+self._id
		cb()
		return

	done = (err, doc) ->
		if err
			return cb(err)
		if not doc
			logger.debug('Vote wasn\'t there?', res._id)
			return cb(null)
		cb(null, doc)
		# jobs.create('post unupvote', {
		# 	title: "New unupvote: #{self.name} → #{res._id}",
		# 	authorId: res.author._id,
		# 	resource: res.toObject(),
		# 	agent: self.toObject(),
		# }).save()
	Problem.findOneAndUpdate {
		_id: ''+res._id, votes: self._id
	}, {
		$pull: { votes: self._id }
	}, done

sanitizeBody = (body, type) ->
	sanitizer = require 'sanitize-html'
	DefaultSanitizerOpts = {
		# To be added: 'pre', 'caption', 'hr', 'code', 'strike',
		allowedTags: ['h1','h2','b','em','strong','a','img','u','ul','li','blockquote','p','br','i'],
		allowedAttributes: {'a': ['href'],'img': ['src']},
		selfClosing: ['img', 'br'],
		transformTags: {'b':'strong','i':'em'},
		exclusiveFilter: (frame) -> frame.tag in ['a','span'] and not frame.text.trim()
	}
	getSanitizerOptions = (type) ->
		_.extend({}, DefaultSanitizerOpts, {
			allowedTags: ['b','em','strong','a','u','ul','blockquote','p','img','br','i','li'],
		})
	str = sanitizer(body, getSanitizerOptions(type))
	# Don't mind my little hack to remove excessive breaks
	str = str.replace(new RegExp("(<br \/>){2,}","gi"), "<br />")
		.replace(/<p>(<br \/>)?<\/p>/gi, '')
		.replace(/<br \/><\/p>/gi, '</p>')
	return str

##########################################################################################
##########################################################################################

module.exports = {
	setLogger: (_logger) -> logger = _logger
	createProblem: createProblem
	upvote: upvote
	unupvote: unupvote
	sanitizeBody: sanitizeBody
}
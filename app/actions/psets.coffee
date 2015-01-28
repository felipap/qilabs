
mongoose = require 'mongoose'
_ = require 'lodash'

please = require 'app/lib/please.js'
jobs = require 'app/config/kue.js'

User = mongoose.model 'User'
Problem = mongoose.model 'Problem'
ProblemSet = mongoose.model 'ProblemSet'

logger = global.logger.mchild()

createPset = (self, data, cb) ->
	please {$model:User}, '$skip', '$isFn'

	pset = new ProblemSet {
		author: User.toAuthorObject(self)
		title: data.title
		description: data.description
		problemIds: data.problemIds
		# _set: data._set or null
		# answer: {
		# 	options: data.answer.options
		# 	value: data.answer.value
		# 	is_mc: data.answer.is_mc
		# }
	}

	pset.save (err, doc) ->
		# Callback now, what happens later doesn't concern the user.
		if err
			logger.error("Error creating pset", err)
			throw err
		cb(null, doc)
		# jobs.create('pset new', {
		# 	title: "New pset: #{self.name} posted #{post._id}",
		# 	author: self.toObject(),
		# 	post: post.toObject(),
		# }).save()

upvote = (self, res, cb) ->
	please {$model:User}, {$model:Problem}, '$isFn'
	if res.author.id is self.id
		cb()
		return

	done = (err, doc) ->
		if err
			throw err
		if not doc
			logger.debug('Vote already there?', res._id)
			return cb(null)
		cb(null, doc)
		# jobs.create('problem upvote', {
		# 	title: "New upvote: #{self.name} → #{res._id}",
		# 	authorId: res.author.id,
		# 	resource: res.toObject(),
		# 	agent: self.toObject(),
		# }).save()
	Problem.findOneAndUpdate {
		_id: ''+res._id, votes: { $ne: self._id }
	}, {
		$push: { votes: self._id }
	}, done

unupvote = (self, res, cb) ->
	please {$model:User}, {$model:Problem}, '$isFn'
	if res.author.id is self.id
		cb()
		return

	done = (err, doc) ->
		if err
			throw err
		if not doc
			logger.debug('Vote wasn\'t there?', res._id)
			return cb(null)
		cb(null, doc)
		# jobs.create('post unupvote', {
		# 	title: "New unupvote: #{self.name} → #{res._id}",
		# 	authorId: res.author.id,
		# 	resource: res.toObject(),
		# 	agent: self.toObject(),
		# }).save()
	Problem.findOneAndUpdate {
		_id: ''+res._id, votes: self._id
	}, {
		$pull: { votes: self._id }
	}, done

##########################################################################################
##########################################################################################

module.exports = {
	createPset: createPset
	upvote: upvote
	unupvote: unupvote
}
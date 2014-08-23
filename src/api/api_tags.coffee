
async = require 'async'
mongoose = require 'mongoose'
_ = require 'underscore'
required = require 'src/lib/required.js'
tags = require 'src/config/tags.js'

Resource = mongoose.model 'Resource'
User = Resource.model 'User'
Post = Resource.model 'Post'


module.exports = {
	permissions: [required.login],
	children: {
		':tag/notes':
			get: (req, res) ->
				tag = req.params.tag
				return res.status(404).endJson { error: true } unless tag of tags.data 
				if isNaN(maxDate = parseInt(req.query.maxDate))
					maxDate = Date.now()

				Post
					.find { type: 'Note', parentPost: null, created_at:{ $lt:maxDate }, subject: tag }
					.exec (err, docs) =>
						return callback(err) if err
						if not docs.length or not docs[docs.length]
							minDate = 0
						else minDate = docs[docs.length-1].created_at
						res.endJson { minDate: minDate, data: docs }
		':tag/discussions':
			get: (req, res) ->
				tag = req.params.tag
				return res.status(404).endJson { error: true } unless tag of tags.data 
				if isNaN(maxDate = parseInt(req.query.maxDate))
					maxDate = Date.now()

				Post
					.find { type: 'Discussion', parentPost: null, created_at:{ $lt:maxDate }, subject: tag }
					.exec (err, docs) =>
						return callback(err) if err
						if not docs.length or not docs[docs.length]
							minDate = 0
						else minDate = docs[docs.length-1].created_at
						res.endJson { minDate: minDate, data: docs }
	}
}
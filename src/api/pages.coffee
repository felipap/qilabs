
async = require 'async'
mongoose = require 'mongoose'
_ = require 'underscore'
required = require 'src/lib/required.js'

Resource = mongoose.model 'Resource'
User = Resource.model 'User'
Post = Resource.model 'Post'

pages = require('src/config/pages.js').data
reversePages = {}
for key, data of pages
	path = data.path
	if path[0] is '/'
		path = path.slice(0)
	reversePages[path] = _.extend({ tag: key }, data)

module.exports = {
	permissions: [required.login],
	children: {
		':tag/notes':
			get: (req, res) ->
				tag = req.params.tag
				console.log tag
				if not tag of pages
					console.log tag
					return res.status(404).endJson({ error: true })
				if isNaN(maxDate = parseInt(req.query.maxDate))
					maxDate = Date.now()
				Post
					.find { type: 'Note', parent: null, created_at:{ $lt:maxDate }, subject: tag }
					.exec (err, docs) =>
						return callback(err) if err
						if not docs.length or not docs[docs.length]
							minDate = 0
						else minDate = docs[docs.length-1].created_at
						res.endJson { minDate: minDate, data: docs }
		':tag/discussions':
			get: (req, res) ->
				tag = req.params.tag
				return res.status(404).endJson { error: true } unless tag of pages 
				if isNaN(maxDate = parseInt(req.query.maxDate))
					maxDate = Date.now()

				Post
					.find { type: 'Discussion', parent: null, created_at:{ $lt:maxDate }, subject: tag }
					.exec (err, docs) =>
						return callback(err) if err
						if not docs.length or not docs[docs.length]
							minDate = 0
						else minDate = docs[docs.length-1].created_at
						res.endJson { minDate: minDate, data: docs }
	}
}
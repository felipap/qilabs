
# Move created_at and updated_at fields from comment.meta to comment

async = require 'async'
mongoose = require 'mongoose'
_ = require 'lodash'

jobber = require('../lib/jobber.js')((e) ->

	CommentTree = mongoose.model 'CommentTree'
	User = mongoose.model 'User'

	workCT = (tree, cb) ->
		async.map tree.docs, ((doc, done) ->
			console.log(doc.id)
			CommentTree.findOneAndUpdate {
				'docs._id': doc._id
			}, {
				'docs.$.parent': tree.parent
				'docs.$.created_at': doc.meta.created_at
				'docs.$.updated_at': doc.meta.updated_at or null
			}, done
		), cb

	CommentTree.find {}, (err, cts) ->
		if err
			throw err

		console.log("INSIDE CTS", cts.length)
		async.map(cts, ((tree, done) ->
			num = Math.floor(Math.random()*100)
			console.log "TREEEE", num, tree.id, tree.docs.length
			workCT tree, done
		), ((err, results) ->
			console.log("QUIT CALLED", err, results)
			e.quit()
		))

).start()

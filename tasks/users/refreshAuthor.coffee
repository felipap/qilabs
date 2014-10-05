
# tasks/users/stats
# Refresh user stats.

async = require 'async'
mongoose = require 'mongoose'
_ = require 'lodash'

jobber = require('../jobber.js')((e) ->

	Resource = mongoose.model 'Resource'
	Post = Resource.model 'Post'
	CommentTree = mongoose.model 'CommentTree'
	User = mongoose.model 'User'

	workUser = (user, cb) ->
		updatePosts = (done) ->
			console.log "Refreshing authorship for #{user.id} aka #{user.username}"
			Post.update {'author.id':''+user.id},
				{$set: {author: User.toAuthorObject(user)}},
				{multi:true},
				(err, num) ->
					if err
						console.error(err)
					console.log "Saving posts:", err, num
					done(err)

		# Update notification trees (too expensive?)
		updateNT = (done) ->

		# Upvote
		updateCT = (done) ->
			console.log("Updating commenttree?")

			getCommentIds = (cb) ->
				CommentTree.find { # CommentTrees that user is in
					'docs.author.id': ''+user.id
				}, (err, cts) ->
					if err
						throw err
					allcomments = _.flatten(_.pluck(cts, 'docs'))
					cb(_.filter(allcomments, (i) -> i.author.id is user.id))

			updateComment = (id, done) ->
				CommentTree.update {
					'docs._id': ''+id
				}, {
					'docs.$.author': User.toAuthorObject(user)
				}, done

			getCommentIds (docs) ->
				console.log(docs)
				async.map docs, ((doc, done) ->
					updateComment doc._id, (err, saved) ->
						if err
							throw err
						if not saved
							throw new Error("WTF")
						console.log("Updated id:", doc._id)
						done()
				), (err, results) ->
					done()
		async.series [updatePosts, updateCT], (err, results) ->
			cb()

	targetUserId = process.argv[2]
	if targetUserId
		User.findOne {_id: targetUserId}, (err, user) ->
			workUser(user, e.quit)
	else
		console.warn "No target user id supplied."
		User.find {}, (err, users) ->
			async.map users, workUser, e.quit

).start()

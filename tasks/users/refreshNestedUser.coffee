
# tasks/users/refreshNestedUser
# Refresh nested objects related to a certain user.
# These include:
# - Comment Authorship (info inside CommentTree.docs.author)
# - Post Authorship (info inside Post.author)
# - Post Participation (info inside Post.participations.user)

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
					# console.log "Saving posts:", err, num
					done(err)

		updateParticipations = (done) ->

			getParticipations = (cb) ->
				Post.find {'participations.user.id':user.id}, (err, posts) ->
					if err
						throw err
					parts = _.map(posts, (post) ->
						userPart = _.find(post.participations, (p) -> p.user.id is user.id)
						if not userPart
							throw new Error("User part in post.participations no longer here.")
						[post._id, userPart._id] # part format
					)
					cb(parts)

			updateParticipation = (part, cb) ->
				Post.update {
					'_id': ''+part[0]
					'participations._id': ''+part[1]
				}, {
					'participations.$.user': User.toAuthorObject(user)
				}, (err, doc) ->
					# console.log('args',arguments)
					cb(err, doc)

			getParticipations (docs) ->
				async.map docs, ((doc, done) ->
					updateParticipation doc, (err, saved) ->
						if err
							throw err
						if not saved
							throw new Error("WTF")
						done()
				), (err, results) ->
					done()

		# Update notification trees (too expensive?)
		updateNT = (done) ->

		# Update comment trees
		updateCT = (done) ->
			# console.log("Updating commenttree?")

			getCommentIds = (cb) ->
				CommentTree.find { # CommentTrees that user is in
					'docs.author.id': ''+user.ide
				}, (err, cts) ->
					if err
						throw err
					allcomments = _.flatten(_.pluck(cts, 'docs'))
					cb(_.filter(allcomments, (i) -> i.author.id is user.id))

			updateComment = (id, done) ->
				# README: this is just too fucking expensive
				CommentTree.update {
					'docs._id': ''+id
				}, {
					'docs.$.author': User.toAuthorObject(user)
				}, done

			getCommentIds (docs) ->
				# console.log(docs)
				async.map docs, ((doc, done) ->
					updateComment doc._id, (err, saved) ->
						if err
							throw err
						if not saved
							throw new Error("WTF")
						# console.log("Updated id:", doc._id)
						done()
				), (err, results) ->
					done()

		console.log "Updating user", user.name, "@"+user.username, user.id
		async.series [updatePosts, updateCT, updateParticipations], (err, results) ->
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

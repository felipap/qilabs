
# src/core/notification
# for QI Labs
# by @f03lipe

mongoose = require 'mongoose'
async = require 'async'
_ = require 'lodash'
assert = require 'assert'

please = require 'src/lib/please'
Chunker = require './chunker'
logger = require('src/core/bunyan')({ service: 'NotificationService' })
TMERA = require 'src/core/lib/tmera'

Notification = mongoose.model 'Notification'
NotificationChunk = mongoose.model 'NotificationChunk'
User = mongoose.model 'User'

Handlers = {
	'NewFollower': {
		instance: (agent, data) ->
			please {$model:'User'}, {follow:{$model:'Follow'},followee:{$model:'User'}}

			return {
				path: agent.path
				key: 'newfollower:'+data.followee._id+':'+agent._id
				created_at: data.follow.dateBegin
				updated_at: data.follow.dateBegin
				object: {
					follow: data.follow._id
					name: agent.name
					avatarUrl: agent.avatarUrl
				}
			}
		item: (data) ->
			please {followee:{$model:'User'}}

			return {
				identifier: 'newfollower:'+data.followee._id
				resource: data.followee._id
				type: 'NewFollower'
				object: { }
				receiver: data.followee._id
				instances: []
			}
	},
	'PostComment': {
		instance: (agent, data) ->
			please {$model:'User'}, {parent:{$model:'Post'},comment:{$model:'Comment'}}
			assert agent isnt data.parent.author._id, "I refuse to notify the parent's author"

			return {
				object: {
					name: data.comment.author.name
					path: data.comment.author.path
					date: data.comment.created_at
					avatarUrl: data.comment.author.avatarUrl
					commentId: data.comment._id
					excerpt: data.comment.content.body.slice(0,100)
				}
				path: agent.path
				key: 'postcomment:tree:'+data.comment.tree+':agent:'+agent._id
				created_at: data.comment.created_at
			}
		item: (data) ->
			please {parent:{$model:'Post'}}

			return {
				identifier: 'postcomment_'+data.parent._id
				resource: data.parent._id
				type: 'PostComment'
				path: data.parent.path # data.comment.path
				object: {
					name: data.parent.content.title
					parentType: data.parent.type
					thumbnail: data.parent.content.image or data.parent.content.link_image
					id: data.parent._id
					lab: data.parent.lab
				}
				receiver: data.parent.author.id
				instances: []
			}
	},
	'CommentReply': {
		instance: (agent, data) ->
			please {$model:'User'},
				{parent:{$model:'Post'},replied:{$model:'Comment'},comment:{$model:'Comment'}}
			assert agent isnt data.parent.author._id, "I refuse to notify the parent's author"

			return {
				object: {
					name: data.comment.author.name
					path: data.comment.author.path
					date: data.comment.created_at
					excerpt: data.comment.content.body.slice(0,100)
					avatarUrl: data.comment.author.avatarUrl
					commentId: data.comment._id
				}
				path: agent.path
				key: 'post_comment:tree:'+data.comment.tree+':replied:'+data.replied._id+':agent:'+agent._id
				created_at: data.comment.created_at
			}
		item: (data) ->
			please {parent:{$model:'Post'},replied:{$model:'Comment'}}

			return {
				identifier: 'commentreply:'+data.replied._id
				resource: data.replied._id
				type: 'CommentReply'
				path: data.replied.path
				object: {
					title: data.parent.content.title
					excerpt: data.replied.content.body.slice(0,100)
					parentType: data.parent.type
					thumbnail: data.parent.content.image or data.parent.content.link_image
					id: data.parent._id
					lab: data.parent.lab
				}
				receiver: data.replied.author.id
				instances: []
			}
	}
	'CommentMention': {
		instance: (agent, data) ->
			please {$model:'User'},
				{parent:{$model:'Post'},mentioned:{$model:'User'},comment:{$model:'Comment'}}
			assert data.mentioned._id isnt data.comment.author._id,
				"I refuse to notify the mentioner"

			return {
				object: {
					name: data.comment.author.name
					path: data.comment.author.path
					date: data.comment.created_at
					excerpt: data.comment.content.body.slice(0,100)
					avatarUrl: data.comment.author.avatarUrl
					commentId: data.comment._id
				}
				path: agent.path
				key: 'commentmention:tree:'+data.comment.tree+':mentioned:'+data.mentioned._id+':agent:'+agent._id
				created_at: data.comment.created_at
			}
		item: (data) ->
			please {parent:{$model:'Post'},mentioned:{$model:'User'},comment:{$model:'Comment'}}

			return {
				identifier: 'commentmention:'+data.parent._id
				resource: data.parent._id
				type: 'CommentMention'
				path: data.parent.path
				object: {
					title: data.parent.content.title
					excerpt: data.parent.content.body.slice(0,100)
					parentType: data.parent.type
					thumbnail: data.parent.content.image or data.parent.content.link_image
					id: data.parent._id
					lab: data.parent.lab
				}
				receiver: data.mentioned._id
				instances: []
			}
	}
}

Generators = {
	CommentReply: (user, cb) ->
		logger = logger.child({ generator: 'CommentReply' })
		Post = mongoose.model('Post')
		User = mongoose.model('User')
		CommentTree = mongoose.model('CommentTree')
		Comment = mongoose.model('Comment')

		Post
			.find { }
			.populate { path: 'comment_tree', model: CommentTree }
			.exec TMERA (docs) ->
				items = []

				# Loop through all posts from that user
				forEachPost = (post, done) ->
					if not post.comment_tree or not post.comment_tree.docs.length
						# logger.debug("No comment_tree or comments for post '%s'", post.content.title)
						return done()
					author_comments = _.filter(post.comment_tree.docs, (i) -> i.author.id is user.id)
					if not author_comments.length
						return done()
					console.log('author comments', author_comments.length, post.content.title)

					forEachComment = (comment, done) ->
						replies_to_that = _.filter(post.comment_tree.docs,
							(i) -> ''+i.replies_to is ''+comment.id)
						if not replies_to_that.length
							return done()

						skin = Handlers.CommentReply.item({
							parent: _.extend(post.toObject(), { comment_tree: post.comment_tree._id }),
							replied: new Comment(comment)
						})
						instances = []
						uniqueAuthors = {}

						forEachReply = (reply, done) ->
							if uniqueAuthors[reply.author.id]
								return done()
							uniqueAuthors[reply.author.id] = true

							User.findOne { _id: reply.author.id }, TMERA (cauthor) ->
								if not cauthor
									logger.error("Author of comment %s of comment_tree %s not found.",
										comment.author.id, post.comment_tree)
									return done()

								console.log("generating instance", reply.content.body.slice(0,100))
								inst = Handlers.CommentReply.instance(cauthor, {
									# Generate unpopulated parent
									parent: _.extend(post, { comment_tree: post.comment_tree._id }),
									# Generate clean comment (without those crazy subdoc attributes like __$)
									replied: new Comment(comment)
									comment: new Comment(reply)
								})
								instances.push(inst)
								done()

						async.map replies_to_that, forEachReply, (err) ->
							if err
								throw err
							if not instances.length
								return done()
							oldest = _.min(instances, 'created_at')
							latest = _.max(instances, 'created_at')
							console.log('oldest', oldest.created_at)
							items.push(new Notification(_.extend(skin, {
								instances: instances
								multiplier: instances.length
								updated_at: latest.created_at
								created_at: oldest.created_at
							})))
							done()

					async.map author_comments, forEachComment, (err) ->
						if err
							throw err
						console.log "forEachComment"
							# logger.warn("Post has comments but no instance was returned.")
						done()

				async.map docs, forEachPost, (err) ->
					if err
						throw err
					console.log "forEachPost"
					cb(null, items)
	PostComment: (user, cb) ->
		logger = logger.child({ generator: 'PostComment' })
		Post = mongoose.model('Post')
		User = mongoose.model('User')
		CommentTree = mongoose.model('CommentTree')
		Comment = mongoose.model('Comment')

		Post
			.find { 'author.id': user._id }
			.populate { path: 'comment_tree', model: CommentTree }
			.exec TMERA (docs) ->
				notifications = []

				forEachPost = (post, done) ->
					instances = []
					if not post.comment_tree or not post.comment_tree.docs.length
						logger.debug("No comment_tree or comments for post '%s'", post.content.title)
						return done()
					skin = Handlers.PostComment.item({
						# Send in unpopulated parent
						parent: _.extend(post.toObject(), { comment_tree: post.comment_tree._id }),
					})
					uniqueAuthors = {}
					# Loop comment_tree entries
					async.map post.comment_tree.docs, ((comment, done) ->
						# Ignore replies to other comments, comments the author made, and authors
						# we already created instances for.
						if comment.thread_root or
						comment.author.id is post.author.id or # 'O
						uniqueAuthors[comment.author.id]
							return done()

						uniqueAuthors[comment.author.id] = true

						User.findOne { _id: comment.author.id }, TMERA (cauthor) ->
							if not cauthor
								logger.error("Author of comment %s of comment_tree %s not found.",
									comment.author.id, post.comment_tree)
								return done()

							inst = Handlers.PostComment.instance(cauthor, {
								# Generate unpopulated parent
								parent: _.extend(post, { comment_tree: post.comment_tree._id }),
								# Generate clean comment (without those crazy subdoc attributes like __$)
								comment: new Comment(comment)
							})
							instances.push(inst)
							done()
					), (err) ->
						if not instances.length
							logger.warn("Post has comments but no instance was returned.")
							return done()
						oldest = _.min(instances, 'created_at')
						latest = _.max(instances, 'created_at')
						console.log('oldest', oldest.created_at)
						notifications.push(new Notification(_.extend(skin, {
							instances: instances
							multiplier: instances.length
							updated_at: latest.created_at
							created_at: oldest.created_at
						})))
						done()

				# Loop through all posts from that user
				async.map docs, forEachPost, (err, results) ->
					cb(null, notifications)
	NewFollower: (user, cb) ->
		logger = logger.child({ generator: 'NewFollower' })
		Follow = mongoose.model('Follow')
		User = mongoose.model('User')

		Follow
			.find { 'followee': user._id }
			.populate { path: 'follower', model: User }
			.exec TMERA (docs) ->
				if docs.length is 0
					return cb(null, [])

				# console.log('docs', docs)
				instances = []
				skin = Handlers.NewFollower.item({ followee: user })
				docs.forEach (follow) ->
					# Get unpopulated follow
					ofollow = new Follow(follow)
					ofollow.follower = follow.follower._id
					data = { follow: ofollow, followee: user }
					instances.push(Handlers.NewFollower.instance(follow.follower, data))
				# console.log("INSTANCES",instances)
				oldest = _.min(instances, 'created_at')
				latest = _.max(instances, 'created_at')
				cb(null, [new Notification(_.extend(skin, {
					instances: instances
					multiplier: instances.length
					updated_at: latest.created_at
					created_at: oldest.created_at # Date of the oldest follow
				}))])
}

class NotificationService

	Handlers: Handlers
	Types: Notification.Types

	chunker = new Chunker('notification_chunks', NotificationChunk, Notification,
		Notification.Types, Handlers, Generators)

	create: (agent, type, data, cb = () ->) ->

		onAdded = (err, object, instance, chunk) ->
			if err
				throw new Error("CARALGHO")
			if not chunk
				return cb(null)
			User.findOneAndUpdate { _id: object.receiver },
			{ 'meta.last_received_notification': Date.now() }, (err, doc) ->
				if err
					logger.error("Failed to update user meta.last_received_notification")
					throw err
				logger.info("User %s(%s) meta.last_received_notification updated",
					doc.name, doc.id)
				cb(null)

		chunker.add(agent, type, data, onAdded)

	undo: (agent, type, data, cb = () ->) ->

		onRemovedAll = (err, count, object, object_inst) ->
			cb(null)

		chunker.remove(agent, type, data, onRemovedAll)

	redoUserNotifications: (user, cb) ->

		chunker.redoUser user, (err, chunk) ->
			console.log('chunk')

			User.findOneAndUpdate {
 				_id: user._id
 			}, {
 				'meta.last_received_notification': chunk.updated_at
 			}, (err, doc) ->
 				cb()

module.exports = new NotificationService
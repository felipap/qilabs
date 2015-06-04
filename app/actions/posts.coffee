
mongoose = require 'mongoose'
_ = require 'lodash'
assert = require 'assert'
async = require 'async'
validator = require 'validator'

please = require 'app/lib/please.js'
jobs = require 'app/config/kue.js'
redis = require 'app/config/redis.js'

User = mongoose.model 'User'
Post = mongoose.model 'Post'
Comment = mongoose.model 'Comment'
CommentTree = mongoose.model 'CommentTree'

# Throw Mongodb Errors Right Away
TMERA = require 'app/lib/tmera'

logger = global.logger.mchild()

###*
 * Creates a new CommentTree object for a post document and saves it.
 * @param 	{Post} 	parent 	The post object we're creating the tree for
 * @param 	{Function} cb Callback(err, tree, parent)
 * @throws 	{Error} If mongo fails to create CommentTree
 * @throws 	{Error} If mongo fails to update parent post with new comment_tree attr
###
createTree = (parent, cb) ->
	please {$model:Post}, '$fn'

	if parent.comment_tree
		logger.warn('Overriding post %s comment_tree attribute (=%s).',
			parent._id, parent.comment_tree)
		delete parent.comment_tree

	logger.debug('Creating comment_tree for post %s', parent._id)
	tree = new CommentTree {
		parent: parent._id
	}
	tree.save TMERA('Failed to save comment_tree (for post %s)', parent._id)(
		(tree) ->
			# Atomic. YES.
			Post.findOneAndUpdate { _id: parent._id }, { comment_tree: tree._id },
				TMERA('Failed to update post %s with comment_tree attr', parent._id)(
					(parent) ->
						cb(tree, parent)
				)
	)

###*
 * Find or create a CommentTree.
 * - Handle cases when the referenced tree (post.comment_tree) doesn't exist
 * 	 (anymore?).
 * @param 	{Post}			parent 	The post object we're creating the tree for.
 * @param 	{Function}	cb 			Callback(err, tree, parent)
 * @throws 	{Error} If mongo fails trying to find CommentTree
 * @throws 	{Error} If createTree throws error
###
findOrCreatePostTree = (parent, cb) ->
	please {$model:Post}, '$fn'

	if parent.comment_tree
		CommentTree.findOne { _id: parent.comment_tree },
		TMERA('Failed to find tree (%s)', parent.comment_tree) (tree) ->
			if not tree
				logger.warn(
					'CommentTree %s of parent %s not found. Attempt to create new one.',
					parent.comment_tree, parent._id)
				createTree parent, (tree, parent) ->
					please {$model:CommentTree}, {$model:Post}
					logger.warn('CommentTree for parent %s finally created.', parent._id)
					cb(tree, parent)
			else
				cb(tree, parent)
	else
		# No tree object.
		# We're fucked if it exists but isn't referenced.
		createTree parent, (tree, parent) ->
			please {$model:CommentTree}, {$model:Post}
			# Pass on new parent (with comment_tree attr updated)
			cb(tree, parent)


###*
 * - I've tried my best to make this function atomic, to no success AFAIK.
 * - This function also handles replies_to functionality and triggering of
 * @param  {User}		me			Author object
 * @param  {Post}   parent 	Parent post on which me is writing
 * @param  {Object} data		Comment content
 * @param  {Function} cb 		[description]
###
module.exports.commentToPost = (self, parent, data, cb) ->
	please {$model:User}, {$model:Post}, {$contains:['content']}, '$fn'

	#*
	# Comments may be nested in a tree of replies. (isNested = true)
	# When isNested, users who replies in that tree of replies should get notified
	# about the new reply. [1] Otherwise, users who watch the post (including the
	# author by default), should get notified about the new comment. [2]
	# Comments may mention users. The mentioned should be notified [3]. This
	# notification takes priority over the notifications documented above.
	#
	# TODO
	# Document how the trust level of self determines which notifications are
	# sent (to prevent spammers).
	#*

	findOrCreatePostTree parent, (tree, parent) ->
		# Get potentially updated parent object.

		if data.threadRoot
			threadRoot = tree.docs.id(data.threadRoot)
			if not threadRoot
				logger.warn 'Tried to reply in a thread that doesn\'t exist: ',
					data.threadRoot

		mentionedUnames = [] # Not user IDs!
		# README: this will see a username in "asdf@username".
		usernames = _.map(
			_.filter(
				_.unique(data.content.body.match(/@([_a-z0-9]{4,})/gi)),
				(i) -> i isnt self.username
			),
			(i) -> i.slice(1) # remove the '@'
		)
		# TODO! Check self trust-level to prevent spam.
		for username in usernames
			participating = _.find(
				parent.participations,
				(i) -> i.user.username is username
			)
			# If self trust-level is bellow 3, only allow mentions to users currently
			# participating.
			if participating or self.flags.trust > 3
				logger.trace 'Mentioned user', username
				mentionedUnames.push(username)
			else
				logger.debug 'Mentioned user '+username+' not participating in'+
					parent.id

		# README: Using new Comment({...}) here is leading to RangeError on server.
		# #WTF
		_comment = tree.docs.create({
			author: User.toAuthorObject(self)
			content: {
				body: data.content.body
			}
			tree: parent.comment_tree
			parent: parent._id
			thread_root: threadRoot and threadRoot.id
			# replied_users: repliedCo and [User.toAuthorObject(repliedCo.author)]
		})

		# The expected object (without those crazy __parentArray, __$, ... properties)
		comment = new Comment(_comment)
		logger.debug 'commentToPost(%s) with comment_tree(%s)', parent._id,
			parent.comment_tree
		console.log comment

		# Atomically push comment to commentTree
		# BEWARE: the comment object won't be validated, since we're not pushing it
		# to the tree object and saving.
		# CommentTree.findOneAndUpdate { _id: tree._id },
		# 	{$push: { docs : comment }}, (err, tree) ->

		# Non-atomically saving? comment to comment tree
		# README: Atomic version is leading to "RangeError: Maximum call stack size
		# exceeded" on Heroku.
		tree.docs.push(_comment) # Push the weird object.
		tree.save (err) ->
			if err
				logger.error('Failed to push comment to CommentTree', err)
				return cb(err)

			jobs.create('updatePostParticipations', {
				treeId: tree._id
				postId: parent._id
				commentId: comment._id
			}).save()

			if threadRoot
				# [1] Notify users participating in the tree of replies.
				jobs.create('notifyWatchingReplyTree', {
					treeId: tree._id
					postId: parent._id
					replyId: comment._id
					commentAuthorId: comment.author.id
					replyTreeRootId: threadRoot.id
					repliedAuthorId: threadRoot.author.id
				}).save()
			else
				# [2] Notify users watching post discussion.
				jobs.create('notifyWatchingComments', {
					treeId: tree._id
					postId: parent._id
					commentId: comment._id
					commentAuthorId: comment.author.id
					postAuthorId: parent.author.id
				}).save()

			# TODO
			# Prevent users from receiving multiple notifications for the same
			# comment.
			if mentionedUnames.length
				jobs.create('notifyMentionedUsers', {
					treeId: tree._id
					postId: parent._id
					commentId: comment._id
					commentAuthorId: comment.author.id
					postAuthorId: parent.author.id
					mentionedUsernames: mentionedUnames
				}).save()

			cb(null, comment)

module.exports.deleteComment = (self, comment, tree, cb) ->
	please {$model:User},{$model:Comment},{$model:CommentTree},'$fn'

	logger.debug 'Removing comment(%s) from tree(%s)', comment._id, tree._id

	isStartOfThread = !!_.find(tree.docs, (i) -> comment.id is ''+i.thread_root)

	# If is parent to a comment thread, don't **really** delete it.
	if isStartOfThread
		logger.debug 'Not *really* removing comment.', comment._id, tree._id, self.id

		console.log tree.docs.id(comment._id).author.id, self.id
		assert tree.docs.id(comment._id).author.id is self.id

		CommentTree.findOneAndUpdate {
				_id: tree._id,
				'docs._id': comment._id,
				# README: DO NOT uncomment following line. It will make docs.$ point to
				# first element of docs.author.
				# 'docs.author.id': self.id
			}, {
				$set: {
					'docs.$.content.deletedBody': comment.content.body,
					'docs.$.content.body': 'comentário excluido',
					'docs.$.deleted_at': Date.now()
					'docs.$.deleted': true
				}
			}, TMERA (tree) ->
				if not tree
					throw "Tree not found! ??? "
				comment = new Comment(tree.docs.id(comment.id)) # WTF is this call done?

				jobs.create('updatePostParticipations', {
					treeId: tree.id
					postId: tree.parent
					commentId: comment.id
					commentAuthorId: comment.author.id
				}).save()

				jobs.create('undoNotificationsFromDeletedComment', {
					jsonComment: comment.toObject()
					commentAuthorId: comment.author.id
					treeId: tree.id
					postId: tree.parent.id
				}).save()

				cb(null, null)
	else
		tree.docs.pull(comment._id)

		tree.save (err, doc) ->
			if err
				logger.error("Failed to pull comment(comment._id) from tree(#{tree._id})", err)
				return cb(err)
			console.log('removed')

			jobs.create('undoNotificationsFromDeletedComment', {
				jsonComment: new Comment(comment).toObject()
				commentAuthorId: comment.author.id
				treeId: tree.id
				postId: tree.parent
			}).save()

			jobs.create('updatePostParticipations', {
				commentAuthorId: comment.author.id
				treeId: tree.id
				postId: tree.parent
				commentId: comment.id
			}).save()

			cb(null, null)

module.exports.upvoteComment = (self, res, cb) ->
	please {$model:User}, {$model:Comment}, '$fn'
	CommentTree.findOneAndUpdate { _id: res.tree, 'docs._id': res._id },
	{ $addToSet: { 'docs.$.votes': self._id} }, (err, tree) ->
		if err
			logger.error("Failed to $addToSet user's(#{self._id}) vote to comment(#{res._id}) belonging"
				"to tree(#{res.tree}")
			return cb(err)
		if not tree
			return cb(new Error("Couldn't find comment(#{res._id})'s tree(#{res.tree}) to upvote"))
		obj = tree.docs.id(res._id)
		if not obj
			return cb(new Error("Couldn't find comment(#{res._id}) in tree(#{res.tree})"))
		cb(null, new Comment(obj))

module.exports.unupvoteComment = (self, res, cb) ->
	please {$model:User}, {$model:Comment}, '$fn'
	CommentTree.findOneAndUpdate { _id: res.tree, 'docs._id': res._id },
	{ $pull: { 'docs.$.votes': self._id} }, (err, tree) ->
		if err
			logger.error("Failed to $pull user's (#{self._id}) vote from comment (#{res._id}) belonging"
				"to tree (#{res.tree}")
			return cb(err)
		if not tree
			return cb(new Error("Couldn't find comment (#{res._id})' comment tree (#{res.tree}) to unupvote"))
		obj = tree.docs.id(res._id)
		if not obj
			return cb(new Error("Couldn't find comment(#{res._id}) in tree(#{res.tree})"))
		cb(null, new Comment(obj))

module.exports.createPost = (self, data, cb) ->
	please {$model:User}, '$skip', '$fn'

	create = () ->
		post = new Post {
			author: User.toAuthorObject(self)
			content: {
				title: data.content.title
				body: data.content.body
				link: data.content.link
				cover: data.content.cover
				images: data.content.images
				link_image: data.content.link_image
				link_type: data.content.link_type
				link_title: data.content.link_title
				link_description: data.content.link_description
			}
			users_watching: [self.id]
			type: data.type
			lab: data.lab
			tags: data.tags
		}
		post.save (err, post) ->
			if err
				return cb(err)
			cb(null, post)

			jobs.create('NEW post', {
				title: "create post: #{self.name} posted #{post.id}",
				postId: post.id,
				authorId: self.id,
			}).save()

	console.log(data.content)
	if validator.isURL(data.content.link)
		og self, data.content.link, (err, ogdata) ->
			data.content.link = validator.trim(ogdata.url or data.content.link)
			data.content.link_type = ogdata.type
			data.content.link_title = ogdata.title
			data.content.link_image = ogdata.image?.url
			data.content.link_updated = ogdata.updated
			data.content.link_description = ogdata.description
			create()
	else
		if data.content.link # Invalid link passed validation function?
			logger.warn "Link existed but wasn't valid. WTF"
		create()

module.exports.watchPost = (self, res, cb) ->
	please {$model:User}, {$model:Post}, '$fn'

	Post.findOneAndUpdate {
		_id: ''+res._id, users_watching: { $ne: self._id }
	}, {
		$addToSet: { users_watching: self._id }
	}, TMERA("Error watch") (doc) ->
		if not doc
			logger.debug('Watching already there?', res.id)
			return cb(null, null)
		cb(null, doc)

module.exports.unwatchPost = (self, res, cb) ->
	please {$model:User}, {$model:Post}, '$fn'

	Post.findOneAndUpdate {
		_id: ''+res._id, users_watching: self._id
	}, {
		$pull: { users_watching: self._id }
	}, TMERA("Error unwatch") (doc) ->
		if not doc
			logger.debug('Watching not there?', res.id)
			return cb(null, null)
		cb(null, doc)

module.exports.upvotePost = (self, res, cb) ->
	please {$model:User}, {$model:Post}, '$fn'
	if ''+res.author.id is ''+self.id
		cb()
		return

	done = (err, doc) ->
		if err
			console.log("ERRO upvote POST", err)
			throw err
			return cb(err)

		if not doc
			logger.debug('Vote already there?', res.id)
			return cb(null)

		jobs.create('post upvote', {
			title: "New upvote: #{self.name} → #{res.id}",
			postAuthorId: doc.author.id,
			postId: doc.id,
			agentId: self.id,
		}).save()
		cb(null, doc)

	Post.findOneAndUpdate {
		_id: ''+res._id, votes: { $ne: self._id }
	}, {
		$push: { votes: self._id }
	}, done

module.exports.unupvotePost = (self, res, cb) ->
	please {$model:User}, {$model:Post}, '$fn'
	if ''+res.author.id is ''+self.id
		cb()
		return

	done = (err, doc) ->
		if err
			console.log("ERRO unupvote POST", err)
			throw err
			return cb(err)

		if not doc
			logger.debug('Vote wasn\'t there?', res.id)
			return cb(null)

		jobs.create('post unupvote', {
			title: "New unupvote: #{self.name} → #{res.id}",
			postAuthorId: doc.author.id,
			authorId: res.author.id,
			postId: doc.id,
			agentId: self.id,
		}).save()
		cb(null, doc)

	Post.findOneAndUpdate { _id: ''+res._id, votes: self._id },
	{ $pull: { votes: self._id } },
	done

module.exports.stuffGetPost = (self, post, cb) ->
	please '$skip', {$model:Post}, '$fn'
	# self might be null, in case user isn't logged

	post.getCommentTree (err, tree) ->
		if err
			console.log('ERRO???', err)
			return cb(err)

		# stuffed post object (db + metadata)
		stfdPost = post.toJSON()
		if tree
			stfdPost.comments = tree.toJSON().docs.slice()
			stfdPost.comments.forEach (i) ->
			  i._meta = { liked: self and !!~i.votes.indexOf(self.id) }
			  delete i.votes
		else
			stfdPost.comments = []

		stfdPost._meta = {}
		stfdPost._meta.liked = self and !!~post.votes.indexOf(self.id)
		stfdPost._meta.watching = self and !!~post.users_watching.indexOf(self.id)

		async.parallel([
			(done) ->
				if self
					self.doesFollowUserId post.author.id, (err, val) ->
						# Fail silently.
						if err
							val = false
							logger.error('Error retrieving doesFollowUserId value', err)
						stfdPost._meta.authorFollowed = val
						done()
				else
					stfdPost._meta.authorFollowed = false
					done()
			(done) ->
				redis.incr post.getCacheField('Views'), (err, count) ->
					if err
						logger.error('Error retrieving views count', err)
					else
						stfdPost._meta.views = count
					done()
		], (err, results) ->
			cb(err, stfdPost)
		)
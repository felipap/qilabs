
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
Notification = mongoose.model 'Notification'

# Throw Mongodb Errors Right Away
TMERA = require 'app/lib/tmera'

logger = null

###*
 * Creates a new CommentTree object for a post document and saves it.
 * @param 	{Post} 	parent 	The post object we're creating the tree for
 * @param 	{Function} cb Callback(err, tree, parent)
 * @throws 	{Error} If mongo fails to create CommentTree
 * @throws 	{Error} If mongo fails to update parent post with new comment_tree attr
###
createTree = (parent, cb) ->
	please {$model:Post}, '$isFn'

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
	please {$model:Post}, '$isFn'

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
 * [commentToPost description]
 * - I've tried my best to make this function atomic, to no success AFAIK.
 * - This function also handles replies_to functionality and triggering of
 * @param  {User}		me			Author object
 * @param  {Post}   parent 	Parent post on which me is writing
 * @param  {Object} data		Comment content
 * @param  {Function} cb 		[description]
###
commentToPost = (self, parent, data, cb) ->
	please {$model:User}, {$model:Post}, {$contains:['content']}, '$isFn'

	findOrCreatePostTree parent, (tree, parent) ->
		# Get potentially updated parent object.

		thread_root = null
		replies_to = null
		replied_user = null
		# Make sure replies_to exists. README: assumes only one tree exists for a post
		if data.replies_to
			replied = tree.docs.id(data.replies_to)
			if replied # make sure object exists
				replied_user = replied.author
				if data.content.body[0] isnt '@' # not talking to anyone
					replies_to = data.replies_to
				if replied.thread_root # replied is also nested
					thread_root = replied.thread_root
				else # replied is root
					thread_root = data.replies_to
			else
				logger.warn 'Tried to reply to a comment that didn\'t exist: %s',
					data.replies_to

		mentions = []
		if data.content.body[0] is '@' # talking to someone
			# Find that user in participation
			usernames = data.content.body.match(/@([_a-z0-9]{4,})/gi)
			if usernames and usernames.length < 4 # penalty for more than 5 mentions
				for _username in _.filter(_.unique(usernames), (i) -> i isnt self.username)
					username = _username.slice(1)
					part = _.find(parent.participations, (i) -> i.user.username is username)
					if part
						mentions.push(''+part.user.id)
					else
						# For now, ignore mentions to users who are not participating.
						logger.debug 'Mentioned user '+username+
							' not in participations of '+parent._id

		# README: Using new Comment({...}) here is leading to RangeError on server.
		# #WTF
		_comment = tree.docs.create({
			author: User.toAuthorObject(self)
			content: {
				body: data.content.body
			}
			tree: parent.comment_tree
			parent: parent._id
			replies_to: replies_to
			thread_root: thread_root
			# replied_users: replied_user and [User.toAuthorObject(replied_user)] or null
		})

		# The expected object (without those crazy __parentArray, __$, ... properties)
		comment = new Comment(_comment)
		logger.debug 'commentToPost(%s) with comment_tree(%s)', parent._id,
			parent.comment_tree

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

			jobs.create('NEW comment', {
				title: 'comment added: '+comment.author.name+' posted '+comment.id+' to '+parent._id,
				commentId: comment._id
				treeId: tree._id
				parentId: parent._id
				commentId: comment._id
			}).save()

			if replies_to
				jobs.create('NEW comment reply', {
					title: 'reply added: '+comment.author.name+' posted '+comment.id+' to '+parent._id,
					treeId: tree._id
					parentId: parent._id
					commentId: comment._id
					repliedId: replied._id
				}).save()

			if mentions and mentions.length
				for mention in mentions
					jobs.create('NEW comment mention', {
						title: 'mention: '+comment.author.name+' mentioned '+mention+' in '+comment.id+' in '+parent._id,
						treeId: tree._id
						parentId: parent._id
						commentId: comment._id
						mentionedId: mention
					}).save()
			cb(null, comment)

deleteComment = (self, comment, tree, cb) ->
	please {$model:User},{$model:Comment},{$model:CommentTree},'$isFn'

	logger.debug 'Removing comment(%s) from tree(%s)', comment._id, tree._id

	# If someone replied to this, don't **really** delete it.
	if true
		CommentTree.findOneAndUpdate {
				_id: tree._id,
				'docs._id': comment._id,
				'docs.author.id': self.id
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
				comment = new Comment(tree.docs.id(comment.id))

				jobs.create('DELETE post comment', {
					title: "Deleted: #{comment.author.name} deleted #{comment.id} from #{comment.tree}"
					comment: comment.toObject()
				}).save()

				cb(null, null)
	else
		tree.docs.pull(comment._id)

		tree.save (err, doc) ->
			if err
				logger.error("Failed to pull comment(comment._id) from tree(#{tree._id})", err)
				return cb(err)
			console.log('removed')

			jobs.create('DELETE post comment', {
				title: "Deleteed: #{comment.author.name} deleted #{comment.id} from #{comment.tree}"
				comment: new Comment(comment).toObject()
			}).save()

			cb(null, null)

upvoteComment = (self, res, cb) ->
	please {$model:User}, {$model:Comment}, '$isFn'
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

unupvoteComment = (self, res, cb) ->
	please {$model:User}, {$model:Comment}, '$isFn'
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

################################################################################
################################################################################

createPost = (self, data, cb) ->
	please {$model:User}, '$skip', '$isFn'

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
				post: post.toObject(),
				author: self.toObject(),
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

watchPost = (self, res, cb) ->
	please {$model:User}, {$model:Post}, '$isFn'

	Post.findOneAndUpdate {
		_id: ''+res._id, users_watching: { $ne: self._id }
	}, {
		$addToSet: { users_watching: self._id }
	}, TMERA("Error watch") (doc) ->
		if not doc
			logger.debug('Watching already there?', res.id)
			return cb(null, null)
		cb(null, doc)

unwatchPost = (self, res, cb) ->
	please {$model:User}, {$model:Post}, '$isFn'

	Post.findOneAndUpdate {
		_id: ''+res._id, users_watching: self._id
	}, {
		$pull: { users_watching: self._id }
	}, TMERA("Error unwatch") (doc) ->
		if not doc
			logger.debug('Watching not there?', res.id)
			return cb(null, null)
		cb(null, doc)

upvotePost = (self, res, cb) ->
	please {$model:User}, {$model:Post}, '$isFn'
	if ''+res.author.id == ''+self.id
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
			post: doc.toObject(),
			agent: self.toObject(),
		}).save()
		cb(null, doc)

	Post.findOneAndUpdate {
		_id: ''+res._id, votes: { $ne: self._id }
	}, {
		$push: { votes: self._id }
	}, done

unupvotePost = (self, res, cb) ->
	please {$model:User}, {$model:Post}, '$isFn'
	if ''+res.author.id == ''+self.id
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
			authorId: res.author.id,
			post: doc.toObject(),
			agent: self.toObject(),
		}).save()
		cb(null, doc)

	Post.findOneAndUpdate {
		_id: ''+res._id, votes: self._id
	}, {
		$pull: { votes: self._id }
	}, done

stuffGetPost = (self, post, cb) ->
	please '$skip', {$model:Post}, '$isFn'
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
					self.doesFollowUser post.author.id, (err, val) ->
						# Fail silently.
						if err
							val = false
							logger.error('Error retrieving doesFollowUser value', err)
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

################################################################################
################################################################################

module.exports = {
	commentToPost: commentToPost
	deleteComment: deleteComment
	upvoteComment: upvoteComment
	unupvoteComment: unupvoteComment
	createPost: createPost
	watchPost: watchPost
	unwatchPost: unwatchPost
	upvotePost: upvotePost
	unupvotePost: unupvotePost
	stuffGetPost: stuffGetPost
}
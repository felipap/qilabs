
'use strict'

var bunyan = require('bunyan')
var kue = require('kue')
var async = require('async')
var assert = require('assert')
var _ = require('lodash')
var mongoose = require('mongoose')
var bluebird = require('bluebird')

var redis = require('app/config/redis')
var please = require('app/lib/please.js')
var KarmaService = require('../services/karma')
var NotificationService = require('../services/notification')
var InboxService = require('../services/inbox')
var FacebookService = require('../services/fb')

var logger = null

var Post = mongoose.model('Post')
var User = mongoose.model('User')
var Inbox = mongoose.model('Inbox')
var Follow = mongoose.model('Follow')
var Comment = mongoose.model('Comment')

function reticentSlice (str, max) {
	if (str.length <= max) {
		return str
	}
	var last = str.match(/\s?(.+)\s*$/)[1]
	if (last.length > 20) {
		return str.slice(0, max-3)+"..."
	} else {
		words = str.slice(0, max-3).split(/\s/)
		return words.slice(0,words.length-2).join(' ')+"..."
	}
}

function _updateFollowStats(follower, followee, cb) {
	please({$model:User},{$model:User},'$fn',arguments)

	async.parallel([
		follower.updateCachedProfile.bind(follower),
		followee.updateCachedProfile.bind(followee)
	], (err, results) => {
		if (err) {
			throw err
		}
		cb()
	})
}

class Jobs {

	constructor(_logger) {
		logger = _logger || global.logger.mchild()

		this.params = {
			author: User,
			agent: User,
			repliedAuthor: User,
			user: User,
			postAuthor: User,
			commentAuthor: User,
			post: Post,
			tree: mongoose.model('CommentTree'),
			follower: User,
			followee: User,
			follow: Follow,
		}
	}

	// Normal jobs below

	userCreated(job, done) {
		please({r:{$contains:['user']}},arguments)

		function createCache(cb) {
			job.r.user.updateCachedProfile(cb)
		}

		function notifyWelcome(cb) {
			NotificationService.create(null, job.r.user, 'Welcome', {}, cb)
		}

		async.parallel([createCache, notifyWelcome], (err) => {
			if (err) {
				throw err
			}
			done()
		})
	}

	userFollow(job, done) {
		please({r:{$contains:['follower','followee','follow']}},arguments)

		function createNotification(cb) {
			NotificationService.create(job.r.follower, job.r.followee,
			'Follow', {
				follow: job.r.follow
			}, cb)
		}

		function updateInbox(cb) {
			cb()
			// InboxService.createAfterFollow(job.r.follower, job.r.followee, cb)
		}

		function updateStats(cb) {
			_updateFollowStats(job.r.follower, job.r.followee, cb)
		}

		async.parallel([updateStats, updateInbox, createNotification], (err) => {
			if (err) {
				throw err
			}

			done()
		})
	}

	userUnfollow(job, done) {
		please({r:{$contains:['follower','followee']}},arguments)

		function undoNotification(cb) {
			NotificationService.undo(job.r.follower, job.r.followee,
			'Follow', {
				follow: new Follow(job.data.follow)
			}, cb)
		}

		function updateInbox(cb) {
			cb()
			// InboxService.removeAfterUnfollow(job.r.follower, job.r.followee, cb)
		}

		function updateStats(cb) {
			_updateFollowStats(job.r.follower, job.r.followee, cb)
		}

		async.parallel([updateStats, updateInbox, undoNotification], done)
	}

	//////////////////////////////////////////////////////////////////////////////
	//////////////////////////////////////////////////////////////////////////////

	postUpvote(job, done) {
		please({r:{$contains:['agent','post','postAuthor']}},arguments)

		KarmaService.create(job.r.agent, job.r.postAuthor, 'PostUpvote', {
			post: job.r.post
		}, done)
	}

	postUnupvote(job, done) {
		please({r:{$contains:['agent','post','postAuthor']}},arguments)

		KarmaService.undo(job.r.agent, job.r.postAuthor, 'PostUpvote', {
			post: job.r.post
		}, done)
	}

	//////////////////////////////////////////////////////////////////////////////
	//////////////////////////////////////////////////////////////////////////////

	updatePostParticipations(job, done) {
		// Updates post count.children and list of participations.
		please({r:{$contains:['post']}}, '$fn',arguments)

		require('./refreshPostParticipations')(job.r.post, (err, result) => {
			done()
		})
	}

	notifyWatchingReplyTree(job, done) {
		please({
			r: { $contains: ['tree', 'post', 'repliedAuthor', 'commentAuthor'] },
			data: { $contains: ['replyTreeRootId','replyId'] },
		}, arguments)

		var replied = job.r.tree.docs.id(job.data.replyTreeRootId)
		var comment = job.r.tree.docs.id(job.data.replyId)
		assert(replied && comment)

		if (job.r.commentAuthor.id === replied.author.id) {
			console.log('no thanks')
			done()
			return
		}

		NotificationService.create(job.r.commentAuthor, job.r.repliedAuthor,
		'CommentReply', {
			reply: new Comment(comment),
			comment: new Comment(replied),
			post: job.r.post,
		}, () => {
			console.log('notification service ended')
			done()
		})
	}

	notifyMentionedUsers(job, done) {
		please({
			r: { $contains: ['tree', 'post', 'commentAuthor', 'postAuthor'] },
			data: { $contains: ['mentionedUsernames'] },
		}, arguments)

		var mention = job.r.tree.docs.id(job.data.commentId)
		async.map(job.data.mentionedUsernames, (mentionedUname, done) => {
			User.findOne({ username: mentionedUname }, (err, mentioned) => {
				if (err) {
					throw err
				}

				if (!mentioned) {
					logger.error('Failed to find mentioned user', mentionedUname,
						mention.author.id)
					return done()
				}

				if (job.r.commentAuthor.flags.trust >= 3) {
					// console.log('trust', job.r.commentAuthor.flags.trust)
					FacebookService.notifyUser(mentioned,
						'Você foi mencionado por @'+job.r.commentAuthor.username+
						' na discussão do post "'+
						reticentSlice(job.r.post.content.title, 200),
						'cmention',
						job.r.post.shortPath,
						(err, result) => {
							// console.log('result', result)
						}
					)
				}

				NotificationService.create(job.r.commentAuthor, mentioned,
					'CommentMention', {
						mention: new Comment(mention),
						post: job.r.post,
					}, done)
			})
		}, (err, results) => {
			done()
		})
	}

	notifyWatchingComments(job, done) {
		please({r:{$contains:['tree','post','commentAuthor','postAuthor']}},arguments)

		var comment = job.r.tree.docs.id(job.data.commentId)

		if (!comment) {
			done(new Error('Failed to find comment '+job.data.commentId+
				' in tree '+job.r.tree.id))
			return
		}

		if (job.r.post.author.id === comment.author.id) {
			done()
			return
		}

		if (job.r.commentAuthor.flags.trust >= 3) {
			FacebookService.notifyUser(job.r.postAuthor,
				'Seu post "'+reticentSlice(job.r.post.content.title, 200)+
				'" recebeu uma resposta de @'+job.r.commentAuthor.username,
				'canswer',
				job.r.post.shortPath,
				(err, result) => {
					// console.log('reuslt', result)
				})
		}

		NotificationService.create(job.r.commentAuthor, job.r.postAuthor, 'PostComment', {
			comment: new Comment(comment),
			post: job.r.post,
		}, done)
	}

	//////////////////////////////////////////////////////////////////////////////
	//////////////////////////////////////////////////////////////////////////////

	// Undo postcomment notification
	undoNotificationsFromDeletedComment(job, done) {
		please({
			r: { $contains: ['tree', 'post', 'commentAuthor'] },
			data: { $contains: [ 'jsonComment' ] },
		}, arguments)

		/*
		 * - Saves new post count of children
		 * - Undoes PostComment and CommentReply notifications
		 *
		 */

		var comment = Comment.fromObject(job.data.jsonComment)

		Post.findOneAndUpdate({ _id: job.r.post._id },
			{ $inc: { 'counts.children': -1 } }, (err, post) => {
			if (err) {
				throw err
			}

			User.findOne({ _id: '' + post.author.id }, (err, postAuthor) => {
				if (err) {
					throw err
				}

				NotificationService.undo(job.r.commentAuthor, postAuthor, 'PostComment', {
					comment: comment,
					post: post,
				}, done)
			})
		})
	}

	newPost(job, done) {
		please({r:{$contains:['post','author']}},arguments)

		var Inbox = mongoose.model('Inbox')

		job.r.author.getPopulatedFollowers((err, followers) => {
			if (err) {
				throw err
			}

			done()
			// InboxService.fillInboxes(job.r.post, [job.r.author].concat(followers), done)
		})
	}

}

module.exports = Jobs
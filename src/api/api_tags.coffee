
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
		':tag':
			children:
				'/posts':
					get: (req, res) ->
						tag = req.params.tag
						#! check here if tag exists!!!
						unless tag of tags.data
							return res.status(404).endJson {
								error: true,
							}
						# req.logMe("fetched board of user #{req.params.userId}")
						if isNaN(maxDate = parseInt(req.query.maxDate))
							maxDate = Date.now()

						Post
							.find { parentPost: null, published:{ $lt:maxDate }, tags: tag }
							.exec (err, docs) =>
								return callback(err) if err
								if not docs.length or not docs[docs.length]
									minDate = 0
								else
									minDate = docs[docs.length-1].published

								async.map docs, (post, done) ->
									if post instanceof Post
										Post.count {type:'Comment', parentPost:post}, (err, ccount) ->
											Post.count {type:'Answer', parentPost:post}, (err, acount) ->
												done(err, _.extend(post.toJSON(), {childrenCount:{Answer:acount,Comment:ccount}}))
									else done(null, post.toJSON())
								, (err, results) ->
									# console.log(results)
									res.endJson {
										minDate: minDate
										data: results
									}
				# '/followers':
				# 	get: (req, res) ->
				# 			return unless userId = req.paramToObjectId('userId')
				# 			User.findOne {_id:userId}, req.handleErrResult((user) ->
				# 				user.getPopulatedFollowers (err, results) ->
				# 					# Add meta.followed attr to users, with req.user → user follow status
				# 					async.map results, ((person, next) ->
				# 							req.user.doesFollowUser person, (err, val) ->
				# 								next(err, _.extend(person.toJSON(),{meta:{followed:val}}))
				# 						), (err, results) ->
				# 							if err
				# 								res.endJson {error:true}
				# 							else
				# 								res.endJson { data:results }
				# 			)
				# '/following':
				# 	get: (req, res) ->
				# 			return unless userId = req.paramToObjectId('userId')
				# 			User.findOne {_id:userId}, req.handleErrResult((user) ->
				# 				user.getPopulatedFollowing (err, results) ->
				# 					# Add meta.followed attr to users, with req.user → user follow status
				# 					async.map results, ((person, next) ->
				# 							req.user.doesFollowUser person, (err, val) ->
				# 								next(err, _.extend(person.toJSON(),{meta:{followed:val}}))
				# 						), (err, results) ->
				# 							if err
				# 								res.endJson {error:true}
				# 							else
				# 								res.endJson { data:results }
				# 			)
				# '/follow':
				# 	post: (req, res) ->
				# 			return unless userId = req.paramToObjectId('userId')
				# 			User.findOne {_id: userId}, req.handleErrResult((user) ->
				# 				req.user.dofollowUser user, (err, done) ->
				# 					res.endJson {
				# 						error: !!err,
				# 					}
				# 			)
				# '/unfollow':
					post: (req, res) ->
							return unless userId = req.paramToObjectId('userId')
							User.findOne {_id: userId}, (err, user) ->
								req.user.unfollowUser user, (err, done) ->
									res.endJson {
										error: !!err,
									}
	}
}
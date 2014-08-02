
async = require 'async'
mongoose = require 'mongoose'
_ = require 'underscore'
required = require 'src/lib/required.js'

Resource = mongoose.model 'Resource'
User = Resource.model 'User'
Post = Resource.model 'Post'

module.exports = {
	permissions: [required.login],
	children: {
		':userId':
			children:
				'/posts':
					get: (req, res) ->
						console.log userId = req.paramToObjectId('userId')
						return unless userId = req.paramToObjectId('userId')

						# req.logMe("fetched board of user #{req.params.userId}")
						maxDate = parseInt(req.query.maxDate)
						if isNaN(maxDate)
							maxDate = Date.now()

						console.log('fetching')

						User.findOne {_id:userId}, req.handleErrResult((user) ->
							User.getUserTimeline user, { maxDate: maxDate },
								req.handleErrResult((docs, minDate=-1) ->
									res.endJson {
										minDate: minDate
										data: docs
									}
								)
						)
				'/followers':
					get: (req, res) ->
						return unless userId = req.paramToObjectId('userId')
						User.findOne {_id:userId}, req.handleErrResult((user) ->
							user.getPopulatedFollowers (err, results) ->
								# Add meta.followed attr to users, with req.user → user follow status
								async.map results, ((person, next) ->
										req.user.doesFollowUser person, (err, val) ->
											next(err, _.extend(person.toJSON(),{meta:{followed:val}}))
									), (err, results) ->
										if err
											res.endJson {error:true}
										else
											res.endJson { data:results }
							)
				'/following':
					get: (req, res) ->
							return unless userId = req.paramToObjectId('userId')
							User.findOne {_id:userId}, req.handleErrResult((user) ->
								user.getPopulatedFollowing (err, results) ->
									# Add meta.followed attr to users, with req.user → user follow status
									async.map results, ((person, next) ->
											req.user.doesFollowUser person, (err, val) ->
												next(err, _.extend(person.toJSON(),{meta:{followed:val}}))
										), (err, results) ->
											if err
												res.endJson {error:true}
											else
												res.endJson { data:results }
							)
				'/follow':
					post: (req, res) ->
							return unless userId = req.paramToObjectId('userId')
							User.findOne {_id: userId}, req.handleErrResult((user) ->
								req.user.dofollowUser user, (err, done) ->
									res.endJson {
										error: !!err,
									}
							)
				'/unfollow':
					post: (req, res) ->
							return unless userId = req.paramToObjectId('userId')
							User.findOne {_id: userId}, (err, user) ->
								req.user.unfollowUser user, (err, done) ->
									res.endJson {
										error: !!err,
									}
	}
}
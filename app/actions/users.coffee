
mongoose = require('mongoose')
_ = require('lodash')

please = require('app/lib/please')
jobs = require('app/config/kue')
redis = require('app/config/redis')

User = mongoose.model('User')
Follow = mongoose.model('Follow')


module.exports.fetchManyCachedUsers = (self, ids, cb) ->
	# Get redis fields for profile data for each id
	profileFields = (User.CacheFields.Profile.replace(/{id}/, i) for i in ids)

	redisCommands = (['hgetall',field] for field in profileFields)
	redis.multi(redisCommands).exec (err, replies) ->
		# Pair up replies with their ids, please!
		for r, i in replies
			if r
				r.id = ids[i]
				r.followed = false # default
			else
				console.log('WTFF??', ids[i])
		# 3. Check which of these users we follow: intersect these ids with
		# self's following set.
		redis.smembers User.CacheFields.Following.replace(/{id}/, self.id),
		(err, followingIds) ->
			for uid in _.intersection(ids, followingIds)
				_.find(replies, { id: uid }).followed = true

			# Structer response data
			data = _.map replies, (user, index) ->
				{
					id: user.id
					name: user.name
					username: user.username
					avatarUrl: user.avatar
					profile:
						bio: user.bio
						location: user.location
						home: user.home
					stats:
						followers: user.nfollowers
						following: user.nfollowing
						karma: user.karma
						posts: user.nposts
					meta:
						followed: user.followed
				}

			cb(null, data)

module.exports.dofollowUser = (agent, user, cb) ->
	please({$model:User}, {$model:User}, '$fn')

	if ''+user.id is ''+agent.id
		# One can't follow itself
		return cb(new Error("Dude, you can't follow yourself"))

	Follow.findOne {follower:agent, followee:user}, (err, doc) =>
		unless doc
			doc = new Follow {
				follower: agent._id
				followee: user._id
			}
			doc.save (err, doc) ->
				if err
					throw err
				cb(null, doc)

				redis.sadd agent.getCacheField("Following"), ''+user.id, (err, doc) ->
					console.log "sadd on following", arguments
					if err
						console.log err

				jobs.create('user follow', {
					title: "New follow: #{agent.name} → #{user.name}",
					followerId: agent.id,
					followeeId: user.id,
					followId: doc.id,
				}).save()
			return
		cb(err, !!doc)

module.exports.unfollowUser = (agent, user, cb) ->
	please({$model:User}, {$model:User}, '$fn')

	Follow.findOne { follower: agent._id, followee: user._id }, (err, doc) =>
		if err
			console.warn("error finding one follow", err)
			return cb(err)

		if doc
			doc.remove (err, ok) ->
				jobs.create('user unfollow', {
					title: "New unfollow: #{agent.name} → #{user.name}",
					followeeId: user.id,
					followerId: agent.id,
					# MUSTN'T pass tge id of a removed object. Serialize it.
					follow: new Follow(doc).toObject(),
				}).save()

				# remove on redis anyway? or only inside clause?
				redis.srem agent.getCacheField("Following"), ''+user.id, (err, doc) ->
					console.log "srem on following", arguments
					if err
						console.log "ERROR REMOVING ON REDIS", err
						console.trace()
				cb(null)
		else
				cb(null)

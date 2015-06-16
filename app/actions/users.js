
var mongoose = require('mongoose')
var _ = require('lodash')
var please = require('app/lib/please')
var jobs = require('app/config/kue')
var redis = require('app/config/redis')

var User = mongoose.model('User')
var Follow = mongoose.model('Follow')

module.exports.fetchManyCachedUsers = function(self, ids, cb) {
  // Get redis fields for profile data for each id
  var profileFields = _.map(ids, (i) => User.CacheFields.Profile.replace(/{id}/, i))
  var redisCommands = _.map(profileFields, (i) => ['hgetall', i])

  redis.multi(redisCommands).exec((err, replies) => {
  	// Pair up replies with their ids, please!
    replies.forEach((r, index) => {
      if (r) {
        r.id = ids[index]
        r.followed = false
      } else {
        console.warn('WTF?', ids[i])
      }
    })

    function onGetReplies(replies) {
    	// Structer response data
      var data = _.map(replies, (user, index) => {
        return {
          id: user.id,
          name: user.name,
          username: user.username,
          avatarUrl: user.avatar,
          profile: {
            bio: user.bio,
            location: user.location,
            home: user.home
          },
          stats: {
            followers: user.nfollowers,
            following: user.nfollowing,
            karma: user.karma,
            posts: user.nposts
          },
          meta: {
            followed: user.followed || false
          },
        }
      })
      cb(null, data)
    }

    if (self) {
    	// 3. Check which of these users we follow: intersect these ids with
			// self's following set.
      var field = User.CacheFields.Following.replace(/{id}/, self.id)
      redis.smembers(field, (err, followingIds) => {
        if (err) {
          throw err
        }

        //
        _.intersection(ids, followingIds).forEach((uid) => {
          _.find(replies, { id: uid }).followed = true
        })

        onGetReplies(replies)
      })
    } else {
      onGetReplies(replies)
    }
  })
}

module.exports.dofollowUser = function(agent, user, cb) {
  please({$model:User},{$model:User},'$fn')

  if ('' + user.id === '' + agent.id) { // One can't follow itself
    cb(new Error("Dude, you can't follow yourself"))
    return
  }

  Follow.findOne({ follower: agent, followee: user }, (err, doc) => {
    if (doc) {
      cb(err, true)
      return
    }

    doc = new Follow({
      follower: agent._id,
      followee: user._id,
    })

    doc.save((err, doc) => {
      if (err) {
        throw err
      }

      cb(null, doc)

      redis.sadd(agent.getCacheField("Following"), ''+user.id, (err, doc) => {
        if (err) {
          throw err
        }
        console.log("sadd on following", arguments)
      })

      jobs.create('user follow', {
        title: "New follow: " + agent.name + " → " + user.name,
        followerId: agent.id,
        followeeId: user.id,
        followId: doc.id
      }).save()
    })
  })
}

module.exports.unfollowUser = function(agent, user, cb) {
  please({$model:User},{$model:User},'$fn')

  Follow.findOne({ follower: agent._id, followee: user._id }, (err, doc) => {
    if (err) {
      throw err
    }

    if (!doc) {
      cb(null, false)
      return
    }

    doc.remove(function(err, ok) {
      if (err) {
        throw err
      }

      jobs.create('user unfollow', {
        title: "New unfollow: " + agent.name + " → " + user.name,
        followeeId: user.id,
        followerId: agent.id,
        // MUSTN'T pass tge id of a removed object. Serialize it.
        follow: new Follow(doc).toObject(),
      }).save()

			// remove on redis anyway? or only inside clause?
      redis.srem(agent.getCacheField("Following"), '' + user.id, (err, doc) => {
        if (err) {
          throw err
        }

        console.log("srem on following", arguments)
      })

      cb(null)
    })
  })
}

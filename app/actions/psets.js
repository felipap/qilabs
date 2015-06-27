
var mongoose = require('mongoose')
var _ = require('lodash')
var async = require('async')

var please = require('app/lib/please.js')
var jobs = require('app/config/kue.js')
var TMERA = require('app/lib/tmera')

var User = mongoose.model('User')
var Problem = mongoose.model('ProblemCore')
var ProblemSet = mongoose.model('ProblemSet')

var logger = global.logger.mchild()
var stuffGetProblem = require('./problems').stuffGetProblem


module.exports.stuffGetPset = function(self, pset, cb) {
  please('$skip',{$model:ProblemSet},'$fn')

  if (self !== null && !self instanceof User) {
    throw new Error("WTF!")
  }

  pset
    .populate('problem_ids')
    .execPopulate()
    .then((err, doc) => {
      console.log('doc!', doc)
    })

  var jsonDoc = pset.toJSON()
  var pids = _.map(pset.problem_ids, (id) => '' + id)

  if (self) {
    self.doesFollowUserId(pset.author.id, (err, val) => {
      if (err) {
        throw err
      }

      jsonDoc._meta = {
        authorFollowed: val,
        liked: !!~pset.votes.indexOf(self.id),
        userIsAuthor: pset.author.id === self.id
      }

      // pset.
      // README should this be popu

      Problem.find({ _id: { $in: pids } }, TMERA((problems) => {
        async.map(problems, ((prob, next) => {
          stuffGetProblem(self, prob, next)
        }), (err, jsonProblems) => {
          if (err) {
            throw err
          }

          jsonDoc.problems = jsonProblems
          cb(null, jsonDoc)
        })
      }))
    })
  } else {
    jsonDoc._meta = {
      authorFollowed: false,
      liked: false,
      userIsAuthor: false
    }

    Problem.find({ _id: { $in: pids } }, TMERA((problems) => {
      async.map(problems, ((prob, next) => {
        stuffGetProblem(self, prob, next)
      }), (err, jsonProblems) => {
        if (err) {
          throw err
        }
        jsonDoc.problems = jsonProblems
        cb(null, jsonDoc)
      })
    }))
  }
}

module.exports.createPset = function(self, data, cb) {
  please({$model:User},'$skip','$fn')

	// Find problems with the passed ids and use only ids of existing problems
  Problem.find({ _id: { $in: data.problem_ids } }, TMERA((problems) => {
    var pids = _.pluck(problems, 'id')
    var pset = new ProblemSet({
      author: User.toAuthorObject(self),
      name: data.name,
      subject: data.subject,
      slug: data.slug,
      description: data.description,
      problem_ids: pids
    })
    pset.save((err, doc) => {
			// Update problems in pids to point to this problemset.
			// This should definitely be better documented.

			// Callback now, what happens later doesn't concern the user.
      if (err) {
        throw err
      }
      cb(null, doc)
			// jobs.create('pset new', {
			// 	title: "New pset: #{self.name} posted #{post._id}",
			// 	author: self.toObject(),
			// 	post: post.toObject(),
			// }).save()
    })
  }))
}

module.exports.updatePset = function(self, pset, data, cb) {
  please({$model:User},{$model:ProblemSet},'$skip','$fn')

  // Find problems with the passed ids and use only ids of existing problems
  Problem.find({ _id: { $in: data.problem_ids } }, TMERA((problems) => {
    var pids = _.pluck(problems, 'id')
    pset.updated_at = Date.now()
    pset.name = data.name
    pset.round = data.round
    pset.level = data.level
    pset.year = data.year
    pset.subject = data.subject
    pset.problem_ids = pids
    pset.slug = data.slug
    pset.description = data.description
    pset.levels_str = _.unique(_.pluck(problems, 'level'))

    pset.save((err, doc) => {
      if (err) {
        throw err
      }
      cb(null, doc)
    })
  }))
}

module.exports.upvote = function(self, res, cb) {
  please({$model:User},{$model:ProblemSet},'$fn')

  if (res.author.id === self.id) {
    cb()
    return
  }

  function done(err, doc) {
    if (err) {
      throw err
    }
    if (!doc) {
      logger.debug('Vote already there?', res._id)
      return cb(null, true)
    }
    cb(null, doc.votes.indexOf(self._id) !== -1)
  }

  ProblemSet.findOneAndUpdate(
  	{ _id: '' + res._id, votes: { $ne: self._id } },
  	{ $push: { votes: self._id }
  }, done)
}

module.exports.unupvote = function(self, res, cb) {
  please({$model:User},{$model:ProblemSet},'$fn')

  if (res.author.id === self.id) {
    cb()
    return
  }

  function done(err, doc) {
    if (err) {
      throw err
    }
    if (!doc) {
      logger.debug('Vote wasn\'t there?', res._id)
      return cb(null, false)
    }
    cb(null, doc.votes.indexOf(self._id) !== -1)
  }

  ProblemSet.findOneAndUpdate(
  	{ _id: '' + res._id, votes: self._id },
  	{ $pull: { votes: self._id } },
  	done)
}

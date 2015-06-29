
var mongoose = require('mongoose')
var _ = require('lodash')
var async = require('async')

var please = require('app/lib/please.js')
var jobs = require('app/config/kue.js')
var TMERA = require('app/lib/tmera')

var User = mongoose.model('User')
var Problem = mongoose.model('Problem')
var ProblemSet = mongoose.model('ProblemSet')

var logger = global.logger.mchild()
var stuffGetProblem = require('./problems').stuffGetProblem


module.exports.stuffGetPset = function(self, pset, cb) {
  please('$skip', {$model:ProblemSet}, '$fn')

  if (self !== null && !self instanceof User) {
    throw new Error("WTF!")
  }

  var selfIsAuthor = selfIsEditor = false
  if (self) {
    var selfIsAuthor = pset.author && pset.author.id === self._id
    var selfIsEditor = self.flags.editor
  }

  function fillChildren(json) {
    return new Promise(function (resolve, reject) {
      // Perhaps we could have simply used Problem.find({ _id: { $in: pids }}),
      // as we only need the populated array. Still, there may be optimizations
      // behind the population that are not extended to this simple find.
      // So let's populate for now.
      pset.populate('problemIds').execPopulate().then((doc) => {
        async.map(doc.problemIds,
          (p, done) => { stuffGetProblem(self, p, done) },
          (err, jsonProblems) => {
            if (err) {
              // TODO: deal with it?
              throw err
            }

            json.problems = jsonProblems
            resolve(json)
          })
      }, (err) => {
        req.logger.error('Error thrown!!!', err)
        reject(err)
      })
    })
  }

  function fillMeta(json) {
    return new Promise(function (resolve, reject) {
      json._meta = {
        authorFollowed: false,
        liked: false,
        userIsAuthor: selfIsAuthor,
      }

      if (!self) {
        return resolve(json)
      }

      json._meta.liked = !!~pset.votes.indexOf(self.id)
      self.doesFollowUserId(pset.author.id, (err, val) => {
        json.authorFollowed = val
        resolve(json)
      })
    })
  }

  fillChildren(pset.toJSON())
    .then(fillMeta)
    .then((json) => {
      cb(null, json)
    }, (err) => {
      console.trace()
      logger.error("Error thrown!", err, err.stack)
      cb(err)
    })
}

module.exports.createPset = function(self, data, cb) {
  please({$model:User},'$skip','$fn')

	// Find problems with the passed ids and use only ids of existing problems
  Problem.find({ _id: { $in: data.problemIds } }, TMERA((problems) => {
    var pids = _.pluck(problems, 'id')
    var pset = new ProblemSet({
      author: User.toAuthorObject(self),
      name: data.name,
      subject: data.subject,
      slug: data.slug,
      description: data.description,
      problemIds: pids
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
  Problem.find({ _id: { $in: data.problemIds } }, TMERA((problems) => {
    var pids = _.pluck(problems, 'id')
    pset.updated_at = Date.now()
    pset.name = data.name
    pset.round = data.round
    pset.level = data.level
    pset.year = data.year
    pset.subject = data.subject
    pset.problemIds = pids
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

var Resource, User, async, mongoose, required, _;

async = require('async');

mongoose = require('mongoose');

_ = require('underscore');

required = require('src/lib/required.js');

Resource = mongoose.model('Resource');

User = Resource.model('User');

module.exports = function(app) {
  var router;
  router = require('express').Router();
  router.use(required.login);
  router.param('userId', function(req, res, next, userId) {
    var e, id;
    try {
      id = mongoose.Types.ObjectId.createFromHexString(userId);
    } catch (_error) {
      e = _error;
      return next({
        type: "InvalidId",
        args: 'userId',
        value: userId
      });
    }
    return User.findOne({
      _id: userId
    }, req.handleErrResult(function(user) {
      req.requestedUser = user;
      return next();
    }));
  });
  router.get('/:userId', function(req, res) {
    return res.endJSON(req.requestedUser.toJSON());
  });
  router.get('/:userId/avatar', function(req, res) {
    return res.redirect(req.requestedUser.avatarUrl);
  });
  router.get('/:userId/posts', function(req, res) {
    var maxDate;
    maxDate = parseInt(req.query.maxDate);
    if (isNaN(maxDate)) {
      maxDate = Date.now();
    }
    return User.getUserTimeline(req.requestedUser, {
      maxDate: maxDate
    }, req.handleErrResult(function(docs, minDate) {
      if (minDate == null) {
        minDate = -1;
      }
      return res.endJSON({
        minDate: minDate,
        data: docs
      });
    }));
  });
  router.get('/:userId/followers', function(req, res) {
    return req.requestedUser.getPopulatedFollowers(function(err, results) {
      return async.map(results, (function(person, next) {
        return req.user.doesFollowUser(person, function(err, val) {
          return next(err, _.extend(person.toJSON(), {
            meta: {
              followed: val
            }
          }));
        });
      }), function(err, results) {
        if (err) {
          return res.endJSON({
            error: true
          });
        } else {
          return res.endJSON({
            data: results
          });
        }
      });
    });
  });
  router.get('/:userId/following', function(req, res) {
    return req.requestedUser.getPopulatedFollowing(function(err, results) {
      return async.map(results, (function(person, next) {
        return req.user.doesFollowUser(person, function(err, val) {
          return next(err, _.extend(person.toJSON(), {
            meta: {
              followed: val
            }
          }));
        });
      }), function(err, results) {
        if (err) {
          return res.endJSON({
            error: true
          });
        } else {
          return res.endJSON({
            data: results
          });
        }
      });
    });
  });
  router.post('/:userId/follow', function(req, res) {
    return req.user.dofollowUser(req.requestedUser, function(err, done) {
      return res.endJSON({
        error: !!err
      });
    });
  });
  router.post('/:userId/unfollow', function(req, res) {
    return req.user.unfollowUser(req.requestedUser, function(err, done) {
      return res.endJSON({
        error: !!err
      });
    });
  });
  return router;
};

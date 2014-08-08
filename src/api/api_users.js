var Post, Resource, User, async, mongoose, required, _;

async = require('async');

mongoose = require('mongoose');

_ = require('underscore');

required = require('src/lib/required.js');

Resource = mongoose.model('Resource');

User = Resource.model('User');

Post = Resource.model('Post');

module.exports = {
  permissions: [required.login],
  children: {
    ':userId': {
      children: {
        '/avatar': {
          get: function(req, res) {
            var userId;
            if (!(userId = req.paramToObjectId('userId'))) {
              return;
            }
            return User.findOne({
              _id: userId
            }, req.handleErrResult(function(user) {
              console.log(user.profile, user.avatarUrl);
              return res.redirect(user.avatarUrl);
            }));
          }
        },
        '/posts': {
          get: function(req, res) {
            var maxDate, userId;
            if (!(userId = req.paramToObjectId('userId'))) {
              return;
            }
            maxDate = parseInt(req.query.maxDate);
            if (isNaN(maxDate)) {
              maxDate = Date.now();
            }
            return User.findOne({
              _id: userId
            }, req.handleErrResult(function(user) {
              return User.getUserTimeline(user, {
                maxDate: maxDate
              }, req.handleErrResult(function(docs, minDate) {
                if (minDate == null) {
                  minDate = -1;
                }
                return res.endJson({
                  minDate: minDate,
                  data: docs
                });
              }));
            }));
          }
        },
        '/followers': {
          get: function(req, res) {
            var userId;
            if (!(userId = req.paramToObjectId('userId'))) {
              return;
            }
            return User.findOne({
              _id: userId
            }, req.handleErrResult(function(user) {
              return user.getPopulatedFollowers(function(err, results) {
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
                    return res.endJson({
                      error: true
                    });
                  } else {
                    return res.endJson({
                      data: results
                    });
                  }
                });
              });
            }));
          }
        },
        '/following': {
          get: function(req, res) {
            var userId;
            if (!(userId = req.paramToObjectId('userId'))) {
              return;
            }
            return User.findOne({
              _id: userId
            }, req.handleErrResult(function(user) {
              return user.getPopulatedFollowing(function(err, results) {
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
                    return res.endJson({
                      error: true
                    });
                  } else {
                    return res.endJson({
                      data: results
                    });
                  }
                });
              });
            }));
          }
        },
        '/follow': {
          post: function(req, res) {
            var userId;
            if (!(userId = req.paramToObjectId('userId'))) {
              return;
            }
            return User.findOne({
              _id: userId
            }, req.handleErrResult(function(user) {
              return req.user.dofollowUser(user, function(err, done) {
                return res.endJson({
                  error: !!err
                });
              });
            }));
          }
        },
        '/unfollow': {
          post: function(req, res) {
            var userId;
            if (!(userId = req.paramToObjectId('userId'))) {
              return;
            }
            return User.findOne({
              _id: userId
            }, function(err, user) {
              return req.user.unfollowUser(user, function(err, done) {
                return res.endJson({
                  error: !!err
                });
              });
            });
          }
        }
      }
    }
  }
};

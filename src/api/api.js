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
    ':tag': {
      children: {
        '/posts': {
          get: function(req, res) {
            var maxDate, tag;
            tag = req.params.tag;
            if (isNaN(maxDate = parseInt(req.query.maxDate))) {
              maxDate = Date.now();
            }
            console.log('fetching');
            return Post.find({
              parentPost: null,
              published: {
                $lt: maxDate
              },
              tags: tag
            }).populate({
              path: 'author',
              model: 'Resource',
              select: User.PopulateFields
            }).exec((function(_this) {
              return function(err, docs) {
                var minDate;
                if (err) {
                  return callback(err);
                }
                if (!docs.length || !docs[docs.length]) {
                  minDate = 0;
                } else {
                  minDate = docs[docs.length - 1].published;
                }
                return async.map(docs, function(post, done) {
                  if (post instanceof Post) {
                    return Post.count({
                      type: 'Comment',
                      parentPost: post
                    }, function(err, ccount) {
                      return Post.count({
                        type: 'Answer',
                        parentPost: post
                      }, function(err, acount) {
                        return done(err, _.extend(post.toJSON(), {
                          childrenCount: {
                            Answer: acount,
                            Comment: ccount
                          }
                        }));
                      });
                    });
                  } else {
                    return done(null, post.toJSON);
                  }
                }, function(err, results) {
                  callback(err, results, minDate);
                  return res.endJson({
                    minDate: minDate,
                    data: docs
                  });
                });
              };
            })(this));
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

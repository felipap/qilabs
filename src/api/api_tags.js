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
                    return done(null, post.toJSON());
                  }
                }, function(err, results) {
                  console.log(results);
                  return res.endJson({
                    minDate: minDate,
                    data: results
                  });
                });
              };
            })(this));
          },
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

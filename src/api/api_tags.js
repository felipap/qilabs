var Post, Resource, User, async, mongoose, required, tags, _;

async = require('async');

mongoose = require('mongoose');

_ = require('underscore');

required = require('src/lib/required.js');

tags = require('src/config/tags.js');

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
            if (!(tag in tags.data)) {
              return res.status(404).endJson({
                error: true
              });
            }
            if (isNaN(maxDate = parseInt(req.query.maxDate))) {
              maxDate = Date.now();
            }
            return Post.find({
              parentPost: null,
              created_at: {
                $lt: maxDate
              },
              tags: tag
            }).exec((function(_this) {
              return function(err, docs) {
                var minDate;
                if (err) {
                  return callback(err);
                }
                if (!docs.length || !docs[docs.length]) {
                  minDate = 0;
                } else {
                  minDate = docs[docs.length - 1].created_at;
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
                  return res.endJson({
                    minDate: minDate,
                    data: results
                  });
                });
              };
            })(this));
          }
        }
      }
    }
  }
};

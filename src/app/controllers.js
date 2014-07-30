var Post, Resource, User, mongoose, n, redis, required, routes, _, _i, _len, _ref;

mongoose = require('mongoose');

required = require('src/lib/required');

redis = require('src/config/redis');

_ = require('underscore');

Resource = mongoose.model('Resource');

Post = Resource.model('Post');

User = Resource.model('User');

routes = {
  '/': {
    name: 'index',
    get: function(req, res) {
      if (req.user) {
        req.user.lastUpdate = new Date();
        res.render('app/main', {
          user_profile: req.user
        });
        return req.user.save();
      } else {
        return res.render('app/front');
      }
    }
  },
  '/entrar': {
    get: function(req, res) {
      return res.redirect('/api/auth/facebook');
    }
  },
  '/settings': {
    name: 'settings',
    permissions: [required.login],
    get: function(req, res) {
      return res.render('app/settings', {});
    }
  },
  '/tags/:tagId': {
    permissions: [required.login],
    get: function(req, res) {
      return res.render('app/tag');
    }
  },
  '/@:username': {
    name: 'profile',
    get: function(req, res) {
      if (!req.params.username) {
        return res.render404();
      }
      return User.findOne({
        username: req.params.username
      }, req.handleErrResult(function(pUser) {
        return pUser.genProfile(function(err, profile) {
          if (err || !profile) {
            return res.render404();
          }
          if (req.user) {
            return req.user.doesFollowUser(pUser, function(err, bool) {
              return res.render('app/profile', {
                pUser: profile,
                follows: bool
              });
            });
          } else {
            return res.render('app/open_profile', {
              pUser: profile
            });
          }
        });
      }));
    }
  },
  '/posts/:postId': {
    name: 'post',
    get: function(req, res) {
      var postId;
      if (!(postId = req.paramToObjectId('postId'))) {
        return;
      }
      return Post.findOne({
        _id: postId
      }, req.handleErrResult(function(post) {
        if (post.parentPost) {
          return res.render404();
        }
        if (req.user) {
          console.log('user');
          return post.stuff(req.handleErrResult(function(stuffedPost) {
            console.log('stuff', stuffedPost.author.id);
            return req.user.doesFollowUser(stuffedPost.author.id, req.handleErrValue(function(val) {
              console.log('follows', val);
              return res.render('app/main', {
                user_profile: req.user,
                post_profile: _.extend(stuffedPost, {
                  meta: {
                    followed: val
                  }
                })
              });
            }));
          }));
        } else {
          return post.stuff(req.handleErrResult(function(post) {
            return res.render('app/open_post.html', {
              post: post
            });
          }));
        }
      }));
    }
  },
  '/sobre': {
    name: 'about',
    get: function(req, res) {
      return res.render('about/main');
    }
  },
  '/faq': {
    name: 'faq',
    get: function(req, res) {
      return res.render('about/faq');
    }
  },
  '/blog': {
    name: 'blog',
    get: function(req, res) {
      return res.redirect('http://blog.qilabs.org');
    }
  }
};

_ref = ['novo', '/posts/:postId/edit'];
for (_i = 0, _len = _ref.length; _i < _len; _i++) {
  n = _ref[_i];
  routes['/' + n] = {
    get: function(req, res, next) {
      if (req.user) {
        return res.render('app/main', {
          user_profile: req.user
        });
      } else {
        return res.redirect('/');
      }
    }
  };
}

module.exports = routes;

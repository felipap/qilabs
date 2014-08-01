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
        if (req.session.signinUp) {
          return req.res.redirect('/signup/finish/1');
        }
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
  '/signup/finish': {
    permissions: [required.login],
    get: function(req, res) {
      return res.redirect('/signup/finish/1');
    }
  },
  '/signup/finish/1': {
    permissions: [required.login],
    get: function(req, res) {
      if (!req.session.signinUp) {
        return res.redirect('/');
      }
      return res.render('app/signup_1');
    },
    put: function(req, res) {
      var email, nome, sobrenome, trim;
      trim = function(str) {
        return str.replace(/(^\s+)|(\s+$)/gi, '');
      };
      nome = trim(req.body.nome).split(' ')[0];
      sobrenome = trim(req.body.sobrenome).split(' ')[0];
      email = trim(req.body.email);
      req.user.name = nome + ' ' + sobrenome;
      if (email.match(/^[a-zA-Z0-9_.+-]+@[a-zA-Z0-9-]+\.[a-zA-Z0-9-.]+$/)) {
        req.user.email = email;
      }
      return req.user.save(function(err) {
        if (err) {
          console.log(err);
          return res.endJson({
            error: true
          });
        }
        return res.endJson({
          error: false
        });
      });
    }
  },
  '/signup/finish/2': {
    permissions: [required.login],
    get: function(req, res) {
      if (!req.session.signinUp) {
        return res.redirect('/');
      }
      return res.render('app/signup_2');
    },
    put: function(req, res) {
      var bio, home, location, trim;
      trim = function(str) {
        return str.replace(/(^\s+)|(\s+$)/gi, '');
      };
      if (req.body.bio) {
        req.user.profile.bio = bio;
        bio = trim(req.body.bio.replace(/^\s+|\s+$/g, '').slice(0, 300));
      } else {
        return res.endJson({
          error: true,
          message: 'Escreva uma bio.'
        });
      }
      if (req.body.home) {
        home = trim(req.body.home.replace(/^\s+|\s+$/g, '').slice(0, 35));
        req.user.profile.home = home;
      } else {
        return res.endJson({
          error: true,
          message: 'De onde você é?'
        });
      }
      if (req.body.location) {
        location = trim(req.body.location.replace(/^\s+|\s+$/g, '').slice(0, 35));
        req.user.profile.location = location;
      } else {
        return res.endJson({
          error: true,
          message: 'O que você faz da vida?'
        });
      }
      return req.user.save(function(err) {
        if (err) {
          console.log(err);
          return res.endJson({
            error: true
          });
        }
        req.session.signinUp = false;
        return res.endJson({
          error: false
        });
      });
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

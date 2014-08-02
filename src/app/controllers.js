var Post, Resource, User, mongoose, n, redis, required, routes, tags, _, _i, _len, _ref,
  __indexOf = [].indexOf || function(item) { for (var i = 0, l = this.length; i < l; i++) { if (i in this && this[i] === item) return i; } return -1; };

mongoose = require('mongoose');

_ = require('underscore');

required = require('src/lib/required');

redis = require('src/config/redis');

tags = require('src/config/tags');

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
  '/tags/:tag': {
    permissions: [required.login],
    get: function(req, res) {
      var data;
      if (!(req.params.tag in tags.data)) {
        return res.render404('Não conseguimos encontrar essa tag nos nossos arquivos.');
      }
      data = _.clone(tags.data[req.params.tag]);
      data.id = req.params.tag;
      return res.render('app/tag', {
        tag: data
      });
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
      var email, n, nascimento, nome, serie, sobrenome, trim, validYears, _ref;
      trim = function(str) {
        return str.replace(/(^\s+)|(\s+$)/gi, '');
      };
      if (typeof req.body.nome !== 'string' || typeof req.body.sobrenome !== 'string' || typeof req.body.email !== 'string' || typeof req.body.nascimento !== 'string' || typeof req.body.ano !== 'string') {
        return res.endJson({
          error: true,
          message: "Não recebemos todos os campos."
        });
      }
      nome = trim(req.body.nome).split(' ')[0];
      sobrenome = trim(req.body.sobrenome).split(' ')[0];
      email = trim(req.body.email);
      nascimento = trim(req.body.nascimento);
      serie = trim(req.body.ano);
      req.user.name = nome + ' ' + sobrenome;
      if (email.match(/^[a-zA-Z0-9_.+-]+@[a-zA-Z0-9-]+\.[a-zA-Z0-9-.]+$/)) {
        req.user.email = email;
      }
      n = parseInt(nascimento);
      if (isNaN(n)) {
        return res.endJson({
          error: true,
          message: 'Erro ao ler o ano de nascimento.'
        });
      } else {
        n = Math.min(Math.max(1950, n), 2001);
        req.user.profile.anoNascimento = n;
      }
      validYears = ['6-ef', '7-ef', '8-ef', '9-ef', '1-em', '2-em', '3-em', 'faculdade'];
      if (_ref = !req.body.ano, __indexOf.call(validYears, _ref) >= 0) {
        return res.endJson({
          error: true,
          message: 'Ano inválido.'
        });
      } else {
        req.user.profile.serie = req.body.ano;
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
        bio = trim(req.body.bio.replace(/^\s+|\s+$/g, '').slice(0, 300));
        req.user.profile.bio = bio;
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

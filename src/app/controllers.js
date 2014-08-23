var Post, Problem, Resource, User, mongoose, n, redis, required, routes, tags, _, _i, _len, _ref,
  __indexOf = [].indexOf || function(item) { for (var i = 0, l = this.length; i < l; i++) { if (i in this && this[i] === item) return i; } return -1; };

mongoose = require('mongoose');

_ = require('underscore');

required = require('src/lib/required');

redis = require('src/config/redis');

tags = require('src/config/tags');

Resource = mongoose.model('Resource');

Post = Resource.model('Post');

User = Resource.model('User');

Problem = Resource.model('Problem');

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
  '/problemas': {
    permissions: [required.login],
    get: function(req, res) {
      return res.render('app/main', {
        user_profile: req.user
      });
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
        if (req.user) {
          return req.user.doesFollowUser(pUser, function(err, bool) {
            return res.render('app/profile', {
              pUser: pUser,
              follows: bool
            });
          });
        } else {
          return res.render('app/open_profile', {
            pUser: pUser
          });
        }
      }));
    }
  },
  '/@:username/notas': {
    name: 'profile',
    get: function(req, res) {
      if (!req.params.username) {
        return res.render404();
      }
      return User.findOne({
        username: req.params.username
      }, req.handleErrResult(function(pUser) {
        var page;
        page = parseInt(req.params.p);
        if (isNaN(page)) {
          page = 0;
        }
        page = Math.max(Math.min(1000, page), 0);
        return Post.find({
          'author.id': pUser.id,
          parentPost: null
        }).skip(10 * page).limit(10).select('created_at updated_at content.title').exec(function(err, docs) {
          return res.render('app/open_notes', {
            pUser: pUser,
            posts: docs
          });
        });
      }));
    }
  },
  '/problems/:problemId': {
    name: 'post',
    permissions: [required.login],
    get: function(req, res) {
      var problemId;
      if (!(problemId = req.paramToObjectId('problemId'))) {
        return;
      }
      return Problem.findOne({
        _id: problemId
      }).populate(Problem.APISelect).exec(req.handleErrResult(function(doc) {
        var resourceObj;
        resourceObj = {
          data: _.extend(doc.toJSON(), {
            _meta: {}
          }),
          type: 'problem'
        };
        if (req.user) {
          return req.user.doesFollowUser(doc.author.id, function(err, val) {
            if (err) {
              console.error("PQP1", err);
            }
            resourceObj.data._meta.authorFollowed = val;
            if (doc.hasAnswered.indexOf('' + req.user.id) === -1) {
              resourceObj.data._meta.userAnswered = false;
              return res.render('app/main', {
                resource: resourceObj
              });
            } else {
              resourceObj.data._meta.userAnswered = true;
              return doc.getFilledAnswers(function(err, children) {
                if (err) {
                  console.error("PQP2", err, children);
                }
                resourceObj.children = children;
                return res.render('app/main', {
                  resource: resourceObj
                });
              });
            }
          });
        } else {
          return res.render('app/main', {
            resource: resourceObj
          });
        }
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
                resource: {
                  data: _.extend(stuffedPost, {
                    _meta: {
                      authorFollowed: val
                    }
                  }),
                  type: 'post'
                }
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
      var birthDay, birthMonth, birthYear, birthday, email, field, fields, nome, serie, sobrenome, validator, _i, _len, _ref;
      validator = require('validator');
      fields = 'nome sobrenome email school-year b-day b-month b-year'.split(' ');
      for (_i = 0, _len = fields.length; _i < _len; _i++) {
        field = fields[_i];
        if (typeof req.body[field] !== 'string') {
          return res.endJson({
            error: true,
            message: "Formulário incompleto."
          });
        }
      }
      nome = validator.trim(req.body.nome).split(' ')[0];
      sobrenome = validator.trim(req.body.sobrenome).split(' ')[0];
      email = validator.trim(req.body.email);
      serie = validator.trim(req.body['school-year']);
      birthDay = parseInt(req.body['b-day']);
      birthMonth = req.body['b-month'];
      birthYear = Math.max(Math.min(2005, parseInt(req.body['b-year'])), 1950);
      if (__indexOf.call('january february march april may june july august september october november december'.split(' '), birthMonth) < 0) {
        return res.endJson({
          error: true,
          message: "Mês de nascimento inválido."
        });
      }
      birthday = new Date(birthDay + ' ' + birthMonth + ' ' + birthYear);
      req.user.profile.birthday = birthday;
      console.log(birthday);
      req.user.name = nome + ' ' + sobrenome;
      if (validator.isEmail(email)) {
        req.user.email = email;
      }
      if ((_ref = !serie) === '6-ef' || _ref === '7-ef' || _ref === '8-ef' || _ref === '9-ef' || _ref === '1-em' || _ref === '2-em' || _ref === '3-em' || _ref === 'faculdade') {
        return res.endJson({
          error: true,
          message: 'Ano inválido.'
        });
      } else {
        req.user.profile.serie = serie;
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

_ref = ['novo', '/posts/:postId/edit', 'novo-problema', '/problems/:postId/edit'];
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

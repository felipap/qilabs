var Post, Problem, Resource, User, bunyan, mongoose, pages, required, winston, _;

mongoose = require('mongoose');

_ = require('underscore');

winston = require('winston');

bunyan = require('bunyan');

required = require('src/lib/required');

pages = require('src/core/pages');

Resource = mongoose.model('Resource');

Post = Resource.model('Post');

User = Resource.model('User');

Problem = Resource.model('Problem');

module.exports = function(app) {
  var data, n, router, tag, _fn, _i, _len, _ref, _ref1;
  router = require('express').Router();
  router.use(function(req, res, next) {
    req.logger.info("<" + (req.user && req.user.username || 'anonymous@' + req.connection.remoteAddress) + ">: HTTP " + req.method + " " + req.url);
    return next();
  });
  router.get('/', function(req, res, next) {
    return next(400);
    if (req.user) {
      if (req.session.signinUp) {
        return req.res.redirect('/signup/finish/1');
      }
      req.user.lastUpdate = new Date();
      req.user.save();
      return res.render('app/main');
    } else {
      return res.render('app/front');
    }
  });
  router.use('/signup', require('./signup.js')(app));
  _ref = pages.data;
  _fn = function(tag, data) {
    if (data.path[0] !== '/') {
      data.path = '/' + data.path;
    }
    return router.get(data.path, required.login, function(req, res) {
      data.id = tag;
      return res.render('app/community', {
        tag: data
      });
    });
  };
  for (tag in _ref) {
    data = _ref[tag];
    _fn(tag, data);
  }
  _ref1 = ['/novo', '/posts/:postId/edit', '/novo-problema', '/problems/:postId/edit'];
  for (_i = 0, _len = _ref1.length; _i < _len; _i++) {
    n = _ref1[_i];
    router.get(n, required.login, function(req, res, next) {
      return res.render('app/main');
    });
  }
  router.get('/entrar', function(req, res) {
    return res.redirect('/api/auth/facebook');
  });
  router.get('/settings', required.login, function(req, res) {
    return res.render('app/settings');
  });
  router.get('/sobre', function(req, res) {
    return res.render('about/main');
  });
  router.get('/faq', function(req, res) {
    return res.render('about/faq');
  });
  router.get('/blog', function(req, res) {
    return res.redirect('http://blog.qilabs.org');
  });
  router.param('username', function(req, res, next, username) {
    return User.findOne({
      username: username
    }, req.handleErrResult(function(user) {
      req.requestedUser = user;
      return next();
    }));
  });
  router.get('/@:username', function(req, res) {
    if (req.user) {
      return req.user.doesFollowUser(req.requestedUser, function(err, bool) {
        return res.render('app/profile', {
          pUser: req.requestedUser,
          follows: bool
        });
      });
    } else {
      return res.render('app/open_profile', {
        pUser: req.requestedUser
      });
    }
  });
  router.get('/@:username/notas', function(req, res) {
    var page;
    page = parseInt(req.params.p);
    if (isNaN(page)) {
      page = 0;
    }
    page = Math.max(Math.min(1000, page), 0);
    return Post.find({
      'author.id': req.requestedUser.id,
      parent: null
    }).skip(10 * page).limit(10).select('created_at updated_at content.title').exec(function(err, docs) {
      return res.render('app/open_notes', {
        pUser: pUser,
        posts: docs
      });
    });
  });
  router.get('/problems/:problemId', required.login, function(req, res) {
    var problemId;
    if (!(problemId = req.paramToObjectId('problemId'))) {
      return;
    }
    return Problem.findOne({
      _id: problemId
    }).exec(req.handleErrResult(function(doc) {
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
  });
  router.get('/posts/:postId', function(req, res) {
    var postId;
    if (!(postId = req.paramToObjectId('postId'))) {
      return;
    }
    return Post.findOne({
      _id: postId
    }).exec(req.handleErrResult(function(post) {
      if (post.parent) {
        return res.render404();
      }
      if (req.user) {
        return post.stuff(req.handleErrResult(function(stuffedPost) {
          console.log('stuff', stuffedPost.author.id);
          return req.user.doesFollowUser(stuffedPost.author.id, req.handleErrValue(function(val) {
            console.log('follows', val);
            return res.render('app/main', {
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
  });
  return router;
};

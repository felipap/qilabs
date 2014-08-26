var BODY_MAX, BODY_MIN, COMMENT_MAX, COMMENT_MIN, Notification, Post, PostCommentRules, PostRules, Resource, TITLE_MAX, TITLE_MIN, User, createPost, dryText, jobs, mongoose, nestify, pages, please, postToParentPost, pureText, required, sanitizeBody, unupvotePost, upvotePost, val, _,
  __indexOf = [].indexOf || function(item) { for (var i = 0, l = this.length; i < l; i++) { if (i in this && this[i] === item) return i; } return -1; };

mongoose = require('mongoose');

required = require('src/lib/required.js');

_ = require('underscore');

please = require('src/lib/please.js');

please.args.extend(require('src/models/lib/pleaseModels.js'));

jobs = require('src/config/kue.js');

Resource = mongoose.model('Resource');

User = Resource.model('User');

Post = Resource.model('Post');

Notification = Resource.model('Notification');


/*
Create a post object with type comment.
 */

postToParentPost = function(self, parent, data, cb) {
  var comment;
  please.args({
    $isModel: User
  }, {
    $isModel: Post
  }, {
    $contains: ['content', 'type']
  }, '$isCb');
  comment = new Post({
    author: User.toAuthorObject(self),
    content: {
      body: data.content.body
    },
    parent: parent,
    type: data.type
  });
  return comment.save(function(err, doc) {
    if (err) {
      return cb(err);
    }
    cb(null, doc);
    return Notification.Trigger(self, Notification.Types.PostComment)(comment, parent, function() {});
  });
};

createPost = function(self, data, cb) {
  var post;
  please.args({
    $isModel: User
  }, {
    $contains: ['content', 'type', 'subject']
  }, '$isCb');
  post = new Post({
    author: User.toAuthorObject(self),
    content: {
      title: data.content.title,
      body: data.content.body
    },
    type: data.type,
    subject: data.subject,
    tags: data.tags
  });
  return post.save((function(_this) {
    return function(err, post) {
      console.log('post save:', err, post);
      cb(err, post);
      if (err) {
        return;
      }
      return self.update({
        $inc: {
          'stats.posts': 1
        }
      }, function() {});
    };
  })(this));
};

upvotePost = function(self, res, cb) {
  var done;
  please.args({
    $isModel: User
  }, {
    $isModel: Post
  }, '$isCb');
  if ('' + res.author.id === '' + self.id) {
    cb();
    return;
  }
  done = function(err, docs) {
    console.log(err, docs);
    cb(err, docs);
    if (!err) {
      return jobs.create('post upvote', {
        title: "New upvote: " + self.name + " → " + res.id,
        authorId: res.author.id,
        resource: res,
        agent: self
      }).save();
    }
  };
  return Post.findOneAndUpdate({
    _id: '' + res.id
  }, {
    $push: {
      votes: self._id
    }
  }, done);
};

unupvotePost = function(self, res, cb) {
  var done;
  please.args({
    $isModel: User
  }, {
    $isModel: Post
  }, '$isCb');
  if ('' + res.author.id === '' + self.id) {
    cb();
    return;
  }
  done = function(err, docs) {
    console.log(err, docs);
    cb(err, docs);
    if (!err) {
      return jobs.create('post unupvote', {
        title: "New unupvote: " + self.name + " → " + res.id,
        authorId: res.author.id,
        resource: res,
        agent: self
      }).save();
    }
  };
  return Post.findOneAndUpdate({
    _id: '' + res.id
  }, {
    $pull: {
      votes: self._id
    }
  }, done);
};

sanitizeBody = function(body, type) {
  var DefaultSanitizerOpts, getSanitizerOptions, sanitizer, str;
  sanitizer = require('sanitize-html');
  DefaultSanitizerOpts = {
    allowedTags: ['h1', 'h2', 'b', 'em', 'strong', 'a', 'img', 'u', 'ul', 'li', 'blockquote', 'p', 'br', 'i'],
    allowedAttributes: {
      'a': ['href'],
      'img': ['src']
    },
    selfClosing: ['img', 'br'],
    transformTags: {
      'b': 'strong',
      'i': 'em'
    },
    exclusiveFilter: function(frame) {
      var _ref;
      return ((_ref = frame.tag) === 'a' || _ref === 'span') && !frame.text.trim();
    }
  };
  getSanitizerOptions = function(type) {
    switch (type) {
      case Post.Types.Discussion:
        return _.extend({}, DefaultSanitizerOpts, {
          allowedTags: ['b', 'em', 'strong', 'a', 'u', 'ul', 'blockquote', 'p', 'img', 'br', 'i', 'li']
        });
      default:
        return DefaultSanitizerOpts;
    }
    return DefaultSanitizerOpts;
  };
  str = sanitizer(body, getSanitizerOptions(type));
  str = str.replace(new RegExp("(<br \/>){2,}", "gi"), "<br />").replace(/<p>(<br \/>)?<\/p>/gi, '').replace(/<br \/><\/p>/gi, '</p>');
  console.log(body, str);
  return str;
};

dryText = function(str) {
  return str.replace(/(\s{1})[\s]*/gi, '$1');
};

pureText = function(str) {
  return str.replace(/(<([^>]+)>)/ig, "");
};

pages = require('src/config/pages.js').data;

TITLE_MIN = 10;

TITLE_MAX = 100;

BODY_MIN = 20;

BODY_MAX = 20 * 1000;

COMMENT_MIN = 3;

COMMENT_MAX = 1000;

val = require('validator');

PostRules = {
  subject: {
    $valid: function(str) {
      return __indexOf.call(_.keys(pages), str) >= 0;
    }
  },
  tags: {
    $required: false
  },
  type: {
    $valid: function(str) {
      var _ref;
      return (_ref = str.toLowerCase()) === 'note' || _ref === 'discussion';
    },
    $clean: function(str) {
      str = val.stripLow(val.trim(str));
      return str[0].toUpperCase() + str.slice(1).toLowerCase();
    }
  },
  content: {
    title: {
      $valid: function(str) {
        return val.isLength(str, TITLE_MIN, TITLE_MAX);
      },
      $clean: function(str) {
        return val.stripLow(dryText(str));
      }
    },
    body: {
      $valid: function(str) {
        return val.isLength(pureText(str), BODY_MIN) && val.isLength(str, 0, BODY_MAX);
      },
      $clean: function(str, body) {
        return val.stripLow(dryText(str));
      }
    }
  }
};

PostCommentRules = {
  content: {
    body: {
      $valid: function(str) {
        return val.isLength(str, COMMENT_MIN, COMMENT_MAX);
      },
      $clean: function(str) {
        return _.escape(dryText(val.trim(str)));
      }
    }
  }
};

nestify = function(obj) {
  var attr, expectArray, path, router, _i, _len, _ref, _ref1;
  router = require('express').Router({
    mergeParams: true
  });
  expectArray = function(obj) {
    if (obj instanceof Array) {
      return obj;
    }
    return [obj];
  };
  _ref = ['get', 'post', 'put', 'delete'];
  for (_i = 0, _len = _ref.length; _i < _len; _i++) {
    attr = _ref[_i];
    if (attr in obj) {
      console.log(attr);
      router[attr].apply(router, ['/'].concat(expectArray(obj[attr])));
    }
  }
  if ('children' in obj) {
    _ref1 = obj.children;
    for (path in _ref1) {
      val = _ref1[path];
      router.use(path, nestify(val));
    }
  }
  return router;
};

module.exports = function(app) {
  var express, router;
  express = require("express");
  router = express.Router();
  router.use(required.login);
  router.post('/', function(req, res) {
    return req.parse(PostRules, function(err, reqBody) {
      var body, tag, tags, _i, _len, _ref, _ref1, _ref2;
      body = sanitizeBody(reqBody.content.body, reqBody.type);
      console.log(reqBody.subject);
      if (reqBody.subject && ((_ref = pages[reqBody.subject]) != null ? (_ref1 = _ref.children) != null ? _ref1.length : void 0 : void 0)) {
        _ref2 = reqBody.tags;
        for (_i = 0, _len = _ref2.length; _i < _len; _i++) {
          tag = _ref2[_i];
          if (__indexOf.call(pages[reqBody.subject].children, tag) >= 0) {
            tags = tag;
          }
        }
      }
      return createPost(req.user, {
        type: reqBody.type,
        subject: reqBody.subject,
        tags: tags,
        content: {
          title: reqBody.content.title,
          body: body
        }
      }, req.handleErrResult(function(doc) {
        return res.endJson(doc);
      }));
    });
  });
  router.param('postId', function(req, res, next, postId) {
    var e, id;
    try {
      id = mongoose.Types.ObjectId.createFromHexString(postId);
    } catch (_error) {
      e = _error;
      return next({
        type: "InvalidId",
        args: 'postId',
        value: postId
      });
    }
    return Post.findOne({
      _id: postId
    }, req.handleErrResult(function(post) {
      req.post = post;
      return next();
    }));
  });
  router.route('/:postId').get(function(req, res) {
    var post;
    post = req.post;
    return post.stuff(req.handleErrResult(function(stuffedPost) {
      if (req.user) {
        return req.user.doesFollowUser(post.author.id, function(err, val) {
          return res.endJson({
            data: _.extend(stuffedPost, {
              _meta: {
                authorFollowed: val
              }
            })
          });
        });
      } else {
        return res.endJson({
          data: _.extend(stuffedPost, {
            _meta: null
          })
        });
      }
    }));
  }).put(required.posts.selfOwns('postId'), function(req, res) {
    var post;
    post = req.post;
    if (post.type === 'Comment') {
      return res.status(403).endJson({
        error: true,
        msg: ''
      });
    }
    if (post.parent) {
      return req.parse(PostChildRules, function(err, reqBody) {
        post.content.body = sanitizeBody(reqBody.content.body, post.type);
        post.updated_at = Date.now();
        return post.save(req.handleErrResult(function(me) {
          return post.stuff(req.handleErrResult(function(stuffedPost) {
            return res.endJson(stuffedPost);
          }));
        }));
      });
    } else {
      return req.parse(PostRules, function(err, reqBody) {
        var tag;
        post.content.body = sanitizeBody(reqBody.content.body, post.type);
        post.content.title = reqBody.content.title;
        post.updated_at = Date.now();
        if (post.subject) {
          post.tags = (function() {
            var _i, _len, _ref, _results;
            _ref = reqBody.tags;
            _results = [];
            for (_i = 0, _len = _ref.length; _i < _len; _i++) {
              tag = _ref[_i];
              if (__indexOf.call(pages[post.subject].children, tag) >= 0) {
                _results.push(tag);
              }
            }
            return _results;
          })();
        }
        return post.save(req.handleErrResult(function(me) {
          return post.stuff(req.handleErrResult(function(stuffedPost) {
            return res.endJson(stuffedPost);
          }));
        }));
      });
    }
  })["delete"](required.posts.selfOwns('postId'), function(req, res) {
    var doc;
    doc = req.post;
    return doc.remove(function(err) {
      if (err) {
        console.log('err', err);
      }
      return res.endJson(doc, {
        error: err
      });
    });
  });
  router.route(':postId/upvote').post(required.posts.selfDoesntOwn('id'), function(req, res) {
    var post;
    post = req.post;
    return upvotePost(req.user, post, function(err, doc) {
      return res.endJson({
        error: err,
        data: doc
      });
    });
  });
  router.route(':postId/unupvote').post(required.posts.selfDoesntOwn('id'), function(req, res) {
    var post;
    post = req.post;
    return unupvotePost(req.user, post, function(err, doc) {
      return res.endJson({
        error: err,
        data: doc
      });
    });
  });
  router.route('/:postId/comments').get(function(req, res) {
    var post;
    post = req.post;
    return post.getComments(req.handleErrResult((function(_this) {
      return function(comments) {
        return res.endJson({
          data: comments,
          error: false,
          page: -1
        });
      };
    })(this)));
  }).post(function(req, res) {
    return req.parse(PostCommentRules, function(err, body) {
      var data, parent;
      data = {
        content: {
          body: body.content.body
        },
        type: Post.Types.Comment
      };
      parent = req.post;
      return postToParentPost(req.user, parent, data, req.handleErrResult((function(_this) {
        return function(doc) {
          return res.endJson({
            error: false,
            data: doc
          });
        };
      })(this)));
    });
  });
  return router;
};

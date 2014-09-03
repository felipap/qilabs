var BODY_MAX, BODY_MIN, COMMENT_MAX, COMMENT_MIN, Comment, CommentTree, Notification, ObjectId, Post, PostCommentRules, PostRules, Resource, TITLE_MAX, TITLE_MIN, User, commentToPost, createPost, dryText, jobs, logger, mongoose, pages, please, pureText, required, sanitizeBody, unupvoteComment, unupvotePost, upvoteComment, upvotePost, val, _,
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

Comment = Resource.model('Comment');

CommentTree = Resource.model('CommentTree');

Notification = Resource.model('Notification');

logger = null;

ObjectId = mongoose.Types.ObjectId;


/*
Create a post object with type comment.
 */

commentToPost = function(me, parent, data, cb) {
  var comment, tree;
  please.args({
    $isModel: User
  }, {
    $isModel: Post
  }, {
    $contains: ['content']
  }, '$isCb');
  if (!parent.comment_tree) {
    logger.debug('Creating comment_tree for post %s', parent._id);
    tree = new CommentTree({
      parent: parent._id
    });
    tree.save(function(err, tree) {
      if (err) {
        logger.error(err, 'Failed to save comment_tree (for post %s)', parent._id);
        return cb(err);
      }
      return parent.update({
        comment_tree: tree._id
      }, function(err, updated) {
        if (err) {
          logger.error(err, 'Failed to update post %s with comment_tree attr', parent._id);
          return cb(err);
        }
        parent.comment_tree = tree._id;
        return commentToPost(me, parent, data, cb);
      });
    });
    return;
  }
  logger.debug('commentToPost(id=%s) with comment_tree(id=%s)', parent._id, parent.comment_tree);
  comment = {
    author: User.toAuthorObject(me),
    content: {
      body: data.content.body
    },
    replies_to: null,
    replies_users: null,
    parent: null
  };
  return CommentTree.findOneAndUpdate({
    _id: parent.comment_tree
  }, {
    $push: {
      docs: comment
    }
  }, function(err, doc) {
    if (err) {
      logger.error(err, 'Failed to push comment to CommentTree');
      return cb(err);
    }
    if (!doc) {
      logger.error('CommentTree %s of parent %s not found. Failed to push comment.', parent.comment_tree, parent._id);
      return cb(true);
    }
    return cb(null, doc);
  });
};

upvoteComment = function(me, res, cb) {
  var done;
  please.args({
    $isModel: User
  }, {
    $isModel: Comment
  }, '$isCb');
  done = function(err, docs) {
    return cb(err, docs);
  };
  return Comment.findOneAndUpdate({
    _id: '' + res.id
  }, {
    $push: {
      votes: me._id
    }
  }, done);
};

unupvoteComment = function(me, res, cb) {
  var done;
  please.args({
    $isModel: User
  }, {
    $isModel: Comment
  }, '$isCb');
  done = function(err, docs) {
    return cb(err, docs);
  };
  return Comment.findOneAndUpdate({
    _id: '' + res.id
  }, {
    $pull: {
      votes: me._id
    }
  }, done);
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
    cb(err, docs);
    if (!err && jobs) {
      return jobs.create('post upvote', {
        title: "New upvote: " + self.name + " → " + res.id,
        authorId: res.author.id,
        post: res,
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
    cb(err, docs);
    if (!err && jobs) {
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
  return str;
};

dryText = function(str) {
  return str.replace(/(\s{1})[\s]*/gi, '$1');
};

pureText = function(str) {
  return str.replace(/(<([^>]+)>)/ig, "");
};

pages = require('src/core/pages.js').data;

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

module.exports = function(app) {
  var router;
  router = require("express").Router();
  logger = app.get('logger').child({
    child: 'API',
    dir: 'posts'
  });
  router.use(required.login);
  router.post('/', function(req, res) {
    return req.parse(PostRules, function(err, reqBody) {
      var body, tag, tags, _i, _len, _ref, _ref1, _ref2;
      body = sanitizeBody(reqBody.content.body, reqBody.type);
      req.logger.error(reqBody.subject);
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
        return res.endJSON(doc);
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
          return res.endJSON({
            data: _.extend(stuffedPost, {
              _meta: {
                authorFollowed: val
              }
            })
          });
        });
      } else {
        return res.endJSON({
          data: _.extend(stuffedPost, {
            _meta: null
          })
        });
      }
    }));
  }).put(required.resources.selfOwns('postId'), function(req, res) {
    var post;
    post = req.post;
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
          return res.endJSON(stuffedPost);
        }));
      }));
    });
  })["delete"](required.resources.selfOwns('postId'), function(req, res) {
    var doc;
    doc = req.post;
    return doc.remove(function(err) {
      if (err) {
        req.logger.error('err', err);
      }
      return res.endJSON(doc, {
        error: err
      });
    });
  });
  router.route('/:postId/upvote').post(required.resources.selfDoesntOwn('postId'), function(req, res) {
    return upvotePost(req.user, req.post, function(err, doc) {
      return res.endJSON({
        error: err,
        data: doc
      });
    });
  });
  router.route('/:postId/unupvote').post(required.resources.selfDoesntOwn('postId'), function(req, res) {
    return unupvotePost(req.user, req.post, function(err, doc) {
      return res.endJSON({
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
        return res.endJSON({
          data: comments,
          error: false,
          page: -1
        });
      };
    })(this)));
  }).post(function(req, res, next) {
    return req.parse(PostCommentRules, function(err, body) {
      return commentToPost(req.user, req.post, {
        content: {
          body: body.content.body
        }
      }, (function(_this) {
        return function(err, doc) {
          if (err) {
            return next(err);
          } else {
            return res.endJSON({
              error: false,
              data: doc
            });
          }
        };
      })(this));
    });
  });
  router.param('commentId', function(req, res, next, commentId) {
    var e, id;
    try {
      id = mongoose.Types.ObjectId.createFromHexString(commentId);
    } catch (_error) {
      e = _error;
      return next({
        type: "InvalidId",
        args: 'commentId',
        value: commentId
      });
    }
    return Comment.findOne({
      _id: commentId,
      parent: req.post
    }, req.handleErrResult(function(comment) {
      req.comment = comment;
      return next();
    }));
  });
  router.route('/:postId/:commentId').get(function(req, res) {
    return 0;
  })["delete"](required.resources.selfOwns('commentId'), function(req, res) {
    var doc;
    doc = req.comment;
    return doc.remove(function(err) {
      if (err) {
        req.logger.error('err', err);
      }
      return res.endJSON(doc, {
        error: err
      });
    });
  }).put(required.resources.selfOwns('commentId'), function(req, res) {
    var comment;
    comment = req.comment;
    return req.parse(PostChildRules, function(err, reqBody) {
      comment.content.body = sanitizeBody(reqBody.content.body, 'Comment');
      comment.meta.updated_at = Date.now();
      return comment.save(req.handleErrResult(function(me) {
        return res.endJSON(comment.toJSON());
      }));
    });
  });
  router.post('/:postId/:commentId/upvote', required.resources.selfDoesntOwn('commentId'), function(req, res) {
    return upvoteComment(req.user, req.comment, function(err, doc) {
      return res.endJSON({
        error: err,
        data: doc
      });
    });
  });
  router.post('/:postId/:commentId/unupvote', required.resources.selfDoesntOwn('commentId'), function(req, res) {
    return unupvoteComment(req.user, req.comment, function(err, doc) {
      return res.endJSON({
        error: err,
        data: doc
      });
    });
  });
  return router;
};

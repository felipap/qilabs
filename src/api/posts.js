var BODY_MAX, BODY_MIN, COMMENT_MAX, COMMENT_MIN, Post, PostAnswerRules, PostCommentRules, PostRules, Resource, TITLE_MAX, TITLE_MIN, User, dryText, mongoose, pureText, required, sanitizeBody, tagMap, val, _,
  __indexOf = [].indexOf || function(item) { for (var i = 0, l = this.length; i < l; i++) { if (i in this && this[i] === item) return i; } return -1; };

mongoose = require('mongoose');

required = require('src/lib/required.js');

_ = require('underscore');

Resource = mongoose.model('Resource');

User = Resource.model('User');

Post = Resource.model('Post');

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
      case Post.Types.Answer:
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

tagMap = require('src/config/tags.js').data;

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
      return str === 'application' || str === 'mathematics';
    }
  },
  tags: {
    $required: false,
    $clean: function(tags) {
      var tag, _i, _len, _results;
      _results = [];
      for (_i = 0, _len = tags.length; _i < _len; _i++) {
        tag = tags[_i];
        if (__indexOf.call(_.keys(tagMap), tag) >= 0) {
          _results.push(tag);
        }
      }
      return _results;
    }
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

PostAnswerRules = {
  content: {
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
        return _.escape(dry(val.trim(str)));
      }
    }
  }
};

module.exports = {
  permissions: [required.login],
  post: function(req, res) {
    return req.parse(PostRules, function(err, reqBody) {
      var body;
      body = sanitizeBody(reqBody.content.body, reqBody.type);
      return req.user.createPost({
        type: reqBody.type,
        tags: reqBody.tags,
        content: {
          title: reqBody.content.title,
          body: body
        }
      }, req.handleErrResult(function(doc) {
        return res.endJson(doc);
      }));
    });
  },
  children: {
    '/:id': {
      get: function(req, res) {
        var postId;
        if (!(postId = req.paramToObjectId('id'))) {
          return;
        }
        return Post.findOne({
          _id: postId
        }, req.handleErrResult(function(post) {
          return post.stuff(req.handleErrResult(function(stuffedPost) {
            if (req.user) {
              return req.user.doesFollowUser(stuffedPost.author.id, function(err, val) {
                return res.endJson({
                  data: _.extend(stuffedPost, {
                    meta: {
                      followed: val
                    }
                  })
                });
              });
            } else {
              return res.endJson({
                data: _.extend(stuffedPost, {
                  meta: null
                })
              });
            }
          }));
        }));
      },
      put: [
        required.posts.selfOwns('id'), function(req, res) {
          var postId;
          if (!(postId = req.paramToObjectId('id'))) {
            return;
          }
          return Post.findById(postId, req.handleErrResult((function(_this) {
            return function(post) {
              if (post.type === 'Comment') {
                return res.status(403).endJson({
                  error: true,
                  msg: ''
                });
              }
              if (post.parentPost) {
                return req.parse(PostChildRules, function(err, reqBody) {
                  post.content.body = sanitizeBody(reqBody.content.body, post.type);
                  post.updated = Date.now();
                  return post.save(req.handleErrResult(function(me) {
                    return post.stuff(req.handleErrResult(function(stuffedPost) {
                      return res.endJson(stuffedPost);
                    }));
                  }));
                });
              } else {
                return req.parse(PostRules, function(err, reqBody) {
                  post.content.body = sanitizeBody(reqBody.content.body, post.type);
                  post.content.title = reqBody.content.title;
                  post.updated = Date.now();
                  post.tags = reqBody.tags;
                  return post.save(req.handleErrResult(function(me) {
                    return post.stuff(req.handleErrResult(function(stuffedPost) {
                      return res.endJson(stuffedPost);
                    }));
                  }));
                });
              }
            };
          })(this)));
        }
      ],
      "delete": [
        required.posts.selfOwns('id'), function(req, res) {
          var postId;
          if (!(postId = req.paramToObjectId('id'))) {
            return;
          }
          return Post.findOne({
            _id: postId,
            'author.id': req.user.id
          }, req.handleErrResult(function(doc) {
            return doc.remove(function(err) {
              if (err) {
                console.log('err', err);
              }
              return res.endJson(doc, {
                error: err
              });
            });
          }));
        }
      ],
      children: {
        '/upvote': {
          post: [
            required.posts.selfDoesntOwn('id'), function(req, res) {
              var postId;
              if (!(postId = req.paramToObjectId('id'))) {
                return;
              }
              return Post.findById(postId, req.handleErrResult((function(_this) {
                return function(post) {
                  return req.user.upvotePost(post, function(err, doc) {
                    return res.endJson({
                      error: err,
                      data: doc
                    });
                  });
                };
              })(this)));
            }
          ]
        },
        '/unupvote': {
          post: [
            required.posts.selfDoesntOwn('id'), function(req, res) {
              var postId;
              if (!(postId = req.paramToObjectId('id'))) {
                return;
              }
              return Post.findById(postId, req.handleErrResult((function(_this) {
                return function(post) {
                  return req.user.unupvotePost(post, function(err, doc) {
                    return res.endJson({
                      error: err,
                      data: doc
                    });
                  });
                };
              })(this)));
            }
          ]
        },
        '/comments': {
          get: function(req, res) {
            var postId;
            if (!(postId = req.paramToObjectId('id'))) {
              return;
            }
            return Post.findById(postId).exec(req.handleErrResult(function(post) {
              return post.getComments(req.handleErrResult((function(_this) {
                return function(comments) {
                  return res.endJson({
                    data: comments,
                    error: false,
                    page: -1
                  });
                };
              })(this)));
            }));
          },
          post: [
            function(req, res) {
              var postId;
              if (!(postId = req.paramToObjectId('id'))) {
                return;
              }
              return req.parse(PostCommentRules, function(err, body) {
                var data;
                data = {
                  content: {
                    body: body.content.body
                  },
                  type: Post.Types.Comment
                };
                return Post.findById(postId, req.handleErrResult((function(_this) {
                  return function(parentPost) {
                    return req.user.postToParentPost(parentPost, data, req.handleErrResult(function(doc) {
                      return res.endJson({
                        error: false,
                        data: doc
                      });
                    }));
                  };
                })(this)));
              });
            }
          ]
        }
      }
    }
  }
};

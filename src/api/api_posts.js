var Post, Resource, User, checks, defaultSanitizerOptions, mongoose, required, sanitizeBody, _,
  __indexOf = [].indexOf || function(item) { for (var i = 0, l = this.length; i < l; i++) { if (i in this && this[i] === item) return i; } return -1; };

mongoose = require('mongoose');

required = require('src/lib/required.js');

Resource = mongoose.model('Resource');

_ = require('underscore');

User = Resource.model('User');

Post = Resource.model('Post');

defaultSanitizerOptions = {
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

sanitizeBody = function(body, type) {
  var getSanitizerOptions, sanitizer, str;
  sanitizer = require('sanitize-html');
  getSanitizerOptions = function(type) {
    switch (type) {
      case Post.Types.Question:
        return _.extend({}, defaultSanitizerOptions, {
          allowedTags: ['b', 'em', 'strong', 'a', 'u', 'ul', 'blockquote', 'p', 'img', 'br', 'i', 'li']
        });
      case Post.Types.Tip:
        return defaultSanitizerOptions;
      case Post.Types.Experience:
        return defaultSanitizerOptions;
      case Post.Types.Answer:
        return _.extend({}, defaultSanitizerOptions, {
          allowedTags: ['b', 'em', 'strong', 'a', 'u', 'ul', 'blockquote', 'p', 'img', 'br', 'i', 'li']
        });
    }
    return defaultSanitizerOptions;
  };
  str = sanitizer(body, getSanitizerOptions(type));
  return str.replace(/(<br \/>){2,}/gi, '<br />').replace(/<p>(<br \/>)?<\/p>/gi, '').replace(/<br \/><\/p>/gi, '</p>');
};

checks = {
  contentExists: function(content, res) {
    if (!content) {
      res.status(500).endJson({
        error: true,
        message: 'Ops.'
      });
      return null;
    }
    return content;
  },
  tags: function(_tags, res) {
    var tag, tags;
    if (!_tags || !_tags instanceof Array) {
      res.status(400).endJson({
        error: true,
        message: 'Selecione pelo menos um assunto relacionado a esse post.'
      });
      return null;
    }
    tags = (function() {
      var _i, _len, _results;
      _results = [];
      for (_i = 0, _len = _tags.length; _i < _len; _i++) {
        tag = _tags[_i];
        if (__indexOf.call(_.keys(res.app.locals.getTagMap()), tag) >= 0) {
          _results.push(tag);
        }
      }
      return _results;
    })();
    if (tags.length === 0) {
      res.status(400).endJson({
        error: true,
        message: 'Selecione pelo menos um assunto relacionado a esse post.'
      });
      return null;
    }
    return tags;
  },
  title: function(title, res) {
    if (!title || !title.length) {
      res.status(400).endJson({
        error: true,
        message: 'Erro! Não recebemos o título da sua publicação.'
      });
      return null;
    }
    if (title.length < 10) {
      res.status(400).endJson({
        error: true,
        message: 'Hm... Esse título é muito pequeno. Escreva um com no mínimo 10 caracteres, ok?'
      });
      return null;
    }
    if (title.length > 100) {
      res.status(400).endJson({
        error: true,
        message: 'Hmm... esse título é muito grande. Escreva um com até 100 caracteres.'
      });
      return null;
    }
    title = title.replace('\n', '');
    return title;
  },
  body: function(body, res, max_length, min_length) {
    var plainText;
    if (max_length == null) {
      max_length = 20 * 1000;
    }
    if (min_length == null) {
      min_length = 20;
    }
    if (!body) {
      res.status(400).endJson({
        error: true,
        message: 'Escreva um corpo para a sua publicação.'
      });
      return null;
    }
    if (body.length > max_length) {
      res.status(400).endJson({
        error: true,
        message: 'Ops. Texto muito grande.'
      });
      return null;
    }
    plainText = body.replace(/(<([^>]+)>)/ig, "");
    if (plainText.length < min_length) {
      res.status(400).endJson({
        error: true,
        message: 'Ops. Texto muito pequeno.'
      });
      return null;
    }
    return body;
  },
  type: function(type, res) {
    var _ref;
    if (_ref = !type.toLowerCase(), __indexOf.call(_.keys(res.app.locals.postTypes), _ref) >= 0) {
      return res.status(400).endJson({
        error: true,
        msg: 'Tipo de publicação inválido.'
      });
    }
    return type[0].toUpperCase() + type.slice(1).toLowerCase();
  }
};

module.exports = {
  permissions: [required.login],
  post: function(req, res) {
    var body, content, data, tags, title, type, _body;
    data = req.body;
    if (!(content = checks.contentExists(req.body.content, res))) {
      return;
    }
    if (!(type = checks.type(req.body.type, res))) {
      return;
    }
    if (!(title = checks.title(content.title, res))) {
      return;
    }
    if (!(tags = checks.tags(req.body.tags, res))) {
      return;
    }
    if (!(_body = checks.body(content.body, res))) {
      return;
    }
    body = sanitizeBody(_body, type);
    return req.user.createPost({
      type: type,
      tags: tags,
      content: {
        title: title,
        body: body
      }
    }, req.handleErrResult(function(doc) {
      return doc.populate('author', function(err, doc) {
        return res.endJson(doc);
      });
    }));
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
              var content, _body;
              if (!(content = checks.contentExists(req.body.content, res))) {
                return;
              }
              if (post.parentPost) {
                if (post.type === 'Answer') {
                  if (!(_body = checks.body(content.body, res))) {
                    return;
                  }
                  post.content.body = sanitizeBody(_body, post.type);
                } else {
                  return res.endJson({
                    error: true,
                    msg: ''
                  });
                }
              } else {
                if (!(content.title = checks.title(content.title, res))) {
                  return;
                }
                if (!(post.tags = checks.tags(req.body.tags, res))) {
                  return;
                }
                if (!(_body = checks.body(content.body, res))) {
                  return;
                }
                content.body = sanitizeBody(_body, post.type);
              }
              _.extend(post.content, content);
              post.updated = Date.now();
              return post.save(req.handleErrResult(function(me) {
                return post.stuff(req.handleErrResult(function(stuffedPost) {
                  return res.endJson(stuffedPost);
                }));
              }));
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
            author: req.user
          }, req.handleErrResult(function(doc) {
            var _ref;
            if ((_ref = doc.type) !== 'Answer' && _ref !== 'Comment') {
              req.user.update({
                $inc: {
                  'stats.posts': -1
                }
              }, function() {
                return console.log(arguments);
              });
            }
            doc.remove();
            return res.endJson(doc);
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
          get: [
            required.posts.selfCanSee('id'), function(req, res) {
              var postId;
              if (!(postId = req.paramToObjectId('id'))) {
                return;
              }
              return Post.findById(postId).populate('author').exec(req.handleErrResult(function(post) {
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
            }
          ],
          post: [
            required.posts.selfCanComment('id'), function(req, res) {
              var data, htmlEntities, postId;
              if (!(postId = req.paramToObjectId('id'))) {
                return;
              }
              htmlEntities = function(str) {
                return String(str).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
              };
              if (req.body.content.body.length > 1000) {
                return res.status(400).endJson({
                  error: true,
                  message: 'Esse comentário é muito grande.'
                });
              }
              if (req.body.content.body.length < 3) {
                return res.status(400).endJson({
                  error: true,
                  message: 'Esse comentário é muito pequeno.'
                });
              }
              data = {
                content: {
                  body: htmlEntities(req.body.content.body)
                },
                type: Post.Types.Comment
              };
              return Post.findById(postId, req.handleErrResult((function(_this) {
                return function(parentPost) {
                  return req.user.postToParentPost(parentPost, data, req.handleErrResult(function(doc) {
                    return doc.populate('author', req.handleErrResult(function(doc) {
                      return res.endJson({
                        error: false,
                        data: doc
                      });
                    }));
                  }));
                };
              })(this)));
            }
          ]
        },
        '/answers': {
          post: [
            required.posts.selfCanComment('id'), function(req, res) {
              var postId;
              if (!(postId = req.paramToObjectId('id'))) {
                return;
              }
              return Post.findById(postId, req.handleErrResult((function(_this) {
                return function(parentPost) {
                  var content, data, postBody, _body;
                  if (!(content = checks.contentExists(req.body.content, res))) {
                    return;
                  }
                  if (!(_body = checks.body(content.body, res))) {
                    return;
                  }
                  postBody = sanitizeBody(_body, Post.Types.Answer);
                  data = {
                    content: {
                      body: postBody
                    },
                    type: Post.Types.Answer
                  };
                  console.log('final data:', data);
                  return req.user.postToParentPost(parentPost, data, req.handleErrResult(function(doc) {
                    return doc.populate('author', req.handleErrResult(function(doc) {
                      return res.endJson(doc);
                    }));
                  }));
                };
              })(this)));
            }
          ]
        }
      }
    }
  }
};

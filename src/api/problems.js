var BODY_MAX, BODY_MIN, COMMENT_MAX, COMMENT_MIN, Post, Problem, ProblemRules, Resource, TITLE_MAX, TITLE_MIN, User, defaultSanitizerOptions, dryText, mongoose, pureText, required, sanitizeBody, tagMap, val, _,
  __indexOf = [].indexOf || function(item) { for (var i = 0, l = this.length; i < l; i++) { if (i in this && this[i] === item) return i; } return -1; };

mongoose = require('mongoose');

required = require('src/lib/required.js');

Resource = mongoose.model('Resource');

_ = require('underscore');

User = Resource.model('User');

Post = Resource.model('Post');

Problem = Resource.model('Problem');

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
      case Post.Types.Answer:
        return _.extend({}, defaultSanitizerOptions, {
          allowedTags: ['b', 'em', 'strong', 'a', 'u', 'ul', 'blockquote', 'p', 'img', 'br', 'i', 'li']
        });
      default:
        return defaultSanitizerOptions;
    }
    return defaultSanitizerOptions;
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

ProblemRules = {
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
      $clean: function(str) {
        return val.stripLow(dryText(str));
      }
    },
    answer: {
      options: {
        $valid: function(array) {
          var e, _i, _len;
          if (array instanceof Array && array.length === 5) {
            for (_i = 0, _len = array.length; _i < _len; _i++) {
              e = array[_i];
              if (e.length >= 40) {
                false;
              }
            }
            true;
          }
          return false;
        }
      },
      is_mc: {
        $valid: function(str) {
          return true;
        }
      }
    }
  }
};

module.exports = {
  permissions: [required.login],
  post: function(req, res) {
    return req.parse(ProblemRules, function(err, reqBody) {
      var body;
      body = sanitizeBody(reqBody.content.body);
      console.log(reqBody, reqBody.content.answer);
      return req.user.createProblem({
        subject: 'mathematics',
        topics: ['combinatorics'],
        content: {
          title: reqBody.content.title,
          body: body,
          source: reqBody.content.source,
          answer: {
            is_mc: true,
            options: reqBody.content.answer.options,
            value: 0
          }
        }
      }, req.handleErrResult(function(doc) {
        return res.endJson(doc);
      }));
    });
  },
  children: {
    '/:id': {
      get: function(req, res) {
        var id;
        if (!(id = req.paramToObjectId('id'))) {
          return;
        }
        return Problem.findOne({
          _id: id
        }).populate(Problem.APISelect).exec(req.handleErrResult(function(doc) {
          if (req.user) {
            return req.user.doesFollowUser(doc.author.id, function(err, val) {
              return res.endJson({
                data: _.extend(doc, {
                  meta: {
                    followed: val
                  }
                })
              });
            });
          } else {
            return res.endJson({
              data: _.extend(doc, {
                meta: null
              })
            });
          }
        }));
      },
      put: [
        required.problems.selfOwns('id'), function(req, res) {
          var problema;
          if (!(problema = req.paramToObjectId('id'))) {
            return;
          }
          return Problem.findById(problema, req.handleErrResult(function(problem) {
            return req.parse(ProblemRules, function(err, reqBody) {
              var body;
              body = sanitizeBody(reqBody.content.body);
              console.log(reqBody, reqBody.content.answer);
              problem.updated_at = Date.now();
              problem.content.title = reqBody.content.title;
              problem.content.body = reqBody.content.body;
              problem.content.source = reqBody.content.source;
              problem.content.answer = {
                options: reqBody.content.answer.options,
                is_mc: reqBody.content.answer.is_mc,
                value: reqBody.content.answer.value
              };
              return problem.save(req.handleErrResult(function(doc) {
                return res.endJson(doc);
              }));
            });
          }));
        }
      ],
      "delete": [
        required.problems.selfOwns('id'), function(req, res) {
          var problema;
          if (!(problema = req.paramToObjectId('id'))) {
            return;
          }
          return Problem.findOne({
            _id: problema,
            'author.id': req.user.id
          }, req.handleErrResult(function(doc) {
            return doc.remove(function(err) {
              console.log('err?', err);
              return res.endJson(doc, {
                error: err
              });
            });
          }));
        }
      ]
    },
    '/upvote': {
      post: [
        required.problems.selfDoesntOwn('id'), function(req, res) {
          var problema;
          if (!(problema = req.paramToObjectId('id'))) {
            return;
          }
          return Problem.findById(problema, req.handleErrResult((function(_this) {
            return function(problem) {
              return req.user.upvoteProbl(problem, function(err, doc) {
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
        required.problems.selfDoesntOwn('id'), function(req, res) {
          var problema;
          if (!(problema = req.paramToObjectId('id'))) {
            return;
          }
          return Problem.findById(problema, req.handleErrResult((function(_this) {
            return function(problem) {
              return req.user.unupvoteProbl(problem, function(err, doc) {
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
    '/answers': {
      post: function(req, res) {
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
            return req.user.postToParentPost(parentPost, data, req.handleErrResult(function(doc) {
              return res.endJson(doc);
            }));
          };
        })(this)));
      }
    }
  }
};

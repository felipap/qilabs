var Answer, BODY_MAX, BODY_MIN, COMMENT_MAX, COMMENT_MIN, Post, Problem, ProblemRules, Resource, TITLE_MAX, TITLE_MIN, User, createProblem, defaultSanitizerOptions, dryText, jobs, mongoose, please, pureText, required, sanitizeBody, unupvoteProblem, upvoteProblem, val, _;

mongoose = require('mongoose');

required = require('src/lib/required.js');

_ = require('underscore');

please = require('src/lib/please.js');

please.args.extend(require('src/models/lib/pleaseModels.js'));

jobs = require('src/config/kue.js');

Resource = mongoose.model('Resource');

User = Resource.model('User');

Post = Resource.model('Post');

Problem = Resource.model('Problem');

Answer = Resource.model('Answer');

createProblem = function(self, data, cb) {
  var problem;
  please.args({
    $isModel: User
  }, {
    $contains: ['content', 'topics'],
    content: {
      $contains: ['title', 'body', 'answer']
    }
  }, '$isCb');
  problem = new Problem({
    author: User.toAuthorObject(self),
    content: {
      title: data.content.title,
      body: data.content.body,
      answer: {
        options: data.content.answer.options,
        value: data.content.answer.value,
        is_mc: data.content.answer.is_mc
      }
    },
    tags: data.tags
  });
  return problem.save((function(_this) {
    return function(err, doc) {
      console.log('doc save:', err, doc);
      cb(err, doc);
      if (err) {

      }
    };
  })(this));
};

upvoteProblem = function(self, res, cb) {
  var done;
  please.args({
    $isModel: User
  }, {
    $isModel: Problem
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
  return Problem.findOneAndUpdate({
    _id: '' + res.id
  }, {
    $push: {
      votes: self._id
    }
  }, done);
};

unupvoteProblem = function(self, res, cb) {
  var done;
  please.args({
    $isModel: User
  }, {
    $isModel: Problem
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
  return Problem.findOneAndUpdate({
    _id: '' + res.id
  }, {
    $pull: {
      votes: self._id
    }
  }, done);
};

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
  content: {
    title: {
      $valid: function(str) {
        return val.isLength(str, TITLE_MIN, TITLE_MAX);
      },
      $clean: function(str) {
        return val.stripLow(dryText(str));
      }
    },
    source: {
      $valid: function(str) {
        return !str || val.isLength(str, 0, 80);
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
                return false;
              }
            }
            return true;
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
      return createProblem(req.user, {
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
          var jsonDoc;
          jsonDoc = _.extend(doc.toJSON(), {
            _meta: {}
          });
          return req.user.doesFollowUser(doc.author.id, function(err, val) {
            if (err) {
              console.error("PQP1", err);
            }
            jsonDoc._meta.authorFollowed = val;
            if (doc.hasAnswered.indexOf('' + req.user.id) === -1) {
              jsonDoc._meta.userAnswered = false;
              return res.endJson({
                data: jsonDoc
              });
            } else {
              jsonDoc._meta.userAnswered = true;
              return doc.getFilledAnswers(function(err, children) {
                if (err) {
                  console.error("PQP2", err, children);
                }
                jsonDoc._meta.children = children;
                return res.endJson({
                  data: jsonDoc
                });
              });
            }
          });
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
      ],
      children: {
        '/upvote': {
          post: [
            required.problems.selfDoesntOwn('id'), function(req, res) {
              var problema;
              if (!(problema = req.paramToObjectId('id'))) {
                return;
              }
              return Problem.findById(problema, req.handleErrResult((function(_this) {
                return function(problem) {
                  return upvoteProblem(req.user, problem, function(err, doc) {
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
                  return unupvoteProblem(req.user, problem, function(err, doc) {
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
            return Problem.findById(postId, req.handleErrResult((function(_this) {
              return function(doc) {
                var userTries;
                userTries = _.findWhere(doc.userTries, {
                  user: '' + req.user.id
                });
                if (doc.hasAnswered.indexOf('' + req.user.id) === -1) {
                  return res.status(403).endJson({
                    error: true
                  });
                }
                return Answer.findOne({
                  'author.id': '' + req.user.id
                }, function(err, doc) {
                  var ans;
                  if (doc) {
                    return res.status(400).endJson({
                      error: true,
                      message: 'Resposta já enviada. '
                    });
                  }
                  return ans = new Answer({
                    author: {},
                    content: {
                      body: req.body.content.body
                    }
                  });
                });
              };
            })(this)));
          }
        },
        '/try': {
          post: function(req, res) {
            var postId;
            if (!(postId = req.paramToObjectId('id'))) {
              return;
            }
            return Problem.findById(postId, req.handleErrResult(function(doc) {
              var correct, userTries;
              correct = req.body.test === '0';
              userTries = _.findWhere(doc.userTries, {
                user: '' + req.user.id
              });
              console.log(typeof req.body.test, correct, req.body.test);
              if (userTries != null) {
                if (userTries.tries >= 3) {
                  return res.status(403).endJson({
                    error: true,
                    message: "Número de tentativas excedido."
                  });
                }
              } else {
                userTries = {
                  user: req.user.id,
                  tries: 0
                };
                doc.userTries.push(userTries);
              }
              if (correct) {
                doc.hasAnswered.push(req.user.id);
                doc.save();
                doc.getFilledAnswers(function(err, answers) {
                  if (err) {
                    console.error("error", err);
                    return res.endJson({
                      error: true
                    });
                  } else {
                    return res.endJson({
                      result: true,
                      answers: answers
                    });
                  }
                });
              } else {
                Problem.findOneAndUpdate({
                  _id: '' + doc.id,
                  'userTries.user': '' + req.user.id
                }, {
                  $inc: {
                    'userTries.$.tries': 1
                  }
                }, function(err, docs) {
                  return console.log(arguments);
                });
                return res.endJson({
                  result: false
                });
              }
            }));
          }
        }
      }
    }
  }
};

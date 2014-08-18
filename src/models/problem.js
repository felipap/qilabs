var Garbage, Inbox, Notification, ObjectId, Problem, ProblemSchema, Resource, assert, async, mongoose, please, _,
  __indexOf = [].indexOf || function(item) { for (var i = 0, l = this.length; i < l; i++) { if (i in this && this[i] === item) return i; } return -1; };

mongoose = require('mongoose');

assert = require('assert');

_ = require('underscore');

async = require('async');

please = require('src/lib/please.js');

please.args.extend(require('./lib/pleaseModels.js'));

Notification = mongoose.model('Notification');

Resource = mongoose.model('Resource');

Garbage = mongoose.model('Garbage');

Inbox = mongoose.model('Inbox');

ObjectId = mongoose.Schema.ObjectId;

ProblemSchema = new Resource.Schema({
  author: {
    id: String,
    username: String,
    path: String,
    avatarUrl: String,
    name: String
  },
  updated: {
    type: Date
  },
  published: {
    type: Date,
    indexed: 1,
    "default": Date.now
  },
  subject: {
    type: String
  },
  topics: {
    type: [
      {
        type: String
      }
    ]
  },
  content: {
    title: {
      type: String
    },
    body: {
      type: String,
      required: true
    },
    source: {
      type: String
    },
    image: {
      type: String
    },
    answer: {
      value: 0,
      options: [],
      is_mc: {
        type: Boolean,
        "default": true
      }
    }
  },
  watching: [],
  canSeeAnswers: [],
  votes: {
    type: [
      {
        type: String,
        ref: 'User',
        required: true
      }
    ],
    "default": []
  }
}, {
  toObject: {
    virtuals: true
  },
  toJSON: {
    virtuals: true
  }
});

ProblemSchema.virtual('voteSum').get(function() {
  return this.votes.length;
});

ProblemSchema.virtual('path').get(function() {
  if (this.parentProblem) {
    return "/problems/" + this.parentProblem + "#" + this.id;
  } else {
    return "/problems/{id}".replace(/{id}/, this.id);
  }
});

ProblemSchema.virtual('apiPath').get(function() {
  return "/api/problems/{id}".replace(/{id}/, this.id);
});

ProblemSchema.pre('remove', function(next) {
  next();
  return Notification.find({
    resources: this
  }, (function(_this) {
    return function(err, docs) {
      console.log("Removing " + err + " " + docs.length + " notifications of Problem " + _this.id);
      return docs.forEach(function(doc) {
        return doc.remove();
      });
    };
  })(this));
});

ProblemSchema.pre('remove', function(next) {
  next();
  return Problem.find({
    parentProblem: this
  }, function(err, docs) {
    return docs.forEach(function(doc) {
      return doc.remove();
    });
  });
});

ProblemSchema.pre('remove', function(next) {
  next();
  return Inbox.remove({
    resource: this.id
  }, (function(_this) {
    return function(err, doc) {
      return console.log("Removing " + err + " " + doc + " inbox of Problem " + _this.id);
    };
  })(this));
});

ProblemSchema.pre('remove', function(next) {
  next();
  return this.addToGarbage(function(err) {
    return console.log("" + err + " - moving Problem " + this.id + " to garbage");
  });
});

ProblemSchema.pre('remove', function(next) {
  var User;
  next();
  if (!this.parentProblem) {
    User = Resource.model('User');
    return User.findById(this.author.id, function(err, author) {
      return author.update({
        $inc: {
          'stats.Problems': -1
        }
      }, function(err) {
        if (err) {
          return console.err("Error in decreasing author stats: " + err);
        }
      });
    });
  }
});

ProblemSchema.methods.addToGarbage = function(cb) {
  var deleted, obj;
  console.log('adding to garbage', this.content.body);
  obj = this.toJSON();
  obj.old_id = '' + this.id;
  obj.deleted_at = Date.now();
  deleted = new Garbage(obj);
  return deleted.save(cb);
};

ProblemSchema.methods.getComments = function(cb) {
  return Problem.find({
    parentProblem: this.id
  }).exec(function(err, docs) {
    return cb(err, docs);
  });
};

ProblemSchema.methods.stuff = function(cb) {
  return this.fillChildren(cb);
};

ProblemSchema.methods.fillChildren = function(cb) {
  var _ref;
  if (_ref = this.type, __indexOf.call(_.values(Types), _ref) < 0) {
    return cb(false, this.toJSON());
  }
  return Problem.find({
    parentProblem: this
  }).exec((function(_this) {
    return function(err, children) {
      return async.map(children, (function(c, done) {
        var _ref1;
        if ((_ref1 = c.type) === Types.Answer) {
          return c.fillChildren(done);
        } else {
          return done(null, c);
        }
      }), function(err, popChildren) {
        return cb(err, _.extend(_this.toJSON(), {
          children: _.groupBy(popChildren, function(i) {
            return i.type;
          })
        }));
      });
    };
  })(this));
};

ProblemSchema.statics.countList = function(docs, cb) {
  please.args({
    $isA: Array
  }, '$isCb');
  return async.map(docs, function(Problem, done) {
    if (Problem instanceof Problem) {
      return Problem.count({
        type: 'Comment',
        parentProblem: Problem
      }, function(err, ccount) {
        return Problem.count({
          type: 'Answer',
          parentProblem: Problem
        }, function(err, acount) {
          return done(err, _.extend(Problem.toJSON(), {
            childrenCount: {
              Answer: acount,
              Comment: ccount
            }
          }));
        });
      });
    } else {
      return done(null, Problem.toJSON);
    }
  }, function(err, results) {
    return cb(err, results);
  });
};

ProblemSchema.statics.fromObject = function(object) {
  return new Problem(void 0, void 0, true).init(object);
};

ProblemSchema.plugin(require('./lib/hookedModelPlugin'));

module.exports = Problem = Resource.discriminator('Problem', ProblemSchema);

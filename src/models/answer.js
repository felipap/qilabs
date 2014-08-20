var Answer, AnswerSchema, Garbage, Inbox, Notification, ObjectId, Resource, assert, async, mongoose, please, _;

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

AnswerSchema = new Resource.Schema({
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

AnswerSchema.virtual('voteSum').get(function() {
  return this.votes.length;
});

AnswerSchema.virtual('path').get(function() {
  if (this.parentAnswer) {
    return "/problems/" + this.parentAnswer + "#" + this.id;
  } else {
    return "/problems/{id}".replace(/{id}/, this.id);
  }
});

AnswerSchema.virtual('apiPath').get(function() {
  return "/api/problems/{id}".replace(/{id}/, this.id);
});

AnswerSchema.pre('remove', function(next) {
  next();
  return Notification.find({
    resources: this
  }, (function(_this) {
    return function(err, docs) {
      console.log("Removing " + err + " " + docs.length + " notifications of Answer " + _this.id);
      return docs.forEach(function(doc) {
        return doc.remove();
      });
    };
  })(this));
});

AnswerSchema.pre('remove', function(next) {
  next();
  return Answer.find({
    parentAnswer: this
  }, function(err, docs) {
    return docs.forEach(function(doc) {
      return doc.remove();
    });
  });
});

AnswerSchema.pre('remove', function(next) {
  next();
  return this.addToGarbage(function(err) {
    return console.log("" + err + " - moving Answer " + this.id + " to garbage");
  });
});

AnswerSchema.pre('remove', function(next) {
  var User;
  next();
  if (!this.parentAnswer) {
    User = Resource.model('User');
    return User.findById(this.author.id, function(err, author) {
      return author.update({
        $inc: {
          'stats.Answers': -1
        }
      }, function(err) {
        if (err) {
          return console.err("Error in decreasing author stats: " + err);
        }
      });
    });
  }
});

AnswerSchema.methods.getComments = function(cb) {
  return Answer.find({
    parentAnswer: this.id
  }).exec(function(err, docs) {
    return cb(err, docs);
  });
};

AnswerSchema.methods.stuff = function(cb) {
  return this.fillChildren(cb);
};

AnswerSchema.methods.fillChildren = function(cb) {
  return Post.find({
    parentAnswer: this
  }).exec((function(_this) {
    return function(err, children) {
      return async.map(children, (function(c, done) {
        var _ref;
        if ((_ref = c.type) === Types.Answer) {
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

AnswerSchema.statics.countList = function(docs, cb) {
  please.args({
    $isA: Array
  }, '$isCb');
  return async.map(docs, function(Answer, done) {
    if (Answer instanceof Answer) {
      return Answer.count({
        type: 'Comment',
        parentAnswer: Answer
      }, function(err, ccount) {
        return Answer.count({
          type: 'Answer',
          parentAnswer: Answer
        }, function(err, acount) {
          return done(err, _.extend(Answer.toJSON(), {
            childrenCount: {
              Answer: acount,
              Comment: ccount
            }
          }));
        });
      });
    } else {
      return done(null, Answer.toJSON);
    }
  }, function(err, results) {
    return cb(err, results);
  });
};

AnswerSchema.statics.fromObject = function(object) {
  return new Answer(void 0, void 0, true).init(object);
};

AnswerSchema.plugin(require('./lib/hookedModelPlugin'));

AnswerSchema.plugin(require('./lib/trashablePlugin'));

module.exports = Answer = Resource.discriminator('Answer', AnswerSchema);

var Inbox, Notification, ObjectId, Problem, ProblemSchema, Resource, assert, async, mongoose, please, _;

mongoose = require('mongoose');

assert = require('assert');

_ = require('underscore');

async = require('async');

please = require('src/lib/please.js');

please.args.extend(require('./lib/pleaseModels.js'));

Notification = mongoose.model('Notification');

Resource = mongoose.model('Resource');

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
  updated_at: {
    type: Date
  },
  created_at: {
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
  counts: {
    children: {
      type: Number,
      "default": 0
    }
  },
  hasAnswered: [],
  hasSeenAnswers: [],
  userTries: [],
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

ProblemSchema.statics.APISelect = '-hasAnswered -canSeeAnswers -hasSeenAnswers -watching -userTries';

ProblemSchema.virtual('counts.votes').get(function() {
  return this.votes.length;
});

ProblemSchema.virtual('path').get(function() {
  return "/problems/{id}".replace(/{id}/, this.id);
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
  return Answer.find({
    problem: this
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

ProblemSchema.methods.getAnswers = function(cb) {
  return Answer.find({
    problem: this._id
  }, cb);
};

ProblemSchema.methods.getFilledAnswers = function(cb) {
  var self;
  self = this;
  return self.getAnswers(function(err, docs) {
    if (err) {
      return cb(err);
    }
    return async.map(docs, (function(ans, done) {
      return ans.getComments(function(err, docs) {
        return done(err, _.extend(ans.toJSON(), {
          comments: docs
        }));
      });
    }), cb);
  });
};

ProblemSchema.statics.fromObject = function(object) {
  return new Problem(void 0, void 0, true).init(object);
};

ProblemSchema.plugin(require('./lib/hookedModelPlugin'));

ProblemSchema.plugin(require('./lib/trashablePlugin'));

ProblemSchema.plugin(require('./lib/selectiveJSON'), ProblemSchema.statics.APISelect);

module.exports = Problem = Resource.discriminator('Problem', ProblemSchema);

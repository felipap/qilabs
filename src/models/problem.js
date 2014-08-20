var Garbage, Inbox, Notification, ObjectId, Problem, ProblemSchema, Resource, assert, async, mongoose, please, _;

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
  return this.addToGarbage(function(err) {
    return console.log("" + err + " - moving Problem " + this.id + " to garbage");
  });
});

ProblemSchema.statics.fromObject = function(object) {
  return new Problem(void 0, void 0, true).init(object);
};

ProblemSchema.plugin(require('./lib/hookedModelPlugin'));

ProblemSchema.plugin(require('./lib/trashablePlugin'));

module.exports = Problem = Resource.discriminator('Problem', ProblemSchema);

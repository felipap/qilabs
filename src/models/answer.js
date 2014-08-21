var Answer, AnswerSchema, Inbox, Notification, ObjectId, Resource, assert, async, mongoose, please, _;

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

AnswerSchema = new Resource.Schema({
  author: {
    id: String,
    username: String,
    path: String,
    avatarUrl: String,
    name: String
  },
  problem: {
    type: String,
    ref: 'Problem',
    required: true
  },
  updated_at: {
    type: Date
  },
  created_at: {
    type: Date,
    indexed: 1,
    "default": Date.now
  },
  content: {
    body: {
      type: String,
      required: true
    }
  },
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

AnswerSchema.statics.APISelect = '';

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
  return this.addToGarbage(function(err) {
    return console.log("" + err + " - moving Answer " + this.id + " to garbage");
  });
});

AnswerSchema.methods.getComments = function(cb) {
  return Post.find({
    parent: this.id
  }, cb);
};

AnswerSchema.statics.fromObject = function(object) {
  return new Answer(void 0, void 0, true).init(object);
};

AnswerSchema.plugin(require('./lib/hookedModelPlugin'));

AnswerSchema.plugin(require('./lib/trashablePlugin'));

module.exports = Answer = Resource.discriminator('Answer', AnswerSchema);

var Comment, CommentSchema, CommentTree, CommentTreeSchema, Notification, ObjectId, Resource, assert, async, authorObject, jobs, mongoose, please, _;

mongoose = require('mongoose');

assert = require('assert');

_ = require('underscore');

async = require('async');

jobs = require('src/config/kue.js');

please = require('src/lib/please.js');

please.args.extend(require('./lib/pleaseModels.js'));

Notification = mongoose.model('Notification');

Resource = mongoose.model('Resource');

ObjectId = mongoose.Schema.ObjectId;

authorObject = {
  id: String,
  username: String,
  path: String,
  avatarUrl: String,
  name: String
};

CommentSchema = new Resource.Schema({
  author: authorObject,
  replies_to: {
    type: ObjectId,
    ref: 'Comment',
    indexed: 1
  },
  replied_users: [authorObject],
  parent: {
    type: ObjectId,
    ref: 'Post',
    indexed: 1
  },
  tree: {
    type: ObjectId,
    ref: 'CommentTree',
    indexed: 1
  },
  content: {
    body: {
      type: String,
      required: true
    }
  },
  votes: [
    {
      type: String,
      ref: 'User',
      required: true
    }
  ],
  meta: {
    updated_at: {
      type: Date
    },
    created_at: {
      type: Date,
      "default": Date.now
    }
  }
}, {
  toObject: {
    virtuals: true
  },
  toJSON: {
    virtuals: true
  }
});

CommentTreeSchema = new Resource.Schema({
  parent: {
    type: ObjectId,
    ref: 'Resource',
    required: true,
    indexed: 1
  },
  docs: [CommentSchema]
}, {
  toObject: {
    virtuals: true
  },
  toJSON: {
    virtuals: true
  }
});

CommentSchema.virtual('counts.votes').get(function() {
  return this.votes && this.votes.length;
});

CommentSchema.virtual('path').get(function() {
  return "/posts/" + this.parent + "#" + this.id;
});

CommentSchema.virtual('apiPath').get(function() {
  return "/api/posts/{parentId}/{id}".replace(/{parentId}/, this.parent).replace(/{id}/, this.id);
});

CommentSchema.pre('remove', function(next) {
  next();
  return Notification.find({
    resources: this
  }, (function(_this) {
    return function(err, docs) {
      console.log("Removing " + err + " " + docs.length + " notifications of comment " + _this.id);
      return docs.forEach(function(doc) {
        return doc.remove();
      });
    };
  })(this));
});

CommentSchema.pre('save', function(next) {
  this.wasNew = this.isNew;
  return next();
});

CommentSchema.post('save', function() {
  if (this.wasNew) {
    return jobs.create('post children', {
      title: "New comment: " + this.author.name + " posted " + this.id + " to " + this.parent,
      post: this
    }).save();
  }
});

CommentSchema.pre('remove', function(next) {
  next();
  return jobs.create('delete children', {
    title: "Delete post children: " + this.author.name + " deleted " + this.id + " from " + this.parent,
    post: this
  }).save();
});

CommentSchema.statics.fromObject = function(object) {
  return new Comment(void 0, void 0, true).init(object);
};

CommentSchema.plugin(require('./lib/hookedModelPlugin'));

CommentSchema.plugin(require('./lib/trashablePlugin'));

CommentSchema.plugin(require('./lib/selectiveJSON'), CommentSchema.statics.APISelect);

CommentSchema.plugin(require('./lib/hookedModelPlugin'));

CommentTree = mongoose.model('CommentTree', CommentTreeSchema);

Comment = Resource.discriminator('Comment', CommentSchema);

module.exports = function(app) {};

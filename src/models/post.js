var Comment, CommentTree, Inbox, Notification, ObjectId, Post, PostSchema, Resource, TransTypes, Types, assert, async, jobs, mongoose, please, _;

mongoose = require('mongoose');

assert = require('assert');

_ = require('underscore');

async = require('async');

jobs = require('src/config/kue.js');

please = require('src/lib/please.js');

please.args.extend(require('./lib/pleaseModels.js'));

Notification = mongoose.model('Notification');

Resource = mongoose.model('Resource');

Inbox = mongoose.model('Inbox');

Comment = Resource.model('Comment');

CommentTree = Resource.model('CommentTree');

Types = {
  Note: 'Note',
  Discussion: 'Discussion'
};

TransTypes = {};

TransTypes[Types.Discussion] = 'Discussão';

TransTypes[Types.Note] = 'Nota';

ObjectId = mongoose.Schema.ObjectId;

PostSchema = new Resource.Schema({
  author: {
    id: String,
    username: String,
    path: String,
    avatarUrl: String,
    name: String
  },
  type: {
    type: String,
    required: true,
    "enum": _.values(Types)
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
  tags: [
    {
      type: String
    }
  ],
  content: {
    title: {
      type: String
    },
    body: {
      type: String,
      required: true
    },
    image: {
      type: String
    }
  },
  counts: {
    children: {
      type: Number,
      "default": 0
    }
  },
  comment_tree: {
    type: String,
    ref: 'CommentTree',
    required: true
  },
  users_watching: [
    {
      type: String,
      ref: 'User'
    }
  ],
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

PostSchema.statics.APISelect = '-users_watching -comment_tree';

PostSchema.virtual('translatedType').get(function() {
  return TransTypes[this.type] || 'Publicação';
});

PostSchema.virtual('counts.votes').get(function() {
  return this.votes && this.votes.length;
});

PostSchema.virtual('path').get(function() {
  return "/posts/{id}".replace(/{id}/, this.id);
});

PostSchema.virtual('apiPath').get(function() {
  return "/api/posts/{id}".replace(/{id}/, this.id);
});

PostSchema.pre('remove', function(next) {
  next();
  return Notification.find({
    resources: this
  }, (function(_this) {
    return function(err, docs) {
      console.log("Removing " + err + " " + docs.length + " notifications of post " + _this.id);
      return docs.forEach(function(doc) {
        return doc.remove();
      });
    };
  })(this));
});

PostSchema.pre('remove', function(next) {
  next();
  return Inbox.remove({
    resource: this.id
  }, (function(_this) {
    return function(err, doc) {
      return console.log("Removing err:" + err + " " + doc + " inbox of post " + _this.id);
    };
  })(this));
});

PostSchema.methods.getComments = function(cb) {
  if (this.comment_tree) {
    return CommentTree.findById(this.comment_tree, function(err, tree) {
      return cb(err, tree && tree.docs);
    });
  } else {
    return cb(null, []);
  }
};

PostSchema.methods.stuff = function(cb) {
  return this.getComments((function(_this) {
    return function(err, docs) {
      if (err) {
        console.warn(err);
      }
      return cb(err, _.extend(_this.toJSON(), {
        children: docs || []
      }));
    };
  })(this));
};

PostSchema.statics.fromObject = function(object) {
  return new Post(void 0, void 0, true).init(object);
};

PostSchema.statics.Types = Types;

PostSchema.plugin(require('./lib/hookedModelPlugin'));

PostSchema.plugin(require('./lib/trashablePlugin'));

PostSchema.plugin(require('./lib/selectiveJSON'), PostSchema.statics.APISelect);

Post = Resource.discriminator('Post', PostSchema);

module.exports = function(app) {};

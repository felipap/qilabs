var Inbox, Notification, ObjectId, Post, PostSchema, Resource, TransTypes, Types, assert, async, jobs, mongoose, please, _,
  __indexOf = [].indexOf || function(item) { for (var i = 0, l = this.length; i < l; i++) { if (i in this && this[i] === item) return i; } return -1; };

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

Types = {
  Note: 'Note',
  Discussion: 'Discussion',
  Comment: 'Comment',
  Problem: 'Problem'
};

TransTypes = {};

TransTypes[Types.Discussion] = 'Discussão';

TransTypes[Types.Note] = 'Nota';

TransTypes[Types.Comment] = 'Comentário';

ObjectId = mongoose.Schema.ObjectId;

PostSchema = new Resource.Schema({
  author: {
    id: String,
    username: String,
    path: String,
    avatarUrl: String,
    name: String
  },
  parent: {
    type: ObjectId,
    ref: 'Resource',
    required: false
  },
  parent: {
    type: ObjectId,
    ref: 'Resource',
    required: false
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
    }
  },
  counts: {
    votes: {
      type: Number,
      "default": 0
    },
    children: {
      type: Number,
      "default": 0
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

PostSchema.virtual('translatedType').get(function() {
  return TransTypes[this.type] || 'Publicação';
});

PostSchema.virtual('voteSum').get(function() {
  return this.votes && this.votes.length;
});

PostSchema.virtual('path').get(function() {
  if (this.parent) {
    return "/posts/" + this.parent + "#" + this.id;
  } else {
    return "/posts/{id}".replace(/{id}/, this.id);
  }
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
  return Post.find({
    parent: this
  }, function(err, docs) {
    return docs.forEach(function(doc) {
      return doc.remove();
    });
  });
});

PostSchema.pre('remove', function(next) {
  next();
  return Inbox.remove({
    resource: this.id
  }, (function(_this) {
    return function(err, doc) {
      return console.log("Removing " + err + " " + doc + " inbox of post " + _this.id);
    };
  })(this));
});

PostSchema.pre('remove', function(next) {
  next();
  return this.addToGarbage(function(err) {
    return console.log("" + err + " - moving post " + this.id + " to garbage");
  });
});

PostSchema.pre('save', function(next) {
  this.wasNew = this.isNew;
  return next();
});

PostSchema.post('save', function() {
  if (this.wasNew) {
    if (this.parent) {
      return jobs.create('post children', {
        title: "New post comment: " + this.author.name + " posted " + this.id + " to " + this.parent,
        post: this
      }).save();
    }
  }
});

PostSchema.pre('remove', function(next) {
  next();
  if (this.parent) {
    return jobs.create('delete children', {
      title: "Delete post children: " + self.name + " posted " + comment.id + " to " + parent.id,
      post: comment
    }).save();
  } else {

  }
});

PostSchema.methods.getComments = function(cb) {
  return Post.find({
    parent: this.id
  }).exec(function(err, docs) {
    return cb(err, docs);
  });
};

PostSchema.methods.stuff = function(cb) {
  return this.fillChildren(cb);
};

PostSchema.methods.fillChildren = function(cb) {
  var _ref;
  if (_ref = this.type, __indexOf.call(_.values(Types), _ref) < 0) {
    return cb(false, this.toJSON());
  }
  return Post.find({
    parent: this
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

PostSchema.statics.fromObject = function(object) {
  return new Post(void 0, void 0, true).init(object);
};

PostSchema.statics.Types = Types;

PostSchema.plugin(require('./lib/hookedModelPlugin'));

PostSchema.plugin(require('./lib/trashablePlugin'));

module.exports = Post = Resource.discriminator('Post', PostSchema);

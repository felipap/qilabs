var Garbage, Inbox, Notification, ObjectId, Post, PostSchema, Resource, TransTypes, Types, assert, async, mongoose, please, _,
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

Types = {
  Note: 'Note',
  Experience: 'Experience',
  Tip: 'Tip',
  Discussion: 'Discussion',
  Question: 'Question',
  Comment: 'Comment',
  Answer: 'Answer',
  Problem: 'Problem'
};

TransTypes = {};

TransTypes[Types.Question] = 'Discussão';

TransTypes[Types.Discussion] = 'Discussão';

TransTypes[Types.Experience] = 'Nota';

TransTypes[Types.Tip] = 'Nota';

TransTypes[Types.Note] = 'Nota';

TransTypes[Types.Answer] = 'Resposta';

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
  parentPost: {
    type: ObjectId,
    ref: 'Post',
    required: false
  },
  updated: {
    type: Date
  },
  published: {
    type: Date,
    indexed: 1,
    "default": Date.now
  },
  type: {
    type: String,
    required: true,
    "enum": _.values(Types)
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
    },
    answer: {
      type: '',
      value: ''
    },
    wrongChoices: []
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
    select: true,
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
  return this.votes.length;
});

PostSchema.virtual('path').get(function() {
  if (this.parentPost) {
    return "/posts/" + this.parentPost + "#" + this.id;
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
    parentPost: this
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

PostSchema.pre('remove', function(next) {
  var User;
  next();
  if (!this.parentPost) {
    User = Resource.model('User');
    return User.findById(this.author.id, function(err, author) {
      return author.update({
        $inc: {
          'stats.posts': -1
        }
      }, function(err) {
        if (err) {
          return console.err("Error in decreasing author stats: " + err);
        }
      });
    });
  }
});

PostSchema.methods.addToGarbage = function(cb) {
  var deleted, obj;
  console.log('adding to garbage', this.content.body);
  obj = this.toJSON();
  obj.old_id = '' + this.id;
  obj.deleted_at = Date.now();
  deleted = new Garbage(obj);
  return deleted.save(cb);
};

PostSchema.methods.getComments = function(cb) {
  return Post.find({
    parentPost: this.id
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
    parentPost: this
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

PostSchema.statics.countList = function(docs, cb) {
  please.args({
    $isA: Array
  }, '$isCb');
  return async.map(docs, function(post, done) {
    if (post instanceof Post) {
      return Post.count({
        type: 'Comment',
        parentPost: post
      }, function(err, ccount) {
        return Post.count({
          type: 'Answer',
          parentPost: post
        }, function(err, acount) {
          return done(err, _.extend(post.toJSON(), {
            childrenCount: {
              Answer: acount,
              Comment: ccount
            }
          }));
        });
      });
    } else {
      return done(null, post.toJSON);
    }
  }, function(err, results) {
    return cb(err, results);
  });
};

PostSchema.statics.fromObject = function(object) {
  return new Post(void 0, void 0, true).init(object);
};

PostSchema.statics.Types = Types;

PostSchema.plugin(require('./lib/hookedModelPlugin'));

module.exports = Post = Resource.discriminator('Post', PostSchema);

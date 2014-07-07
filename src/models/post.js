var Notification, ObjectId, Post, PostSchema, Resource, TransTypes, Types, assert, async, mongoose, please, smallify, urlify, _,
  __indexOf = [].indexOf || function(item) { for (var i = 0, l = this.length; i < l; i++) { if (i in this && this[i] === item) return i; } return -1; };

mongoose = require('mongoose');

assert = require('assert');

_ = require('underscore');

async = require('async');

please = require('src/lib/please.js');

please.args.extend(require('./lib/pleaseModels.js'));

Notification = mongoose.model('Notification');

Resource = mongoose.model('Resource');

Types = {
  Experience: 'Experience',
  Tip: 'Tip',
  Question: 'Question',
  Comment: 'Comment',
  Answer: 'Answer'
};

TransTypes = {};

TransTypes[Types.Question] = 'Pergunta';

TransTypes[Types.Experience] = 'Experiência';

TransTypes[Types.Tip] = 'Dica';

TransTypes[Types.Answer] = 'Resposta';

TransTypes[Types.Comment] = 'Comentário';

ObjectId = mongoose.Schema.ObjectId;

PostSchema = new Resource.Schema({
  author: {
    type: ObjectId,
    ref: 'User',
    required: true,
    indexed: 1
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

smallify = function(url) {
  if (url.length > 50) {
    return '...' + /https?:(?:\/\/)?[A-Za-z0-9][A-Za-z0-9\-]*([A-Za-z0-9\-]{2}\.[A-Za-z0-9\.\-]+(\/.{0,20})?)/.exec(url)[1] + '...';
  } else {
    return url;
  }
};

urlify = function(text) {
  var urlRegex;
  urlRegex = /(((https?:(?:\/\/)?)(?:www\.)?[A-Za-z0-9\.\-]+)((?:\/[\+~%\/\.\w\-_]*)?\??(?:[\-\+=&;%@\.\w_]*)#?(?:[\.\!\/\\\w]*))?)/;
  return text.replace(urlRegex, function(url) {
    return "<a href=\"" + url + "\">" + (smallify(url)) + "</a>";
  });
};

PostSchema.virtual('content.escapedBody').get(function() {
  if (this.type === 'Comment') {
    return urlify(this.content.body);
  } else {
    return this.content.body;
  }
});

PostSchema.virtual('content.plainBody').get(function() {
  return this.content.body.replace(/(<([^>]+)>)/ig, "");
});

PostSchema.pre('remove', function(next) {
  next();
  return Notification.find({
    resources: this
  }, (function(_this) {
    return function(err, docs) {
      console.log("Removing " + err + " " + docs.length + " notifications of resource " + _this.id);
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

PostSchema.methods.getComments = function(cb) {
  return Post.find({
    parentPost: this.id
  }).populate('author', '-memberships').exec(function(err, docs) {
    return cb(err, docs);
  });
};

PostSchema.methods.stuff = function(cb) {
  return this.populate('author', function(err, doc) {
    if (err) {
      return cb(err);
    } else if (doc) {
      return doc.fillChildren(cb);
    } else {
      return cb(false, null);
    }
  });
};

PostSchema.methods.fillChildren = function(cb) {
  var _ref;
  if (_ref = this.type, __indexOf.call(_.values(Types), _ref) < 0) {
    return cb(false, this.toJSON());
  }
  return Post.find({
    parentPost: this
  }).populate('author').exec((function(_this) {
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

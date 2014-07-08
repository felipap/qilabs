var Activity, Follow, HandleLimit, Inbox, Notification, ObjectId, PopulateFields, Post, Resource, User, UserSchema, async, fetchTimelinePostAndActivities, jobs, mongoose, please, redis, _;

mongoose = require('mongoose');

_ = require('underscore');

async = require('async');

jobs = require('src/config/kue.js');

redis = require('src/config/redis.js');

please = require('src/lib/please.js');

please.args.extend(require('./lib/pleaseModels.js'));

Resource = mongoose.model('Resource');

Activity = Resource.model('Activity');

Notification = mongoose.model('Notification');

Inbox = mongoose.model('Inbox');

Follow = Resource.model('Follow');

Post = Resource.model('Post');

PopulateFields = '-accesssToken -firstAccess -followingTags';

ObjectId = mongoose.Types.ObjectId;

UserSchema = new mongoose.Schema({
  name: {
    type: String
  },
  username: {
    type: String
  },
  lastAccess: {
    type: Date,
    select: false
  },
  firstAccess: {
    type: Date,
    select: false
  },
  facebookId: {
    type: String
  },
  accessToken: {
    type: String,
    select: false
  },
  followingTags: [],
  profile: {
    location: {
      type: String,
      "default": 'Student at Hogwarts School'
    },
    bio: {
      type: String,
      "default": 'Lorem ipsum dolor sit amet, consectetur adipisicing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat.'
    },
    home: {
      type: String,
      "default": 'Rua dos Alfeneiros, n° 4, Little Whitning'
    },
    bgUrl: {
      type: String,
      "default": '/static/images/rio.jpg'
    },
    avatarUrl: ''
  },
  stats: {
    posts: {
      type: Number,
      "default": 0
    },
    votes: {
      type: Number,
      "default": 0
    },
    followers: {
      type: Number,
      "default": 0
    },
    following: {
      type: Number,
      "default": 0
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

UserSchema.methods.getCacheFields = function(field) {
  switch (field) {
    case "Following":
      return "user:" + this.id + ":following";
    default:
      throw "Field " + field + " isn't a valid cache field.";
  }
};

UserSchema.virtual('avatarUrl').get(function() {
  if (this.username === 'felipearagaopires') {
    return '/static/images/avatar.png';
  } else {
    return 'https://graph.facebook.com/' + this.facebookId + '/picture?width=200&height=200';
  }
});

UserSchema.virtual('path').get(function() {
  return '/u/' + this.username;
});

UserSchema.pre('remove', function(next) {
  return Follow.find().or([
    {
      followee: this
    }, {
      follower: this
    }
  ]).exec((function(_this) {
    return function(err, docs) {
      var follow, _i, _len;
      if (docs) {
        for (_i = 0, _len = docs.length; _i < _len; _i++) {
          follow = docs[_i];
          follow.remove(function() {});
        }
      }
      console.log("Removing " + err + " " + docs.length + " follows of " + _this.username);
      return next();
    };
  })(this));
});

UserSchema.pre('remove', function(next) {
  return Post.find({
    author: this
  }, (function(_this) {
    return function(err, docs) {
      var doc, _i, _len;
      if (docs) {
        for (_i = 0, _len = docs.length; _i < _len; _i++) {
          doc = docs[_i];
          doc.remove(function() {});
        }
      }
      console.log("Removing " + err + " " + docs.length + " posts of " + _this.username);
      return next();
    };
  })(this));
});

UserSchema.pre('remove', function(next) {
  return Notification.find().or([
    {
      agent: this
    }, {
      recipient: this
    }
  ]).remove((function(_this) {
    return function(err, docs) {
      console.log("Removing " + err + " " + docs + " notifications related to " + _this.username);
      return next();
    };
  })(this));
});

UserSchema.pre('remove', function(next) {
  return Activity.remove({
    actor: this
  }, (function(_this) {
    return function(err, docs) {
      console.log("Removing " + err + " " + docs + " activities related to " + _this.username);
      return next();
    };
  })(this));
});

UserSchema.methods.getFollowsAsFollowee = function(cb) {
  return Follow.find({
    followee: this,
    follower: {
      $ne: null
    }
  }, cb);
};

UserSchema.methods.getFollowsAsFollower = function(cb) {
  return Follow.find({
    follower: this,
    followee: {
      $ne: null
    }
  }, cb);
};

UserSchema.methods.getPopulatedFollowers = function(cb) {
  return this.getFollowsAsFollowee(function(err, docs) {
    if (err) {
      return cb(err);
    }
    return User.populate(docs, {
      path: 'follower',
      select: User.PopulateFields
    }, function(err, popFollows) {
      return cb(err, _.filter(_.pluck(popFollows, 'follower'), function(i) {
        return i;
      }));
    });
  });
};

UserSchema.methods.getPopulatedFollowing = function(cb) {
  return this.getFollowsAsFollower(function(err, docs) {
    if (err) {
      return cb(err);
    }
    return User.populate(docs, {
      path: 'followee',
      select: User.PopulateFields
    }, function(err, popFollows) {
      return cb(err, _.filter(_.pluck(popFollows, 'followee'), function(i) {
        return i;
      }));
    });
  });
};

UserSchema.methods.getFollowersIds = function(cb) {
  return this.getFollowsAsFollowee(function(err, docs) {
    return cb(err, _.pluck(docs || [], 'follower'));
  });
};

UserSchema.methods.getFollowingIds = function(cb) {
  return this.getFollowsAsFollower(function(err, docs) {
    return cb(err, _.pluck(docs || [], 'followee'));
  });
};

UserSchema.methods.doesFollowUser = function(user, cb) {
  var userId;
  if (user instanceof User) {
    userId = user.id;
  } else if (typeof user === "string") {
    userId = user;
  } else {
    throw "Passed argument should be either a User object or a string id.";
  }
  return redis.sismember(this.getCacheFields("Following"), "" + userId, function(err, val) {
    if (err) {
      console.log(arguments);
      return Follow.findOne({
        followee: userId,
        follower: this.id
      }, function(err, doc) {
        return cb(err, !!doc);
      });
    } else {
      return cb(null, !!val);
    }
  });
};

UserSchema.methods.dofollowUser = function(user, cb) {
  var self;
  please.args({
    $isModel: 'User'
  }, '$isCb');
  self = this;
  if ('' + user.id === '' + self.id) {
    return cb(true);
  }
  return Follow.findOne({
    follower: self,
    followee: user
  }, (function(_this) {
    return function(err, doc) {
      if (!doc) {
        doc = new Follow({
          follower: self,
          followee: user
        });
        doc.save();
        redis.sadd(_this.getCacheFields("Following"), '' + user.id, function(err, doc) {
          console.log("sadd on following", arguments);
          if (err) {
            return console.log(err);
          }
        });
        Notification.Trigger(self, Notification.Types.NewFollower)(self, user, function() {});
        Activity.Trigger(self, Notification.Types.NewFollower)({
          follow: doc,
          follower: self,
          followee: user
        }, function() {});
        jobs.create('user follow', {
          title: "New follow: " + self.name + " → " + user.name,
          follower: self,
          followee: user
        }).save();
      }
      return cb(err, !!doc);
    };
  })(this));
};

UserSchema.methods.unfollowUser = function(user, cb) {
  var self;
  please.args({
    $isModel: User
  }, '$isCb');
  self = this;
  return Follow.findOne({
    follower: this,
    followee: user
  }, (function(_this) {
    return function(err, doc) {
      if (err) {
        return cb(err);
      }
      if (doc) {
        doc.remove(cb);
        jobs.create('user unfollow', {
          title: "New unfollow: " + self.name + " → " + user.name,
          followee: user,
          follower: self
        }).save();
      }
      return redis.srem(_this.getCacheFields("Following"), '' + user.id, function(err, doc) {
        console.log("srem on following", arguments);
        if (err) {
          return console.log(err);
        }
      });
    };
  })(this));
};

HandleLimit = function(func) {
  return function(err, _docs) {
    var docs;
    docs = _.filter(_docs, function(e) {
      return e;
    });
    return func(err, docs);
  };
};


/*
 * Behold.
 */

UserSchema.methods.getTimeline = function(opts, callback) {
  var self;
  please.args({
    $contains: 'maxDate'
  }, '$isCb');
  self = this;
  return Inbox.find({
    recipient: self.id,
    dateSent: {
      $lt: opts.maxDate
    }
  }).sort('-dateSent').populate('resource').exec((function(_this) {
    return function(err, docs) {
      var minDate, posts;
      if (err) {
        return cb(err);
      }
      posts = _.pluck(docs, 'resource').filter(function(i) {
        return i;
      });
      console.log("" + posts.length + " posts gathered from inbox");
      if (!posts.length || !docs[docs.length - 1]) {
        minDate = 0;
      } else {
        minDate = posts[posts.length - 1].published;
      }
      return Resource.populate(posts, {
        path: 'author actor target object',
        select: User.PopulateFields
      }, function(err, docs) {
        if (err) {
          return callback(err);
        }
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
          return callback(err, results, minDate);
        });
      });
    };
  })(this));
};

UserSchema.statics.PopulateFields = PopulateFields;

fetchTimelinePostAndActivities = function(opts, postConds, actvConds, cb) {
  please.args({
    $contains: ['maxDate']
  });
  return Post.find(_.extend({
    parentPost: null,
    published: {
      $lt: opts.maxDate - 1
    }
  }, postConds)).sort('-published').populate('author').limit(opts.limit || 20).exec(HandleLimit(function(err, docs) {
    var minPostDate;
    if (err) {
      return cb(err);
    }
    minPostDate = 1 * (docs.length && docs[docs.length - 1].published) || 0;
    return async.parallel([
      function(next) {
        return Activity.find(_.extend(actvConds, {
          updated: {
            $lt: opts.maxDate,
            $gt: minPostDate
          }
        })).populate('resource actor target object').exec(next);
      }, function(next) {
        return Post.countList(docs, next);
      }
    ], HandleLimit(function(err, results) {
      var all;
      all = _.sortBy((results[0] || []).concat(results[1]), function(p) {
        return -p.published;
      });
      return cb(err, all, minPostDate);
    }));
  }));
};

UserSchema.statics.getUserTimeline = function(user, opts, cb) {
  please.args({
    $isModel: User
  }, {
    $contains: 'maxDate'
  });
  return fetchTimelinePostAndActivities({
    maxDate: opts.maxDate
  }, {
    author: user,
    parentPost: null
  }, {
    actor: user
  }, function(err, all, minPostDate) {
    return cb(err, all, minPostDate);
  });
};


/*
Create a post object with type comment.
 */

UserSchema.methods.postToParentPost = function(parentPost, data, cb) {
  var comment;
  please.args({
    $isModel: Post
  }, {
    $contains: ['content', 'type']
  }, '$isCb');
  comment = new Post({
    author: this,
    content: {
      body: data.content.body
    },
    parentPost: parentPost,
    type: data.type
  });
  comment.save(cb);
  return Notification.Trigger(this, Notification.Types.PostComment)(comment, parentPost, function() {});
};


/*
Create a post object and fan out through inboxes.
 */

UserSchema.methods.createPost = function(data, cb) {
  var post, self;
  self = this;
  please.args({
    $contains: ['content', 'type', 'tags']
  }, '$isCb');
  post = new Post({
    author: self.id,
    content: {
      title: data.content.title,
      body: data.content.body
    },
    type: data.type,
    tags: data.tags
  });
  self = this;
  return post.save((function(_this) {
    return function(err, post) {
      console.log('post save:', err, post);
      cb(err, post);
      if (err) {
        return;
      }
      self.update({
        $inc: {
          'stats.posts': 1
        }
      }, function() {});
      return jobs.create('post new', {
        title: "New post: " + self.name + " posted " + post.id,
        author: self,
        post: post
      }).save();
    };
  })(this));
};

UserSchema.methods.upvotePost = function(post, cb) {
  var self;
  self = this;
  please.args({
    $isModel: Post
  }, '$isCb');
  if ('' + post.author === '' + this.id) {
    return cb();
  } else {
    post.votes.addToSet('' + this.id);
    return post.save(function(err) {
      cb.apply(this, arguments);
      if (!err) {
        return jobs.create('post upvote', {
          title: "New upvote: " + self.name + " → " + post.id,
          authorId: post.author,
          post: post,
          agent: this
        }).save();
      }
    });
  }
};

UserSchema.methods.unupvotePost = function(post, cb) {
  var i;
  please.args({
    $isModel: Post
  }, '$isCb');
  console.log(post.votes);
  if ((i = post.votes.indexOf(this.id)) > -1) {
    console.log('not');
    post.votes.splice(i, 1);
    return post.save(function(err) {
      cb.apply(this, arguments);
      if (!err) {
        return jobs.create('post unupvote', {
          authorId: post.author,
          post: post,
          agent: this
        }).save();
      }
    });
  } else {
    return cb(null, post);
  }
};


/*
Generate stuffed profile for the controller.
 */

UserSchema.methods.genProfile = function(cb) {
  return cb(null, this.toJSON());
};

UserSchema.methods.getNotifications = function(limit, cb) {
  return Notification.find({
    recipient: this
  }).limit(limit).sort('-dateSent').exec(cb);
};

UserSchema.statics.fromObject = function(object) {
  return new User(void 0, void 0, true).init(object);
};

UserSchema.plugin(require('./lib/hookedModelPlugin'));

module.exports = User = Resource.discriminator("User", UserSchema);

var Activity, Follow, Inbox, Notification, ObjectId, Post, Problem, Resource, User, UserSchema, async, fetchTimelinePostAndActivities, jobs, mongoose, please, redis, winston, _;

mongoose = require('mongoose');

_ = require('underscore');

async = require('async');

winston = require('winston');

jobs = require('src/config/kue.js');

redis = require('src/config/redis.js');

please = require('src/lib/please.js');

please.args.extend(require('src/models/lib/pleaseModels.js'));

Resource = mongoose.model('Resource');

Activity = Resource.model('Activity');

Notification = mongoose.model('Notification');

Inbox = mongoose.model('Inbox');

Follow = Resource.model('Follow');

Post = Resource.model('Post');

Problem = Resource.model('Problem');

ObjectId = mongoose.Types.ObjectId;

UserSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true
  },
  username: {
    type: String,
    required: true
  },
  access_token: {
    type: String,
    required: true
  },
  facebook_id: {
    type: String,
    required: true
  },
  email: {
    type: String
  },
  avatar_url: {
    type: String
  },
  profile: {
    isStaff: {
      type: Boolean,
      "default": false
    },
    fbName: {
      type: String
    },
    location: {
      type: String,
      "default": ''
    },
    bio: {
      type: String,
      "default": ''
    },
    home: {
      type: String,
      "default": ''
    },
    bgUrl: {
      type: String,
      "default": '/static/images/rio.jpg'
    },
    serie: {
      type: String
    },
    avatarUrl: '',
    birthday: {
      type: Date
    }
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
  },
  preferences: {
    tags: []
  },
  meta: {
    sessionCount: {
      type: Number,
      "default": 0
    },
    created_at: {
      type: Date,
      "default": Date.now
    },
    updated_at: {
      type: Date,
      "default": Date.now
    },
    last_access: {
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

UserSchema.statics.APISelect = 'name username profile avatar_url path';

UserSchema.methods.getCacheFields = function(field) {
  switch (field) {
    case "Following":
      return "user:" + this.id + ":following";
    default:
      throw "Field " + field + " isn't a valid cache field.";
  }
};

UserSchema.virtual('avatarUrl').get(function() {
  if (this.avatar_url) {
    return this.avatar_url + '?width=200&height=200';
  } else {
    return 'https://graph.facebook.com/' + this.facebook_id + '/picture?width=200&height=200';
  }
});

UserSchema.virtual('path').get(function() {
  return '/@' + this.username;
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
    'author.id': this
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
      path: 'follower'
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
      path: 'followee'
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
  return redis.sismember(this.getCacheFields("Following"), "" + userId, (function(_this) {
    return function(err, val) {
      console.log('is member?', _this.id, userId, val);
      if (err) {
        console.log(arguments);
        return Follow.findOne({
          followee: userId,
          follower: _this.id
        }, function(err, doc) {
          return cb(err, !!doc);
        });
      } else {
        return cb(null, !!val);
      }
    };
  })(this));
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
        jobs.create('user follow', {
          title: "New follow: " + self.name + " → " + user.name,
          follower: self,
          followee: user,
          follow: doc
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


/*
 * Behold.
 */

UserSchema.methods.getTimeline = function(opts, callback) {
  var self, _ref;
  please.args({
    $contains: 'maxDate',
    $contains: 'source',
    source: {
      $among: ['inbox', 'global', 'problems']
    }
  }, '$isCb');
  self = this;
  if ((_ref = opts.source) === 'global' || _ref === 'inbox') {
    Post.find({
      parent: null,
      created_at: {
        $lt: opts.maxDate
      }
    }).select('-content.body').exec((function(_this) {
      return function(err, docs) {
        var minDate;
        if (err) {
          return callback(err);
        }
        if (!docs.length || !docs[docs.length]) {
          minDate = 0;
        } else {
          minDate = docs[docs.length - 1].created_at;
        }
        return callback(null, docs, minDate);
      };
    })(this));
    return;
  } else if (opts.source === 'inbox') {
    Inbox.find({
      recipient: self.id,
      dateSent: {
        $lt: opts.maxDate
      }
    }).sort('-dateSent').populate('resource').limit(25).exec((function(_this) {
      return function(err, docs) {
        var minDate, posts;
        if (err) {
          return cb(err);
        }
        posts = _.filter(_.pluck(docs, 'resource'), function(i) {
          return i;
        });
        console.log("" + posts.length + " posts gathered from inbox");
        if (posts.length || !posts[docs.length - 1]) {
          minDate = 0;
        } else {
          minDate = posts[posts.length - 1].created_at;
        }
        return callback(null, docs, minDate);
      };
    })(this));
    return;
  } else if (opts.source === 'problems') {
    Problem.find({
      created_at: {
        $lt: opts.maxDate
      }
    }, (function(_this) {
      return function(err, docs) {
        var minDate;
        if (err) {
          return callback(err);
        }
        if (!docs.length || !docs[docs.length]) {
          minDate = 0;
        } else {
          minDate = docs[docs.length - 1].created_at;
        }
        return callback(err, docs, minDate);
      };
    })(this));
    return;
  }
  return callback(null, docs, minDate);
};

fetchTimelinePostAndActivities = function(opts, postConds, actvConds, cb) {
  please.args({
    $contains: ['maxDate']
  });
  return Post.find(_.extend({
    parent: null,
    created_at: {
      $lt: opts.maxDate - 1
    }
  }, postConds)).sort('-created_at').limit(opts.limit || 20).exec(function(err, docs) {
    var minPostDate, results;
    if (err) {
      return cb(err);
    }
    results = _.filter(results, function(i) {
      return i;
    });
    minPostDate = 1 * (docs.length && docs[docs.length - 1].created_at) || 0;
    return cb(err, docs, minPostDate);
  });
};

UserSchema.methods.getNotifications = function(limit, cb) {
  return Notification.find({
    recipient: this
  }).limit(limit).sort('-dateSent').exec(cb);
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
    'author.id': '' + user.id,
    parent: null
  }, {
    actor: user
  }, function(err, all, minPostDate) {
    return cb(err, all, minPostDate);
  });
};

UserSchema.statics.toAuthorObject = function(user) {
  return {
    id: user.id,
    username: user.username,
    path: user.path,
    avatarUrl: user.avatarUrl,
    name: user.name
  };
};

UserSchema.statics.fromObject = function(object) {
  return new User(void 0, void 0, true).init(object);
};

UserSchema.plugin(require('./lib/hookedModelPlugin'));

UserSchema.plugin(require('./lib/trashablePlugin'));

UserSchema.plugin(require('./lib/selectiveJSON'), UserSchema.statics.APISelect);

module.exports = User = Resource.discriminator("User", UserSchema);

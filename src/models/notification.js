var MsgHtmlTemplates, MsgTemplates, Notification, NotificationSchema, Resource, Types, assert, async, mongoose, notifyUser, please, _;

mongoose = require('mongoose');

async = require('async');

_ = require('underscore');

assert = require('assert');

please = require('src/lib/please.js');

please.args.extend(require('./lib/pleaseModels.js'));

Resource = mongoose.model('Resource');

Types = {
  PostComment: 'PostComment',
  NewFollower: 'NewFollower',
  SharedPost: 'SharedPost',
  PostUpvote: 'PostUpvote'
};

MsgTemplates = {
  PostComment: '<%= agentName %> comentou na sua publicação.',
  NewFollower: '<%= agentName %> começou a te seguir.',
  PostUpvote: '<%= agentName %> votou na sua publicação.'
};

MsgHtmlTemplates = {
  PostComment: '<%= agentName %> comentou na sua publicação.',
  NewFollower: '<%= agentName %> começou a te seguir.',
  PostUpvote: '<%= agentName %> votou na sua publicação.'
};

NotificationSchema = new mongoose.Schema({
  agent: {
    type: mongoose.Schema.ObjectId,
    ref: 'User',
    required: true
  },
  agentName: {
    type: String
  },
  recipient: {
    type: mongoose.Schema.ObjectId,
    ref: 'User',
    required: true,
    index: 1
  },
  dateSent: {
    type: Date,
    index: 1,
    "default": Date.now
  },
  type: {
    type: String,
    required: true
  },
  seen: {
    type: Boolean,
    "default": false
  },
  accessed: {
    type: Boolean,
    "default": false
  },
  url: {
    type: String
  },
  resources: [
    {
      type: mongoose.Schema.ObjectId
    }
  ],
  thumbnailUrl: {
    type: String,
    required: false
  }
}, {
  toObject: {
    virtuals: true
  },
  toJSON: {
    virtuals: true
  }
});

NotificationSchema.virtual('msg').get(function() {
  if (MsgTemplates[this.type]) {
    return _.template(MsgTemplates[this.type], this);
  }
  console.warn("No template found for notification of type" + this.type);
  return "Notificação " + this.type;
});

NotificationSchema.virtual('msgHtml').get(function() {
  if (MsgHtmlTemplates[this.type]) {
    return _.template(MsgHtmlTemplates[this.type], this);
  } else if (MsgTemplates[this.type]) {
    return _.template(MsgTemplates[this.type], this);
  }
  console.warn("No html template found for notification of type" + this.type);
  return "Notificação " + this.type;
});

notifyUser = function(recpObj, agentObj, data, cb) {
  var User, note;
  please.args({
    $isModel: 'User'
  }, {
    $isModel: 'User'
  }, {
    $contains: ['url', 'type']
  }, '$isCb');
  User = Resource.model('User');
  note = new Notification({
    agent: agentObj.id,
    agentName: agentObj.name,
    recipient: recpObj,
    type: data.type,
    url: data.url,
    thumbnailUrl: data.thumbnailUrl || agentObj.avatarUrl
  });
  if (data.resources) {
    note.resources = data.resources;
  }
  return note.save(function(err, doc) {
    return typeof cb === "function" ? cb(err, doc) : void 0;
  });
};

NotificationSchema.statics.Trigger = function(agent, type) {
  var User;
  please.args({
    $isModel: 'User'
  });
  User = Resource.model('User');
  switch (type) {
    case Types.PostUpvote:
      return function(post, cb) {
        please.args({
          $isModel: 'Post'
        }, '$isCb');
        return User.findOne({
          _id: '' + post.author.id
        }, function(err, parentAuthor) {
          if (parentAuthor && !err) {
            return notifyUser(parentAuthor, agent, {
              type: Types.PostUpvote,
              url: post.path,
              resources: [post.id]
            }, function(err, res) {
              if (err) {
                console.warn("ERR:", err, err && err.errors);
                return cb(false);
              }
            });
          } else {
            console.warn("err: " + err + " or parentAuthor (id:" + post.author.id + ") not found");
            return cb(true);
          }
        });
      };
    case Types.PostComment:
      return function(commentObj, parentObj, cb) {
        var parentAuthorId;
        please.args({
          $isModel: 'Comment'
        }, {
          $isModel: 'Post'
        }, '$isCb');
        if (cb == null) {
          cb = function() {};
        }
        if ('' + parentObj.author.id === '' + agent.id) {
          return cb(false);
        }
        parentAuthorId = '' + parentObj.author.id;
        return User.findOne({
          _id: parentAuthorId
        }, function(err, parentAuthor) {
          if (parentAuthor && !err) {
            return notifyUser(parentAuthor, agent, {
              type: Types.PostComment,
              url: commentObj.path,
              resources: [parentObj.id, commentObj.id]
            }, cb);
          } else {
            console.warn("err: " + err + " or parentAuthor (id:" + parentAuthorId + ") not found");
            return cb(true);
          }
        });
      };
    case Types.NewFollower:
      return function(followerObj, followeeObj, cb) {
        if (cb == null) {
          cb = function() {};
        }
        cb();
        return Notification.findOne({
          type: Types.NewFollower,
          agent: followerObj,
          recipient: followeeObj
        }, function(err, doc) {
          if (doc) {
            doc.remove(function() {});
          }
          return notifyUser(followeeObj, followerObj, {
            type: Types.NewFollower,
            url: followerObj.path
          }, cb);
        });
      };
    default:
      throw "Unexisting notification type.";
  }
};

NotificationSchema.statics.Types = Types;

NotificationSchema.plugin(require('./lib/hookedModelPlugin'));

module.exports = Notification = mongoose.model("Notification", NotificationSchema);

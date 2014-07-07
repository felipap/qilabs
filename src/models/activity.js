var Activity, ActivitySchema, ContentHtmlTemplates, Inbox, Notification, ObjectId, Resource, Types, assert, async, createActivityAndInbox, mongoose, please, _;

assert = require('assert');

_ = require('underscore');

async = require('async');

mongoose = require('mongoose');

ObjectId = mongoose.Schema.ObjectId;

please = require('src/lib/please.js');

please.args.extend(require('./lib/pleaseModels.js'));

Resource = mongoose.model('Resource');

Inbox = mongoose.model('Inbox');

Notification = mongoose.model('Notification');

Types = {
  NewFollower: "NewFollower",
  GroupCreated: "GroupCreated",
  GroupMemberAdded: "GroupMemberAdded"
};

ContentHtmlTemplates = {
  NewFollower: '<a href="<%= actor.path %>"><%= actor && actor.name %></a> começou a seguir <a href="<%= target.path %>"><%= target && target.name %></a>.',
  GroupCreated: '<a href="<%= actor.path %>"><%= actor && actor.name %></a> criou o grupo <a href="<%= object && object.path %>"><%= object && object.name %></a>.',
  GroupMemberAdded: '<a href="<%= object.path %>"><%= object && object.name %></a> entrou para o laboratório <a href="<%= target && target.path %>"><%= target && target.name %></a>.'
};

ActivitySchema = new mongoose.Schema({
  actor: {
    type: ObjectId,
    ref: 'User',
    required: true
  },
  icon: {
    type: String
  },
  object: {
    type: ObjectId,
    ref: 'Resource'
  },
  target: {
    type: ObjectId,
    ref: 'Resource'
  },
  group: {
    type: ObjectId,
    ref: 'Group',
    indexed: 1
  },
  verb: {
    type: String,
    required: true
  },
  published: {
    type: Date,
    "default": Date.now
  },
  updated: {
    type: Date,
    "default": Date.now
  }
}, {
  toObject: {
    virtuals: true
  },
  toJSON: {
    virtuals: true
  }
});

ActivitySchema.virtual('content').get(function() {
  if (this.verb in ContentHtmlTemplates) {
    return _.template(ContentHtmlTemplates[this.verb], this);
  }
  console.warn("No html template found for activity of verb " + this.verb);
  return "Notificação " + this.verb;
});

ActivitySchema.virtual('apiPath').get(function() {
  return '/api/activities/' + this.id;
});

ActivitySchema.pre('save', function(next) {
  if (this.published == null) {
    this.published = new Date;
  }
  if (this.updated == null) {
    this.updated = new Date;
  }
  return next();
});

createActivityAndInbox = function(agentObj, data, cb) {
  var activity;
  please.args({
    $isModel: 'User'
  }, {
    $contains: ['verb', 'url', 'actor', 'object']
  }, '$isCb');
  activity = new Activity({
    verb: data.verb,
    url: data.url,
    actor: data.actor,
    object: data.object,
    target: data.target
  });
  return activity.save(function(err, doc) {
    if (err) {
      console.log(err);
    }
    console.log(doc);
    return agentObj.getFollowersIds(function(err, followers) {
      return Inbox.fillInboxes([agentObj._id].concat(followers), {
        author: agentObj,
        resource: activity
      }, cb);
    });
  });
};

ActivitySchema.statics.Trigger = function(agentObj, activityType) {
  var User;
  User = Resource.model('User');
  switch (activityType) {
    case Types.NewFollower:
      return function(opts, cb) {
        var genericData;
        please.args({
          follow: {
            $isModel: 'Follow'
          },
          followee: {
            $isModel: 'User'
          },
          follower: {
            $isModel: 'User'
          }
        }, '$isCb', arguments);
        genericData = {
          verb: activityType,
          actor: opts.follower,
          target: opts.followee
        };
        return Activity.remove(genericData, function(err, count) {
          if (err) {
            console.log('trigger err:', err);
          }
          return createActivityAndInbox(opts.follower, _.extend(genericData, {
            url: opts.follower.path,
            object: opts.follow
          }), function() {});
        });
      };
    default:
      throw "Unrecognized Activity Type passed to Trigger.";
  }
};

ActivitySchema.statics.Types = Types;

ActivitySchema.plugin(require('./lib/hookedModelPlugin'));

module.exports = Activity = Resource.discriminator("Activity", ActivitySchema);

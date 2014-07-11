
/*
TODO:
✔ Implement fan-out write for active users
- and fan-out read for non-active users.
See http://blog.mongodb.org/post/65612078649
 */
var Inbox, InboxSchema, Types, async, mongoose, please;

mongoose = require('mongoose');

async = require('async');

please = require('src/lib/please.js');

please.args.extend(require('./lib/pleaseModels.js'));

Types = {
  Post: 'Post',
  Activity: 'Activity'
};

InboxSchema = new mongoose.Schema({
  dateSent: {
    type: Date,
    indexed: 1
  },
  type: {
    type: String
  },
  recipient: {
    type: mongoose.Schema.ObjectId,
    ref: 'User',
    indexed: 1,
    required: true
  },
  author: {
    type: mongoose.Schema.ObjectId,
    ref: 'User',
    indexed: 1,
    required: true
  },
  resource: {
    type: mongoose.Schema.ObjectId,
    ref: 'Resource',
    required: true
  }
});

InboxSchema.pre('save', function(next) {
  if (this.dateSent == null) {
    this.dateSent = new Date();
  }
  return next();
});

InboxSchema.statics.fillInboxes = function(recipients, opts, cb) {
  please.args({
    '$isA': Array
  }, {
    $contains: ['resource', 'author']
  }, '$isCb');
  if (!recipients.length) {
    return cb(false, []);
  }
  return async.mapLimit(recipients, 5, ((function(_this) {
    return function(rec, done) {
      var inbox;
      inbox = new Inbox({
        resource: opts.resource,
        recipient: rec,
        author: opts.author
      });
      return inbox.save(done);
    };
  })(this)), cb);
};

InboxSchema.statics.fillUserInboxWithResources = function(recipient, resources, cb) {
  please.args({
    '$isModel': 'User'
  }, {
    '$isA': Array
  }, '$isCb');
  if (!resources.length) {
    return cb(false, []);
  }
  console.log('Resources found:', resources.length);
  return async.mapLimit(resources, 5, ((function(_this) {
    return function(resource, done) {
      var inbox;
      inbox = new Inbox({
        resource: resource,
        recipient: recipient,
        author: resource.author || resource.actor,
        dateSent: resource.published
      });
      return inbox.save(function(err, doc) {
        console.log("Resource " + resource.id + " of type " + resource.__t + " sent on " + resource.published + " added");
        return done(err, doc);
      });
    };
  })(this)), cb);
};

InboxSchema.statics.Types = Types;

InboxSchema.plugin(require('./lib/hookedModelPlugin'));

module.exports = Inbox = mongoose.model("Inbox", InboxSchema);

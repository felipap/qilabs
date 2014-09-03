var Follow, FollowSchema, Inbox, Notification, Resource, mongoose;

mongoose = require('mongoose');

Resource = mongoose.model('Resource');

Inbox = mongoose.model('Inbox');

Notification = mongoose.model('Notification');

FollowSchema = new mongoose.Schema({
  dateBegin: {
    type: Date,
    index: 1
  },
  follower: {
    type: mongoose.Schema.ObjectId,
    index: 1
  },
  followee: {
    type: mongoose.Schema.ObjectId,
    index: 1
  }
});

FollowSchema.pre('remove', function(next) {
  return Notification.remove({
    type: Notification.Types.NewFollower,
    agent: this.follower,
    recipient: this.followee
  }, function(err, result) {
    console.log("Removing " + err + " " + result + " notifications on unfollow.");
    return next();
  });
});

FollowSchema.pre('save', function(next) {
  if (this.dateBegin == null) {
    this.dateBegin = new Date;
  }
  return next();
});

FollowSchema.statics.fromObject = function(object) {
  return new Follow(void 0, void 0, true).init(object);
};

FollowSchema.plugin(require('./lib/hookedModelPlugin'));

Follow = Resource.discriminator("Follow", FollowSchema);

module.exports = function(app) {};

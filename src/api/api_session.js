var Activity, Follow, Garbage, Inbox, Notification, Post, Problem, Resource, User, mongoose, required;

mongoose = require('mongoose');

required = require('src/lib/required.js');

Resource = mongoose.model('Resource');

Garbage = mongoose.model('Garbage');

User = Resource.model('User');

Post = Resource.model('Post');

Inbox = mongoose.model('Inbox');

Follow = Resource.model('Follow');

Problem = Resource.model('Problem');

Activity = Resource.model('Activity');

Notification = mongoose.model('Notification');

module.exports = {
  permissions: [required.isMe],
  methods: {
    get: function(req, res) {
      console.log(req.query);
      if (req.query.user != null) {
        return User.find({}, function(err, docs) {
          return res.endJson({
            users: docs
          });
        });
      } else if (req.query.activity != null) {
        return Activity.find({}).populate('actor').exec(function(err, docs) {
          return res.endJson({
            activities: docs
          });
        });
      } else if (req.query.inbox != null) {
        return Inbox.find({}).populate('resource').exec(function(err, inboxs) {
          return res.endJson({
            err: err,
            inboxs: inboxs
          });
        });
      } else if (req.query.notification != null) {
        return Notification.find({}, function(err, notifics) {
          return res.endJson({
            notifics: notifics
          });
        });
      } else if (req.query.post != null) {
        return Post.find({}, function(err, posts) {
          return res.endJson({
            posts: posts
          });
        });
      } else if (req.query.problem != null) {
        return Problem.find({}, function(err, docs) {
          return res.endJson({
            docs: docs
          });
        });
      } else if (req.query.follow != null) {
        return Follow.find({}, function(err, follows) {
          return res.endJson({
            follows: follows
          });
        });
      } else if (req.query.note != null) {
        return Activity.find({}, function(err, notes) {
          return res.endJson({
            notes: notes
          });
        });
      } else if (req.query.garbage != null) {
        return Garbage.find({}, function(err, trash) {
          return res.endJson({
            trash: trash
          });
        });
      } else if (req.query.session != null) {
        return res.endJson({
          ip: req.ip,
          session: req.session
        });
      } else {
        return User.find({}, function(err, users) {
          return Post.find({}, function(err, posts) {
            return Inbox.find({}, function(err, inboxs) {
              return Follow.find({}, function(err, follows) {
                return Notification.find({}, function(err, notifics) {
                  return Activity.find({}, function(err, notes) {
                    var obj;
                    obj = {
                      ip: req.ip,
                      inboxs: inboxs,
                      notifics: notifics,
                      session: req.session,
                      users: users,
                      posts: posts,
                      follows: follows,
                      notes: notes
                    };
                    return res.endJson(obj);
                  });
                });
              });
            });
          });
        });
      }
    }
  }
};

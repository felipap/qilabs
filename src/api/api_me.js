var Activity, Inbox, Notification, Post, Resource, mongoose, required;

mongoose = require('mongoose');

required = require('src/lib/required.js');

Activity = mongoose.model('Activity');

Inbox = mongoose.model('Inbox');

Notification = mongoose.model('Notification');

Resource = mongoose.model('Resource');

Post = Resource.model('Post');

module.exports = {
  permissions: [required.login],
  children: {
    'profile': {
      put: function(req, res) {
        var bio, home, location, trim;
        trim = function(str) {
          return str.replace(/(^\s+)|(\s+$)/gi, '');
        };
        console.log('profile received', req.body.profile);
        bio = trim(req.body.profile.bio.replace(/^\s+|\s+$/g, '').slice(0, 300));
        home = trim(req.body.profile.home.replace(/^\s+|\s+$/g, '').slice(0, 35));
        location = trim(req.body.profile.location.replace(/^\s+|\s+$/g, '').slice(0, 35));
        if (bio) {
          req.user.profile.bio = bio;
        }
        if (home) {
          req.user.profile.home = home;
        }
        if (location) {
          req.user.profile.location = location;
        }
        req.user.save(function() {});
        return res.endJson({
          error: false
        });
      }
    },
    'notifications': {
      permissions: [required.login],
      get: function(req, res) {
        var limit;
        if (req.query.limit) {
          limit = Math.max(0, Math.min(10, parseInt(req.query.limit)));
        } else {
          limit = 6;
        }
        return req.user.getNotifications(limit, req.handleErrResult(function(notes) {
          return res.endJson({
            data: notes,
            error: false
          });
        }));
      },
      children: {
        ':id/access': {
          get: function(req, res) {
            var nId;
            if (!(nId = req.paramToObjectId('id'))) {
              return;
            }
            return Notification.update({
              recipient: req.user.id,
              _id: nId
            }, {
              accessed: true,
              seen: true
            }, {
              multi: false
            }, function(err) {
              return res.endJson({
                error: !!err
              });
            });
          }
        },
        'seen': {
          post: function(req, res) {
            return Notification.update({
              recipient: req.user.id
            }, {
              seen: true
            }, {
              multi: true
            }, function(err) {
              return res.endJson({
                error: !!err
              });
            });
          }
        }
      }
    },
    'inbox/posts': {
      get: function(req, res) {
        var maxDate;
        if (isNaN(maxDate = parseInt(req.query.maxDate))) {
          maxDate = Date.now();
        }
        return req.user.getTimeline({
          maxDate: maxDate,
          source: 'inbox'
        }, req.handleErrResult(function(docs, minDate) {
          if (minDate == null) {
            minDate = -1;
          }
          return res.endJson({
            minDate: minDate,
            data: docs
          });
        }));
      }
    },
    'global/posts': {
      get: function(req, res) {
        var maxDate;
        if (isNaN(maxDate = parseInt(req.query.maxDate))) {
          maxDate = Date.now();
        }
        return req.user.getTimeline({
          maxDate: maxDate,
          source: 'global'
        }, req.handleErrResult(function(docs, minDate) {
          if (minDate == null) {
            minDate = -1;
          }
          return res.endJson({
            minDate: minDate,
            data: docs
          });
        }));
      }
    },
    'logout': {
      name: 'logout',
      post: function(req, res) {
        req.logout();
        return res.redirect('/');
      }
    }
  }
};

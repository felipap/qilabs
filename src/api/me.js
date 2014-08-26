var Activity, Inbox, Notification, Post, Resource, mongoose, required;

mongoose = require('mongoose');

required = require('src/lib/required.js');

Activity = mongoose.model('Activity');

Inbox = mongoose.model('Inbox');

Notification = mongoose.model('Notification');

Resource = mongoose.model('Resource');

Post = Resource.model('Post');

module.exports = function(app) {
  var router;
  router = require('express').Router();
  router.use(required.login);
  router.put('/profile', function(req, res) {
    var bio, home, location, name, trim;
    trim = function(str) {
      return str.replace(/(^\s+)|(\s+$)/gi, '');
    };
    console.log('profile received', req.body.profile);
    name = req.body.profile.nome1.replace(/\s/, '') + ' ' + req.body.profile.nome2.replace(/\s/, '');
    bio = trim(req.body.profile.bio).slice(0, 300);
    home = trim(req.body.profile.home).slice(0, 37);
    location = trim(req.body.profile.location).slice(0, 37);
    if (name) {
      req.user.name = name;
    }
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
    return res.endJSON({
      data: req.user.toJSON(),
      error: false
    });
  });
  router.route('notifications').get(function(req, res) {
    var limit;
    if (req.query.limit) {
      limit = Math.max(0, Math.min(10, parseInt(req.query.limit)));
    } else {
      limit = 6;
    }
    return req.user.getNotifications(limit, req.handleErrResult(function(notes) {
      return res.endJSON({
        data: notes,
        error: false
      });
    }));
  });
  router.get('/inbox/posts', function(req, res) {
    var maxDate;
    console.log('oi');
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
      return res.endJSON({
        minDate: minDate,
        data: docs
      });
    }));
  });
  router.get('/inbox/problems', function(req, res) {
    var maxDate;
    if (isNaN(maxDate = parseInt(req.query.maxDate))) {
      maxDate = Date.now();
    }
    return req.user.getTimeline({
      maxDate: maxDate,
      source: 'problems'
    }, req.handleErrResult(function(docs, minDate) {
      if (minDate == null) {
        minDate = -1;
      }
      return res.endJSON({
        minDate: minDate,
        data: docs
      });
    }));
  });
  router.get('/inbox/posts', function(req, res) {
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
      return res.endJSON({
        minDate: minDate,
        data: docs
      });
    }));
  });
  router.post('/logout', function(req, res) {
    req.logout();
    return res.redirect('/');
  });
  return router;
};

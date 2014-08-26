var Post, Resource, User, async, mongoose, pages, required, _;

async = require('async');

mongoose = require('mongoose');

_ = require('underscore');

required = require('src/lib/required.js');

Resource = mongoose.model('Resource');

User = Resource.model('User');

Post = Resource.model('Post');

pages = require('src/config/pages.js').data;

module.exports = function(app) {
  var router;
  router = require('express').Router();
  router.use(required.login);
  router.param('tag', function(req, res, next) {
    var tag;
    tag = req.params.tag;
    if (!tag in pages) {
      return res.status(404).endJSON({
        error: true
      });
    }
    req.tag = tag;
    return next();
  });
  router.get('/:tag/notes', function(req, res, next) {
    var maxDate;
    if (isNaN(maxDate = parseInt(req.query.maxDate))) {
      maxDate = Date.now();
    }
    return Post.find({
      type: 'Note',
      parent: null,
      created_at: {
        $lt: maxDate
      },
      subject: req.tag
    }).exec((function(_this) {
      return function(err, docs) {
        var minDate;
        if (err) {
          return next(err);
        }
        if (!docs.length || !docs[docs.length]) {
          minDate = 0;
        } else {
          minDate = docs[docs.length - 1].created_at;
        }
        return res.endJSON({
          minDate: minDate,
          data: docs
        });
      };
    })(this));
  });
  router.get('/:tag/discussions', function(req, res, next) {
    var maxDate;
    if (isNaN(maxDate = parseInt(req.query.maxDate))) {
      maxDate = Date.now();
    }
    return Post.find({
      type: 'Discussion',
      parent: null,
      created_at: {
        $lt: maxDate
      },
      subject: req.tag
    }).exec((function(_this) {
      return function(err, docs) {
        var minDate;
        if (err) {
          return next(err);
        }
        if (!docs.length || !docs[docs.length]) {
          minDate = 0;
        } else {
          minDate = docs[docs.length - 1].created_at;
        }
        return res.endJSON({
          minDate: minDate,
          data: docs
        });
      };
    })(this));
  });
  return router;
};

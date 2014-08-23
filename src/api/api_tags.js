var Post, Resource, User, async, mongoose, required, tags, _;

async = require('async');

mongoose = require('mongoose');

_ = require('underscore');

required = require('src/lib/required.js');

tags = require('src/config/tags.js');

Resource = mongoose.model('Resource');

User = Resource.model('User');

Post = Resource.model('Post');

module.exports = {
  permissions: [required.login],
  children: {
    ':tag/notes': {
      get: function(req, res) {
        var maxDate, tag;
        tag = req.params.tag;
        if (!(tag in tags.data)) {
          return res.status(404).endJson({
            error: true
          });
        }
        if (isNaN(maxDate = parseInt(req.query.maxDate))) {
          maxDate = Date.now();
        }
        return Post.find({
          type: 'Note',
          parent: null,
          created_at: {
            $lt: maxDate
          },
          subject: tag
        }).exec((function(_this) {
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
            return res.endJson({
              minDate: minDate,
              data: docs
            });
          };
        })(this));
      }
    },
    ':tag/discussions': {
      get: function(req, res) {
        var maxDate, tag;
        tag = req.params.tag;
        if (!(tag in tags.data)) {
          return res.status(404).endJson({
            error: true
          });
        }
        if (isNaN(maxDate = parseInt(req.query.maxDate))) {
          maxDate = Date.now();
        }
        return Post.find({
          type: 'Discussion',
          parent: null,
          created_at: {
            $lt: maxDate
          },
          subject: tag
        }).exec((function(_this) {
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
            return res.endJson({
              minDate: minDate,
              data: docs
            });
          };
        })(this));
      }
    }
  }
};

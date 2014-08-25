var Post, Resource, User, async, data, key, mongoose, pages, path, required, reversePages, _;

async = require('async');

mongoose = require('mongoose');

_ = require('underscore');

required = require('src/lib/required.js');

Resource = mongoose.model('Resource');

User = Resource.model('User');

Post = Resource.model('Post');

pages = require('src/config/pages.js').data;

reversePages = {};

for (key in pages) {
  data = pages[key];
  path = data.path;
  if (path[0] === '/') {
    path = path.slice(0);
  }
  reversePages[path] = _.extend({
    tag: key
  }, data);
}

module.exports = {
  permissions: [required.login],
  children: {
    ':tag/notes': {
      get: function(req, res) {
        var maxDate, tag;
        tag = req.params.tag;
        console.log(tag);
        if (!tag in pages) {
          console.log(tag);
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
        if (!(tag in pages)) {
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

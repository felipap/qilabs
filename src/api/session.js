var Activity, Follow, Garbage, Inbox, Notification, Post, Problem, Resource, User, async, mongoose, required,
  __indexOf = [].indexOf || function(item) { for (var i = 0, l = this.length; i < l; i++) { if (i in this && this[i] === item) return i; } return -1; };

mongoose = require('mongoose');

required = require('src/lib/required.js');

async = require('async');

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
  permissions: [required.login, required.isStaff],
  get: function(req, res) {
    var e, models, _i, _len, _ref;
    models = [[Activity, 'actor'], [Inbox, 'resource'], User, Notification, Post, Problem, Follow, Garbage];
    if (req.query.session != null) {
      return res.endJson({
        ip: req.ip,
        session: req.session
      });
    }
    for (_i = 0, _len = models.length; _i < _len; _i++) {
      e = models[_i];
      if (e instanceof Array) {
        if (req.query[e[0].modelName.toLowerCase()] != null) {
          e[0].find({}).populate(e[1]).exec(function(err, docs) {
            return res.endJson({
              model: e[0].modelName,
              err: err,
              docs: docs
            });
          });
          return;
        }
      } else if (req.query[e.modelName.toLowerCase()] != null) {
        e.find({}, function(err, _docs) {
          var doc, docs;
          if (_docs[0].fullJSON) {
            docs = (function() {
              var _j, _len1, _results;
              _results = [];
              for (_j = 0, _len1 = _docs.length; _j < _len1; _j++) {
                doc = _docs[_j];
                _results.push(doc.fullJSON());
              }
              return _results;
            })();
          } else {
            docs = (function() {
              var _j, _len1, _results;
              _results = [];
              for (_j = 0, _len1 = _docs.length; _j < _len1; _j++) {
                doc = _docs[_j];
                _results.push(doc.toJSON());
              }
              return _results;
            })();
          }
          return res.endJson({
            model: e.modelName,
            err: err,
            docs: docs
          });
        });
        return;
      }
    }
    console.log("Celeuma", Post.modelName.toLowerCase(), req.query, (_ref = Post.modelName.toLowerCase(), __indexOf.call(req.query, _ref) >= 0), __indexOf.call(req.query, 'post') >= 0, typeof req.query['post'] === 'undefined', typeof req.query['post']);
    res.status(404).endJson({
      error: "Cadê?"
    });
  }
};

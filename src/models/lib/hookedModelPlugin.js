var circumventionists, mongoose,
  __indexOf = [].indexOf || function(item) { for (var i = 0, l = this.length; i < l; i++) { if (i in this && this[i] === item) return i; } return -1; };

mongoose = require('mongoose');

circumventionists = ['findByIdAndUpdate', 'findOneAndUpdate', 'findOneAndRemove', 'findByIdAndUpdate'];

module.exports = function(schema, options) {
  var a, hookedActions, smname, _i, _len;
  for (_i = 0, _len = circumventionists.length; _i < _len; _i++) {
    smname = circumventionists[_i];
    schema.statics[smname] = function() {
      throw "Invalid static method call on hookedModel " + schema + ". Use document methods.";
    };
  }
  hookedActions = (function() {
    var _j, _len1, _ref, _results;
    _ref = schema.callQueue;
    _results = [];
    for (_j = 0, _len1 = _ref.length; _j < _len1; _j++) {
      a = _ref[_j];
      _results.push(a[1][0]);
    }
    return _results;
  })();
  if (__indexOf.call(hookedActions, 'remove') >= 0) {
    return schema.statics.remove = function() {
      throw "The .remove static method has been disabled for the hookedModel because it has middlewares tied to the 'remove' action. Remove each document separately so that these middlewares can trigger";
    };
  }
};

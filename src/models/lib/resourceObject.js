var BaseSchema, ResourceSchema, mongoose, util;

mongoose = require('mongoose');

util = require('util');

BaseSchema = function() {
  mongoose.Schema.apply(this, arguments);
  return this.pre('remove', function(next) {
    var Activity;
    next();
    Activity = mongoose.model('Activity');
    return Activity.find().or([
      {
        target: this
      }, {
        object: this
      }
    ]).exec((function(_this) {
      return function(err, docs) {
        console.log("Activity " + err + " " + docs.length + " removed bc " + _this.id);
        return docs.forEach(function(doc) {
          return doc.remove();
        });
      };
    })(this));
  });
};

util.inherits(BaseSchema, mongoose.Schema);

ResourceSchema = new BaseSchema;

ResourceSchema.statics.Schema = BaseSchema;

module.exports = mongoose.model('Resource', ResourceSchema);

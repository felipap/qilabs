var BaseSchema, GarbageSchema, mongoose, util;

mongoose = require('mongoose');

util = require('util');

BaseSchema = function() {
  return mongoose.Schema.apply(this, arguments);
};

util.inherits(BaseSchema, mongoose.Schema);

GarbageSchema = new BaseSchema({}, {
  strict: false
});

GarbageSchema.statics.Schema = BaseSchema;

module.exports = mongoose.model('Garbage', GarbageSchema);

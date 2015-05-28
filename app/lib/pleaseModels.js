
var mongoose = require('mongoose');

module.exports = {
  $is: function(value, expected) {
    if (expected.schema && expected.schema instanceof mongoose.Schema) {
      if (value instanceof mongoose.model(expected)) {
        return;
      }
    }
    if (value !== expected) {
      return true;
    }
  },
  $model: function(value, expected) {
    if (expected.schema && expected.schema instanceof mongoose.Schema) {
      var model = expected;
    } else if (typeof expected === 'string') {
      var model = mongoose.model(expected);
    } else {
      return true;
    }

    // Testing if value is instanceof Resource won't work for subdocuments AFAIT (AFAI've tested)
    if (!(value instanceof model)) {
      return true;
    }
  },
  $ObjectId: function(value) {
    if (value instanceof mongoose.Types.ObjectId) {
      return false;
    }

    try {
      mongoose.Types.ObjectId.createFromHexString(value)
    } catch (e) {
      return true;
    }
  },
};
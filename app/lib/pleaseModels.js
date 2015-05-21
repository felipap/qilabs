
var mongoose = require('mongoose')

module.exports = {
  $is: {
    test: function(value, expected) {
      if (expected.schema && expected.schema instanceof mongoose.Schema) {
        if (value instanceof mongoose.model(expected)) {
          return false;
        }
      }
      if (value === expected) {
        return false;
      }
      return "Argument '"+value+"'' doesn't match '$is': "+expected;
    }
  },

  $model: {
    test: function(value, expected) {
      var model
      if (expected.schema && expected.schema instanceof mongoose.Schema) {
        model = expected
      } else if (typeof expected === 'string') {
        model = mongoose.model(expected)
      } else {
        return "Invalid expected value for assertion of type '$model': "+expected
      }

      // Testing if value is instanceof Resource won't work for subdocuments AFAIT (AFAI've tested)
      if (value instanceof model) {
        return false
      }
      return "The following argument doesn't match {model:"+expected+"}: '"+(JSON.stringify(value))+"'"
    }
  },
  $ObjectId: {
    test: function(value) {
      var mongoose = require('mongoose')
      if (value instanceof mongoose.Types.ObjectId)
        return false;

      try {
        mongoose.Types.ObjectId.createFromHexString(value)
      } catch (e) {
        return "Invalid expected value for assertion of type '$ObjectId': "+value+": "+e
      }
      return false
    }
  },
}
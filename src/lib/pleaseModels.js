
module.exports = {
  $isModel: {
    test: function(value, expected) {
      var mongoose = require('mongoose')
      var Resource = mongoose.model('Resource')
      var model
      if (expected.schema && expected.schema instanceof mongoose.Schema) {
        model = expected
      } else if (typeof expected === 'string') {
        model = mongoose.model(expected)
      } else {
        return "Invalid expected value for assertion of type '$ismodel': "+expected
      }

      // Testing if value is instanceof Resource won't work for subdocuments AFAIT (AFAI've tested)
      if (value instanceof model) {
        return false
      } else if (value.__t === expected || value instanceof Resource) {
        return false
      }
      return "The following argument doesn't match {ismodel:"+expected+"}: '"+(JSON.stringify(value))+"'"
    }
  },
  $ObjectId: {
    test: function(value) {
      var mongoose = require('mongoose')
      if (value instanceof mongoose.Types.ObjectId)
        return false;

      try {
        var id = mongoose.Types.ObjectId.createFromHexString(value)
      } catch (e) {
        return "Invalid expected value for assertion of type '$ObjectId': "+value+": "+e
      }
      return false
    }
  },
}

mongoose = require('mongoose')
assert = require('assert')

module.exports = function (schema, getModel) {

	schema.statics.fromObject = function (object) {
		var model = getModel()
		try {
			assert(typeof object.__v !== 'undefined',
				"Argument isn't a valid object (no __v attribute). "+
				"It might be the result of a toJSON call.")
			return new model(undefined, undefined, true).init(object)
		} catch (e) {
			console.log(""+model.modelName+".fromObject failed for argument", object)
			console.trace()
			throw e
		}
	}
}
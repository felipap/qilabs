
logger = require('src/core/bunyan')()

module.exports = function (schema, getModel) {

	schema.statics.fromObject = function (object) {
		var model = getModel()
		try {
			if (typeof object.__v === 'undefined')
				logger.warn("Argument might not be a valid object: it has no __v attribute. "+
				"Perhaps it's the result of a toJSON call, or an object that hasn't been saved yet.",
				object)
			return new model(undefined, undefined, true).init(object)
		} catch (e) {
			console.log(""+model.modelName+".fromObject failed for argument", object)
			console.trace()
			throw e
		}
	}
}
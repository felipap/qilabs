
var logger = global.logger.mchild()

module.exports = function (schema) {

	schema.statics.fromObject = function (object) {
		try {
			if (typeof object.__v === 'undefined')
				logger.debug("Argument might not be a valid object: it has no __v attribute. "+
				"Perhaps it's the result of a toJSON call, or an object that hasn't been saved yet.",
				object)
			if (typeof object._id === 'undefined')
				throw new Error("Argument without _id attribute.")
			return new this(undefined, undefined, true).init(object)
		} catch (e) {
			logger.error(""+this.modelName+".fromObject failed for argument", object)
			console.trace()
			throw e
		}
	}
}
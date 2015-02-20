
// Create a special mongoose model that removes static methods that circumvent (don't fire) mongoose
// middlewares, namely: .update, .findByIdAndUpdate, .findOneAndUpdate, .findOneAndRemove and
// .findByIdAndRemove.
// See: http://mongoosejs.com/docs/middleware.html

circumventionists = [
	// 'update',
	// 'remove',
	// 'findOneAndUpdate',
	// 'findByIdAndUpdate',
	'findOneAndRemove',
]

module.exports = function (schema, options) {

	// Basic
	circumventionists.forEach(function (smname) {
		schema.statics[smname] = function () {
			throw 'Invalid static method call on hookedModel '+schema+
				'. Use document methods.'
		}
	})

	// Check if there are any hooks to remove. If so, remove .remove too. ... lol
	var hookedActions = []
	schema.callQueue.forEach(function (m) {
		hookedActions.push(m[1][0])
	})
	if ('remove' in hookedActions) {
		schema.statics.remove = function () {
			throw 'The .remove static method has been disabled for the hookedModel'+
				' because it has middlewares tied to the \'remove\' action. Remove each'+
				' document separately so that these middlewares can trigger'
		}
	}
}
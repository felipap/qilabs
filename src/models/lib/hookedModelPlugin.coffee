
# Create a special mongoose model that removes static methods that circumvent (don't fire)
# mongoose middlewares, namely: .update, .findByIdAndUpdate, .findOneAndUpdate,
# .findOneAndRemove and .findByIdAndRemove.
# See: http://mongoosejs.com/docs/middleware.html

mongoose = require 'mongoose'

circumventionists = [
	# 'update',
	# 'remove',
	'findByIdAndUpdate',
	'findOneAndUpdate',
	'findOneAndRemove',
	'findByIdAndUpdate',
]

module.exports = (schema, options) ->

	# Basic 
	for smname in circumventionists
		schema.statics[smname] = () ->
			throw "Invalid static method call on hookedModel #{schema}. Use document methods."

	# Check if there are any hooks to remove. If so, remove .remove too. ... lol
	hookedActions = (a[1][0] for a in schema.callQueue)
	if 'remove' in hookedActions
		schema.statics.remove = () ->
			throw "The .remove static method has been disabled for the hookedModel because
					it has middlewares tied to the 'remove' action. Remove each document
					separately so that these middlewares can trigger"
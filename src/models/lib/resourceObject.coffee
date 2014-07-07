
mongoose = require 'mongoose'
util = require 'util'

BaseSchema = () ->
	mongoose.Schema.apply(@, arguments)

	@pre 'remove', (next) ->
		next()
		Activity = mongoose.model 'Activity'
		Activity.find().or([{target:@},{object:@}]).exec (err, docs) =>
			console.log "Activity #{err} #{docs.length} removed bc #{@id}"
			docs.forEach (doc) ->
				doc.remove()

util.inherits(BaseSchema, mongoose.Schema)

ResourceSchema = new BaseSchema 

ResourceSchema.statics.Schema = BaseSchema

module.exports = mongoose.model('Resource', ResourceSchema)
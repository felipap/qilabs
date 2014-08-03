
mongoose = require 'mongoose'
util = require 'util'

BaseSchema = () ->
	mongoose.Schema.apply(@, arguments)

util.inherits(BaseSchema, mongoose.Schema)

GarbageSchema = new BaseSchema({}, {strict:false}) # scrit:false to allow custom fields

GarbageSchema.statics.Schema = BaseSchema

module.exports = mongoose.model('Garbage', GarbageSchema)
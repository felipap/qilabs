
var mongoose = require('mongoose')
var util = require('util')

BaseSchema = function () {
	mongoose.Schema.apply(this, arguments)
}

util.inherits(BaseSchema, mongoose.Schema)

GarbageSchema = new BaseSchema({}, {strict:false}) // scrit:false to allow custom fields
GarbageSchema.statics.Schema = BaseSchema

module.exports = mongoose.model('Garbage', GarbageSchema)
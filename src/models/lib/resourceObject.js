
mongoose = require('mongoose')
util = require('util')

BaseSchema = function () {
	mongoose.Schema.apply(this, arguments)
	
	this.pre('remove', function(next) {
		next()
		var Activity = mongoose.model('Activity')
		Activity
			.find()
			.or([{ target: this }, { object: this }])
			.exec(function(err, docs) {
				console.log("Activity " + err + " " + docs.length + " removed bc " + this.id)
				docs.forEach(function(doc) {
					doc.remove()
				})
			}.bind(this))
	})
}

util.inherits(BaseSchema, mongoose.Schema)
ResourceSchema = new BaseSchema
ResourceSchema.statics.Schema = BaseSchema

module.exports = mongoose.model('Resource', ResourceSchema)
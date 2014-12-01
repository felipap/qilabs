
mongoose = require('mongoose')
util = require('util')

BaseSchema = function () {
	mongoose.Schema.apply(this, arguments)

	// this.pre('remove', function(next) {
	// 	var Activity = mongoose.model('Activity')
	// 	Activity
	// 		.find()
	// 		.or([{ target: this.id }, { object: this.id }])
	// 		.exec(function(err, docs) {
	// 			if (err) {
	// 				console.log("error", err);
	// 				return next(true);
	// 			}
	// 			console.log("Activity " + err + " " + docs.length + " removed bc " + this.id)
	// 			docs.forEach(function(doc) {
	// 				doc.remove()
	// 			})
	// 			next()
	// 		}.bind(this))
	// })
}

util.inherits(BaseSchema, mongoose.Schema)
ResourceSchema = new BaseSchema
ResourceSchema.statics.Schema = BaseSchema

module.exports = mongoose.model('Resource', ResourceSchema)
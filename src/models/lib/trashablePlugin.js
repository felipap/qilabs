
// Adds addToGarbage method to the model.
// addToGarbage creates a copy of the model and adds it to the garbage collection.
// Attributes 'deleted_at' and 'old_id' are added to the models. 

mongoose = require('mongoose')
Garbage = mongoose.model('Garbage')

addToGarbage = function (cb) {
	// http://mathias-biilmann.net/posts/2011/07/12/garbage-collection
	console.log('adding to garbage', this.content)
	var obj = this.toObject()
	// delete obj.id
	// delete obj._id
	obj.old_id = ''+this.id
	obj.deleted_at = Date.now()
	deleted = new Garbage(obj)
	deleted.save(cb)
}

module.exports = function (schema, options) {
	schema.methods.addToGarbage = addToGarbage
	schema.pre('remove', function (next) {
		next()
		this.addToGarbage(function (err) {
			console.log("err:"+err+" - moving post "+this.id+" to garbage")
		}.bind(this))
	})
}
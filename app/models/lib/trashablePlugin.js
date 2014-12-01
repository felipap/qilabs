
// Adds addToGarbage method to the model.
// addToGarbage creates a copy of the model and adds it to the garbage collection.
// Attributes 'deleted_at' and 'old_id' are added to the models.
// sauce? http://mathias-biilmann.net/posts/2011/07/12/garbage-collection

var mongoose = require('mongoose')
var Garbage = mongoose.model('Garbage')

addToGarbage = function (cb) {
	console.log('adding to garbage', this, this._id)
	// this is a subdocument, so saving toObject's result will result in "Maximum call stack size exceeded".
	// Instead, let's try using this._doc._doc (which is apparently the original object), and see if it works.
	var obj;
	if ('__parentArray' in this._doc) { // In case it's a subdoc, we'll have to digg.
		obj = this._doc._doc;
	} else {
		obj = this.toObject()
	}
	delete obj._id
	obj.old_id = ''+this.id
	obj.deleted_at = Date.now()
	deleted = new Garbage(obj)
	deleted.save(cb)
}

module.exports = function (schema, options) {
	schema.methods.addToGarbage = addToGarbage
	schema.pre('remove', function (next) {
		console.log("Trying to send object to garbage.")
		addToGarbage.bind(this)(function (err) {
			if (err) {
				console.log("err:"+err+" - moving post "+this.id+" to garbage")
			}
			next(err)
		}.bind(this))
	})
}

// Creates and object if it's not there already, else updates.
// Customized from https://github.com/drudge/mongoose-findorcreate

var _ = require('lodash')

module.exports = function (conditions, doc, options, callback) {
	if (arguments.length < 4) {
		if (typeof options === 'function') { // Scenario: findOrCreate(conditions, doc, callback)
			var callback = options
			var options = {}
		} else if (typeof doc === 'function') { // Scenario: findOrCreate(conditions, callback)
			var callback = doc
			var doc = {}
			var options = {}
		}
	}

	this.findOne(conditions, function (err, result) {
		if (err || result) {
			if (options && options.upsert && !err) {
				console.log("Object already here, so updating.", conditions)
				this.update(conditions, doc, function (err, count) {
					if err
						return callback(err)
					this.findOne(conditions, function (err, result) {
						callback(err, result, false)
					});
				}.bind(this))
			} else {
				callback(err, result, false)
			}
		} else {
			_.extend(conditions, doc)
			this.create(conditions, function (err, obj) {
				callback(err, obj, true)
			})
		}
	}.bind(this))
}
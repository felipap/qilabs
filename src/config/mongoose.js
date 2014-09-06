
mongoose = require('mongoose')
nconf = require('nconf')

mongoose.connect(nconf.get('MONGOLAB_URI') || 'mongodb://localhost/madb')

require('src/models/lib/resourceObject')
require('src/models/lib/garbageObject')

module.exports = function () {

	// We can't simply import all that's inside src/models, because some modules depend on the registration
	// of other models (having ran other modules).

	var models = ['notification', 'inbox', 'comment', 'post', 'follow', 'activity', 'problem', 'user']
	for (var i=0; i<models.length; i++) {
	 	require('src/models/'+models[i])()
	}

	return mongoose
}
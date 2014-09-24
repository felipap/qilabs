
mongoose = require('mongoose')
nconf = require('nconf')

mongoose.connect(nconf.get('MONGOLAB_URI') || 'mongodb://localhost/madb')
mongoose.connection.once('connected', function() {
	console.log("Connected to database")
});

require('src/models/lib/resourceObject')
require('src/models/lib/garbageObject')

if (nconf.get('MONGOOSE_DEBUG')) {
	mongoose.set('debug', true);
}

module.exports = function () {

	var modules = [];

	// Ordering is crutial!
	var models = ['notification', 'inbox', 'user', 'karma', 'comment', 'post', 'follow', 'activity', 'problem']
	for (var i=0; i<models.length; i++) {
		var it = require('src/models/'+models[i]);
	 	modules.push(it)
		it();
	}

	for (var i=0; i<modules.length; i++) {
		if (modules[i].start)
		 	modules[i].start();
	}

	return mongoose
}
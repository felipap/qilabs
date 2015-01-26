
var mongoose = require('mongoose')
var nconf = require('nconf')
var fs = require('fs')
var path = require('path')
var bunyan = require('bunyan')

var logger = global.logger.mchild()

mongoose.connect(nconf.get('MONGOLAB_URI') || 'mongodb://localhost/madb')
mongoose.connection.once('connected', function () {
	logger.info("Connected to database")
})

require('app/models/lib/garbageObject')

if (nconf.get('MONGOOSE_DEBUG')) {
	mongoose.set('debug', true)
}

var MODELS_PATH = path.normalize(__dirname+'/../models')

module.exports = function () {
	var schemas = []
	var models = fs.readdirSync(MODELS_PATH)

	var models = {
		'inbox': 'Inbox',
		'user': 'User',
		'comment': 'Comment',
		'karma': 'KarmaItem',
		'karma_chunk': 'KarmaChunk',
		'comment_tree': 'CommentTree',
		'notification': 'Notification',
		'notification_chunk': 'NotificationChunk',
		'post': 'Post',
		'follow': 'Follow',
		'problem': 'Problem',
		'problem_set': 'ProblemSet',
	}

	for (var m in models)
	if (models.hasOwnProperty(m)) {
		logger.trace("Registering model "+m)
		var schema = require(path.join(MODELS_PATH, m))
		var module = mongoose.model(models[m], schema)
		schemas.push(schema);
	}

	// Allow modules to set local variables that might have raised race conditions when
	// models where being registered
	// Ex: mongoose.model('User') shan't called before models/user.coffee is required above.
	for (var i=0; i<schemas.length; i++) {
		if (schemas[i].start)
		 	schemas[i].start()
	}

	return mongoose
}
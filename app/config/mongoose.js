
'use strict';

var mongoose = require('mongoose')
var nconf = require('nconf')
var fs = require('fs')
var path = require('path')

var logger = global.logger.mchild()

mongoose.connect(nconf.get('MONGOLAB_URI') || 'mongodb://localhost/madb')
mongoose.connection.once('connected', function () {
	logger.info('Connected to database')
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
		'post': 'Post',
		'follow': 'Follow',
		'problemCore': 'Problem',
		'problemCache': 'ProblemCache',
		// 'problemCapsule': 'ProblemCapsule',
		'problemSet': 'ProblemSet',
	}

	for (var m in models)
	if (models.hasOwnProperty(m)) {
		logger.trace('Registering model '+m)
		var schema = require(path.join(MODELS_PATH, m))
		// Register model
		let model = mongoose.model(models[m], schema)
		model.on('index', function (err) {
			if (err) {
				console.error('Index error raised on mongoose model declaration.', err)
				throw err
			}
		})

		schemas.push(schema)
	}

	// Allow modules to set local variables that might have raised race conditions when
	// models where being registered
	// Ex: mongoose.model('User') shan't called before models/user.coffee is required above.
	for (var i=0; i<schemas.length; i++) {
		if (schemas[i].start) {
		 	schemas[i].start()
		}
	}

	return mongoose
}
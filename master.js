
// QI Labs bootloader
// Load server through command line.

'use strict';

require('coffee-script/register');

/**
 * Absolute imports.
 * See https://gist.github.com/branneman/8048520#6-the-hack
 */
process.env.NODE_PATH = '.';
require('module').Module._initPaths();

/**
 * Environment variables.
 * Yes, please.
 */
var nconf = require('app/config/nconf');

/**
 * Logging. Bunyan.
 * Set global logger.
 */
var logger = require('app/config/bunyan')();
global.logger = logger;
logger.level(nconf.get('BUNYAN_LVL') || 'debug');

/**
 * Set mongoose here, not in server script.
 */
var mongoose = require('app/config/mongoose')(logger);

/**
 * Upstart servers.
 * Use clusters unless NO_CLUSTER env variable is set.
 */

function startServerAfterMongoose(server) {
	function startServer() {
		server.start();
	}

	// Start server instance when mongoose is ready.
	if (mongoose.connection.readyState == 2) {
		// connecting → wait
		mongoose.connection.once('connected', startServer);
	} else if (mongoose.connection.readyState == 1) {
		startServer();
	} else {
		throw new Error("Unexpected mongo readyState of "+
			mongoose.connection.readyState);
	}
}

// Using clusters in debug mode leads to "Failed to open socket on port 5858,
// waiting 1000 ms before retrying"
if (process.env.NODE_ENV === 'production' && !process.env.NO_CLUSTER) {
// if (!process.env.NO_CLUSTER) {
	var cluster = require('cluster');
	var numCPUs = require('os').cpus().length;

	process.env.__CLUSTERING = true;

	if (cluster.isMaster) {
		// If clustering and CONSUME_MAIN is set, consumer must be called here.
		if (nconf.get('CONSUME_MAIN')) {
			require('./app/consumer.js');
		}
		for (var i=0; i<numCPUs; ++i) {
			cluster.fork();
		}
		cluster.on('disconnect', function (worker, code, signal) {
			console.warn('Worker pid='+worker.process.pid+' died.\nForking...');
			cluster.fork();
		});
	} else {
		var server = require('./app/server.js');
		startServerAfterMongoose(server);
	}
} else {
	if (nconf.get('CONSUME_MAIN')) {
		logger.info('Calling consumer from web process.');
		require('./app/consumer.js');
	}
	var server = require('./app/server.js');
	startServerAfterMongoose(server);
}
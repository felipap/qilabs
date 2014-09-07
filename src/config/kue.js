
var kue = require('kue')
var url = require('url')
var nconf = require('nconf')

// var redis = require("redis");
// var redisClient = require('./redis.js')

if (nconf.get('REDISTOGO_URL')) {
	var redisUrl = url.parse(nconf.get('REDISTOGO_URL'))
	var count = 0;

	module.exports = kue.createQueue({
		redis: {
			port: redisUrl.port,
			host: redisUrl.hostname,
			auth: redisUrl.auth && redisUrl.auth.split(':')[1],
			// createClientFactory: function (options) {
			// 	count++;
			// 	if (count%4 != 0) {
			// 		var client = redisClient;
			// 		console.log('porra')
			// 	} else {
			// 		console.log(options)
			// 		var socket = options.redis.socket;
			// 		var port = !socket ? (options.redis.port || 6379) : null;
			// 		var host = !socket ? (options.redis.host || '127.0.0.1') : null;
			// 		var client = redis.createClient( socket || port , host, options.redis.options );
			// 	}
			// 	if (options.redis.auth) {
			// 	    client.auth(options.redis.auth);
			// 	}
			// 	if (options.redis.db) {
			// 	    client.select(options.redis.db);
			// 	}
			// 	return client;
			// }
		},
	})
	// module.exports = {
	// 	client: {
	// 		port: '123',
	// 	}
	// }
} else {
	module.exports = kue.createQueue({})
}

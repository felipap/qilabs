// var forky = require('forky');
// forky(__dirname + '/src/server.js');

if (true || process.env.NODE_ENV === 'production') {
	var cluster = require('cluster');
	var numCPUs = require('os').cpus().length || 4;
	process.env.__CLUSTERING = true;

	if (cluster.isMaster) {
		for (var i=0; i<numCPUs; ++i) {
			cluster.fork();
		}
		cluster.on('exit', function (worker, code, signal) {
			console.warn('worker '+worker.process.pid+' died');
		});
	} else {
		require('./src/server.js');
	}
} else {
	require('./src/server.js');
}
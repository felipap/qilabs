
var kue = require('kue')
var url = require('url')
var nconf = require('nconf')

if (nconf.get('REDISCLOUD_URL')) {
	var redisUrl = url.parse(nconf.get('REDISCLOUD_URL'))

	module.exports = kue.createQueue({
		redis: {
			port: redisUrl.port,
			host: redisUrl.hostname,
			auth: redisUrl.auth && redisUrl.auth.split(':')[1],
		},
	})
} else {
	module.exports = kue.createQueue({})
}

var redis = require('redis')
var url = require('url')
var nconf = require('nconf')

if (nconf.get('REDIS_DEBUG')) {
	redis.debug_mode = true;
}

if (nconf.get('REDISCLOUD_URL')) {
	var redisUrl = url.parse(nconf.get('REDISCLOUD_URL'))
	var client = redis.createClient(redisUrl.port, redisUrl.hostname, {
		auth_pass: redisUrl.auth && redisUrl.auth.split(':')[1]
	})
	module.exports = client;
} else {
	module.exports = redis.createClient()
}
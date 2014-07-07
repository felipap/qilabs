
var redis = require('redis')
var url = require('url')

if (process.env.REDISTOGO_URL) {
	var redisUrl = url.parse(process.env.REDISTOGO_URL)
	module.exports = redis.createClient(redisUrl.port, redisUrl.hostname, {
		auth_pass: redisUrl.auth && redisUrl.auth.split(':')[1]
	})
} else {
	module.exports = redis.createClient()
}

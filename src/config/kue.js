
var kue = require('kue')
var url = require('url')

if (process.env.REDISTOGO_URL) {
	var redisUrl = url.parse(process.env.REDISTOGO_URL)
	module.exports = kue.createQueue({
		redis: {
			port: redisUrl.port,
			host: redisUrl.hostname,
			auth: redisUrl.auth && redisUrl.auth.split(':')[1]
		}
	})
} else {
	module.exports = kue.createQueue({})
}


knox = require('knox')
nconf = require('nconf')

module.exports = function (app) {
	var client = knox.createClient({
		key: nconf.get('AWS_ACCESS_KEY_ID'),
		secret: nconf.get('AWS_SECRET_ACCESS_KEY'),
		bucket: 'qilabs',
		region: 'sa-east-1',
	})
	return client;
}
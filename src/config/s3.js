
var knox = require('knox')

module.exports = client = knox.createClient({
	key: process.env.AWS_ACCESS_KEY_ID,
	secret: process.env.AWS_SECRET_ACCESS_KEY,
	bucket: 'qilabs',
	// endpoint: 'qilabs.s3-sa-east-1.amazonaws.com',
	region: 'sa-east-1',
})

// var buffer = new Buffer('a string of data');
// var headers = {
// 	'x-amz-acl': 'public-read', // if you want anyone to be able to download the file
// 	'Content-Type': 'text/plain',
//   // 'Contnt-Length': buffer.length,
// };

// client.putBuffer(buffer, '/string.txt', headers, function(err, res){
// 	if (err)
// 		console.error(err);
// 	console.log('status', res.statusCode)
// 	res.on('data', function (chunk) {
// 		console.log('BODY: ' + chunk);
// 	});
// });

// _ = require('underscore')

// req.on('response', function (res) {

// 	var m = _.clone(res);
// 	m.req = false;
// 	m.socket = false;
// 	m.client = false;
// 	m.connection = false;
// 	// m.connection.socket = false;
// 	// console.log(m)

// 	// fs.writeFile('src/config/boo.json', JSON.stringify(m), function () {
// 	// 	console.log(arguments)
// 	// });

// 	console.log(res.headers, console.dir(res.statusCode))
// 	if (200 == res.statusCode) {
// 		console.log('saved to %s', req.url);
// 	}
// 	res.on('data', function (chunk) {
// 		console.log('BODY: ' + chunk);
// 	});
// });

// req.on('error', function(e) {
//   console.log('problem with request: ' + e.message);
// });

// req.end(string);

// var AWS = require('aws-sdk');

// var s3 = new AWS.S3();

// // Relatives paths won't work here because of the nodepath hack.
// AWS.config.loadFromPath('src/config/s3.json');

// s3.createBucket({Bucket: 'http://qilabs.s3-website-sa-east-1.amazonaws.com/'}, function () {
// 	var params = {Bucket: 'qilabs', Key: 'myKey', Body: 'Hello!'};
// 	s3.putObject(params, function(err, data) {
// 		if (err)
// 			console.log(err)
// 		else
// 			console.log("Successfully uploaded data to myBucket/myKey");
// 	});
// });

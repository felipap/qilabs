
var knox = require('knox')

module.exports = client = knox.createClient({
	key: process.env.AWS_ACCESS_KEY_ID,
	secret: process.env.AWS_SECRET_ACCESS_KEY,
	bucket: 'qilabs',
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
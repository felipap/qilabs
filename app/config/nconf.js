
// Initialize nconf for the app.

var path = require('path');
var nconf = require('nconf');

nconf.argv().env();

nconf.use('memory');

if (nconf.get('NODE_ENV') !== 'production') {
	nconf.file({file: __dirname+'/env.json'});
	// Allow testing production environment at home.
	// Load variables from env.json, but set NODE_ENV to production.
	if (nconf.get('FAKE_PROD')) {
		nconf.set('env', 'production');
		nconf.set('fake_prod', true);
	} else {
		nconf.set('env', 'development');
	}
} else {
	nconf.set('env', 'production');
}

var srcDir = path.join(path.dirname(module.parent.filename), 'app');

nconf.set('appRoot', srcDir);
nconf.set('viewsRoot', path.join(srcDir, 'views'));
nconf.set('staticUrl', '/static/');
nconf.set('localStaticRoot', path.join(srcDir, '../assets'));

if (nconf.get('env') === 'production') {
  nconf.set('s3Root', nconf.get('S3_STATIC_URL'));
}

nconf.defaults({
	port: 3000,
});

module.exports = nconf;
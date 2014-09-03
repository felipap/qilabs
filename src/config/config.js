
// Configuration variables for app.

var path = require('path');
var srcDir = path.dirname(module.parent.filename);

module.exports = function (app) {
	return app.config = {
		appRoot: srcDir,
		staticUrl: '/static/',
		staticRoot: path.join(srcDir, '/../assets'),
		mediaUrl: '/media/',
		mediaRoot: path.join(srcDir, 'media'),
		viewsRoot: path.join(srcDir, 'views'),
	};
};
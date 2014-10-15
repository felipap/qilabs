
var pathLib = require('path')
var _ = require('underscore')
var fsLib = require('fs')
var nconf = require('nconf')

module.exports = function (app) {
	var logger = app.get("logger");

	var obj = {
		errors: {},
		// getUrl: // in need of a named-url library for Express 4.x 
		pageMap: require('../labs.js'),
		assetUrl: function (mediaType) {
			var relPath = pathLib.join.apply(null, arguments);
			// Check file existence for these.
			switch (mediaType) {
				case "css":
				case "js": {
					var absPath = pathLib.join(nconf.get('staticRoot'), relPath);
					if (!fsLib.existsSync(absPath) && !fsLib.existsSync(absPath+'.js')) {
						if (app.get('env') !== 'production') {
							throw "Required asset "+absPath+" not found.";
						} else {
							logger.warn("Required asset "+absPath+" not found.");
						}
					}
				}
			}
			return pathLib.join(nconf.get('staticUrl'), relPath);
		},
		_: require('underscore'),
		app: {
			env: nconf.get('env')
		},
		ids: {
			facebook: nconf.get('facebook_app_id'),
			ga: nconf.get('google_analytics_id'),
			intercom: nconf.get('intercom_id'),
		},
		urls: { // while we can't proxy express.Router() calls and namefy them...
			settings: '/settings',
			faq: '/faq',
			about: '/sobre',
			twitter: 'http://twitter.com/qilabsorg',
			facebook: 'http://facebook.com/qilabsorg',
			logo: "/static/images/logo.png",
			logout: '/api/me/logout',
			feedbackForm: 'https://docs.google.com/forms/d/1bfmATEv6WfOkON_gv4Dmhob4jDAm7jJbo7xK7Lt8_jE/viewform',
			blog: 'http://blog.qilabs.org',
		},
	};

	_.extend(app.locals, obj);
}
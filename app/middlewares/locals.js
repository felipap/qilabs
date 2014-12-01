
var pathLib = require('path')
var fsLib = require('fs')
var nconf = require('nconf')
var marked = require('marked')

module.exports = function (app) {
	var logger = app.get("logger");

	app.locals.errors = {}
	app.locals.pageMap = require('app/data/labs')
	app.locals.assetUrl = function (mediaType) {
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
	}

	app.locals.worklogHtml = marked(''+fsLib.readFileSync(
		pathLib.resolve(__dirname, '../static/worklog.md')))

	// getUrl = // in need of a named-url library for Express 4.x
	app.locals._ = require('lodash')
	app.locals.app = { env: nconf.get('env') }
	app.locals.ids = {
		facebook: nconf.get('facebook_app_id'),
		ga: nconf.get('google_analytics_id'),
		intercom: nconf.get('intercom_id'),
	}

	app.locals.urls = { // while we can't proxy express.Router() calls and namefy them...
		settings: '/settings',
		faq: '/faq',
		about: '/sobre',
		twitter: 'http://twitter.com/qilabsorg',
		github: 'http://github.com/QI-Labs',
		facebook: 'http://facebook.com/qilabsorg',
		logo: "/static/images/logo.png",
		logout: '/api/me/logout',
		feedbackForm: 'https://docs.google.com/forms/d/1bfmATEv6WfOkON_gv4Dmhob4jDAm7jJbo7xK7Lt8_jE/viewform',
		blog: 'http://blog.qilabs.org',
	};
}
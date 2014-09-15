
var pathLib = require('path')
var _ = require('underscore')
var fsLib = require('fs')
var nconf = require('nconf')

module.exports = function (app) {
	var logger = app.get("logger");

	var obj = {
		errors: {},
		// getUrl: function (name, args) { // (name, args... to fill pageurl if known)
		// 	// var urls = app.locals.urls;
		// 	if (typeof urls[name] !== 'undefined') {
		// 		/* Fill in arguments to url passed in arguments. */
		// 		var url = urls[name],
		// 			regex = /:[\w_]+/g;
		// 		/* This doesn't account for optional arguments! TODO */
		// 		if ((url.match(regex) || []).length !== _.size(args))
		// 			throw "Wrong number of keys to getPageUrl.";

		// 		if (args) {
		// 			var a = url.replace(regex, function (occ) {
		// 				var argName = occ.slice(1,occ.length);
		// 				if (!(argName in args))
		// 					throw "Invalid argument '"+argName+"' to url '"+url+"'' getPageUrl. ";
		// 				return args[occ.slice(1,occ.length)];
		// 			});
		// 			return a
		// 		} else {
		// 			return url;
		// 		}
		// 	} else {
		// 		if (app.get('env') !== 'production') {
		// 			console.trace();
		// 			throw "Page named '"+name+"' was referenced but doesn't exist.";
		// 		} else {
		// 			logger.error("Page named '"+name+"' was referenced but doesn't exist.");
		// 			console.trace();
		// 		}
		// 		return "#";
		// 	}
		// },
		pageMap: require('../pages.js').data,
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
		urls: { // while we can't proxy express.Router() calls and namefy them...
			settings: '/settings',
			faq: '/faq',
			about: '/sobre',
			twitter: 'http://twitter.com/qilabsorg',
			facebook: 'http://facebook.com/qilabsorg',
			logo: "/static/images/logo.png",
			logout: '/api/me/logout',
			blog: 'http://blog.qilabs.org',
		},
	};

	_.extend(app.locals, obj);
}
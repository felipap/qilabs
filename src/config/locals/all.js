
var pathLib = require('path')
var _ = require('underscore')
var fsLib = require('fs')

module.exports = function(app) {

	_.extend(app.locals, {
		errors: {},
		getPageUrl: function (name, args) { // (name, args... to fill pageurl if known)
			if (typeof app.locals.urls[name] !== 'undefined') {
				/* Fill in arguments to url passed in arguments. */
				var url = app.locals.urls[name],
					regex = /:[\w_]+/g;
				/* This doesn't account for optional arguments! TODO */
				if ((url.match(regex) || []).length !== _.size(args))
					throw "Wrong number of keys to getPageUrl.";

				if (args) {
					console.log(args)
					var a = url.replace(regex, function (occ) {
						var argName = occ.slice(1,occ.length);
						if (!(argName in args))
							throw "Invalid argument '"+argName+"' to url '"+url+"'' getPageUrl. ";
						return args[occ.slice(1,occ.length)];
					});
					return a
				} else {
					return url;
				}

			} else {
				if (app.get('env') !== 'production') {
					console.trace();
					throw "Page named '"+name+"' was referenced but doesn't exist.";
				} else {
					console.error("Page named '"+name+"' was referenced but doesn't exist.");
					console.trace();
				}
				return "#";
			}
		},
		getQILogo: function () {
			return "/static/images/logo.png";
		},
		postTypes: {
			discussion: {
				translated: 'Discussion',
				iconClass: 'icon-question'
			},
			note: {
				translated: 'Note',
				iconClass: 'icon-bulb',
			},
		},
		pageMap: require('../pages.js').data,
		getMediaUrl: function (mediaType) {
			var relPath = pathLib.join.apply(null, arguments);
			// Check file existence for these.
			switch (mediaType) {
				case "css":
				case "js": {
					var absPath = pathLib.join(app.config.staticRoot, relPath);
					if (!fsLib.existsSync(absPath) && !fsLib.existsSync(absPath+'.js')) {
						if (app.get('env') !== 'production') {
							throw "Required css/js file "+absPath+" not found.";
						} else {
							console.log("Required css/js file "+absPath+" not found.");
						}
					}
				}
			}
			return pathLib.join(app.config.staticUrl, relPath);
		},
		_: require('underscore'),
		socialUrls: {
			'twitter': '#',
			'facebook': '#',
			'blog': 'http://blog.qilabs.org',
		},
		app: {
			env: app.get('env')
		},
	});
}

// required.js
// Python-like decorators for controllers.

var nconf = require('nconf');

module.exports = required = {
	logout: function (req, res, next) {
		if (req.user) {
			next({permission:'logout'});
		} else {
			next();
		}
	},
	development: function (req, res, next) {
		if (nconf.get('env') === 'development') {
			next()
		} else {
			next({permission:'development'});
		}
	},
	login: function (req, res, next) {
		if (req.user) {
			next();
		} else {
			next({permission:'login'});
		}
	},
	self: {
		admin: function (req, res, next) {
			if (req.user && req.user.flags && req.user.flags.admin) {
				console.log('yes')
				next();
			} else {
				next({permission:'admin', args:[req.user && req.user.flags.admin]});
			}
		},
	},
	selfCanEdit: function (param) {
		return function (req, res, next) {
			if (!(param in req)) {
				throw new Error("Couldn't find param "+param+" in request resource.");
			}

			var resource = req[param];

			if (req.user &&
				(resource.author &&
				(resource.author.id === ''+req.user.id) ||
				req.user.flags.admin)) {
				return next();
			}
			next({ permission: 'selfOwns' });
		};
	},
	selfDoesntOwn: function (param) {
		return function (req, res, next) {
			if (!(param in req)) {
				throw new Error("Couldn't find param "+param+" in request resource.");
			}

			var resource = req[param];
			if (!req.user ||
				!(resource.author && resource.author.id === ''+req.user.id)) {
				return next();
			}
			next({ permission: 'selfDoesntOwn' });
		};
	},

}
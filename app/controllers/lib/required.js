
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
	login: function (req, res, next) {
		if (req.user) {
			next();
		} else {
			next({permission:'login'});
		}
	},
	self: {
		staff: function (req, res, next) {
			// if (nconf.get('env') === "production" && (!req.user || !req.user.profile.staff))
			if (req.user && req.user.profile && req.user.profile.staff) {
				next();
			} else {
				next({permission:'staff', args:[req.user && req.user.profile.staff]});
			}
		},
		isEditor: function (req, res, next) {
			if (req.user && req.user.flags.editor) {
				next();
			} else {
				next({permission:'isEditor', args:[req.user && req.user.flags.editor]});
			}
		},
		canEdit: function (param) {
			return function (req, res, next) {
				if (param in req) { // If object in request object.
					var object = req[param];
					if (req.user.flags.mystique || ''+object.author.id === ''+req.user.id) {
						next();
					} else {
						next({ permission: 'canEdit' });
					}
				} else
					throw new Error("Couldn't find param "+param+" in request object.");
			};
		},
	},
	selfOwns: function (param) {
		return function (req, res, next) {
			if (param in req) { // If object in request object.
				var object = req[param];
				if (req.user.flags.mystique || ''+object.author.id === ''+req.user.id) {
					next();
				} else {
					next({ permission: 'selfOwns' });
				}
			} else
				throw new Error("Couldn't find param "+param+" in request object.");
		};
	},
	selfDoesntOwn: function (param) {
		return function (req, res, next) {
			if (param in req) { // If object in request object.
				var object = req[param];
				if (req.user.flags.admin || ''+object.author.id !== ''+req.user.id) {
					next();
				} else {
					next({ permission: 'selfDoesntOwn' });
				}
			} else
				throw new Error("Couldn't find param "+param+" in request object.");
		};
	},

}
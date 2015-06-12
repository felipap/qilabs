
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
			console.log('no?', req.user.flags)
			if (req.user && req.user.flags && req.user.flags.admin) {
				console.log('yes')
				next();
			} else {
				next({permission:'admin', args:[req.user && req.user.flags.admin]});
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
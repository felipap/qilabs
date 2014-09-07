
// required.js
// Python-like decorators for controllers.

var mongoose = require('mongoose');
var _ = require('lodash');
var nconf = require('nconf');

module.exports = required = {
	logout: function (req, res, next) {
		if (req.user)
			next({permission:'logout'});
		else next();
	},
	login: function (req, res, next) {
		if (req.user) {
			next();
		} else {
			next({permission:'login'});
		}
	},
	isStaff: function (req, res, next) {
		// if (nconf.get('env') == "production" && (!req.user || !req.user.profile.isStaff))
		if (req.user && req.user.profile && req.user.profile.isStaff)
			next();
		else
			next({permission:'isStaff', args:[req.user && req.user.profile.isStaff]});
	},
	// Require user to be me. :D
	isMe: function (req, res, next) {
		if (nconf.get('env') == "production" && (!req.user || req.user.facebook_id !== nconf.get('facebook_me')))
			next({permission:'isMe', args:[nconf.get('facebook_me'), req.user && req.user.facebook_id]});
		else
			next();
	},
	selfOwns: function (param) {
		return function (req, res, next) {
			if (param in req) { // If object in request object.
				var object = req[param];
				if (req.user.facebook_id === nconf.get('facebook_me') ||
					''+object.author.id === ''+req.user.id) {
					next();
				} else {
					next({ required: 'selfOwns' });
				}
			} else
				throw new Error("Couldn't find param "+param+" in request object.");
		};
	},
	selfDoesntOwn: function (param) {
		return function (req, res, next) {
			if (param in req) { // If object in request object.
				var object = req[param];
				if (req.user.facebook_id === nconf.get('facebook_me') ||
					''+object.author.id !== ''+req.user.id) {
					next();
				} else {
					next({ required: 'selfDoesntOwn' });
				}
			} else
				throw new Error("Couldn't find param "+param+" in request object.");
		};
	},

}

var mongoose = require('mongoose');
var _ = require('lodash');
var async = require('async');
var sanitizer = require('sanitizer');

module.exports = function (req, res, next) {

	// Expects not-null as second argument, throws 404 otherwise.
	req.handleErr404 = function (callback, options) {
		var self = this;
		return function (err, result) {
			if (err) {
				return next({ type:"ErrResult", status: 400, obj:err });
			} else if (!result) {
				return next({ type:"ObsoleteId", status: 404, obj:err });
			} else {
				return callback.apply(self, [].splice.call(arguments,1));
			}
		};
	};

	req.handleErr = function (callback, options) {
		var self = this;
		return function (err, result) {
			if (err) {
				return next({ type:"ErrResult", status: 400, args:_.extend({err:err},options) });
			} else {
				return callback.apply(self, [].splice.call(arguments,1));
			}
		};
	};

	req.paramToObjectId = function (param, callback) {
		if (typeof req.params[param] === 'undefined') {
			console.trace();
			throw "Fatal error: parameter '"+param+"' doesn't belong to url.";
		}

		if (arguments.length === 2) { // Async call
			try {
				mongoose.Types.ObjectId.createFromHexString(req.params[param]);
			} catch (e) {
				next({ type: "InvalidId", args:param, value:req.params[param]});
			}
			callback(id);
		} else { // Sync call
			try {
				return new mongoose.Types.ObjectId.createFromHexString(req.params[param]);
			} catch (e) {
				return false;
			}
		}
	};

	req.logMe = function () {
		console.log.apply(console, ["<"+req.user.username+">:"].concat([].slice.call(arguments)));
	};

	/**
	 * fetch/validate/clean req.body according to de rules
	 */
	req.parse = function (rules, cb) {
		// TODO!
		// - improve logging.

		var verbose = false;
		var requestBody = req.body;

		function log (msg) {
			if (verbose) {
				req.logger.trace(msg);
			}
		}
		function warn (msg) {
			req.logger.warn(msg);
		}

		if (!rules) {
			throw "Null rules object to req.parse.";
		}

		function flattenObjList (list) {
			if (list.length) {
				return _.reduce(list, function (a, b) { return _.extend({}, a, b); });
			}
			return [];
		}

		function escapeObject (obj) {
			if (typeof obj === 'string') {
				return sanitizer.escape(obj);
			} else if (typeof obj === 'number') {
				return obj;
			} else if (typeof obj === 'boolean') {
				return obj;
			} else if (obj === null) {
				return obj;
			} else if (obj instanceof Array) {
				return _.map(obj, escapeObject);
			} else {
				throw new Error("Failed to escape not covered by conditions.");
			}
		}

		function parseObj (key, requestValue, rule, cb) {
			if (typeof rule === 'undefined') {
				warn("No rule defined for key "+key);
				cb();
				return;
			} else if (rule === false) { // Ignore object
				log('Rule not found for key '+key)
				cb();
				return;
			} else if (rule.$required !== false
				&& typeof requestValue === 'undefined'
				&& requestValue) { // Default is required
				warn("Attribute '"+key+"' is required.");
				cb("Attribute '"+key+"' is required.");
				return;
			} else if (!requestValue && rule.$required === false) {
				// If the object is not required, don't even try to validate it.
				cb();
			} else if (rule.$valid && !rule.$valid(requestValue, req.body, req.user)) {
				if ('$msg' in rule) {
					if (typeof rule.$msg === 'function')
						cb(rule.$msg(requestValue));
					else
						cb(rule.$msg)
				} else {
					cb("Attribute '"+key+"' fails validation function: "+
						JSON.stringify(requestValue));
				}
				return;
			} else if (rule.$validate) {
				var ret = rule.$validate(requestValue, req.body, req.user);
				if (ret) { // Error!
					if (typeof ret === 'string') {
						cb(ret);
					} else if (typeof ret === 'function') {
						cb(ret(requestValue));
					} else if (typeof rule['$msg'] === 'string') {
						cb(rule['$msg']);
					} else if (typeof rule['$msg'] === 'function') {
						cb(rule['$msg'](requestValue));
					} else {
						cb("Attribute '"+key+"' fails validation function: "+
							JSON.stringify(requestValue));
					}
					return;
				}
			}

			// Call on nested objects (if available)
			if (_.isObject(requestValue) && !_.isArray(requestValue)) {
				var content = {};
				for (var attr in requestValue) if (requestValue.hasOwnProperty(attr)) {
					content[attr] = requestValue[attr];
				}

				// If nested content available → digg in!
				async.map(_.keys(content), function (key, done) {
					if (key[0] === '$') // keys starting with $ denote options
						return done();
					parseObj(key, content[key], rule[key], done);
				}, function (err, results) {
					results = flattenObjList(results.filter(function (e) { return !!e; }));
					var a = {};
					if (results)
						a[key] = results;
					cb(err, a);
				});
				return;
			}

			// Clean-up object if $clean attribute is present.
			var cleanFn = rule.$clean || function(i){return i;}
			var result;
			try {
				result = cleanFn(requestValue, req.body, req.user);
			} catch (e) {
				console.log("Error cleaning up object.");
				if ('$msg' in rule) {
					cb(rule.$msg(requestValue));
				} else {
					cb("Attribute '"+key+"' fails validation function: "+
						JSON.stringify(requestValue));
				}
				return;
			}
			if (!result && !!requestValue) {
				console.warn("Cleaning up '"+key+"' returned "+result)
			}

			if (rule.$escape !== false)
				result = escapeObject(result);

			var dict = {};
			dict[key] = result;
			cb(null, dict);
		}

		async.map(_.keys(rules), function (key, done) {
			parseObj(key, requestBody[key], rules[key], done);
		}, function (err, results) {
			results = flattenObjList(results.filter(function (e) { return !!e; }));
			if (err) {
				return res.status(400).endJSON({ error:true, message:err });
			} else {
				// FIXME: the err attribute in the callback is completely unused.
				cb(null, results);
			}
		});
	};

	next();
}
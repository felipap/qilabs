
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

	function parseArrayBody(rules, cb) {
		if (!(req.body instanceof Array)) {
			throw new Error("Tried to req.parseArray a non-array.");
		}

		async.map(req.body, function (item, next) {
			parseBody(item, rules, function (err, parsedBody) {
				if (err) {
					next(err);
				} else {
					next(null, parsedBody);
				}
			});
		}, function (error, results) {
			if (error) {
				next(error);
			} else {
				cb(results);
			}
		});
	};

	req.parseArray = parseArrayBody;

	/**
	 * fetch/validate/clean requestBody according to da rules
	 */
	function parseBody(requestBody, rules, callback) {
		var verbose = false;

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
			function onError(message) {
				cb({ message: message, key: key, value: requestValue });
			}

			if (typeof rule === 'undefined') {
				warn("No rule defined for key "+key);
				cb();
				return;
			} else if (rule === false) { // Ignore object
				log('Rule not found for key '+key)
				cb();
				return;
			} else if (typeof requestValue === 'undefined') {
				if (rule.$required === false) {
					// If the object is not required, don't even try to validate it.
					cb();
				} else { // Default is required
					warn("Attribute '"+key+"' is required.");
					onError("Attribute '"+key+"' is required.");
				}
				return;
			} else if (rule.$valid && !rule.$valid(requestValue, requestBody, req.user)) {
				if ('$msg' in rule) {
					if (typeof rule.$msg === 'function')
						onError(rule.$msg(requestValue));
					else
						onError(rule.$msg)
				} else {
					onError("Attribute '"+key+"' fails validation function: "+
						JSON.stringify(requestValue));
				}
				return;
			} else if (rule.$validate) {
				var ret = rule.$validate(requestValue, req.body, req.user);
				if (ret) { // Error!
					if (typeof ret === 'string') {
						onError(ret);
					} else if (typeof ret === 'function') {
						onError(ret(requestValue));
					} else if (typeof rule['$msg'] === 'string') {
						onError(rule['$msg']);
					} else if (typeof rule['$msg'] === 'function') {
						onError(rule['$msg'](requestValue));
					} else {
						onError("Attribute '"+key+"' fails validation function: "+
							JSON.stringify(requestValue));
					}
					return;
				}
			}

			// Call on nested objects (if available).
			if (_.isPlainObject(requestValue)) {
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
				result = cleanFn(requestValue, requestBody, req.user);
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

		if (!_.isPlainObject(requestBody)) {
			console.log('what?', requestBody)
			callback({
				error: 'ReqParse',
				status: 400,
				message: 'Wrong payload type.',
			});
			return;
		}

		async.map(_.keys(rules), function (key, done) {
			parseObj(key, requestBody[key], rules[key], done);
		}, function (err, results) {
			results = flattenObjList(results.filter(function (e) { return !!e; }));
			if (err) {
				callback(_.extend({ error: 'ReqParse' }, err));
			} else {
				callback(null, results);
			}
		});
	};

	req.parse = function (rules, callback) {
		parseBody(req.body, rules, function (err, result) {
			if (err) {
				console.log("mext")
				next(err);
			} else {
				console.log("caççbacl")
				callback(result);
			}
		})
	};

	next();
}
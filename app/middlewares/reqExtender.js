
mongoose = require('mongoose')
_ = require('lodash')
async = require('async')

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
		}
	};

	req.handleErr = function (callback, options) {
		var self = this;
		return function (err, result) {
			if (err) {
				return next({ type:"ErrResult", status: 400, args:_.extend({err:err},options) });
			} else {
				return callback.apply(self, [].splice.call(arguments,1));
			}
		}
	};

	req.paramToObjectId = function (param, callback) {
		if (typeof req.params[param] === 'undefined') {
			console.trace();
			throw "Fatal error: parameter '"+param+"' doesn't belong to url.";
		}

		if (arguments.length === 2) { // Async call
			try {
				var id = mongoose.Types.ObjectId.createFromHexString(req.params[param]);
			} catch (e) {
				next({ type: "InvalidId", args:param, value:req.params[param]});
			}
			callback(id);
		} else { // Sync call
			try {
				return new mongoose.Types.ObjectId.createFromHexString(req.params[param])
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

		var verbose = false;
		var requestBody = req.body;

		if (!rules)
			throw "Null rules object to req.parse.";

		function flattenObjList (list) {
			if (list.length)
				return _.reduce(list, function (a, b) { return _.extend({}, a, b); });
			return [];
		}

		function parseObj (key, requestValue, rule, cb) {

			if (typeof rule === 'undefined') {
				req.logger.trace("No rule defined for key "+key);
				cb();
				return;
			} if (rule === false) {
				// Ignore object
				cb();
				return;
			} if (rule.$required !== false && typeof requestValue === 'undefined'
				&& requestValue) {
				// Default is required
				cb("Attribute '"+key+"' is required.");
				return;
			} else if (rule.$valid && !rule.$valid(requestValue, req.body, req.user)) {
				if (!requestValue && rule.$required === false) {
					// Don't propagate fail if object is not required.
					cb();
				} else if ('$msg' in rule) {
					cb(rule.$msg(requestValue));
				} else {
					cb("Attribute '"+key+"' fails validation function: "+
						JSON.stringify(requestValue));
				}
				return;
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
			var result = {};
			try {
				result[key] = cleanFn(requestValue, req.body, req.user);
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
			if (!result[key] && !!requestValue) {
				console.warn("Cleaning up '"+key+"' returned "+result)
			}
			cb(null, result)
		}

		async.map(_.keys(rules), function (key, done) {
			parseObj(key, requestBody[key], rules[key], done)
		}, function (err, results) {
			results = flattenObjList(results.filter(function (e) { return !!e; }));
			if (err) {
				return res.status(400).endJSON({ error:true, message:err });
			} else {
				// FIXME: the err attribute in the callback is unused.
				cb(null, results);
			}
		});
	};

	next();
}

var mongoose = require('mongoose')
var _ = require('underscore')

module.exports = function(req, res, next) {
	res.endJson = function (data) {
		res.end(JSON.stringify(data));
	};

	res.render404 = function (msg) {
		res.status(404);
		if (req.accepts('html')) { // respond with html page;
			res.render('app/404', { url: req.url, user: req.user, msg: msg });
		} else if (req.accepts('json')) { // respond with json;
			res.send({ error: true, name: 'Notfound' });
		}
	};

	req.handleErrResult = function (callback, options) {
		var self = this;
		return function (err, result) {
			if (err) {
				return next({ type:"ErrResult", status: 400, args:_.extend({err:err},options) });
			} else if (!result) {
				return next({ type:"ObsoleteId", status: 404, args:_.extend({err:err},options) });
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
	
	next();
}
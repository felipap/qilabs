
var mongoose = require('mongoose')
var _ = require('underscore')

module.exports = function (req, res, next) {
	res.endJson = function (data) {
		res.set('Content-Type', 'application/json').end(JSON.stringify(data));
	};

	res.render404 = function (msg) {
		res.status(404);
		if (req.accepts('html') && !req.isAPICall) { // respond with html page;
			res.render('app/404', { url: req.url, user: req.user, msg: msg });
		} else if (req.accepts('json')) { // respond with json;
			res.send({ error: true, name: 'Not found.' });
		}
	};
	next();
}
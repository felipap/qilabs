
module.exports = function (req, res, next) {
	res.endJSON = function (data) {
		res.set('Content-Type', 'application/json').end(JSON.stringify(data));
	};

	res.render404 = function (obj) {
		if (req.accepts('html') && !req.isAPICall) // respond with html page;
			res.status(404).render('app/404', { url: req.url, user: req.user, msg: obj && obj.msg });
		else
			res.status(404).send({ error: true, message: (obj && obj.msg) || 'Not found.' });
	};

	res.locals = {
		// source: https://github.com/HabitRPG/habitrpg/blob/develop/src/middleware.js
		IS_MOBILE: /Android|webOS|iPhone|iPad|iPod|BlackBerry/i.test(req.header('User-Agent')),
	};

	next();
}
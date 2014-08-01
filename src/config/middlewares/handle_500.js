
var permissions = {
	login: {
		message: "Você tem que estar logado para continuar.",
	}
}

var winston = require('winston');
var expressWinston = require('express-winston');

module.exports = function(err, req, res, next) {

	// Don't handle ObsoleteId, for it's sign of a 404.
	if (err.type === 'ObsoleteId') {
		// TODO: find way to detect while model type we couldn't find and customize 404 message.
		return res.render404(); // "Esse usuário não existe.");
	}

	// Set status.
	if (err.status)
		res.status(err.status);
	else if (err.permission)
		res.status(401);
	else if (res.statusCode < 400)
		res.status(500);
	
	var accept = req.headers.accept || '';
	// Test permissions like login and don't trace/log them.
	// Ideally this could be implemented as a map object of permissionError to callbacks implementing
	// their responses.
	if (err.permission && err.permission === 'login') {
		console.error('IP '+req.connection.remoteAddress+' can\'t '+req.method+' path '+req.url);
		if (~accept.indexOf('html')) {
			res.redirect('/');
		} else {
			// Don't use middleware.
			res.endJson({ error: true, message: 'Unauthenticated user.' });
		}
		return;
	} else {
		console.error('Error stack:', err);
		console.trace();
	}

	// hack to use middleware conditionally
	expressWinston.errorLogger({
		transports: [ new winston.transports.Console({ json: true, colorize: true }) ],
	})(err, res, res, function () {

	});

	if (~accept.indexOf('html')) {
		if (req.app.get('env') === 'development') {
			res.render('app/500', {
				user: req.user,
				error_code: res.statusCode,
				error_msg: err,
				error_stack: (err.stack || '').split('\n').slice(1).join('<br>'),
			});
		} else {
			res.render('app/500', {
				user: req.user,
				message: err.human_message
			});
		}
	} else {
		var error = { message: err.message };
		for (var prop in err) error[prop] = err[prop];
		return res
			.set('Content-Type', 'application/json')
			.end(JSON.stringify({ error: error, message: err.msg || 'Erro.' }));
	}
}
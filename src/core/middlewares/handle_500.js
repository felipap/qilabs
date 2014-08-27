
var winston = require('winston');
var expressWinston = require('express-winston');

module.exports = function(err, req, res, next) {

	// Don't handle ObsoleteId, for it's sign of a 404.
	console.log('oiem')
	if (err.type === 'ObsoleteId' || err.type === 'InvalidId') {
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
			res.endJSON({ error: true, message: 'Unauthenticated user.' });
		}
		return;
	} else if (err.permission) {
		err.msg = "Proibido de continuar.";
	}
	console.log(err)

	// hack to use middleware conditionally
	// require('express-bunyan-logger').errorLogger({
	// 	format: ':remote-address - - :method :url',
	// })(err, res, res, function(){});
	// app.use(require('express-bunyan-logger')({
	// 	format: ":remote-address - :user-agent[major] custom logger"
	// }));
	// expressWinston.errorLogger({
	// 	transports: [ new winston.transports.Console({ json: true, colorize: true }) ],
	// })(err, res, res, function () {});
	
	if (req.app.get('env') === 'production') {
		var newrelic = require('newrelic');
		newrelic.noticeError(err);
	}
	
	console.error('Error stack:', err, err.args && JSON.stringify(err.args.err && err.args.err.errors));
	console.trace();

	if (~accept.indexOf('html') && !req.isAPICall) {
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
			// .end(JSON.stringify({ error: message, message: err.msg || 'Erro.' }));
			.end(JSON.stringify({ error: true, message: err.msg || 'Erro.' }));
	}
}

var winston = require('winston');
var nconf = require('nconf');
var expressWinston = require('express-winston');

permissions = {
	'not_on_list': 'Você não está autorizado a continuar. Se você faz parte do mentoriado NOIC 2014, é provável que você não tenha preenchido o formulário de inscrição no QI Labs.',
	'isMe': 'Você não está autorizado a continuar.',
	'selfOwns': 'Ação não autorizada.',
	'selfDoesntOwn': 'Ação não autorizada.',
	'login': 'Ação não autorizada.',
}

Error.stackTraceLimit = 60

module.exports = function(err, req, res, next) {
	// Don't handle ObsoleteId, for it's sign of a 404.
	if (err.type === 'ObsoleteId' || err.type === 'InvalidId') {
		// TODO: find way to detect while model type we couldn't find and customize 404 message.
		return res.render404(); // 'Esse usuário não existe.');
	}

	// Test permissions and don't trace/log them.
	if (err.permission) {
		res.status(401);
		if (err.permission === 'login') {
			if (~accept.indexOf('html')) {
				res.redirect('/');
			} else {
				// Don't use middleware.
				res.endJSON({ error: true, message: 'Unauthenticated user.' });
			}
			// Keep track of unauthorized access (lots of they may indicate a problem).
			jobber.debug('IP '+req.connection.remoteAddress+' can\'t '+req.method+' path '+req.url);
		}

		if (err.permission in permissions) {
			res.renderError({msg: permissions[err.permission]})
			return;
		}
		logger.warn("Permission "+err.permission+" not found in list.");
		res.renderError({msg: "Proibido continuar."});
	}

	if (err.name === 'InternalOAuthError') {
		res.renderError({status: 401, msg: 'Não conseguimos te autenciar. Tente novamente.'})
		return;
	}

	// Set status.
	if (err.status)
		res.status(err.status);
	else if (res.statusCode < 400)
		res.status(500);

	Error.stackTraceLimit = 60

	// hack to use middleware conditionally
	// require('express-bunyan-logger').errorLogger({
	// 	format: ':remote-address - - :method :url',
	// })(err, res, res, function(){});
	// app.use(require('express-bunyan-logger')({
	// 	format: ':remote-address - :user-agent[major] custom logger'
	// }));
	// expressWinston.errorLogger({
	// 	transports: [ new winston.transports.Console({ json: true, colorize: true }) ],
	// })(err, res, res, function () {});
	
	if (req.app.get('env') === 'production') {
		try {
			var newrelic = require('newrelic');
			newrelic.noticeError(err);
		} catch (e) {
			req.logger.warn('Failed to call newrelic.noticeError.', e);
		}
	}
	
	req.logger.fatal('Error detected:', err, err.args && JSON.stringify(err.args.err && err.args.err.errors));
	console.trace();

	try {
		res.renderError({
			error_code: res.statusCode,
			error_msg: err.msg,
			error_stack: (err.stack || '').split('\n').slice(1).join('<br>'),
			msg: err.human_message,
		});
	} catch (e) {
		res.end();
		req.logger.fatal("Failed to renderError. Empty response returned.", e);
		console.trace();
	}

	// var accept = req.headers.accept || '';
	// if (~accept.indexOf('html') && !req.isAPICall) {
	// 	if (req.app.get('env') === 'development') {
	// 	} else {
	// 		res.render500({
	// 			message: err.human_message
	// 		});
	// 	}
	// } else {
	// 	var error = { message: err.message };
	// 	for (var prop in err) error[prop] = err[prop];
	// 	return res
	// 		.end(JSON.stringify({ error: true, message: err.human_message || 'Erro.' }));
	// }
}
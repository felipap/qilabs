
var nconf = require('nconf');
var lodash = require('lodash');

permissions = {
	'isMe': 'Você não está autorizado a continuar.',
	'selfOwns': 'Ação não autorizada.',
	'selfDoesntOwn': 'Ação não autorizada.',
	'login': 'Ação não autorizada.',
	'isStaff': 'Ação não autorizada.',
	'isEditor': 'Ação não autorizada.',
}

Error.stackTraceLimit = 60

module.exports = function(err, req, res, next) {

	// wrong/abscent CSRF token
	if (err.code === "EBADCSRFTOKEN") {
		// Can't user renderError here!, because the method is only attached to the
		// res object after the csrf middleware is run.
		req.logger.info("Auth error: Wrong CSRF token.");
		return res.status(401).send({ msg: "Erro de autenticação." });
	}

	// Check for errors of type 404
	if (err.type === 'ObsoleteId' //
		|| err.type === 'InvalidId' // Wrong ID format (FIXME: shoudl this be a 404?)
		|| (err.obj && err.obj.name === 'CastError' && err.obj.type === 'ObjectId') // failed to cast to _id
	) {
		// TODO? find way to detect while model type we couldn't find and customize 404 message.
		if (err.type === 'ObsoleteId') {
			return res.render404({ msg: 'Não encontramos o objeto que você estava procurando...'});
		}
		return res.render404(); // 'Esse usuário não existe.');
	}

	// Test permissions and don't trace/log them.
	if (err.permission) {
		res.status(403);
		if (err.permission === 'login') {
			if (~(req.headers.accept || '').indexOf('html')) {
				res.redirect('/');
			} else {
				// Don't use middleware.
				res.endJSON({ error: true, message: 'Unauthenticated user.' });
			}
			// Keep track of unauthorized access (lots of they may indicate a problem).
			req.logger.debug('IP '+req.connection.remoteAddress+' can\'t '+req.method+' path '+req.url);
			return;
		}

		if (err.permission in permissions) {
			res.renderError(403, {msg: permissions[err.permission]})
			return;
		}
		req.logger.warn('Permission '+err.permission+' not found in list.');
		res.renderError(403, {msg: 'Ação não autorizada.'});
		return;
	}

	// Test mongoose errors.
	if (err.name === 'ValidationError' || err.obj && err.obj.name === 'ValidationError') {
		res.renderError(400, {msg:'Não foi possível completar a sua ligação.'})
		return;
	}

	if (err.name === 'InternalOAuthError') {
		req.logger.info(err)
		console.trace();
		res.renderError(401, {msg: 'Não conseguimos te autenticar. Tente novamente.'})
		return;
	}

	if (err instanceof TypeError) {
		// May be express complaining of a url with invalid stuff (%A23 or whatever)
		// TODO: find a better way to distill the url problem from other TypeErrors!
		if (err.stack)
			req.logger.info(err.stack)
		console.trace();
		res.render404();
		return;
	}

	// Set status.
	if (err.status)
		res.status(err.status);
	else if (res.statusCode < 400)
		res.status(500);

	// hack to use middleware conditionally
	// require('express-bunyan-logger').errorLogger({
	// 	format: ':remote-address - - :method :url',
	// })(err, res, res, function(){});
	// app.use(require('express-bunyan-logger')({
	// 	format: ':remote-address - :user-agent[major] custom logger'
	// }));

	if (req.app.get('env') === 'production') {
		try {
			var newrelic = require('newrelic');
			newrelic.noticeError(err);
		} catch (e) {
			req.logger.warn('Failed to call newrelic.noticeError.', e);
		}
	}

	req.logger.fatal('Error detected:', err, err.args &&
		JSON.stringify(err.args.err && err.args.err.errors), lodash.keys(err), err.status);
	Error.stackTraceLimit = 60
	if (err.stack)
		req.logger.info(err.stack)
	console.trace();

	// from http://nodejs.org/api/domain.html#domain_warning_don_t_ignore_errors
	try {
		// Close server and force exit after 10 if CLUSTERING.
		if (nconf.get('env') === 'production' && process.env.__CLUSTERING) {
			req.app.preKill(10*1000);
		}

		// try to send error callback
		res.renderError(500, {
			errorCode: res.statusCode,
			errorMsg: err.msg,
			errorStack: (err.stack || '').split('\n').slice(1).join('<br>'),
			msg: err.human_message,
		});
	} catch (e) {
		// oh well, not much we can do at this point.
		res.end();
		req.logger.fatal('Failed to renderError. Empty response returned.', e);
		console.trace();
	}
}
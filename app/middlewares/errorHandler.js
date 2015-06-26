
var nconf = require('nconf');
var lodash = require('lodash');

permissions = {
	'selfOwns': 'Ação não autorizada.',
	'selfDoesntOwn': 'Ação não autorizada.',
	'login': 'Ação não autorizada.',
	'admin': 'Ação não autorizada.',
	'isEditor': 'Ação não autorizada.',
}

Error.stackTraceLimit = 60

module.exports = function(err, req, res, next) {

	// wrong/abscent CSRF token
	if (err.code === "EBADCSRFTOKEN") {
		// Can't user renderError here!, because the method is only attached to the
		// res object after the csrf middleware is run.
		req.logger.info("Auth error: Wrong CSRF token.");
		return res.renderError(401, { msg: "Erro de autenticação." });
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

	if (err.err === 'APIError') {
		res.renderError(400, {
			name: err.name,
			error: err.err,
			msg: err.msg || 'Não foi possível completar a sua ligação.',
		});
		return;
	}

	if (err.error === 'ReqParse') {
		res.renderError(400, {
			name: err.type,
			key: err.key,
			value: err.value,
			error: err.error,
			message: err.message,
		});
		return;
	}

	// I have the slight feeling that this stuff is getting out of hand.
	// { process: false } means: "don't process the error. it's not critical.
	// just send it to the user"
	if (err.process === false) {
		delete err.process;
		res.renderError(err.status || 500, err);
		return;
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
		console.log('validationerror', err)
		res.renderError(400, {msg: 'Não foi possível completar a sua ligação.'})
		return;
	}

	if (err.name === 'InternalOAuthError') {
		req.logger.info(err)
		console.trace();
		res.renderError(401, {msg: 'Não conseguimos te autenticar. Tente novamente.'})
		return;
	}

	if (err.name === 'BotDetected') {
		req.logger.info('BOT DETECTED!',
			req.headers["x-forwarded-for"] || req.connection.remoteAddress);
		res.renderError(403, {msg: 'Detectamos atividade maliciosa na sua sessão.'})
		return;
	}

	if (err instanceof TypeError) {
		// May be express complaining of a url with invalid stuff (%A23 or whatever)
		// TODO: find a better way to discern the url problem from other TypeErrors!
		if (err.stack)
			req.logger.info(err.stack)
		console.trace();
		res.renderError(500);
		return;
	}

	// Set status.
	if (err.status) {
		res.status(err.status);
	} else if (res.statusCode < 400) {
		res.status(500);
	}

	if (req.app.get('env') === 'production') {
		try {
			var newrelic = require('newrelic');
			newrelic.noticeError(err);
		} catch (e) {
			req.logger.warn('Failed to call newrelic.noticeError.', e);
		}
	}

	req.logger.fatal('Error detected:', err, err.args &&
		JSON.stringify(err.args.err && err.args.err.errors), err.status);
	Error.stackTraceLimit = 60
	if (err.stack) {
		req.logger.info(err.stack)
	}
	console.trace();

	// from http://nodejs.org/api/domain.html#domain_warning_don_t_ignore_errors
	try {
		// Close server and force exit after 10 if CLUSTERING.
		if (nconf.get('env') === 'production' && process.env.__CLUSTERING) {
			req.app.preKill(10*1000);
		}

		if (nconf.get('env') === 'development') {
			// try to send error callback
			res.renderError(500, {
				errorCode: err.statusCode,
				errorMsg: err.msg,
				errorStack: (err.stack || '').split('\n').slice(1).join('<br>'),
			});
		} else {
			res.renderError(500, {
				message: err.msg || "Ops.",
			});
		}
	} catch (e) {
		// oh well, not much we can do at this point.
		res.end();
		req.logger.fatal('Failed to renderError. Empty response returned.', e);
		console.trace();
	}
}
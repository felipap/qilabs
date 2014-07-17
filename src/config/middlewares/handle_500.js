
var permissions = {
	login: {
		message: "Você tem que estar logado para continuar.",
	}
}

module.exports = function(err, req, res, next) {

	if (err.type === 'ObsoleteId') {
		// TODO: find way to detect while model type we couldn't find and customize 404 message.
		return res.render404(); // "Esse usuário não existe.");
	}

	console.error('Error stack:', err);
	console.trace();

	if (err.status)
		res.status(err.status);
	else if (err.permission)
		res.status(401);
	else if (res.statusCode < 400)
		res.status(500);

	var accept = req.headers.accept || '';

	if (~accept.indexOf('html')) {
		if (err.permission === 'login') {
			return res.redirect('/');
		}
		
		if (req.app.get('env') === 'production') {
			res.render('app/500', {
				user: req.user,
				message: err.human_message
			});
		} else {
			res.render('app/500', {
				user: req.user,
				error_code: res.statusCode,
				error_msg: err,
				error_stack: (err.stack || '').split('\n').slice(1).join('<br>'),
			});
		}
	} else {
		var error = { message: err.message, stack: err.stack };
		for (var prop in err) error[prop] = err[prop];
		return res
			.set('Content-Type', 'application/json')
			.end(JSON.stringify({ error: error, message: err.msg || 'Erro.' }));
		// if (req.app.get('env') === 'production') {
		// } else {	
		// 	var error = { message: err.message, stack: err.stack };
		// 	for (var prop in err) error[prop] = err[prop];
		// 	var json = JSON.stringify({ error: error });
		// 	res.setHeader('Content-Type', 'application/json');
		// 	res.end(json);
		// }
	}
}
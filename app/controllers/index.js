
var mongoose = require('mongoose')
var _ = require('lodash')

var required = require('./lib/required')
var labs = require('app/data/labs')

function colorFromIP(text, ip) {
	var colors = require('colors/safe');
	var CS = [
		'red', 'green', 'yellow', 'blue',
		'magenta', 'cyan', 'white', 'gray', 'grey'
	];
	var ccolor = CS[Math.floor(Math.random()*CS.length)]
	// return JSON.stringify(colors[ccolor](text))
	// return colors.red(text)
	return JSON.stringify(colors.red("asdfasdf"))
}

module.exports = function (app) {
	var router = require('express').Router()

	var logger = app.get('logger').child({ child: 'APP' })

	router.use(function (req, res, next) {
		req.logger = logger
		var ip = req.connection.remoteAddress
		if (req.user) {
			var identification = colorFromIP(req.user.username+'@'+ip, ip)
		} else {
			var identification = colorFromIP('anonymous@'+ip, ip)
		}
		logger.info('<'+identification+'>: HTTP '+req.method+' '+req.url)
		next()
	})

	router.use('/signup', (require('./signup'))(app))

	router.use(function (req, res, next) {
		// meta.registered is true when user has finished /signup form
		if (req.user && !req.user.meta.registered) {
			return res.redirect('/signup')
		}

		if (!req.user) {
			next()
			return
		}

		res.locals.userCache = {}
		res.locals.lastAccess = req.user.meta.last_access
		req.user.meta.last_access = new Date()
		req.user.save()

		// this is really not modular...
		req.user.Cacher().onNotifications.get((err, data) => {
			if (err) {
				throw err
			}
			res.locals.userCache.lastNotified = data.lastNotified
			res.locals.userCache.lastSeenNotifications = data.lastSeen

			next()
		})
	})

	router.get('/links/:link', function (req, res, next) {
		if (req.params.link in app.locals.urls)
			res.redirect(app.locals.urls[req.params.link])
		else {
			res.render404()
		}
	})

	router.use(require('./labs')(app))
	router.use(require('./olympiads')(app))
	router.use(require('./ranking')(app))
	router.use(require('./profile')(app))

	router.get('/login', (req, res) => { res.redirect('/') })
	router.get('/entrar', (req, res) => { res.redirect('/auth/facebook') })
	router.get('/sobre', (req, res) => { res.render('about/main') })
	router.get('/faq', (req, res) => { res.render('about/faq') })
	router.get('/blog', (req, res) => { res.redirect('http://blog.qilabs.org') })

	router.get('/settings', required.login, (req, res) => {
		res.render('app/settings')
	})

	router.use('/auth', require('./passport')(app))
	router.use('/admin', require('./admin')(app))

	return router
}
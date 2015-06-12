
var express = require('express')
var unspam = require('../lib/unspam')
var bunyan = require('app/config/bunyan')
var required = require('../lib/required')

var User = require('mongoose').model('User')

module.exports = function (app) {
	var api = express.Router()
	var logger = app.get('logger').child({ child: 'API' })

	api.use(function (req, res, next) {
		req.logger = logger
		// logger.info("<"+(req.user && req.user.username || 'anonymous@'+
		// 	req.connection.remoteAddress)+">: HTTP "+req.method+" /api"+req.url)
		req.isAPICall = true
		next()
	})

	api.use(unspam)

	// A little backdoor for debugging purposes.
	api.get('/logmein/:username', (req, res) => {
		if (nconf.get('env') === 'production') {
			if (!req.user || !req.user.flags.mystique || !req.user.flags.admin) {
				return res.status(404).end()
			}
		}
		var is_admin = nconf.get('env') === 'development' || req.user.flags.admin
		User.findOne({ username: req.params.username }, (err, user) => {
			if (err) {
				return res.endJSON({ error: err })
			}
			if (!user) {
				return res.endJSON({ error: true, message: 'User not found' })
			}
			if (!user.flags.fake && !is_admin) {
				return res.endJSON({ error: true, message: 'Não pode.' })
			}
			logger.info('Logging in as ', user.username)
			req.login(user, (err) => {
				if (err) {
					return res.endJSON({ error: err })
				}
				logger.info('Success??')
				res.redirect('/')
			})
		})
	})

	api.use('/session', require('./session')(app))

	api.use('/labs', require('./labs')(app))
	api.use('/users', require('./users')(app))
	api.use('/posts', require('./posts')(app))
	api.use('/psets', require('./psets')(app))
	api.use(required.login)
	api.use('/problems', require('./problems')(app))
	api.use('/me', require('./me')(app))

	// Handle 404.
	// Don't 'leak' to other controllers: all /api/ should be satisfied here.
	api.use((req, res) => {
		res.status(404).send({
			error: true,
			message: 'Page not found.',
		})
	})

	return api
}
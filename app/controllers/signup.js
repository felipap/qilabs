
var mongoose = require('mongoose')
var validator = require('validator')

var required = require('./lib/required')
var unspam = require('./lib/unspam')
var validator = require('validator')

var User = mongoose.model('User')

function isValidUsername (str) {
	return str.match(/^[a-z0-9][_a-z0-9]{4,}$/)
}

module.exports = function (app) {
	var router = require('express').Router()

	router.use(required.login)
	router.use((req, res, next) => {
		if (req.user.meta.registered) {
			return res.redirect('/')
		}
		next()
	})

	router.get(['/finish','/'], (req, res) => {
		console.log(req.session.registerStep)
		if (req.session.registerStep === 2) {
			return res.redirect('/signup/finish/2')
		}
		res.redirect('/signup/finish/1')
	})

	router.get('/exists', unspam, unspam.limit(300), (req, res) => {
		if (!req.query.username) {
			res.endJSON({ invalid: true })
			return
		}

		var username = req.query.username.toLowerCase()

		if (!isValidUsername(username)) {
			res.endJSON({ invalid: true })
			return
		}

		User.findOne({ username: username }, (err, doc) => {
			if (err) {
				req.logger.error('Você tinha que quebrar, né, usuáriozinho?', err)
				return res.endJSON({ exists: true })
			}
			res.endJSON({ exists: !!doc })
		})
	})

	router.get('/finish/1', (req, res) => {
		res.render('app/signup_1')
	})

	router.get('/finish/2', (req, res) => {
		if (req.session.registerStep !== 2) {
			res.redirect('/singup/finish/1')
			return
		}
		res.render('app/signup_2')
	})

	router.get('/logout', (req, res) => {
		req.logout()
		res.redirect('/')
	})

	router.put('/finish/1', (req, res) => {

		var fields = [
			'nome', 'sobrenome', 'email', 'school-year', 'b-day', 'b-month', 'b-year',
		]

		for (var i=0; i<fields.length; ++i) {
			if (typeof req.body[fields[i]] !== 'string') {
				res.endJSON({ message: 'Formulário incompleto.' })
				return
			}
		}

		var body = {
			nome: validator.trim(req.body.nome).split(' ')[0],
			sobrenome: validator.trim(req.body.sobrenome).split(' ')[0],
			email: validator.trim(req.body.email),
			serie: validator.trim(req.body['school-year']),
		}

		var birthday = new Date(''+
			parseInt(req.body['b-day'])+' '+
			Math.max(0, Math.min(12, parseInt(req.body['b-month'])))+' '+
			Math.max(Math.min(2005, parseInt(req.body['b-year'])), 1950)
		)

		// Validate!

		// TODO:
		// check if email is already in use.

		if (!validator.isEmail(body.email)) {
			res.endJSON({ error: 'Email inválido.' })
			return
		}

		var series = [
			'6-ef', '7-ef', '8-ef', '9-ef', '1-em',
			'2-em', '3-em', 'faculdade', 'pg', 'esc'
		]

		if (series.indexOf(body.serie) === -1) {
			res.endJSON({ error: 'Série inválida.' })
			return
		}

		req.user.name = body.nome+' '+body.sobrenome
		req.user.email = body.email
		req.user.profile.serie = body.serie

		// TODO: refactor this shit
		// Goto next form
		req.session.registerStep = 2

		req.user.save((err) => {
			if (err) {
				throw err
			}

			res.endJSON({ error: false })
		})

	})


	router.put('/finish/2', (req, res) => {
		if (req.user.meta.registered) {
			// Make "extra-sure" that nobody will rename their usernames
			res.status(403).end()
			return
		}

		// console.log('profile received', req.body)
		// do tests
		// sanitize
		if (req.body.username) {
			var username = validator.trim(req.body.username.replace(/^\s+|\s+$/g, '').slice(0,14)).toLowerCase()
			if (!isValidUsername(username)) {
				return res.endJSON({ error: 'Escolha um username válido.' })
			}
		} else {
			res.endJSON({ error: 'Escolha uma username definitivo.' })
			return
		}

		if (req.body.bio) {
			var bio = validator.trim(req.body.bio.replace(/^\s+|\s+$/g, '').slice(0,300))
			req.user.profile.bio = bio
		} else {
			res.endJSON({ error: 'Escreva uma bio.' })
			return
		}

		if (req.body.home) {
			var home = validator.trim(req.body.home.replace(/^\s+|\s+$/g, '').slice(0,50))
			req.user.profile.home = home
		} else {
			res.endJSON({ error: 'De onde você é?' })
			return
		}

		if (req.body.location) {
			var location = validator.trim(req.body.location.replace(/^\s+|\s+$/g, '').slice(0,50))
			req.user.profile.location = location
		} else {
			res.endJSON({ error: 'O que você faz da vida?' })
			return
		}

		User.findOne({ username: username }, (err, doc) => {
			if (doc) {
				res.endJSON({ error: 'Esse nome de usuário já está em uso.' })
				return
			}

			req.user.username = username
			req.user.meta.registered = true
			req.user.save((err) => {
				if (err) {
					throw err
				}
				req.session.signinUp = false
				res.endJSON({ error: false })
				})
		})
	})

	return router
}
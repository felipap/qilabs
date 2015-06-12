
mongoose = require 'mongoose'
validator = require 'validator'

required = require './lib/required'
unspam = require './lib/unspam'

User = mongoose.model 'User'

is_valid_username = (str) -> str.match /^[a-z0-9][_a-z0-9]{4,}$/

module.exports = (app) ->
	router = require('express').Router()

	router.use required.login
	router.use (req, res, next) ->
		if req.user.meta.registered
			return res.redirect('/')
		next()

	router.get ['/finish','/'], (req, res) ->
		if req.session.sign_form is 2
			return res.redirect('/signup/finish/2')
		res.redirect('/signup/finish/1')

	router.get '/exists', unspam, unspam.limit(300), (req, res) ->

		if not req.query.username
			return res.endJSON { invalid: true }

		username = req.query.username.toLowerCase()

		if not is_valid_username(username)
			return res.endJSON { invalid: true }

		User.findOne { username: username }, (err, doc) ->
			if err
				req.logger.error 'Você tinha que quebrar, né, usuáriozinho?', err
				return res.endJSON { exists: true }
			res.endJSON { exists: doc? }

	router.route('/finish/1')
		.get (req, res) ->
			res.render('app/signup_1')
		.put (req, res) ->
			validator = require('validator')

			fields = 'nome sobrenome email school-year b-day b-month b-year'.split(' ')

			for field in fields
				if typeof req.body[field] isnt 'string'
					return res.endJSON { error: true, message: 'Formulário incompleto.' }

			nome = validator.trim(req.body.nome).split(' ')[0]
			sobrenome = validator.trim(req.body.sobrenome).split(' ')[0]
			email = validator.trim(req.body.email)
			serie = validator.trim(req.body['school-year'])
			birthDay = parseInt(req.body['b-day'])
			birthMonth = req.body['b-month']
			birthYear = Math.max(Math.min(2005, parseInt(req.body['b-year'])), 1950)

			if birthMonth not in 'january february march april may june july august september october november december'.split(' ')
				return res.endJSON { error: true, message: 'Mês de nascimento inválido.'}

			birthday = new Date(birthDay+' '+birthMonth+' '+birthYear)
			req.user.profile.birthday = birthday
			console.log birthday
			# Fill stuff
			# Name
			req.user.name = nome+' '+sobrenome
			# Email
			if validator.isEmail(email)
				req.user.email = email
			# School year
			if not serie in ['6-ef', '7-ef', '8-ef', '9-ef', '1-em', '2-em', '3-em', 'faculdade', 'pg', 'esc']
				return res.endJSON { error: true, message: 'Ano inválido.' }
			else
				req.user.profile.serie = serie

			req.session.sign_form = 2
			req.user.save (err) ->
				if err
					req.logger.error('PUTS', err)
					return res.endJSON { error: true }
				res.endJSON { error: false }

	router.route('/finish/2')
		.get (req, res) ->
			if req.session.sign_form isnt 2
				return res.redirect('/signup/finish/1')
			res.render('app/signup_2')
		.put (req, res) ->

			if req.user.meta.registered
			# Make "extra-sure" that nobody will rename their usernames
				return res.status(403).end()

			# console.log('profile received', req.body)
			# do tests
			# sanitize
			if req.body.username
				username = validator.trim(req.body.username.replace(/^\s+|\s+$/g, '').slice(0,14)).toLowerCase()
				if not is_valid_username(username)
					return res.endJSON { error: true, message: 'Escolha um username válido.' }
			else
				return res.endJSON { error: true, message: 'Escolha uma username definitivo.' }
			if req.body.bio
				bio = validator.trim(req.body.bio.replace(/^\s+|\s+$/g, '').slice(0,300))
				req.user.profile.bio = bio
			else
				return res.endJSON { error: true, message: 'Escreva uma bio.' }
			if req.body.home
				home = validator.trim(req.body.home.replace(/^\s+|\s+$/g, '').slice(0,50))
				req.user.profile.home = home
			else
				return res.endJSON { error: true, message: 'De onde você é?' }
			if req.body.location
				location = validator.trim(req.body.location.replace(/^\s+|\s+$/g, '').slice(0,50))
				req.user.profile.location = location
			else
				return res.endJSON { error: true, message: 'O que você faz da vida?' }

			User.findOne { username: username }, (err, doc) ->
				if doc
					return res.endJSON { error: true, message: 'Esse nome de usuário já está em uso.' }
				else
					req.user.username = username
					req.user.meta.registered = true
					req.user.save (err) ->
						if err
							console.log(err);
							return res.endJSON { error: true }
						req.session.signinUp = false
						res.endJSON { error: false }

	return router
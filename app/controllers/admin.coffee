
module.exports = (app) ->
	router = require('express').Router()

	router.use (req, res, next) ->
		if req.user?.flags?.admin
			return next()
		res.render404()

	router.get '/', (req, res) ->
		res.render 'admin/home', {}

	router
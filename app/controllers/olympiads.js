
var mongoose = require('mongoose')

var required = require('./lib/required')
var psetActions = require('app/actions/psets')
var problemActions = require('app/actions/problems')

module.exports = function (app) {
	var router = require('express').Router()

	var Problem = mongoose.model('Problem')
	var ProblemSet = mongoose.model('ProblemSet')

	router.param('problemId', function (req, res, next, problemId) {
		try {
			var id = mongoose.Types.ObjectId.createFromHexString(problemId)
		} catch (e) {
			return next({ type: "InvalidId", args:'problemId', value: problemId})
		}
		Problem.findOne({ _id: problemId }, req.handleErr404((problem) => {
			req.problem = problem
			next()
		}))
	})

	router.param('psetSlug', function (req, res, next, psetSlug) {
		ProblemSet.findOne({ slug: psetSlug },
		req.handleErr404((pset) => {
			req.pset = pset
			next()
		}))
	})

	//

	router.get('/olimpiadas', function (req, res) {
		ProblemSet.find({}, req.handleErr((docs) => {
			res.render('app/problem_sets', {
				pageUrl: '/olimpiadas',
				psets: docs,
			})
		}))
	})

	var n = [
		'/olimpiadas/problemas/novo',
		'/olimpiadas/colecoes/novo',
	]
	n.forEach((n) => {
		router.get(n, required.self.admin, function (req, res) {
			ProblemSet.find({}, req.handleErr((docs) => {
				res.render('app/problem_sets', {
					pageUrl: '/olimpiadas',
					psets: docs,
				})
			}))
		})
	})

	var n = [
		'/olimpiadas/colecoes/:psetSlug/editar',
	]
	n.forEach((n) => {
		router.get(n, function (req, res) {
			ProblemSet.find({}, req.handleErr((docs) => {
				psetActions.stuffGetPset(req.user, req.pset, (err, json) => {
					res.render('app/problem_sets', {
						pageUrl: '/olimpiadas',
						resource: {
							data: json,
						},
						psets: docs,
					})
				})
			}))
		})
	})

	var n = [
		'/olimpiadas/colecoes/:psetSlug',
		'/olimpiadas/colecoes/:psetSlug/:problemIndex',
	]
	n.forEach((n) => {
		router.get(n, required.login, function (req, res) {
			ProblemSet.find({}, req.handleErr((docs) => {
				psetActions.stuffGetPset(req.user, req.pset, (err, json) => {
					res.render('app/problem_sets', {
						pageUrl: '/olimpiadas',
						resource: {
							data: json,
						},
						psets: docs,
					})
				})
			}))
		})
	})


	var n = [
		'/olimpiadas/problemas/:problemId',
		'/olimpiadas/problemas/:problemId/editar',
	]
	n.forEach((n) => {
		router.get(n, required.login, (req, res) => {
			problemActions.stuffGetProblem(req.user, req.problem,
			req.handleErr404((json) => {
				res.render('app/problem_sets', {
					pageUrl: '/olimpiadas',
					resource: {
						data: json,
						type: 'problem',
					},
					metaResource: req.problem,
				})
			}))
		})
	})

	return router
}

var express = require('express')
var mongoose = require('mongoose')
var lodash = require('lodash')

var required = require('../lib/required')

module.exports = function (app) {
	var router = express.Router()

	router.use(required.development)

	var availableModels = [
		'Inbox', 'CommentTree', 'User', 'KarmaChunk', 'Post',
		'Problem', 'Notification', 'Follow', 'Garbage', 'ProblemSet',
		'ProblemCache',
	]

	router.get('/:model', function (req, res) {
		if (availableModels.indexOf(req.params.model) === -1) {
			res.endJSON({ error: "Cadê?" })
			return
		}

		var model = mongoose.model(req.params.model)
		model.find({}, (err, docs) => {
			if (err) {
				throw err
			}

			var result = []
			if (docs.length) {
				if (docs[0].fullJSON) {
					result = lodash.map(docs, (i) => i.fullJSON())
				} else {
					result = lodash.map(docs, (i) => i.toJSON())
				}
			}
			res.endJSON({ model: model.modelName, err: err, docs: result })
		})
	})

	router.get('/', function (req, res) {
		res.endJSON({ ip: req.ip, session: req.session })
	})

	return router
}
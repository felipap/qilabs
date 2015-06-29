
var mongoose = require('mongoose')
var _ = require('lodash')
var async = require('async')

var required = require('./lib/required')
var labs = require('app/static/labs')
var redis = require('app/config/redis.js')
var stuffGetPost = require('app/actions/posts').stuffGetPost
var cardActions = require('app/actions/cards')
var psetActions = require('app/actions/psets')
var problemActions = require('app/actions/problems')

var Post = mongoose.model('Post')

module.exports = (app) => {
	var router = require('express').Router()

	// SAP pages → render main template
	var n = [
		'/interesses',
		'/posts/:postId/editar'
	]
	n.forEach((n) => {
		router.get(n, required.login, (req, res, next) => {
			res.render('app/labs', { pageUrl: '/' })
		})
	})

	// LABS

	function getLatestLabPosts(user, cb) {
		var query =	Post.find({}).limit(15).sort('-created_at')

		if (user) {
			query.where({ lab: { $in: user.preferences.labs } })
		}

		query.exec((err, docs) => {
			if (err) {
				throw err
			}

			if (!docs.length || !docs[docs.length-1]) {
				minDate = 0
			} else {
				minDate = docs[docs.length-1].created_at
			}
			cb(null, cardActions.workPostCards(user, docs), minDate)
		})
	}

	router.get('/', (req, res, next) => {
		var data = {}
		data.pageUrl = '/'
		getLatestLabPosts(req.user || null, (err, posts, minDate) => {
			data.feed = {
				docs: posts,
				minDate: minDate,
			}
			res.render('app/labs', data)
		})
	})

	router.get('/labs/:labSlug', (req, res) => {
		var labdata = _.find(labs, { slug: req.params.labSlug })
		if (!labdata) {
			return res.render404()
		}
		res.render('app/labs', {
			lab: labdata,
			pageUrl: '/'+req.params.labSlug,
			// results: null
		})
	})

	/*
	 * POSTS
	 */

	router.get('/posts/:postId', (req, res) => {
		Post.findOne({ _id: req.params.postId }, req.handleErr404((post) => {
			stuffGetPost(req.user, post, (err, data) => {
				res.render('app/labs',  {
					resource: {
						data: data,
						type: 'post',
					},
					metaResource: post,
					pageUrl: '/',
				})
			})
		}))
	})

	router.get('/p/:post64Id', (req, res) => {
		// TODO: check if the try-catch is really necessary.
		try {
			var id = new Buffer(req.params.post64Id, 'base64').toString('hex')
			res.redirect('/posts/'+id)
		} catch (e) {
			res.redirect('/')
		}
	})

	return router
}
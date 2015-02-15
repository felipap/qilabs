
// consumer.js
// Script to consume kue jobs.

'use strict'

require('coffee-script/register')

// Absolute imports.
// See https://gist.github.com/branneman/8048520#6-the-hack
process.env.NODE_PATH = '.'
require('module').Module._initPaths()

var nconf = require('./config/nconf')

// Logging.
// Create before app is used as arg to modules.
if (!global.logger) {
	var logger = require('app/config/bunyan')()
	global.logger = logger
	logger.level(nconf.get('BUNYAN_LVL') || 'debug')
} else {
	var logger = global.logger.mchild()
}

//

var bunyan = require('bunyan')
var kue = require('kue')
var express = require('express')
var assert = require('assert')
var _ = require('lodash')
var domain = require('domain')
var mongoose = require('mongoose')
var async = require('async')

var please = require('./lib/please.js')
var jobs = require('./config/kue.js') // get kue (redis) connection

function main () {
	// var d = require('dtrace-provider')

	logger.info('Jobs queue started. Listening on port', jobs.client.port)

	// process.once('SIGTERM', function (sig) {
	// 	jobs.shutdown(function(err) {
	// 		logger.info('Kue is shutting down.', err||'')
	// 		process.exit(0)
	// 	}, 5000)
	// })

	/**
	 * Remove jobs after they complete.
	 */
	jobs.on('job complete', function (id, result) {
		kue.Job.get(id, function (err, job) {
			if (err || !job) {
				logger.warn('[consumer::on job completed] fail to get job: '+id+
					'. error:'+err)
				return
			}
			// logger.info('Job completed', { type: job.type, title: job.data.title })
			if (job && _.isFunction(job.remove)) {
				job.remove()
			} else {
				logger.error('[consumer::removeKueJob] bad argument, '+job)
			}
		})
	})

	var Jobs = new (require('app/jobs'))(logger)

	var jDict = {
		'user follow': Jobs.userFollow,
		'user unfollow': Jobs.userUnfollow,
		'post upvote': Jobs.postUpvote,
		'post unupvote': Jobs.postUnupvote,
		'updatePostParticipations': Jobs.updatePostParticipations,
		'notifyAuthorRepliedComment': Jobs.notifyAuthorRepliedComment,
		'notifyMentionedUsers': Jobs.notifyMentionedUsers,
		'notifyRepliedPostAuthor': Jobs.notifyRepliedPostAuthor,
		'undoNotificationsFromDeletedComment': Jobs.undoNotificationsFromDeletedComment,
		'NEW post': Jobs.newPost,
	};

	/**
	 * Run function inside a domain, to catch any errors the job may throw.
	 */
	function wrapJobInDomain (func, name) {
		assert(func && name)

		function ParameterObjectNotFound (message) {
			this.name = 'ParameterObjectNotFound'
			this.message = message || ''
		}
		ParameterObjectNotFound.prototype = Object.create(Error.prototype)

		function loadParams (job, done) {
			var params = Jobs.params,
					populatedParams = {}
			async.map(Object.keys(params), function (param, done) {
				if (param+'Id' in job.data) {
					var model = params[param],
							id = job.data[param+'Id']

					// Test if valid id. This is a good idea.
					try {
						mongoose.Types.ObjectId.createFromHexString(id);
					} catch (e) {
						throw new Error('Invalid id value for param '+param+': '+id)
					}

					model.findOne({ _id: id }, function (err, result) {
						if (err) {
							throw err
						}
						if (!result) {
							// This should be caught by domain!
							throw new ParameterObjectNotFound(
								'Failed to fetch object with id '+id+' of model '+
								model.modelName)
						}
						// console.log('fetched param \'%s\' %s(%s)', param, model.modelName, id)
						populatedParams[param] = result
						done()
					})
				} else {
					done()
				}
			}, function (err, results) {
				done(populatedParams)
			})
		}

		return function (job, done) {
			job.logger = logger.child({ job: name, type: job.type })
			job.logger.debug('Job '+name+' started with data', job.data)

			var d = domain.create()

			d.on('error', function (err) {
				console.log('error on job '+name, err, err.stack)
				done(err)
			})

			d.run(function () {
				loadParams(job, function (pparams) {
					job.r = pparams;
					func(job, function (err) {
						if (err) {
							job.logger.error('Job '+name+' finished with error', job.data)
							done(err)
						} else {
							job.logger.debug('Job '+name+' finished successfully with data',
								job.data)
							done(null)
						}
					})
				})
			})
		};
	}

	for (var name in jDict) {
		jobs.process(name, wrapJobInDomain(jDict[name], name))
	}

	// require('app/jobs/scheduled')
}

// Kue Web visualizer.
function startWebServer() {
	if (nconf.get('KUE_SERVER_PASS')) {
		var app = express() // no tls for now
		var ui = require('kue-ui')
		var basicAuth = require('basic-auth')

		ui.setup({
	    apiURL: '/api', // IMPORTANT: specify the api url
	    baseURL: '/kue' // IMPORTANT: specify the base url
		})
		app.use(function (req, res, next) {
			var user = basicAuth(req)
			if (!user || user.name !== 'admin' ||
			user.pass !== nconf.get('KUE_SERVER_PASS')) {
				res.set('WWW-Authenticate', 'Basic realm=Authorization Required')
				return res.status(401).end()
			}
			next()
		})
		app.use('/api', kue.app); // Mount kue JSON api
		app.use('/kue', ui.app); // Mount UI
		app.use('/', ui.app); // Mount UI
		// app.use(kue.app)
		var s = app.listen(nconf.get('KUE_SERVER_PORT') || 4000)
		if (s.address()) {
			logger.info('Kue web interface listening on port '+s.address().port)
		} else {
			logger.error('Failed to start kue web interface.')
		}
	} else {
		throw new Error('Server pass not found. Add KUE_SERVER_PASS to your env.')
	}
}

if (require.main === module) { // We're on our own
	require('./config/mongoose.js')()
	process.on('uncaughtException', function (error) {
		logger.error('[consumer::uncaughtException] '+error+', stack:'+error.stack)
	})
} else if (nconf.get('KUE_SERVE_HTTP')) {
	startWebServer();
}

// Start processing jobs only after mongoose is connected
if (mongoose.connection.readyState == 2) { // connecting → wait
	mongoose.connection.once('connected', main)
} else if (mongoose.connection.readyState == 1) {
	main()
} else {
	throw 'Unexpected mongo readyState of '+mongoose.connection.readyState
	}

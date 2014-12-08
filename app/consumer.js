
// consumer.js
// Script to consume kue jobs.

// Absolute imports. See https://gist.github.com/branneman/8048520#6-the-hack
process.env.NODE_PATH = '.';
require('module').Module._initPaths();

require('coffee-script/register');

//

var bunyan = require('bunyan')
var kue = require('kue')
var nconf = require('nconf')
var express = require('express')
var assert = require('assert')
var _ = require('lodash')
var mongoose = require('mongoose')

var please = require('./lib/please.js')
var jobs = require('./config/kue.js') // get kue (redis) connection

var logger

function main () {
	// var d = require('dtrace-provider');

	logger.info('Jobs queue started. Listening on port', jobs.client.port)

	process.once('SIGTERM', function (sig) {
		jobs.shutdown(function(err) {
			logger.info('Kue is shutting down.', err||'')
			process.exit(0)
		}, 5000)
	})

	jobs.on('job complete', function (id, result) {
		kue.Job.get(id, function (err, job) {
			if (err || !job) {
				logger.warn("[consumer::on job completed] fail to get job: "+id+
					". error:"+err)
				return
			}
			logger.info("Job completed", { type: job.type, title: job.data.title })
			if (job && _.isFunction(job.remove)) {
				job.remove()
			} else {
				logger.error("[consumer::removeKueJob] bad argument, "+job)
			}
		})
	})

	var JobsService = new (require('app/jobs'))(logger)
	require('app/jobs/scheduled')

	jobs.process('user follow', JobsService.userFollow)
	jobs.process('user unfollow', JobsService.userUnfollow)
	jobs.process('post upvote', JobsService.postUpvote)
	jobs.process('post unupvote', JobsService.postUnupvote)
	jobs.process('NEW comment', JobsService.newComment)
	jobs.process('NEW comment reply', JobsService.newCommentMention)
	jobs.process('new comment mention', JobsService.newCommentReply)
	jobs.process('DELETE post comment', JobsService.deletePost)
	jobs.process('NEW post', JobsService.newPost)
}

// Kue Web visualizer.
function startServer() {
	if (nconf.get('KUE_SERVER_PASS')) {
		var app = express() // no tls for now
		var basicAuth = require('basic-auth')
		app.use(function (req, res, next) {
			var user = basicAuth(req)
			if (!user || user.name !== 'admin' ||
			user.pass !== nconf.get('KUE_SERVER_PASS')) {
				res.set('WWW-Authenticate', 'Basic realm=Authorization Required')
				return res.send(401)
			}
			next()
		})
		app.use(kue.app)
		var s = app.listen(nconf.get('KUE_SERVER_PORT') || 4000)
		logger.info("Kue server listening on port "+s.address().port)
	} else {
		throw new Error("Server pass not found. Add KUE_SERVER_PASS to your env.")
	}
}

if (require.main === module) { // We're on our own
	logger = require('./config/bunyan.js')()
	require('./config/mongoose.js')()
	// startServer()
	process.on('uncaughtException', function (error) {
		logger.error("[consumer::uncaughtException] "+error+", stack:"+error.stack)
	})

	// Start processing jobs only after mongoose is connected
	if (mongoose.connection.readyState == 2) { // connecting → wait
		mongoose.connection.once('connected', main)
	} else if (mongoose.connection.readyState == 1) {
		main()
	} else
		throw "Unexpected mongo readyState of "+mongoose.connection.readyState
} else {
	logger = global.logger.mchild()
	startServer()
	// Expects mongoose to already be connected
	main()
}
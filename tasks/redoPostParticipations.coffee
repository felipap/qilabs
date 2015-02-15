
async = require('async')
mongoose = require('mongoose')
_ = require('lodash')

jobber = require('./lib/jobber.js')((e) ->

	Post = mongoose.model 'Post'

	workPost = (post, done) ->
		require('app/jobs/refreshPostParticipations') post, done

	targetPostId = process.argv[2]
	if targetPostId
		Post.findOne { _id: targetPostId }, (err, post) ->
			workPost post, e.quit
	else
		console.warn 'No target post id supplied. Doing all.'
		Post.find {}, (err, posts) ->
			async.map posts, workPost, e.quit

).start()
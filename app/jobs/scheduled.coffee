
agenda = require 'app/config/agenda'
fbService = require 'app/services/fb'

_ = require 'lodash'
mongoose = require 'mongoose'
User = mongoose.model 'User'

# agenda.on 'start', (job) ->
#   console.log 'Job %s starting', job.attrs.name

# agenda.on 'fail', (err, job) ->
# 	console.log 'Job failed with error: %s', err.message

# agenda.define 'irritate asd', (job, done) ->
# 	console.log('porra')
# 	# throw new Error("caramba")
# 	done()
	# User.findOne { username: 'felipe' }, (err, asd) ->
		# fbService.notifyUser asd, 'Oi, Asd. Você é ridícula.', 'novidades', '/tour'

# setInterval () ->

# 	agenda.jobs {}, (err, jobs) ->
# 		# console.log jobs[0].agenda._nextScanAt, jobs[0].next
# 		console.log(jobs[0])
# 		# setTimeout (() -> console.log '-----\n'), 1000

# , 5000

# agenda.every '2 minutes', 'irritate asd'


# agenda.start()
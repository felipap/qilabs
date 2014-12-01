
mongoose = require 'mongoose'
_ = require 'lodash'
nconf = require 'nconf'
FB = require 'fb'

please = require 'app/lib/please.js'
jobs = require 'app/config/kue.js'
logger = require('app/config/bunyan')({ service: 'FacebookService' })

# FB.setAccessToken nconf.get('facebook_access_token')
User = mongoose.model 'User'

module.exports = {

	notifyUser: (user, text, cb) ->
		please {$model:'User'},'$skip','$isFn'
		data = {
			template: text,
			ref: 'novidades',
			href: '/tour',
		}
		logger.info('Notifying user '+user.name+' ('+user.id+').', data)
		data.access_token = nconf.get('prod_facebook_access_token') # user.access_token
		FB.api '/'+user.facebook_id+'/notifications', 'post', data, (res) ->
			console.log(arguments)
}
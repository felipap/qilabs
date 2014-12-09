
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

	notifyUser: (user, text, ref, href, cb) ->
		please {$model:'User'},'$skip','$skip','$skip','$isFn'
		data = {
			template: text,
			ref: ref,
			href: href,
		}
		logger.info('Notifying user '+user.name+' ('+user.id+').', data)
		data.access_token = nconf.get('prod_facebook_access_token') # user.access_token
		FB.api '/'+user.facebook_id+'/notifications', 'post', data, (res) ->
			console.log(arguments)

	getFriendsInQI: (user, cb) ->
		logger.info('Getting user '+user.name+' ('+user.id+') friends in qi labs')
		data = {}
		data.fields = 'name,id,picture'
		data.access_token = nconf.get('prod_facebook_access_token') # user.access_token
		# data.access_token = user.access_token
		FB.api '/v2.0/'+user.facebook_id+'/friends', 'get', data, (res) ->
		# FB.api '/v2.0/me/friends', 'get', data, (res) ->
			cb(null, res)

}
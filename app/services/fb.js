
var mongoose = require('mongoose')
var _ = require('lodash')
var nconf = require('nconf')
var FB = require('fb')

var please = require('app/lib/please.js')
var jobs = require('app/config/kue.js')
var logger = require('app/config/bunyan')({ service: 'FacebookService' })

// FB.setAccessToken nconf.get('facebook_access_token')
var User = mongoose.model('User')

module.exports = {
	notifyUser: function (user, text, ref, href, cb) {
		please({$model:User},'$skip','$skip','$skip','$fn')

		var data = {
			template: text,
			ref: ref,
			href: href,
		}

		logger.info('Notifying user '+user.name+' ('+user.id+').', data)
		data.access_token = nconf.get('prod_facebook_access_token') // user.access_token
		FB.api('/'+user.facebook_id+'/notifications', 'post', data, function (res) {
			console.log(arguments)
		});
	},

	getFriendsInQI: function (user, cb) {
		logger.info('Getting user '+user.name+' ('+user.id+') friends in qi labs')
		var data = {
			fields: 'name,id,picture',
			access_token: nconf.get('prod_facebook_access_token'), // user.access_token,
		}
		// data.access_token = user.access_token
		FB.api('/v2.0/'+user.facebook_id+'/friends', 'get', data, function (res) {
		// FB.api '/v2.0/me/friends', 'get', data, (res) ->
			cb(null, res)
		})
	}
}
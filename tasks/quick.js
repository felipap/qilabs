
var async = require('async')
var mongoose = require('mongoose')
var ObjectId = mongoose.Types.ObjectId

jobber = require('./jobber.js')(function (e) {
	var Resource = mongoose.model('Resource')
	var User = Resource.model('User')
	var Follow = Resource.model('Follow')

}).start()
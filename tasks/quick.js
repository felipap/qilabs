
var async = require('async')

function dryText (str) {
	return str.replace(/(\s{1})[\s]*/gi, '$1');
}
function pureText (str) {
	return str.replace(/(<([^>]+)>)/ig,"");
}

jobber = require('./jobber.js')(function (e) {
	var mongoose = require('mongoose')
	var Post = mongoose.model('Resource').model('Post')

}).start()
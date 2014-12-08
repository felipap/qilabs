
var Agenda = require('agenda');
var nconf = require('nconf');

var agenda = new Agenda({
	db: {
		address: nconf.get('MONGOLAB_URI') || 'mongodb://localhost/madb'
	},
	processEvery: '5 seconds',
})

module.exports = agenda;
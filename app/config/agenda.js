
var Agenda = require('agenda');
var nconf = require('nconf');

var agenda = new Agenda({
	db: {
		address: nconf.get('MONGOLAB_URI') || 'mongodb://localhost/madb'
	},
	processEvery: '5 seconds',
})

// var count = 1
// var last = Date.now()

// agenda.define('say hi', function (job, done) {
//   console.log('Hi! lol', count++, (Date.now()-last)/1000)
//   last = Date.now()
//   done()
// })

// agenda.every('10 seconds', 'say hi')

// agenda.start()

module.exports = agenda;
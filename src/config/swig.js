
var swig = require('swig')
var extras = require('swig-extras')

// var mySwig = new swig.Swig()

extras.useTag(swig, 'switch')
extras.useTag(swig, 'case')

extras.useTag(swig, 'markdown')

// Remove html tags from text.
swig.setFilter('planify', function (input) {
	return input.replace(/(<([^>]+)>)/ig,"")
})

// You know what slice is.
swig.setFilter('slice', function (input, start, end) {
	if (!end) {
		end = start;
		start = 0;
	}
	return input.slice(start, end);
})

// You also know what split is.
swig.setFilter('split', function (input, char) {
	return input.split(char);
})

module.exports = swig

var swig = require('swig')

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

module.exports = swig
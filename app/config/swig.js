
var swig = require('swig')
var extras = require('swig-extras')
var nconf = require('nconf')

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


var marked = require('marked');
var renderer = new marked.Renderer();
renderer.codespan = function (html) {
	// Don't consider codespans in markdown (they're actually 'latex')
	return '`'+html+'`';
}
marked.setOptions({
	renderer: renderer,
	gfm: false,
	tables: false,
	breaks: false,
	pedantic: false,
	sanitize: true,
	smartLists: true,
	smartypants: true,
})

swig.setFilter('marked', function (input) {
	return marked(input);
})

swig.setFilter('trnsltDate', function (input) {
	function camel(a) {
		return a[0].toUpperCase()+a.slice(1);
	}
	var dict = {
		"january": "janeiro",
		"february": "fevereiro",
		"march": "março",
		"april": "abril",
		"may": "maio",
		"june": "junho",
		"july": "julho",
		"august": "agosto",
		"september": "setembro",
		"october": "outubro",
		"november": "novembro",
		"december": "dezembro",
	}
	for (var k in dict) {
		input = input.replace(k, dict[k]);
		input = input.replace(camel(k), camel(dict[k]));
	}
	return input;
})

swig.setFilter('calcTimeFrom', function (input) {
	var now = new Date(),
		then = new Date(input),
		diff = now-then;

	if (diff < 1000*60) {
		return 'agora';
		var m = Math.floor(diff/1000);
		return 'há '+m+' segundo'+(m>1?'s':'');
	} else if (diff < 1000*60*60) {
		var m = Math.floor(diff/1000/60);
		return 'há '+m+' minuto'+(m>1?'s':'');
	} else if (diff < 1000*60*60*30) { // até 30 horas
		var m = Math.floor(diff/1000/60/60);
		return 'há '+m+' hora'+(m>1?'s':'');
	} else if (diff < 1000*60*60*24*14) {
		var m = Math.floor(diff/1000/60/60/24);
		return 'há '+m+' dia'+(m>1?'s':'');
	} else {
		var m = Math.floor(diff/1000/60/60/24/7);
		return 'há '+m+' semana'+(m>1?'s':'');
	}
})

// You know what index is too
swig.setFilter('index', function (input, index) {
	if (index < 0)
		return input[input.length+index];	
	return input[index];
})

/**
 * Only enter block when in development.
 * Use for testing features.
 */
swig.setTag('development',
	function parse (str, line, parser, types, stack, options, swig) {
		parser.on('*', function () {
			throw new Error('The development tag does not accept arguments');
		});

		return true;
	},
	function compile (compiler, args, content, parents, options, blockName) {
		if (nconf.get('env') === 'development') {
			return compiler(content, parents, options, blockName);
		}
		return '';
	},
	true,
	true
);

/**
 * Only enter block when in production.
 * Use to prevent needless features during development.
 */
swig.setTag('production',
	function parse (str, line, parser, types, stack, options, swig) {
		parser.on('*', function () {
			throw new Error('The production tag does not accept arguments');
		});

		return true;
	},
	function compile (compiler, args, content, parents, options, blockName) {
		if (nconf.get('env') === 'production') {
			return compiler(content, parents, options, blockName);
		}
		return '';
	},
	true,
	true
);

module.exports = swig
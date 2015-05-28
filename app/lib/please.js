
// please.js
// A small utility for ttd.

// Sample usage:
// function notifyUser (recpObj, agentObj, data, cb) {
//   please({$model:Model},{$model:Model},{$contains:['url','type']})
// }
//

var lodash = require('lodash');

function formatObject (obj, climit) {
	// TODO: limit size of nested object.
	if (!climit) {
		climit = 10000;
	}
	var stringified = JSON.stringify(obj, undefined, 2);
	if (stringified.length > climit)
		stringified = stringified.slice(0, climit-3)+'...';
	return stringified;
}

var argsBuiltin = {
	$equals:
		function(value, expected) {
			if (value !== expected) {
				return true;
			}
		},
	$instance:
		function(value, expected) {
			if (!(value instanceof expected)) {
				return true;
			}
		},
	$isErr:
		function(value) {
			if (value instanceof Error || value === null || value === undefined ||
				value === false) {
				return;
			}
			return true;
		},
	$object: // Check
		function(value) {
			if (!lodash.isPlainObject(value)) {
				return true;
			}
		},
	$skip:
		function(value) {
		},
	$fn:
		function(value) {
			if (value instanceof Function) {
				return;
			}
			return true;
		},
	$contains:
		function(value, expected) {
			if (expected instanceof Array) {
				var keys = expected;
			} else if (typeof expected === 'string') {
				var keys = expected.split(' ');
			} else {
				return "Invalid expected value for assertion of type 'contains': "+expected;
			}
			for (var i=0; i<keys.length; i++) {
				var key = keys[i];
				if (!(key in value)) {
					return true;
				}
			}
		},
	$in:
		function(value, expected) {
			if (value in expected) {
				return false;
			}

			if (expected instanceof Array) {
				var keys = expected;
			} else if (typeof expected === 'string') {
				var keys = expected.split(' ');
			} else {
				return "Invalid expected value for assertion of type 'among': "+expected;
			}
			if (keys.indexOf(value) === -1) {
				return true;
			}
		},
};

var Please = function () {

	function assertParam (tests, fnArg) {
		var builtins = Please.tests || {};

		// Support for unary tests like '$fn'
		if (typeof tests === 'string') {
			if (tests[0] === '$' && tests in builtins) {
				if (builtins[tests].length === 1) {
					return builtins[tests](fnArg);
				}
				return "Type '"+tests+"' takes a positive number of arguments";
			}
			return "Invalid assertion of type "+tests;
		}

		// Support for many tests.
		// Eg: {$contains:['a','b'],'a':'$fn','b':{$isA:Array}}
		for (var key in tests) {
			if (key[0] === '$') {
				// key is a test operation. call it!
				if (key in builtins) {
					var err = builtins[key](fnArg, tests[key]);
					if (err) {
						return "Argument '"+fnArg+"' doesn't match "+key+": "+tests[key]+
							"\n"+err;
					}
				} else {
					return "Invalid assertion of type '"+key;
				}
			} else {
				// key is a nested attribute: validate stuff inside of it.
				if (fnArg.hasOwnProperty(key)) {
					var err = assertParam(tests[key], fnArg[key]);
					if (err) {
						return "On attribute "+key+". "+err;
					}
				} else {
					return "Attribute '"+key+"' not found in "+fnArg+".";
				}
			}
		}
	};

	var asserts = 1 <= arguments.length ? [].slice.call(arguments, 0) : [];

	// Callee arguments might have been passed at asserts[-1]
	if (''+asserts[asserts.length - 1] === '[object Arguments]') {
		var args = asserts.pop();
	} else {
		// Or gotten using arguments.callee.caller['arguments']
		try {
			var args = arguments.callee.caller["arguments"];
		} catch (e) {
			console.trace();
			throw "To use function inside strictmode, provide arguments as last parameter";
		}
	}

	for (var i=0; i<asserts.length; i++) {
		var paramAssertions = asserts[i];
		if (this.verbose) {
			console.log('Asserting arg:'+JSON.stringify(args[i])+' to conform to '+JSON.stringify(paramAssertions))
		}
		var err = assertParam(paramAssertions, args[i]);
		if (err) {
			console.error("Please error on index "+i+": \""+err+"\".");
			console.trace();
			throw "Please error on index "+i+": \""+err+"\".";
		}
	}
}

Please.verbose = true;
Please.tests = {};

Please.setVerbose = function (v) {
	this.verbose = !!v;
}

Please.extend = function (obj) {
	for (var i in obj) {
		if (obj.hasOwnProperty(i)) {
			Please.tests[i] = obj[i];
		}
	}
}

Please.extend(argsBuiltin);
Please.extend(require('./pleaseModels.js'));

module.exports = Please;
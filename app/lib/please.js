
// please.js
// A lib for ttd?
// by @f03lipe

// Sample usage:
// notifyUser = (recpObj, agentObj, data, cb) ->
// 	please({$model:Model},{$model:Model},{$contains:['url','type']})

function formatObject (obj, climit) {
	// TODO: limit size of nested object.
	if (!climit)
		climit = 10000;
	var stringified = JSON.stringify(obj, undefined, 2);
	if (stringified.length > climit)
		stringified = stringified.slice(0, climit-3)+'...';
	return stringified;
}

var argsBuiltin = {
	$equals: {
		test: function(value, expected) {
			if (value === expected) {
				return false;
			}
			return "Argument '"+value+"'' doesn't match '$is': "+expected;
		}
	},
	$instance: {
		test: function(value, expected) {
			if (value instanceof expected) {
				return false;
			}
			return "Argument '"+value+"'' doesn't match '$instance': "+expected;
		}
	},
	$isErr: {
		test: function(value) {
			if (value instanceof Error || value === null || value === undefined ||
				value === false) {
				return false;
			}
			return "Argument '"+value+"'' doesn't match '$isErr'";
		}
	},
	$skip: {
		test: function(value) {
			return false;
		}
	},
	$fn: {
		test: function(value) {
			if (value instanceof Function) {
				return false;
			}
			return "Argument '"+value+"'' doesn't match 'isFn'";
		}
	},
	$contains: {
		test: function(value, expected) {
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
					return "Argument '"+formatObject(value)+"' doesn't match {$contains:"+key+"}";
				}
			}
			return false;
		}
	},
	$in: {
		test: function(value, expected) {
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
				return "Argument '"+formatObject(value)+"' doesn't match {$in:"+expected+"}";
			}
			return false;
		}
	}
};

var Please = function () {

	function assertParam (param, functionArg) {
		var builtins = Please.tests || {};

		// Support for unary tests like '$fn'
		if (typeof param === 'string') {
			if (param[0] === '$' && param in builtins) {
				if (builtins[param].test.length === 1) {
					return builtins[param].test(functionArg);
				}
				return "Type '"+param+"' takes a non-zero number of arguments";
			}
			return "Invalid assertion of type "+param;
		}

		// Support for many tests. Eg: {$contains:['a','b'], 'a':'$fn', 'b':{$isA:Array}}
		for (akey in param) {
			var avalue = param[akey];

			if (akey[0] === '$') {
				if (akey in builtins) {
					var err = builtins[akey].test(functionArg, avalue);
					if (err) {
						return err;
					}
				} else {
					console.log(builtins)
					return "Invalid assertion of type '"+akey;
				}
			} else {
				if (functionArg.hasOwnProperty(akey)) {
					var err = assertParam(avalue, functionArg[akey]);
					if (err) {
						return ("On attribute "+akey+". ")+err;
					}
				} else {
					return "Attribute '"+akey+"' not found in "+functionArg+".";
				}
			}
		}
	};

	var args, asserts = 1 <= arguments.length ? [].slice.call(arguments, 0) : [];

	// Callee arguments might have been passed at asserts[-1]
	if (''+asserts[asserts.length - 1] === '[object Arguments]') {
		args = asserts.pop();
	} else {
		// Or gotten using arguments.callee.caller['arguments']
		try {
			args = arguments.callee.caller["arguments"];
		} catch (e) {
			throw "To use function inside strictmode, provide arguments as last parameter";
		}
	}

	for (var i=0; i<asserts.length; i++) {
		var paramAssertions = asserts[i];
		if (this.verbose) {
			console.log('Asserting arg:'+JSON.stringify(args[i])+' to conform to '+JSON.stringify(paramAssertions))
		}
		var err = assertParam(paramAssertions, args[i])
		if (err) {
			console.error("Please error on index "+i+": \""+err+"\".");
			console.trace()
			throw "Please error on index "+i+": \""+err+"\".";
		}
	}
}

Please.verbose = true
Please.tests = {}

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
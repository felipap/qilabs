
/* jobber.js
* A wrapper for jobs. Repeat after me:
- This is not a library.
- This is not a library.
- This is not a library.
- I swear not to try to make this into a library. */

var colors = require('colors');
var path = require('path');
var mongoose = require('mongoose');

module.exports = function (job, options) {
	
	var standalone = (module.parent === require.main);

	var verbose = (options && options.verbose)||true;
	var requirable = options?((typeof options === 'string')?options:options.requirable):false;
	if (!standalone && !requirable)
		throw "This module is supposed to be executed as a job.";

	var parentFile = path.basename(module.parent.filename);

	var start = function () {

		verbose && console.log(('Jobber: Requiring environment keys.').green);
		
		// If being executed directly...
		// > load keys
		try {
			require('../src/env.js');
		} catch (e) {}

		// Open database.
		verbose && console.log(('Jobber: Opening database configuration file.').green);
		require('../src/config/mongoose');

		verbose && console.log(('Jobber: Requiring environment keys.').green);

		verbose && console.log(('Jobber: Calling job on file '+parentFile).green);
	
		console.time('jobTime');
		job({
			// To be called by user at the end of function.
			quit: function (err) {
				console.timeEnd('jobTime');
				if (err) {					
					console.log(("Jobber: Process (pid="+process.pid+") terminated with err:").red, err)
				} else {
					console.log(("Jobber: Process (pid="+process.pid+") terminated.").green)
				}
				// Close database at the end.
				// Otherwise, the script won't close.
				mongoose.connection.close()
				process.exit(!!err)
			},
			// Simple 'continue? [y/n]' utility.
			checkContinue: function checkContinue (onContinue) {
				process.stdout.write('Continue [Y/n]? ')
				var stdin = process.openStdin();
				stdin.on('data', function (chunk) {
					var input = chunk.toString(); 
					if (input === '\n' || input === 'y\n' || input.toLowerCase() === 'yes\n') {
						onContinue();
					} else { // (input === 'n\n' || input.toLowerCase() === 'no\n') {
						console.log("Aborting process (pid="+process.pid+").");
						// Close database at the end.
						// Otherwise, the script won't close.
						mongoose.connection.close();
						process.exit(0);
					}
				});
			}
		})
	};

	return {start: start};
}
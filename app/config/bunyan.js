
var bunyan = require('bunyan');
var nconf = require('nconf');
var _ = require('lodash');
var path = require('path');

module.exports = function (options) {

  var logger = bunyan.createLogger(_.extend({
		name: 'QI',
		serializers: { // add serializers for req, res and err
			req: bunyan.stdSerializers.req,
			req: bunyan.stdSerializers.res,
			err: bunyan.stdSerializers.err,
		},
		level: 'trace',
	}, options || {}));

  // Ugly?
  // Custom child method that returns a child logger for the caller file
  // (usefull for quick usages, such as config modules)
  logger.mchild = function (options) {
    // http://stackoverflow.com/questions/13227489
    // HACK to get callers' filename
    var origPrepareStackTrace = Error.prepareStackTrace;
    Error.prepareStackTrace = function (_, stack) { return stack }
    var err = new Error();
    var stack = err.stack;
    Error.prepareStackTrace = origPrepareStackTrace;
    // Yes, I'm desperate to shoot myself in the foot
    // https://github.com/joyent/node/issues/9253#issuecomment-75314037
    var abspath = stack[1].toString().match(/.* \(([\w.\/]+):\d+:\d+\)/)[1]
    if (!abspath)
      throw new Error("Failed to find absolute path of the caller.")
    var relpath = path.relative(path.resolve(__dirname, '..'), abspath);
    return this.child(_.extend(options, { module: relpath }));
  }.bind(logger)

	return logger;
}
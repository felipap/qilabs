
// Throw Mongodb Errors Right Away

module.exports = function (call) {
	if (typeof call === 'string') {
		var message = [].slice.call(arguments)
		return function (call) {
			return function (err) {
				if (err) {
					message.push(err)
					logger.error.apply(logger, message)
					console.trace()
					throw err
				}
				call.apply(this, [].slice.call(arguments, 1))
			}
		}
	} else {
		return function (err) {
			if (err) {
				logger.error("TMERA:", err)
				console.trace()
				throw err
			}
			call.apply(this, [].slice.call(arguments, 1))
		}
	}
}
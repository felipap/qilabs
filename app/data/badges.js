
_ = require('lodash')

data = {
}

for (var i in data)
if (data.hasOwnProperty(i))
	data[i].id = i;

module.exports = data;
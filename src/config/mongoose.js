
var oldPath = process.env.NODE_PATH;
// https://gist.github.com/branneman/8048520#6-the-hack
process.env.NODE_PATH = '.';
require('module').Module._initPaths();

var mongoose = require('mongoose');
mongoose.connect(process.env.MONGOLAB_URI
	|| process.env.MONGOHQ_URL
	|| 'mongodb://localhost/madb');

require('../models/lib/resourceObject');

// module.exports = function (app) {
// // Keep user as last one.
// }
var models = ['notification', 'inbox', 'post', 'follow', 'activity', 'user'];
for (var i=0; i<models.length; i++)
	require('../models/'+models[i]);

// Re-set old NODE_PATH
process.env.NODE_PATH = oldPath;
require('module').Module._initPaths();

module.exports = mongoose;
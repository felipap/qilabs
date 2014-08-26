var bunyan, express;

express = require('express');

bunyan = require('bunyan');

module.exports = function(app) {
  var api, router;
  console.log('porra');
  router = require('../lib/router.js')(app);
  api = express.Router();
  api.use(function(req, res, next) {
    req.logger = new bunyan.createLogger({
      name: 'API'
    });
    req.logger.info("<" + (req.user && req.user.username || 'anonymous@' + req.connection.remoteAddress) + ">: HTTP " + req.method + " " + req.url);
    req.isAPICall = true;
    return next();
  });
  api.use('/session', require('./session.js')(app));
  api.use('/posts', require('./posts.js')(app));
  return api;
};

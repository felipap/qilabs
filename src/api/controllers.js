var bunyan, express;

express = require('express');

bunyan = require('bunyan');

module.exports = function(app) {
  var api, logger;
  api = express.Router();
  logger = app.get('logger').child({
    child: 'API'
  });
  api.use(function(req, res, next) {
    req.logger = logger;
    req.logger.info("<" + (req.user && req.user.username || 'anonymous@' + req.connection.remoteAddress) + ">: HTTP " + req.method + " " + req.url);
    req.isAPICall = true;
    return next();
  });
  api.use('/session', require('./session.js')(app));
  api.use('/posts', require('./posts.js')(app));
  api.use('/problems', require('./problems.js')(app));
  api.use('/pages', require('./pages.js')(app));
  api.use('/me', require('./me.js')(app));
  api.use('/users', require('./users.js')(app));
  return api;
};

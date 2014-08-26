var bunyan, express;

express = require('express');

bunyan = require('bunyan');

module.exports = function(app) {
  var api;
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
  api.use('/problems', require('./problems.js')(app));
  api.use('/pages', require('./pages.js')(app));
  api.use('/me', require('./me.js')(app));
  api.use('/users', require('./users.js')(app));
  api.use('/auth', require('./auth.js')(app));
  return api;
};

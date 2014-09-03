var bunyan, express, required;

express = require('express');

bunyan = require('bunyan');

required = require('src/lib/required');

module.exports = function(app) {
  var api, logger;
  api = express.Router();
  logger = app.get('logger').child({
    child: 'API'
  });
  api.get('/logmein/:userId', required.isMe, function(req, res) {
    var User, id;
    User = require('mongoose').model('Resource').model('User');
    id = req.paramToObjectId('userId');
    return User.findById(id, function(err, user) {
      if (err) {
        return res.endJSON({
          error: err
        });
      }
      logger.info('Logging in as ', user.username);
      return req.login(user, function(err) {
        if (err) {
          return res.endJSON({
            error: err
          });
        }
        logger.info('Success??');
        return res.endJSON({
          error: false
        });
      });
    });
  });
  api.use(function(req, res, next) {
    req.logger = logger;
    req.logger.info("<" + (req.user && req.user.username || 'anonymous@' + req.connection.remoteAddress) + ">: HTTP " + req.method + " " + req.url);
    req.isAPICall = true;
    return next();
  });
  api.use('/session', require('./session')(app));
  api.use('/posts', require('./posts')(app));
  api.use('/problems', require('./problems')(app));
  api.use('/pages', require('./pages')(app));
  api.use('/me', require('./me')(app));
  api.use('/users', require('./users')(app));
  return api;
};

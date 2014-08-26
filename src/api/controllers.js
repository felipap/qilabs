module.exports = function(app) {
  var logger;
  logger = app.get('logger').child({
    app: 'API'
  });
  return {
    '/api': {
      use: [
        function(req, res, next) {
          req.logger = logger;
          logger.info("<" + (req.user && req.user.username || 'anonymous@' + req.connection.remoteAddress) + ">: HTTP " + req.method + " " + req.url);
          return next();
        }
      ],
      children: {
        'session': require('./session'),
        'posts': require('./posts'),
        'problems': require('./problems'),
        'pages': require('./pages'),
        'me': require('./me'),
        'users': require('./api_users'),
        'auth': require('./auth')
      }
    }
  };
};

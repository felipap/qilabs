module.exports = {
  '/api': {
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

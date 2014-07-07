
/*
The controller for /api/* calls.
 */
var mongoose;

mongoose = require('mongoose');

module.exports = {
  '/api': {
    children: {
      'session': require('./api_session'),
      'posts': require('./api_posts'),
      'users': require('./api_users'),
      'me': require('./api_me'),
      'auth': require('./api_auth')
    }
  }
};

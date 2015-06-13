
var React = require('react');

var CardTemplates = require('../components/cardTemplates.jsx');
var Models = require('../lib/models.js');

module.exports = function (app) {
  app.FeedWall.setup(Models.PostList, CardTemplates.Post);
  app.FeedWall.renderPath('/api/users/'+window.user_profile.id+'/posts')
};
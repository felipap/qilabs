var async, jobber, _;

async = require('async');

_ = require('underscore');

jobber = require('../jobber.js')(function(e) {
  var Follow, Post, Resource, User, mongoose, targetUserId;
  mongoose = require('../../src/config/mongoose.js');
  Resource = mongoose.model('Resource');
  Post = Resource.model('Post');
  User = Resource.model('User');
  Follow = Resource.model('Follow');
  targetUserId = process.argv[2];
  if (!targetUserId) {
    console.warn("No target user id supplied.");
    e.quit(1);
  }
  console.log("Refreshing status for " + targetUserId);
  return User.findOne({
    _id: targetUserId
  }, function(err, user) {
    return Follow.count({
      follower: user,
      followee: {
        $ne: null
      }
    }, function(err, cfollowing) {
      return Follow.count({
        followee: user,
        follower: {
          $ne: null
        }
      }, function(err, cfollowers) {
        return Post.find({
          author: user,
          parentPost: null
        }, function(err, posts) {
          var post, votes, _i, _len;
          user.stats.following = cfollowing;
          user.stats.followers = cfollowers;
          user.stats.posts = posts.length;
          votes = 0;
          for (_i = 0, _len = posts.length; _i < _len; _i++) {
            post = posts[_i];
            votes += post.votes.length;
          }
          user.stats.votes = votes;
          console.log("Saving new user stats: ", user.stats);
          return user.save(function() {
            return e.quit();
          });
        });
      });
    });
  });
}).start();

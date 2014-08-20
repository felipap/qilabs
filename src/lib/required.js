
// required.js
// Python-like decorators for controllers.

var mongoose = require('mongoose');
var _ = require('underscore');

var Resource = mongoose.model('Resource');
var Post = Resource.model('Post');
var Problem = Resource.model('Problem');

function extendErr (err, label) {
	return _.extend(err,{required:(err.required||[]).concat(label)});
}

var permissions = {
	posts: {
		selfOwns: function (postId, req, res, callback) {
			if (''+req.user.facebook_id === process.env.facebook_me) {
				callback();
				return;
			}
			Post.findById(postId, req.handleErrResult(function (post) {
				if (''+post.author === req.user.id) {
					callback();
				} else {
					callback({ required: 'posts.selfOwns' });
				}
			}));
		},

		selfDoesntOwn: function (postId, req, res, callback) {
			Post.findById(postId, req.handleErrResult(function (post) {
				if (''+post.author === req.user.id) {
					callback({ required: 'posts.selfDoesntOwn' });
				} else {
					callback();
				}
			}));
		},
	},
	problems: {
		selfOwns: function (problemId, req, res, callback) {
			if (''+req.user.facebook_id === process.env.facebook_me) {
				callback();
				return;
			}
			Problem.findById(problemId, req.handleErrResult(function (problem) {
				if (''+problem.author === req.user.id) {
					callback();
				} else {
					callback({ required: 'problems.selfOwns' });
				}
			}));
		},

		selfDoesntOwn: function (problemId, req, res, callback) {
			Problem.findById(problemId, req.handleErrResult(function (problem) {
				if (''+problem.author === req.user.id) {
					callback({ required: 'problems.selfDoesntOwn' });
				} else {
					callback();
				}
			}));
		},
	},

};

module.exports = required = {
	logout: function (req, res, next) {
		if (req.user)
			next({permission:'logout'});
		else next();
	},
	login: function (req, res, next) {
		if (req.user) {
			next();
		} else {
			next({permission:'login'});
		}
	},
	// Require user to be me. :D
	isMe: function (req, res, next) {
		if (process.env == "production" && (!req.user || req.user.facebook_id !== process.env.facebook_me))
			next({permission:'isMe', args:[process.env.facebook_me, req.user && req.user.facebook_id]});
		else
			next();
	},
	posts: {
		selfOwns: function (postIdParam) {
			return function (req, res, next) {
				req.paramToObjectId(postIdParam, function (postId) {
					permissions.posts.selfOwns(postId, req, res, function (err) {
						next( err ? extendErr(err, 'posts.selfOwns') : undefined);
					});
				});
			};
		},
		selfDoesntOwn: function (postIdParam) {
			return function (req, res, next) {
				req.paramToObjectId(postIdParam, function (postId) {
					permissions.posts.selfDoesntOwn(postId, req, res, function (err) {
						next( err ? extendErr(err, 'posts.selfDoesntOwn') : undefined);
					});
				});
			};
		},
	},
	problems: {
		selfOwns: function (problemIdParam) {
			return function (req, res, next) {
				req.paramToObjectId(problemIdParam, function (problemId) {
					permissions.problems.selfOwns(problemId, req, res, function (err) {
						next( err ? extendErr(err, 'problems.selfOwns') : undefined);
					});
				});
			};
		},
		selfDoesntOwn: function (problemIdParam) {
			return function (req, res, next) {
				req.paramToObjectId(problemIdParam, function (problemId) {
					permissions.problems.selfDoesntOwn(problemId, req, res, function (err) {
						next( err ? extendErr(err, 'problems.selfDoesntOwn') : undefined);
					});
				});
			};
		},
	}
}
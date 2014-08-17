
// required.js
// Python-like decorators for controllers.

var mongoose = require('mongoose');
var _ = require('underscore');

var Resource = mongoose.model('Resource');
var Post = Resource.model('Post');

function extendErr (err, label) {
	return _.extend(err,{required:(err.required||[]).concat(label)});
}

var permissions = {
	posts: {
		selfCanSee: function (postId, req, res, callback) {
			console.error("Warning: selfCanSee might not make sense anymore. Please, felipe, make up your mind.")
			callback();
			// Post.findById(postId, req.handleErrResult(function (post) {
			// 	// A priori, all posts are visible if not within a private group.
			// 	if (!post.group) {
			//		callback();
			// 	} else {
			// 		permissions.labs.selfCanSee(post.group, req, res, function (err) {
			// 			callback( err ? extendErr(err, 'posts.selfCanSee') : undefined);
			// 		});
			// 	}
			// }));
		},

		selfCanComment: function (postId, req, res, callback) {
			console.error("Warning: selfCanSee might not make sense anymore. Please, felipe, make up your mind.")
			callback();
			// Post.findById(postId, req.handleErrResult(function (post) {
			// 	// A priori, all posts are visible if not within a private group.
			// 	if (!post.group) {
			// 		callback();
			// 	} else {
			// 		permissions.labs.selfIsMember(post.group, req, res, function (err) {
			// 			callback( err ? extendErr(err, 'posts.selfCanComment') : undefined);
			// 		});
			// 	}
			// }));
		},

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
		selfCanSee: function (postIdParam) {
			return function (req, res, next) {
				req.paramToObjectId(postIdParam, function (postId) {
					permissions.posts.selfCanSee(postId, req, res, function (err) {
						next();
					});
				});
			};
		},
		selfCanComment: function (postIdParam) {
			return function (req, res, next) {
				req.paramToObjectId(postIdParam, function (postId) {
					permissions.posts.selfCanComment(postId, req, res, function (err) {
						next( err ? extendErr(err, 'posts.selfCanComment') : undefined);
					});
				});
			};
		},
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
	}
}
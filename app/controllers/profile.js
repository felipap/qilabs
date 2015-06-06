
var mongoose = require('mongoose')
var redis = require('app/config/redis')

var User = mongoose.model('User')

module.exports = function (app) {
	var router = require('express').Router()

	router.param('username', function (req, res, next, username) {
		User.findOne({ username: username }, (err, user) => {
			if (err) {
				throw err
			}
			if (!user) {
				return res.render404({ msg: "Usuário não encontrado." })
			}
			if (user.username !== username) {
				res.redirect(user.path)
				return
			}
			req.requestedUser = user
			next()
		})
	})

	function getProfile (req, res) {
		redis.hgetall(req.requestedUser.getCacheField('Profile'), (err, hash) => {
			req.requestedUser.redis = hash || {}
			if (req.user) {
				req.user.doesFollowUserId(req.requestedUser.id, (err, bool) => {
					res.render('app/profile', {
						pUser: req.requestedUser,
						follows: bool,
						pageUrl: '/@'+req.requestedUser.username,
					})
				})
			} else {
				res.render('app/profile', {
					pUser: req.requestedUser,
					pageUrl: '/@'+req.params.username,
				})
			}
		})
	}

	// router.get [path1,path2,...] isn't working with router.param
	router.get('/@:username', getProfile)
	router.get('/@:username/seguindo', getProfile)
	router.get('/@:username/seguidores', getProfile)

	return router
}

# app/controllers.coffee
# for QILabs.org

mongoose = require 'mongoose'
required = require 'src/lib/required'
redis = require 'src/config/redis'
_ = require 'underscore'

Resource = mongoose.model 'Resource'

Post = Resource.model 'Post'
User = Resource.model 'User'

routes = {
	'/':
		name: 'index'
		get: (req, res) ->
			if req.user
				req.user.lastUpdate = new Date()
				res.render 'app/main',
					user_profile: req.user
				req.user.save()
			else
				res.render 'app/front'

	'/entrar':
		get: (req, res) ->
			res.redirect('/api/auth/facebook')

	'/settings':
		name: 'settings'
		permissions: [required.login]
		get: (req, res) ->
			res.render 'app/settings', {}

	'/tags/:tagId':
		permissions: [required.login]
		get: (req, res) ->
			res.render 'app/tag',
				profile: req.user
				follows: bool

	'/@:username':
		name: 'profile'
		get: (req, res) ->
			unless req.params.username
				return res.render404()
			User.findOne {username:req.params.username},
				req.handleErrResult (pUser) ->
					pUser.genProfile (err, profile) ->
						if err or not profile
							# req.logMe "err generating profile", err
							return res.render404()
						if req.user
							req.user.doesFollowUser pUser, (err, bool) ->
								res.render 'app/profile', 
									pUser: profile
									follows: bool
						else
							res.render 'app/open_profile',
								pUser: profile

	'/posts/:postId':
		name: 'post'
		get: (req, res) ->
			return unless postId = req.paramToObjectId('postId')
			Post.findOne { _id:postId }, req.handleErrResult((post) ->
				if post.parentPost
					return res.render404()
				if req.user
					console.log('user')
					post.stuff req.handleErrResult((stuffedPost) ->
						console.log('stuff', stuffedPost.author.id)
						req.user.doesFollowUser stuffedPost.author.id,
							req.handleErrValue((val) ->
								console.log('follows', val)
								res.render 'app/main',
									user_profile: req.user
									post_profile: _.extend(stuffedPost, { meta: { followed: val } })
							)
					)
				else
					post.stuff req.handleErrResult (post) ->
						res.render 'app/open_post.html',
							post: stuffedPost
			)

	'/posts/:postId/edit':
		permissions: [required.login]
		get: (req, res) ->
			res.redirect('/#posts/'+req.params.postId+'/edit')

	'/sobre':
		name: 'about',
		get: (req, res) ->
			res.render('about/main')

	'/faq':
		name: 'faq',
		get: (req, res) ->
			res.render('about/faq')

	'/blog':
		name: 'blog',
		get: (req, res) ->
			res.redirect('http://blog.qilabs.org')
}

# These correspond to SAP pages, and therefore mustn't return 404.
for n in ['new', 'following', 'followers', 'notifications']
	routes['/'+n] =
		get: (req, res, next) ->
			if req.user
				res.render 'app/main',
					user_profile: req.user
			else
				next()

module.exports = routes
/** @jsx React.DOM */

var $ = require('jquery')
// require('jquery-cookie')
var Backbone = require('backbone')
var _ = require('underscore')
var React = require('react')
var NProgress = require('nprogress')
window._ = _;

var PostForm = require('../views/postForm.js')
var ProblemForm = require('../views/problemForm.js')

var models 				= require('../components/models.js')
var Flasher 			= require('../components/flash.js')
var QITour				= require('../components/tour.js')
var Follows 			= require('../views/follows.js')
var FullPost 			= require('../views/fullItem.js')
var Interests 		= require('../views/interests.js')
var Stream 				= require('../views/stream.js')
var ProfileView 	= require('../pages/profile.js')
var ProblemsView 	= require('../pages/problems.js')

// require('../components/karma.js')
// require('../components/bell.js')
// $('#nav-karma').ikarma();
// $('#nav-bell').bell();

$(document).ajaxStart(function() {
	NProgress.start()
});
$(document).ajaxComplete(function() {
	NProgress.done()
});

window.loadFB = function (cb) {

	if (window.FB)
		return cb();

	var id = $('meta[property=fb:app_id]').attr('content');

	if (!id)
		throw "Meta tag fb:app_id not found.";

  window.fbAsyncInit = function () {
	  FB.init({
	    appId      : id,
	    xfbml      : true,
	    version    : 'v2.1'
	  });
	  cb()
	};

	(function(d, s, id){
	   var js, fjs = d.getElementsByTagName(s)[0];
	   if (d.getElementById(id)) {return;}
	   js = d.createElement(s); js.id = id;
	   js.src = "//connect.facebook.net/en_US/sdk.js";
	   fjs.parentNode.insertBefore(js, fjs);
	 }(document, 'script', 'facebook-jssdk'));
}

//////////////////////////////////////////////////////////////////////////////////////////


// Part of a snpage-only functionality
// Hide popover when mouse-click happens outside of it.
$(document).mouseup(function (e) {
	var container = $('#sidebar');
	if ($('body').hasClass('sidebarOpen')) {
		if (!container.is(e.target) && container.has(e.target).length === 0 &&
			!$('#openSidebar').is(e.target) && $('#openSidebar').has(e.target).length === 0) {
			$('body').removeClass('sidebarOpen');
		}
	}
});
// $(document).keydown(function(e){
// 	if (e.keyCode == 32) {
// 		$('body').toggleClass('sidebarOpen');
// 		return false;
// 	}
// });
$(document).on('click', '#openSidebar', function (e) {
	$('body').toggleClass('sidebarOpen');
});

$('body').on("click", ".btn-follow", function (evt) {
	var action = this.dataset.action;
	if (action !== 'follow' && action !== 'unfollow') {
		throw "What?";
	}

	var neew = (action==='follow')?'unfollow':'follow';
	if (this.dataset.user) {
		$.ajax({
			type: 'post',
			dataType: 'json',
			url: '/api/users/'+this.dataset.user+'/'+action,
		}).done(function (response) {
			if (response.error) {
				if (app && app.flash) {
					app.flash.alert(data.message || "Erro!");
				}
				console.warn("ERRO!", response.error);
			} else {
				this.dataset.action = neew;
			}
		}.bind(this)).fail(function (xhr) {
			if (app && app.flash) {
				app.flash.alert(xhr.responseJSON.message || 'Erro!');
			}
		});
	}
});


$('body').on('click', '[data-trigger=component]', function (e) {
	e.preventDefault();
	// Call router method
	var dataset = this.dataset;
	// Too coupled. This should be implemented as callback, or smthng. Perhaps triggered on navigation.
	$('body').removeClass('sidebarOpen');
	if (dataset.route) {
		var href = $(this).data('href') || $(this).attr('href');
		if (href)
			console.warn('Component href attribute is set to '+href+'.');
		app.navigate(href, {trigger:true, replace:false});
	} else {
		if (typeof app === 'undefined' || !app.components) {
			if (dataset.href)
				window.location.href = dataset.href;
			else
				console.error("Can't trigger component "+dataset.component+" in unexistent app object.");
			return;
		}
		if (dataset.component in app.components) {
			var data = {};
			if (dataset.args) {
				try {
					data = JSON.parse(dataset.args);
				} catch (e) {
					console.error('Failed to parse data-args '+dataset.args+' as JSON object.');
					console.error(e.stack);
				}
			}
			app.components[dataset.component].call(app, data);
		} else {
			console.warn('Router doesn\'t contain component '+dataset.component+'.')
		}
	}
});

// $(document).ready(function () {
// })
// $(window).load(function () {
// })

setTimeout(function updateCounters () {
	$('[data-time-count]').each(function () {
		this.innerHTML = calcTimeFrom(parseInt(this.dataset.timeCount), !!this.dataset.short);
	});
	setTimeout(updateCounters, 5000);
}, 1000);

var Page = function (component, dataPage, opts) {

	var opts = _.extend({}, opts || {
		onClose: function () {}
	});

	component.props.page = this;
	var e = document.createElement('div');
	this.e = e;
	this.c = component;
	if (!opts.navbar)
		$(e).addClass('pContainer');
	$(e).addClass((opts && opts.class) || '');
	$(e).addClass('invisible').hide().appendTo('body');
	if (dataPage)
		e.dataset.page = dataPage;
	var oldTitle = document.title;
	if (opts.title) {
		document.title = opts.title;
	}
	$('html').addClass(opts.crop?'crop':'place-crop');

	React.renderComponent(component, e, function () {
		$(e).show().removeClass('invisible');
	});

	this.destroy = function (dismissOnClose) {
		$(e).addClass('invisible');
		React.unmountComponentAtNode(e);
		$(e).remove();
		document.title = oldTitle;
		$('html').removeClass(opts.crop?'crop':'place-crop');
		if (opts.onClose) {
			var a = opts.onClose;
			opts.onClose = undefined; // Prevent calling twice
			if (!dismissOnClose)
				a();
		}
	};
};

if (window.location.hash == "#tour") {
	Tour.start();
	// window.location.href = "/posts/53ffd868784c6e0200f91bee"; // fugly
}

// Central functionality of the app.
var WorkspaceRouter = Backbone.Router.extend({
	initialize: function () {
		console.log('initialized')
		window.app = this;
		this.pages = [];

		this.pageRoot = window.conf && window.conf.pageRoot;

		for (var id in pageMap)
		if (pageMap.hasOwnProperty(id)) {
			(function (id) {
				var data = pageMap[id],
					path = data.path;
				if (path[0] === '/')
					path = path.slice(1);
				this.route(path, function () {
					var self = this;
					this.renderWall('/api/labs/'+id+'/all');
					$('[data-action=see-notes]').click(function (e) {
						self._fetchStream('/api/labs/'+id+'/notes');
						$(this.parentElement.parentElement).find('button').removeClass('active');
						$(this).addClass('active');
					});
					$('[data-action=see-discussions]').click(function (e) {
						self._fetchStream('/api/labs/'+id+'/discussions');
						$(this.parentElement.parentElement).find('button').removeClass('active');
						$(this).addClass('active');
					});
				}.bind(this));
			}.bind(this))(id);
		}

		if (document.getElementById('qi-stream-wrap')) {
			$(document).scroll(_.throttle(function() {
				// Detect scroll up?
				// http://stackoverflow.com/questions/9957860/detect-user-scroll-down-or-scroll-up-in-jquery
				if ($(document).height() - ($(window).scrollTop() + $(window).height()) < 50) {
					app.tryFetchMore();
				}
			}, 300));
		}
	},

	flash: new Flasher,

	closePages: function () {
		for (var i=0; i<this.pages.length; i++) {
			this.pages[i].destroy();
		}
		this.pages = [];
	},

	fetchStream: function (source) {
		var urls = { global: '/api/me/global/posts', inbox: '/api/me/inbox/posts', problems: '/api/me/problems' };
		var url;
		if (source) {
			if (source in urls) {
				// $.cookie('qi.feed.source', source);
				url = urls[source];
			}
		} else {
			// if ($.cookie('qi.feed.source', source) === 'undefined') {
			// 	$.removeCookie('qi.feed.source');
			// }
			// source = $.cookie('qi.feed.source', source) || 'inbox';
			url = source || urls.inbox;
		}

		// $('.streamSetter').removeClass('active');
		// $('.streamSetter[data-stream-source="'+source+'"]').addClass('active');

		this._fetchStream(url);
	},

	_fetchStream: function (url, query) {
		if (this.postList.url === url && !query) {
			return;
		}

		this.postList.url = url;
		this.postList.reset();
		this.postList.fetch({ reset: true, data: query || {} });
	},

	triggerComponent: function (comp, args) {
		comp.call(this, args);
	},

	tryFetchMore: function () {
		this.postList && this.postList.tryFetchMore();
	},

	renderWall: function (url) {
		if (this.postList && (!url || this.postList.url === url)) {
			// If there already is a postList and no specific url, app.fetchStream() should have been
			// called instead.
			return;
		}

		if (!document.getElementById('qi-stream-wrap')) {
			console.log("Not stream container found.");
			return;
		}

		url = url || (window.conf && window.conf.postsRoot);

		console.log('renderwall')

		if (!this.postList) {
			this.postList = new models.feedList([], {url:url});
		}
		if (!this.postWall) {
			this.postWall = React.renderComponent(
				Stream({ wall: conf.streamRender !== "ListView" }),
				document.getElementById('qi-stream-wrap'));
			// this.postWall = Stream({ wall: conf.streamRender !== "ListView" });
		}

		if (!url) { // ?
			app.fetchStream();
		} else {
			this.postList.reset();
			this.postList.url = url;
			this.postList.fetch({reset:true});
			return;
		}
	},

	routes: {
		'tour':
			function () {
				// detect if chrome // say: "we only support chrome right now"
				if ('WebkitAppearance' in document.documentElement.style);
				this.renderWall();
			},
		'@:username':
			function (username) {
				ProfileView(this)
				this.renderWall()
			},
		'@:username/seguindo':
			function (username) {
				ProfileView(this)
				if (window.user_profile && window.user_profile.username === username) {
					// We really are in <username>'s profile page, and we have its id.
					this.navigate('/@'+username, { trigger: false })
					this.renderWall()
					this.triggerComponent(this.components.following,{
						id: window.user_profile.id
					})
				} else {
					// We don't have his/her id, so redirect to his/her profile
					location.href = '/@'+username+'/seguindo'
				}
			},
		'@:username/seguidores':
			function (username) {
				ProfileView(this)
				if (window.user_profile && window.user_profile.username === username) {
					// We really are in <username>'s profile page, and we have its id.
					this.navigate('/@'+username, { trigger: false })
					this.renderWall()
					this.triggerComponent(this.components.followers,{
						id: window.user_profile.id
					})
				} else {
					// We don't have his/her id, so redirect to his/her profile
					location.href = '/@'+username+'/seguidores'
				}
			},
		// problemas
		'problemas':
			function () {
				ProblemsView(this)
				this.renderWall("/api/me/inbox/problems")
			},
		'problemas/novo':
			function (postId) {
				ProblemsView(this)
				this.triggerComponent(this.components.createProblem)
				this.renderWall("/api/me/inbox/problems")
			},
		'problemas/:problemId':
			function (problemId) {
				ProblemsView(this)
				this.triggerComponent(this.components.viewProblem,{id:problemId})
				this.renderWall("/api/me/inbox/problems")
			},
		'problemas/:problemId/editar':
			function (problemId) {
				ProblemsView(this)
				this.triggerComponent(this.components.editProblem,{id:problemId})
				this.renderWall("/api/me/inbox/problems")
			},
		// posts
		'posts/:postId':
			function (postId) {
				this.triggerComponent(this.components.viewPost,{id:postId})
				this.renderWall()
			},
		'posts/:postId/editar':
			function (postId) {
				this.triggerComponent(this.components.editPost,{id:postId})
				this.renderWall()
			},
		'novo':
			function (postId) {
				this.triggerComponent(this.components.createPost)
				this.renderWall()
			},
		'interesses':
			function (postId) {
				this.triggerComponent(this.components.selectInterests);
				this.renderWall();
			},
		'':
			function () {
				this.closePages();
				this.renderWall();
			},
	},

	components: {
		viewPost: function (data) {
			this.closePages();
			var postId = data.id;
			var resource = window.conf.resource;

			if (!postId) {
				console.warn("No postId supplied to viewPost.", data, resource);
				throw "WTF";
			}

			// Check if resource object came with the html
			if (resource && resource.type === 'post' && resource.data.id === postId) {
			// Resource available on page
				var postItem = new models.postItem(resource.data);
				// Remove window.conf.post, so closing and re-opening post forces us to fetch
				// it again. Otherwise, the use might lose updates.
				window.conf.resource = undefined;
				var p = new Page(FullPost( {type:postItem.get('type'), model:postItem} ), 'post', {
					title: resource.data.content.title,
					crop: true,
					onClose: function () {
						app.navigate(app.pageRoot || '/', { trigger: false });
					}
				});
				this.pages.push(p);
			} else {
			// No. Fetch it by hand.
				$.getJSON('/api/posts/'+postId)
					.done(function (response) {
						if (response.data.parent) {
							return app.navigate('/posts/'+response.data.parent, {trigger:true});
						}
						console.log('response, data', response);
						var postItem = new models.postItem(response.data);
						var p = new Page(FullPost( {type:postItem.get('type'), model:postItem} ), 'post', {
							title: postItem.get('content').title,
							crop: true,
							onClose: function () {
								app.navigate(app.pageRoot || '/', { trigger: false });
							}
						});
						this.pages.push(p);
					}.bind(this))
					.fail(function (xhr) {
						if (xhr.responseJSON && xhr.responseJSON.error) {
							app.flash.alert(xhr.responseJSON.message || 'Erro! <i class="icon-sad"></i>');
						} else {
							app.flash.alert('Contato com o servidor perdido. Tente novamente.');
						}
					}.bind(this));
			}
		},

		viewProblem: function (data) {
			this.closePages();
			var postId = data.id;
			var resource = window.conf.resource;
			if (resource && resource.type === 'problem' && resource.data.id === postId) {
				var postItem = new models.problemItem(resource.data);
				// Remove window.conf.problem, so closing and re-opening post forces us to fetch
				// it again. Otherwise, the use might lose updates.
				window.conf.resource = undefined;
				var p = new Page(FullPost( {type:"Problem", model:postItem} ), 'problem', {
					title: resource.data.content.title,
					crop: true,
					onClose: function () {
						app.navigate(app.pageRoot || '/', { trigger: false });
					}
				});
				this.pages.push(p);
			} else {
				$.getJSON('/api/problems/'+postId)
					.done(function (response) {
						if (response.data.parent) {
							return app.navigate('/problems/'+response.data.parent, {trigger:true});
						}
						console.log('response, data', response);
						var postItem = new models.problemItem(response.data);
						var p = new Page(FullPost( {type:"Problem", model:postItem} ), 'problem', {
							title: postItem.get('content').title,
							crop: true,
							onClose: function () {
								app.navigate(app.pageRoot || '/', { trigger: false });
							}
						});
						this.pages.push(p);
					}.bind(this))
					.fail(function (xhr) {
						app.flash.alert('Ops! Não conseguimos encontrar essa publicação. Ela pode ter sido excluída.');
					}.bind(this));
			}
		},

		createProblem: function (data) {
			this.closePages();
			var p = new Page(ProblemForm.create({user: window.user}), 'problemForm', {
				crop: true,
				onClose: function () {
				}
			});
			this.pages.push(p);
		},

		editProblem: function (data) {
			this.closePages();
			$.getJSON('/api/problems/'+data.id)
				.done(function (response) {
					console.log('response, data', response)
					var problemItem = new models.problemItem(response.data);
					var p = new Page(ProblemForm.edit({model: problemItem}), 'problemForm', {
						crop: true,
						onClose: function () {
							app.navigate(app.pageRoot || '/', { trigger: false });
						},
					});
					this.pages.push(p);
				}.bind(this))
				.fail(function (xhr) {
					app.flash.warn("Problema não encontrado.");
					app.navigate('/', { trigger: true });
				}.bind(this));
		},

		editPost: function (data) {
			this.closePages();
			$.getJSON('/api/posts/'+data.id)
				.done(function (response) {
					if (response.data.parent) {
						return alert('eerrooo');
					}
					console.log('response, data', response)
					var postItem = new models.postItem(response.data);
					var p = new Page(PostForm.edit({model: postItem}), 'postForm', {
						crop: true,
						onClose: function () {
							app.navigate(app.pageRoot || '/', { trigger: false });
						}.bind(this),
					});
					this.pages.push(p);
				}.bind(this))
				.fail(function (xhr) {
					app.flash.warn("Publicação não encontrada.");
					app.navigate('/', { trigger: true });
				}.bind(this));
		},

		createPost: function () {
			this.closePages();
			var p = new Page(PostForm.create({user: window.user}), 'postForm', {
				crop: true,
				onClose: function () {
				}
			});
			this.pages.push(p);
		},

		selectInterests: function (data) {
			var self = this;
			new Interests({}, function () {
			})
		},

		following: function (data) {
			var userId = data.id;
			var self = this;
			$.getJSON('/api/users/'+userId+'/following')
				.done(function (response) {
					var p = new Page(Follows( {list:response.data, isFollowing:true, profile:user_profile} ),
						'listView', {
							navbar: false,
							crop: true,
						});
					self.pages.push(p);
				})
				.fail(function (xhr) {
					alert('vish');
				});
		},

		followers: function (data) {
			var userId = data.id;
			var self = this;
			$.getJSON('/api/users/'+userId+'/followers')
				.done(function (response) {
					var p = new Page(Follows( {list:response.data, isFollowing:false, profile:user_profile} ),
						'listView', {
							navbar: false,
							crop: true,
						});
					self.pages.push(p);
				})
				.fail(function (xhr) {
					alert('vish');
				});
		},

		// notifications: function (data) {
		// 	this.closePages();
		// 	var p = new Page(<NotificationsPage />, 'notifications', { navbar: false, crop: false });
		// 	this.pages.push(p);
		// },
	},
});

module.exports = {
	initialize: function () {
		new WorkspaceRouter;
		// Backbone.history.start({ pushState:false, hashChange:true });
		Backbone.history.start({ pushState:true, hashChange: false });
	},
};
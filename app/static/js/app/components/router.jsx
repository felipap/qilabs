
var $ = require('jquery')
// require('jquery-cookie')
var Backbone = require('backbone')
var _ = require('lodash')
var React = require('react')
var NProgress = require('nprogress')

window._ = _;
Backbone.$ = $;

// 'O
var Models 				= require('../components/models.js')
var Flasher 			= require('../components/flasher.jsx')
var Tour					= require('../components/tour.js')

// SPA react views
var PostForm 			= require('../views/postForm.jsx')
var ProblemForm 	= require('../views/problemForm.jsx')
var Follows 			= require('../views/follows.jsx')
var FullPost 			= require('../views/fullItem.jsx')
var Interests 		= require('../views/interests.jsx')
var Stream 				= require('../views/stream.jsx')

// View-specific views (to be triggered by the routes)
var ProfileView 	= require('../pages/profile.js')
var LabView 			= require('../pages/lab.js')
var LabsView 			= require('../pages/labs.jsx')
var ProblemsView 	= require('../pages/problems.jsx')

if (window.user) {
	require('../components/karma.jsx')
	require('../components/bell.jsx')
	$('#nav-karma').ikarma();
	$('#nav-bell').bell();
}

//////////////////////////////////////////////////////////////////////////////////////////
//////////////////////////////////////////////////////////////////////////////////////////

$(document).ajaxStart(function() {
	NProgress.start()
});
$(document).ajaxComplete(function() {
	NProgress.done()
});

//////////////////////////////////////////////////////////////////////////////////////////
//////////////////////////////////////////////////////////////////////////////////////////


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
					return;
				}
			}
			// Pass parsed data and element that triggered.
			app.components[dataset.component].call(app, data, this);
		} else {
			console.warn('Router doesn\'t contain component '+dataset.component+'.')
		}
	}
});

$('body').on('click', 'button[data-src]', function (e) {
	app.renderWall(this.dataset.src);
	$('button[data-src]').removeClass('active');
	$('button[data-src=\''+this.dataset.src+'\']').addClass('active');
})

if (window.location.hash == "#tour" || window.conf.showTour) {
	Tour()
}

if (window.conf && window.conf.showInterestsBox) {
	setTimeout(function () {
		app.triggerComponent(app.components.selectInterests);
	}, 500)
}

var Pages = function () {
	var pages = [];

	this.push = function (component, dataPage, opts) {
		var opts = _.extend({
			onClose: function () {}
		}, opts || {});

		var e = document.createElement('div');
		var oldTitle = document.title;
		var destroyed = false;

		// Adornate element and page.
		if (!opts.navbar)
			$(e).addClass('pcontainer');
		if (opts.class)
			$(e).addClass(opts.class);
		$(e).addClass('invisble');
		if (dataPage)
			e.dataset.page = dataPage;
		if (opts.title) {
			document.title = opts.title;
		}

		var obj = {
			target: e,
			component: component,
			destroy: function (dismissOnClose) {
				if (destroyed) {
					console.warn("Destroy for page "+dataPage+" being called multiple times.");
					return;
				}
				destroyed = true;
				pages.splice(pages.indexOf(this), 1);
				$(e).addClass('invisible');
				React.unmountComponentAtNode(e);
				$(e).remove();
				document.title = oldTitle;
				$('html').removeClass(opts.crop?'crop':'place-crop');
				opts.onClose && opts.onClose();
			}.bind(this),
		};
		component.props.page = obj;
		pages.push(obj);

		// DOIT
		$(e).hide().appendTo('body');
		$('html').addClass(opts.crop?'crop':'place-crop'); // Remove scrollbars?

		React.render(component, e, function () {
			$(e).show().removeClass('invisible');
		});

		return obj;
	};

	this.pop = function () {
		this.pages.pop().destroy();
	};

	this.closeAll = function () {
		for (var i=0; i<pages.length; i++) {
			pages[i].destroy();
		}
		pages = [];
	};
};

/**
 * Central client-side functionality.
 */
var QILabs = Backbone.Router.extend({
	pages: new Pages(),
	pageRoot: window.conf && window.conf.pageRoot,
	flash: new Flasher,

	initialize: function () {
		console.log('initialized')

		if (document.getElementById('qi-stream-wrap')) {
			$(document).scroll(_.throttle(function() {
				// Detect scroll up?
				// http://stackoverflow.com/questions/9957860/detect-user-scroll-down-or-scroll-up-in-jquery
				if ($(document).height() - ($(window).scrollTop() + $(window).height()) < 50) {
					this.postList && this.postList.tryFetchMore();
				}
			}.bind(this), 2000));
		}

		for (var id in pageMap) if (pageMap.hasOwnProperty(id)) {
			(function (id) {
				var path = pageMap[id].path;
				if (path[0] === '/')
					path = path.slice(1);
				this.route(path, function () {
					this.renderWall('/api/labs/'+id+'/all');
				}.bind(this));
			}.bind(this))(id);
		}
	},

	triggerComponent: function (comp, args) {
		comp.call(this, args);
	},

	renderWallData: function (resource) {
		// Reset wall with resource bootstraped into the page
		if (!resource) throw "WHAT";

		if (!document.getElementById('qi-stream-wrap')) {
			console.log("No stream container found.");
			return;
		}

		var url = resource.url || window.conf.postsRoot;
		if (!this.postList) {
			this.postList = new Models.feedList([], {url:url});
		}
		if (!this.postWall) {
			this.postWall = React.render(
				<Stream wall={!conf.isListView} />,
				document.getElementById('qi-stream-wrap'));
		}

		this.postList.reset();
		this.postList.url = url;
		this.postList.minDate = 1*new Date(resource.minDate);
		this.postList.reset(resource.data);
	},

	renderWall: function (url, query, cb) {
		if (!cb && typeof query === 'function') {
			cb = query;
			query = undefined;
		}

		if (this.postList && (!query && (!url || this.postList.url === url))) {
			// If there already is a postList and no specific url, app.fetchStream() should
			// have been called instead.
			return;
		}

		if (!document.getElementById('qi-stream-wrap')) {
			console.log("No stream container found.");
			return;
		}

		url = url || (window.conf && window.conf.postsRoot);

		console.log('renderwall')

		if (!this.postList) {
			this.postList = new Models.feedList([], {url:url});
		}
		if (!this.postWall) {
			this.postWall = React.render(<Stream wall={!conf.isListView} />,
				document.getElementById('qi-stream-wrap'));
		}

		this.postList.reset();
		this.postList.url = url;
		if (cb) {
			this.postList.once('reset', cb);
		}
		this.postList.fetch({ reset: true, data: query || {} });
	},

	routes: {
		'tour':
			function () {
				// detect if chrome // say: "we only support chrome right now"
				if ('WebkitAppearance' in document.documentElement.style);
				this.renderWall();
			},
		// profile
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
				this.renderWall("/api/labs/all/problems")
			},
		'problemas/novo':
			function (postId) {
				ProblemsView(this)
				this.triggerComponent(this.components.createProblem)
				this.renderWall("/api/labs/all/problems")
			},
		'problemas/:problemId':
			function (problemId) {
				ProblemsView(this)
				this.triggerComponent(this.components.viewProblem,{id:problemId})
				this.renderWall("/api/labs/all/problems")
			},
		'problemas/:problemId/editar':
			function (problemId) {
				ProblemsView(this)
				this.triggerComponent(this.components.editProblem,{id:problemId})
				this.renderWall("/api/labs/all/problems")
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
		// misc
		'novo':
			function (postId) {
				this.triggerComponent(this.components.createPost)
				this.renderWall()
			},
		'interesses':
			function (postId) {
				this.triggerComponent(this.components.selectInterests)
				this.renderWall()
			},
		'labs':
			function () {
				var resource = window.conf.resource;
				LabsView(this)
				this.pages.closeAll()
				if (resource && resource.type === 'feed') { // Check if feed came with the html
					app.renderWallData(resource);
				} else {
					app.renderWall('/api/labs/all');
				}
			},
		'labs/:labSlug':
			function (labSlug) {
				var resource = window.conf.resource;
				// check if labslug is in pagemap
				if (labSlug) {

				}
				LabsView(this,null,labSlug)
				this.pages.closeAll()
				if (resource && resource.type === 'feed') { // Check if feed came with the html
					app.renderWallData(resource);
				} else {
					app.renderWall('/api/labs/'+labSlug);
				}
			},
		'problemas':
			function () {
				LabsView(this, 'problems')
				this.pages.closeAll()
			},
		'':
			function () {
				this.pages.closeAll()
				this.renderWall()
			},
	},

	components: {
		viewPost: function (data) {
			this.pages.closeAll();
			var postId = data.id;
			var resource = window.conf.resource;

			if (!postId) {
				console.warn("No postId supplied to viewPost.", data, resource);
				throw "WTF";
			}

			// Check if resource object came with the html
			if (resource && resource.type === 'post' && resource.data.id === postId) {
			// Resource available on page
				var postItem = new Models.postItem(resource.data);
				// Remove window.conf.post, so closing and re-opening post forces us to fetch
				// it again. Otherwise, the use might lose updates.
				window.conf.resource = undefined;
				this.pages.push(<FullPost type={postItem.get('type')} model={postItem} />, 'post', {
					title: resource.data.content.title+' | QI Labs',
					crop: true,
					onClose: function () {
						app.navigate(app.pageRoot || '/', { trigger: false });
					}
				});
			} else {
			// No. Fetch it by hand.
				$.getJSON('/api/posts/'+postId)
					.done(function (response) {
						if (response.data.parent) {
							return app.navigate('/posts/'+response.data.parent, {trigger:true});
						}
						console.log('response, data', response);
						var postItem = new Models.postItem(response.data);
						this.pages.push(<FullPost type={postItem.get('type')} model={postItem} />, 'post', {
							title: postItem.get('content').title+' | QI Labs',
							crop: true,
							onClose: function () {
								app.navigate(app.pageRoot || '/', { trigger: false });
							}
						});
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
			this.pages.closeAll();
			var postId = data.id;
			var resource = window.conf.resource;
			if (resource && resource.type === 'problem' && resource.data.id === postId) {
				var postItem = new Models.problemItem(resource.data);
				// Remove window.conf.problem, so closing and re-opening post forces us to fetch
				// it again. Otherwise, the use might lose updates.
				window.conf.resource = undefined;
				this.pages.push(<FullPost type="Problem" model={postItem} />, 'problem', {
					title: resource.data.content.title+' | QI Labs',
					crop: true,
					onClose: function () {
						app.navigate(app.pageRoot || '/', { trigger: false });
					}
				});
			} else {
				$.getJSON('/api/problems/'+postId)
					.done(function (response) {
						if (response.data.parent) {
							return app.navigate('/problems/'+response.data.parent, {trigger:true});
						}
						console.log('response, data', response);
						var postItem = new Models.problemItem(response.data);
						this.pages.push(<FullPost type="Problem" model={postItem} />, 'problem', {
							title: postItem.get('content').title+' | QI Labs',
							crop: true,
							onClose: function () {
								app.navigate(app.pageRoot || '/', { trigger: false });
							}
						});
					}.bind(this))
					.fail(function (xhr) {
						if (xhr.status === 404) {
							app.flash.alert('Ops! Não conseguimos encontrar essa publicação. Ela pode ter sido excluída.');
						} else {
							app.flash.alert('Ops.');
						}
					}.bind(this));
			}
		},

		createProblem: function (data) {
			this.pages.closeAll();
			this.pages.push(ProblemForm.create({user: window.user}), 'problemForm', {
				crop: true,
				onClose: function () {
				}
			});
		},

		editProblem: function (data) {
			this.pages.closeAll();
			$.getJSON('/api/problems/'+data.id)
				.done(function (response) {
					console.log('response, data', response)
					var problemItem = new Models.problemItem(response.data);
					this.pages.push(ProblemForm.edit({model: problemItem}), 'problemForm', {
						crop: true,
						onClose: function () {
							app.navigate(app.pageRoot || '/', { trigger: false });
						},
					});
				}.bind(this))
				.fail(function (xhr) {
					app.flash.warn("Problema não encontrado.");
					app.navigate('/', { trigger: true });
				}.bind(this));
		},

		editPost: function (data) {
			this.pages.closeAll();
			$.getJSON('/api/posts/'+data.id)
				.done(function (response) {
					if (response.data.parent) {
						return alert('eerrooo');
					}
					console.log('response, data', response)
					var postItem = new Models.postItem(response.data);
					this.pages.push(PostForm.edit({model: postItem}), 'postForm', {
						crop: true,
						onClose: function () {
							app.navigate(app.pageRoot || '/', { trigger: false });
						}.bind(this),
					});
				}.bind(this))
				.fail(function (xhr) {
					app.flash.warn("Publicação não encontrada.");
					app.navigate('/', { trigger: true });
				}.bind(this));
		},

		createPost: function () {
			this.pages.closeAll();
			this.pages.push(PostForm.create({user: window.user}), 'postForm', {
				crop: true,
				onClose: function () {
				}
			});
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
					self.pages.push(<Follows list={response.data} isFollowing={true} profile={user_profile} />,
						'listView', {
							navbar: false,
							crop: true,
						});
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
					self.pages.push(<Follows list={response.data} isFollowing={false} profile={user_profile} />,
						'listView', {
							navbar: false,
							crop: true,
						});
				})
				.fail(function (xhr) {
					alert('vish');
				});
		},

		// openSidebarPlane: function (data, e) {
		// 	/**
		// 	 * Trigger when mouse-click happens outside of elements.
		// 	 */
		// 	function triggerClickOutsideElements (elems, cb) {
		// 		if (elems instanceof window.Element)
		// 			elems = $(elems);
		// 		$(document).one('mouseup', function (event) {
		// 			if (!$(event.target).is(elems) && // Not the elements.
		// 				!elems.has($(event.target)).length) { // Not a child of the elements.
		// 				cb(event);
		// 			}
		// 		});
		// 	}
		// 	var e = document.getElementById(e.dataset.plane);
		// 	if ($(e).hasClass('open')) {
		// 		$(e).removeClass('open');
		// 		return;
		// 	}
		// 	$(e).addClass('open');
		// 	triggerClickOutsideElements(e, function () {
		// 		$(e).removeClass('open');
		// 	})
		// },
	},

	utils: {
		refreshLatex: function () {
			setTimeout(function () {
				if (window.MathJax)
					MathJax.Hub.Queue(["Typeset",MathJax.Hub]);
				else
					console.warn("MathJax object not found.")
			}, 100);
		},
		renderMarkdown: function (txt) {
			var marked = require('marked');
			var renderer = new marked.Renderer();
			renderer.codespan = function (html) { // Ignore codespans in md (they're actually 'latex')
				return '`'+html+'`';
			}
			marked.setOptions({
				renderer: renderer,
				gfm: false,
				tables: false,
				breaks: false,
				pedantic: false,
				sanitize: true,
				smartLists: true,
				smartypants: true,
			})
			return marked(txt);
		},
		pretty: {
			log: function (text) {
				var args = [].slice.apply(arguments);
				args.unshift('Log:');
				args.unshift('font-size: 13px;');
				args.unshift('%c %s');
				console.log.apply(console, args)
			},
			error: function (text) {
			},
		},
	}
});

module.exports = {
	initialize: function () {
		window.app = new QILabs;
		Backbone.history.start({ pushState:true, hashChange: false });
	},
};
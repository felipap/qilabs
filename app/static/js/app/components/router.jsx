
var $ = require('jquery')
// require('jquery-cookie')
var Backbone = require('backbone')
var _ = require('lodash')
var React = require('react')
var NProgress = require('nprogress')

window._ = _;
Backbone.$ = $;

// 'O
var Models 	= require('../components/models.js')
var Flasher = require('../components/flasher.jsx')
var Tour		= require('../components/tour.js')
var Dialog 	= require('../components/dialog.jsx')

// react views
var PostForm 		= require('../views/postForm.jsx')
var ProblemForm = require('../views/problemForm.jsx')
var PsetForm		= require('../views/problemSetForm.jsx')
var FullPost 		= require('../views/fullItem.jsx')
var Interests 	= require('../views/interests.jsx')
var Stream 			= require('../views/stream.jsx')

// View-specific (to be triggered by the routes)
var ProfilePage 	= require('../pages/profile.jsx')
var LabsPage 			= require('../pages/labs.jsx')
var ProblemsPage 	= require('../pages/problems.jsx')
var SettingsPage 	= require('../pages/settings.jsx')

var CardTemplates = require('../views/parts/cardTemplates.jsx')

if (window.user) {
	require('../components/karma.jsx')
	require('../components/bell.jsx')
	$('#nav-karma').ikarma();
	$('#nav-bell').bell();
}

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

if (window.location.hash == "#tour" || window.conf.showTour) {
	if (window.user) {
		Tour()
	}
}

if (window.location.hash == '#fff' && window.user) {
	Dialog.FFFDialog()
}

if (window.location.hash == "#intro" || window.conf.showIntro) {
	Dialog.IntroDialog()
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
				// $(e).addClass('invisible');
				React.unmountComponentAtNode(e);
				$(e).remove();
				document.title = oldTitle;
				if (opts.chop) {
					this.unchop();
				} else {
					$('html').removeClass('place-chop');
				}
				opts.onClose && opts.onClose();
			}.bind(this),
		};
		component.props.page = obj;
		pages.push(obj);

		// DOIT
		$(e).hide().appendTo('body');

		// Remove scrollbars?
		if (opts.chop) {
			this.chop();
		} else {
			$('html').addClass('place-chop');
		}

		React.render(component, e, function () {
			// $(e).removeClass('invisible');
			$(e).show()
		});

		return obj;
	};

	this.getActive = function () {
		return pages[pages.length-1];
	};

	this.pop = function () {
		pages.pop().destroy();
	};

	var chopCounter = 0;

	this.chop = function () {
		if (chopCounter === 0) {
			$('body').addClass('chop');
		}
		++chopCounter;
	};
	this.unchop = function () {
		--chopCounter;
		if (chopCounter === 0) {
			$('body').removeClass('chop');
		}
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
		if (document.getElementById('qi-stream-wrap')) {
			if (window.conf.streamType === 'Problem') {
				var template = React.createFactory(CardTemplates.Problem);
			} else {
				var template = React.createFactory(CardTemplates.Post);
			}
			this.streamItems = new Models.PostList([]);
			this.stream = React.render(
				<Stream
					wall={conf.isWall}
					template={template}
					collection={this.streamItems} />,
				document.getElementById('qi-stream-wrap'));
		} else {
			console.log("No stream container found.");
		}
	},

	triggerComponent: function (comp, args) {
		comp.call(this, args);
	},

	renderWallData: function (feed) {
		// Reset wall with feed bootstraped into the page
		if (!feed) throw "WHAT";

		this.stream.changeCollection(this.streamItems);
		this.streamItems.url = feed.url || window.conf.postsRoot;
		this.streamItems.reset(feed.posts);
		this.streamItems.minDate = 1*new Date(feed.minDate);
	},

	renderWall: function (url, query, cb) {
		if (!cb && typeof query === 'function') {
			cb = query;
			query = undefined;
		}

		if (this.streamItems.initialized && !query && (!url || this.streamItems.url === url)) {
			// Trying to render wall as it was already rendered (app.navigate was
			// used and the route is calling app.renderWall() again). Blocked!
			// TODO: find a better way of handling this?
			return;
		}

		this.streamItems.initialized = true;
		this.streamItems.url = url || (window.conf && window.conf.postsRoot);
		this.streamItems.reset();
		if (cb) {
			this.streamItems.once('reset', cb);
		}
		this.streamItems.fetch({ reset: true, data: query || {} });
	},

	routes: {
		// profile
		'@:username':
			function (username) {
				ProfilePage(this)
				this.renderWall('/api/users/'+window.user_profile.id+'/posts')
				$("[role=tab][data-tab-type]").removeClass('active');
				$("[role=tab][data-tab-type='posts']").addClass('active');
			},
		'@:username/seguindo':
			function (username) {
				ProfilePage(this)
				$("[role=tab][data-tab-type]").removeClass('active');
				$("[role=tab][data-tab-type='following']").addClass('active');
				var url = '/api/users/'+window.user_profile.id+'/following';
				var collection = new Models.UserList([], { url: url });
				app.stream.setTemplate(React.createFactory(CardTemplates.User));
				app.stream.changeCollection(collection);
				collection.fetch();
			},
		'@:username/seguidores':
			function (username) {
				ProfilePage(this)
				$("[role=tab][data-tab-type]").removeClass('active');
				$("[role=tab][data-tab-type='followers']").addClass('active');

				var url = '/api/users/'+window.user_profile.id+'/followers';
				var collection = new Models.UserList([], { url: url });
				app.stream.setTemplate(React.createFactory(CardTemplates.User));
				app.stream.changeCollection(collection);
				collection.fetch();
			},
		// problemas
		'problemas':
			function () {
				ProblemsPage(this);
				this.pages.closeAll();
				if (window.conf.feed) { // Check if feed came with the html
					app.renderWallData(window.conf.feed);
				} else {
					app.renderWall('/api/labs/problems/all');
				}
			},
		'problemas/novo':
			function (postId) {
				ProblemsPage(this);
				this.triggerComponent(this.components.createProblem);
				this.renderWall("/api/labs/problems/all");
			},
		'pset/novo':
			function (postId) {
				this.triggerComponent(this.components.createPset);
				this.renderWall("/api/labs/problems/all");
			},
		'problemas/:labSlug':
			function (labSlug) {
				var lab = _.find(pageMap, function (u) { return labSlug === u.slug && u.hasProblems; });
				if (!lab) {
					app.navigate('/problemas', { trigger: true });
					return;
				}
				ProblemsPage.oneLab(this, lab);
				this.pages.closeAll();
				if (window.conf.feed) { // Check if feed came with the html
					app.renderWallData(window.conf.feed);
				} else {
					app.renderWall('/api/labs/problems/'+lab.id+'/all');
				}
			},
		'problema/:problemId':
			function (problemId) {
				ProblemsPage(this);
				this.triggerComponent(this.components.viewProblem,{id:problemId});
				this.renderWall("/api/labs/problems/all");
			},
		'problema/:problemId/editar':
			function (problemId) {
				ProblemsPage(this);
				this.triggerComponent(this.components.editProblem,{id:problemId});
				this.renderWall("/api/labs/problems/all");
			},
		// posts
		'posts/:postId':
			function (postId) {
				this.triggerComponent(this.components.viewPost,{id:postId});
				LabsPage(this);
				this.renderWall();
			},
		'posts/:postId/editar':
			function (postId) {
				this.triggerComponent(this.components.editPost,{id:postId});
				LabsPage(this);
				this.renderWall();
			},
		// misc
		'settings':
			function () {
				SettingsPage(this);
			},
		'novo':
			function (postId) {
				this.triggerComponent(this.components.createPost);
				LabsPage(this);
				this.renderWall();

			},
		'interesses':
			function (postId) {
				this.triggerComponent(this.components.selectInterests);
				LabsPage(this);
				this.renderWall();
			},
		'labs/:labSlug':
			function (labSlug) {
				var lab = _.find(pageMap, function (u) { return labSlug === u.slug; });
				if (!lab) {
					app.navigate('/', { trigger: true });
					return;
				}
				LabsPage.oneLab(this, lab);
				this.pages.closeAll();
				if (window.conf.feed) { // Check if feed came with the html
					this.renderWallData(window.conf.feed);
				} else {
					this.renderWall('/api/labs/'+lab.id+'/all');
				}
			},
		'':
			function () {
				LabsPage(this);
				this.pages.closeAll();
				if (window.conf.feed) { // Check if feed came with the html
					app.renderWallData(window.conf.feed);
					delete window.conf.feed;
				} else {
					app.renderWall('/api/labs/all');
				}
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
				var postItem = new Models.Post(resource.data);
				// Remove window.conf.post, so closing and re-opening post forces us to fetch
				// it again. Otherwise, the use might lose updates.
				window.conf.resource = undefined;
				this.pages.push(<FullPost type={postItem.get('type')} model={postItem} />, 'post', {
					title: resource.data.content.title+' · QI Labs',
					chop: true,
					onClose: function () {
						app.navigate(app.pageRoot || '/', { trigger: false });
					}
				});
			} else {
			// No. Fetch it by hand.
				$.getJSON('/api/posts/'+postId)
					.done(function (response) {
						console.log('response, data', response);
						var postItem = new Models.Post(response.data);
						this.pages.push(<FullPost type={postItem.get('type')} model={postItem} />, 'post', {
							title: postItem.get('content').title+' · QI Labs',
							chop: true,
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
						app.navigate(app.pageRoot || '/', { trigger: false });
					}.bind(this))
			}
		},

		viewProblem: function (data) {
			this.pages.closeAll();
			var postId = data.id;
			var resource = window.conf.resource;
			if (resource && resource.type === 'problem' && resource.data.id === postId) {
				var postItem = new Models.Problem(resource.data);
				// Remove window.conf.problem, so closing and re-opening post forces us to fetch
				// it again. Otherwise, the use might lose updates.
				window.conf.resource = undefined;
				this.pages.push(<FullPost type="Problem" model={postItem} />, 'problem', {
					title: resource.data.content.title+' · QI Labs',
					chop: true,
					onClose: function () {
						app.navigate(app.pageRoot || '/', { trigger: false });
					}
				});
			} else {
				$.getJSON('/api/problems/'+postId)
					.done(function (response) {
						console.log('response, data', response);
						var postItem = new Models.Problem(response.data);
						this.pages.push(<FullPost type="Problem" model={postItem} />, 'problem', {
							title: postItem.get('content').title+' · QI Labs',
							chop: true,
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
						app.navigate(app.pageRoot || '/', { trigger: false });
					}.bind(this))
			}
		},

		createPset: function (data) {
			this.pages.closeAll();
			this.pages.push(PsetForm.create({user: window.user}), 'psetForm', {
				chop: true,
				onClose: function () {
				}
			});
		},

		createProblem: function (data) {
			this.pages.closeAll();
			this.pages.push(ProblemForm.create({user: window.user}), 'problemForm', {
				chop: true,
				onClose: function () {
				}
			});
		},

		editProblem: function (data) {
			this.pages.closeAll();
			$.getJSON('/api/problems/'+data.id)
				.done(function (response) {
					console.log('response, data', response);
					var problemItem = new Models.Problem(response.data);
					this.pages.push(ProblemForm.edit({model: problemItem}), 'problemForm', {
						chop: true,
						onClose: function () {
							app.navigate(app.pageRoot || '/', { trigger: false });
						},
					});
				}.bind(this))
				.fail(function (xhr) {
					app.flash.warn("Problema não encontrado.");
					app.navigate('/', { trigger: true });
				}.bind(this))
		},

		editPost: function (data) {
			this.pages.closeAll();
			$.getJSON('/api/posts/'+data.id)
				.done(function (response) {
					if (response.data.parent) {
						return alert('eerrooo');
					}
					console.log('response, data', response);
					var postItem = new Models.Post(response.data);
					this.pages.push(PostForm.edit({model: postItem}), 'postForm', {
						chop: true,
						onClose: function () {
							app.navigate(app.pageRoot || '/', { trigger: false });
						}.bind(this),
					});
				}.bind(this))
				.fail(function (xhr) {
					app.flash.warn("Publicação não encontrada.");
					app.navigate('/', { trigger: true });
				}.bind(this))
		},

		createPost: function () {
			this.pages.closeAll();
			this.pages.push(PostForm.create({user: window.user}), 'postForm', {
				chop: true,
				onClose: function () {
				}
			});
		},

		selectInterests: function (data) {
			var self = this;
			new Interests({}, function () {
			});
		},
	},

	utils: {
		pleaseLogin: function (action) {
			action = action || 'continuar';
			app.flash.info('<strong>Crie uma conta no QI Labs</strong> para '+action+
				'.');
		},
		refreshLatex: function () {
			setTimeout(function () {
				if (window.MathJax) {
					MathJax.Hub.Queue(["Typeset",MathJax.Hub]);
				} else {
					console.warn("MathJax object not found.");
				}
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
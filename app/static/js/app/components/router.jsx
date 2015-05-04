
var $ = require('jquery')
var Backbone = require('backbone')
var _ = require('lodash')
var React = require('react')

window._ = _;
Backbone.$ = $;

var Flasher = require('../components/flasher.jsx')
var Dialog = require('../components/modal.jsx')
var Models = require('../components/models.js')
var Tour = require('../components/tour.js')

var ProblemSetForm = require('../views/ProblemSetForm.jsx')
var CardTemplates = require('../views/components/cardTemplates.jsx')
var ProblemForm = require('../views/problemForm.jsx')
var Interests = require('../views/interests.jsx')
var PostForm = require('../views/postForm.jsx')
var FullPost = require('../views/fullItem.jsx')
var Stream = require('../views/stream.jsx')

var Pages = {
	Problems: require('../pages/problems.jsx'),
	Settings: require('../pages/settings.jsx'),
	Profile: require('../pages/profile.jsx'),
	Labs: require('../pages/labs.jsx'),
};

$(function () {
	function bindFollowButton() {
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
						if (app && Utils.flash) {
							Utils.flash.alert(data.message || "Erro!");
						}
						console.warn("ERRO!", response.error);
					} else {
						this.dataset.action = neew;
					}
				}.bind(this)).fail(function (xhr) {
					if (app && Utils.flash) {
						Utils.flash.alert(xhr.responseJSON.message || 'Erro!');
					}
				});
			}
		});
	}

	bindFollowButton();

	if (window.user) {
		require('../components/karma.jsx');
		require('../components/bell.jsx');
		$('#nav-karma').ikarma();
		$('#nav-bell').bell();
	}

	if (window.user && window.location.hash === "#tour") {
		Tour();
	}

	if (window.user && window.location.hash === '#fff') {
		Dialog.FFFDialog();
	}

	if (window.location.hash === "#intro" || window.conf.showIntro) {
		Dialog.IntroDialog();
	}
});

/*
 * Organizes the allocatin and disposal of components on the screen.
 */
var ComponentStack = function () {
	function bindTriggerBtns() {
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
	}

	var pages = [];
	var chopCounter = 0;
	bindTriggerBtns();

	function chop () {
		if (chopCounter === 0) {
			$('body').addClass('chop');
		}
		++chopCounter;
	}

	function unchop () {
		--chopCounter;
		if (chopCounter === 0) {
			$('body').removeClass('chop');
		}
	}

	return {
		push: function (component, dataPage, opts) {
			var opts = _.extend({
				onClose: function () {}
			}, opts || {});

			var e = document.createElement('div'),
				oldTitle = document.title,
				destroyed = false,
				changedTitle = false;

			// Adornate element and page.
			if (!opts.navbar)
				$(e).addClass('pcontainer');
			if (opts.class)
				$(e).addClass(opts.class);
			$(e).addClass('invisble');
			if (dataPage)
				e.dataset.page = dataPage;

			var obj = {
				target: e,
				component: component,
				setTitle: function (str) {
					changedTitle = true;
					document.title = str;
				},
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

					if (changedTitle) {
						document.title = oldTitle;
					}

					if (opts.chop !== false) {
						unchop();
					}

					opts.onClose && opts.onClose();
				}.bind(this),
			};
			component.props.page = obj;
			pages.push(obj);

			$(e).hide().appendTo('body');

			// Remove scrollbars?
			if (opts.chop !== false) {
				chop();
			}

			React.render(component, e, function () {
				// $(e).removeClass('invisible');
				$(e).show()
			});

			return obj;
		},
		getActive: function () {
			return pages[pages.length-1];
		},
		pop: function () {
			pages.pop().destroy();
		},
		closeAll: function () {
			for (var i=0; i<pages.length; i++) {
				pages[i].destroy();
			}
			pages = [];
		},
	}
};

/**
 * Customized Backbone Router, supporting triggering of components.
 */
var Router = Backbone.Router.extend({
	initialize: function () {
		this._bindComponentCalls();
		this._pages = new ComponentStack();
	},

	_bindComponentCalls: function () {
		function bindComponentCall (name, fn) {
			this.on(name, function () {
				this.closeComponents();
				fn.apply(this, arguments);
			}, this);
		}

		for (var c in this.components) {
			if (this.components.hasOwnProperty(c)) {
				bindComponentCall.call(this, c, this.components[c]);
			}
		}
	},

	closeComponents: function () {
		this._pages.closeAll();
	},

	pushComponent: function () {
		this._pages.push.apply(this._pages, arguments);
	},

	components: {},
})

/**
 * Renders results in the pages.
 */
function FeedWall (el) {

	'use strict';

	var isSetup = false,
			coll = null,
			tmpl = null;

	// var template = React.createFactory(CardTemplates.Post);
	// coll = new Models.PostList([]);
	var stream = React.render(
		<Stream
			wall={conf.isWall}
			collection={coll}
			template={tmpl} />,
		el);

	/*
	 * Setup stream collection and template.
	 * This MUST be called before rending.
	 */
	this.setup = function (_Coll, _tmpl) {
		// _Coll must be a Backbone collection, and _tmpl a React class.
		coll = new _Coll([]);
		tmpl = React.createFactory(_tmpl);
		isSetup = true;
		stream.setCollection(coll);
		stream.setTemplate(tmpl);
	}

	/*
	 * Update results wall with data in feed object.
	 * (usually data bootstraped into page)
	 */
	this.renderData = function (feed) {
		// Reset wall with feed bootstraped into the page
		if (!isSetup)
			throw "Call setup() before rendering data.";

		if (!feed) throw "WHAT";

		// stream.changeCollection(coll);
		coll.url = feed.url || window.conf.postsRoot;
		coll.reset(feed.docs);
		coll.initialized = true;
		coll.minDate = 1*new Date(feed.minDate);
	};

	/*
	 * Render wall with results from a url, using a certain querystring.
	 */
	this.render = function (url, query, cb) {
		if (!isSetup)
			throw "Call setup() before rendering data.";

		// (string, fn) → (url, cb)
		if (!cb && typeof query === 'function') {
			cb = query;
			query = undefined;
		}

		if (coll.initialized && !query && (!url || coll.url === url)) {
			// Trying to render wall as it was already rendered (app.navigate was
			// used and the route is calling app.renderWall() again). Blocked!
			// TODO: find a better way of handling this?
			console.log('Wall already rendered. ok.');
			return;
		}

		coll.initialized = true;
		coll.url = url || coll.url || (window.conf && window.conf.postsRoot);
		coll.reset();
		if (cb) {
			coll.once('reset', cb);
		}
		coll.fetch({ reset: true, data: query || {} });
	};
};

window.Utils = {
	flash: new Flasher(),

	pleaseLoginTo: function (action) {
		action = action || 'continuar';
		Utils.flash.info(
			'<strong>Crie uma conta no QI Labs</strong> para '+action+'.');
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
};

/**
 * Central client-side functionality.
 * Defines routes and components.
 */
var App = Router.extend({

	pageRoot: window.conf && window.conf.pageRoot || '/',

	initialize: function () {
		Router.prototype.initialize.apply(this);

		if (document.getElementById('qi-results')) {
			this.FeedWall = new FeedWall(document.getElementById('qi-results'));
		} else {
			this.FeedWall = null;
			console.log("No stream container found.");
		}
	},

	routes: {
		'@:username':
			function (username) {
				Pages.Profile(this);

				$("[role=tab][data-tab-type]").removeClass('active');
				$("[role=tab][data-tab-type='posts']").addClass('active');

				this.FeedWall.setup(Models.PostList, CardTemplates.Post);
				this.FeedWall.render('/api/users/'+window.user_profile.id+'/posts')
			},
		'@:username/seguindo':
			function (username) {
				Pages.Profile(this);

				$("[role=tab][data-tab-type]").removeClass('active');
				$("[role=tab][data-tab-type='following']").addClass('active');

				app.FeedWall.setup(Models.UserList, CardTemplates.User);
				app.FeedWall.render('/api/users/'+window.user_profile.id+'/following');
			},
		'@:username/seguidores':
			function (username) {
				Pages.Profile(this);

				$("[role=tab][data-tab-type]").removeClass('active');
				$("[role=tab][data-tab-type='followers']").addClass('active');

				app.FeedWall.setup(Models.UserList, CardTemplates.User);
				app.FeedWall.render('/api/users/'+window.user_profile.id+'/followers');
			},
		// problemas
		'problemas':
			function () {
				Pages.Problems(this);

				this.FeedWall.setup(Models.ProblemSetList, CardTemplates.ProblemSet);
				this.FeedWall.render('/api/labs/psets/all');
			},
		'problemas/novo':
			function (postId) {
				Pages.Problems(this);
				this.trigger('createProblem');

				this.FeedWall.setup(Models.ProblemSetList, CardTemplates.ProblemSet);
				this.FeedWall.render('/api/labs/psets/all');
			},
		'colecoes/novo':
			function (postId) {
				Pages.Problems(this);
				this.trigger('createProblemSet');

				this.FeedWall.setup(Models.ProblemSetList, CardTemplates.ProblemSet);
				this.FeedWall.render('/api/labs/psets/all');
			},
		'colecoes/:psetId/editar':
			function (psetId) {
				Pages.Problems(this);
				this.trigger('editProblemSet', { id: psetId });

				this.FeedWall.setup(Models.ProblemSetList, CardTemplates.ProblemSet);
				this.FeedWall.render('/api/labs/psets/all');
			},
		'colecoes/:psetSlug':
			function (psetId) {
				// Pages.ProblemSet(this);

				this.FeedWall.setup(Models.ProblemList, CardTemplates.Problem);
				if (window.conf.feed) {
					this.FeedWall.renderData(window.conf.feed);
				} else {
					this.FeedWall.render('/api/psets/'+window.conf.pset.id+'/problems');
				}
			},
		'problemas/:labSlug':
			function (labSlug) {
				var lab = _.find(pageMap, function (u) { return labSlug === u.slug && u.hasProblems; });
				if (!lab) {
					app.navigate('/problemas', { trigger: true });
					return;
				}
				ProblemsPage.oneLab(this, lab);

				if (window.conf.feed) { // Check if feed came with the html
					this.FeedWall.renderData(window.conf.feed);
				} else {
					this.FeedWall.render('/api/labs/problems/'+lab.id+'/all');
				}
			},
		'problema/:problemId':
			function (problemId) {
				Pages.Problems(this);
				this.trigger('viewProblem', { id: problemId });
				this.FeedWall.setup(Models.ProblemList, CardTemplates.Problem);
				this.FeedWall.render("/api/labs/problems/all");
			},
		'problema/:problemId/editar':
			function (problemId) {
				Pages.Problems(this);
				this.trigger('editProblem', { id: problemId });

				this.FeedWall.setup(Models.ProblemList, CardTemplates.Problem);
				this.FeedWall.render("/api/labs/problems/all");
			},
		// posts
		'posts/:postId':
			function (postId) {
				this.trigger('viewPost', { id: postId });
				Pages.Labs(this);
				this.FeedWall.setup(Models.PostList, CardTemplates.Problem);
				this.FeedWall.render();
			},
		'posts/:postId/editar':
			function (postId) {
				this.trigger('editPost', { id: postId });
				Pages.Labs(this);
				this.FeedWall.setup(Models.PostList, CardTemplates.Problem);
				this.FeedWall.render();
			},
		// misc
		'settings':
			function () {
				Pages.Settings(this);
			},
		'novo':
			function (postId) {
				this.trigger('createPost');
				Pages.Labs(this);
				this.FeedWall.setup(Models.PostList, CardTemplates.Problem);
				this.FeedWall.render();

			},
		'interesses':
			function (postId) {
				this.trigger('selectInterests');
				Pages.Labs(this);
				this.FeedWall.setup(Models.PostList, CardTemplates.Problem);
				this.FeedWall.render();
			},
		'labs/:labSlug':
			function (labSlug) {
				var lab = _.find(pageMap, function (u) { return labSlug === u.slug; });
				if (!lab) {
					app.navigate('/', { trigger: true });
					return;
				}
				LabsPage.oneLab(this, lab);
				this.FeedWall.setup(Models.PostList, CardTemplates.Problem);

				if (window.conf.feed) { // Check if feed came with the html
					this.FeedWall.renderData(window.conf.feed);
				} else {
					this.FeedWall.render('/api/labs/'+lab.id+'/all');
				}
			},
		'':
			function () {
				Pages.Labs(this);
				this.FeedWall.setup(Models.PostList, CardTemplates.Problem);
				if (window.conf.feed) { // Check if feed came with the html
					this.FeedWall.renderData(window.conf.feed);
					delete window.conf.feed;
				} else {
					this.FeedWall.render('/api/labs/all');
				}
			},
	},

	components: {
		viewPost: function (data) {
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
				this.pushComponent(<FullPost type={postItem.get('type')} model={postItem} />, 'post', {
					onClose: function () {
						app.navigate(app.pageRoot, { trigger: false });
					}
				});
			} else {
			// No. Fetch it by hand.
				$.getJSON('/api/posts/'+postId)
					.done(function (response) {
						console.log('response, data', response);
						var postItem = new Models.Post(response.data);
						this.pushComponent(<FullPost type={postItem.get('type')} model={postItem} />, 'post', {
							onClose: function () {
								app.navigate(app.pageRoot, { trigger: false });
							}
						});
					}.bind(this))
					.fail(function (xhr) {
						if (xhr.responseJSON && xhr.responseJSON.error) {
							Utils.flash.alert(xhr.responseJSON.message || 'Erro! <i class="icon-sad"></i>');
						} else {
							Utils.flash.alert('Contato com o servidor perdido. Tente novamente.');
						}
						app.navigate(app.pageRoot, { trigger: false });
					}.bind(this))
			}
		},

		viewProblem: function (data) {
			var postId = data.id;
			var resource = window.conf.resource;
			if (resource && resource.type === 'problem' && resource.data.id === postId) {
				var postItem = new Models.Problem(resource.data);
				// Remove window.conf.problem, so closing and re-opening post forces us to fetch
				// it again. Otherwise, the use might lose updates.
				window.conf.resource = undefined;
				this.pushComponent(<FullPost type="Problem" model={postItem} />, 'problem', {
					onClose: function () {
						app.navigate(app.pageRoot, { trigger: false });
					}
				});
			} else {
				$.getJSON('/api/problems/'+postId)
					.done(function (response) {
						console.log('response, data', response);
						var postItem = new Models.Problem(response.data);
						this.pushComponent(<FullPost type="Problem" model={postItem} />, 'problem', {
							onClose: function () {
								app.navigate(app.pageRoot, { trigger: false });
							}
						});
					}.bind(this))
					.fail(function (xhr) {
						if (xhr.status === 404) {
							Utils.flash.alert('Ops! Não conseguimos encontrar essa publicação. Ela pode ter sido excluída.');
						} else {
							Utils.flash.alert('Ops.');
						}
						app.navigate(app.pageRoot, { trigger: false });
					}.bind(this))
			}
		},

		createProblemSet: function (data) {
			this.pushComponent(ProblemSetForm.Create({user: window.user}), 'psetForm');
		},

		editProblemSet: function (data) {
			$.getJSON('/api/psets/'+data.id)
				.done(function (response) {
					console.log('response, data', response);
					var psetItem = new Models.ProblemSet(response.data);
					this.pushComponent(ProblemSetForm({model: psetItem}), 'problemForm', {
						onClose: function () {
							app.navigate(app.pageRoot, { trigger: false });
						},
					});
				}.bind(this))
				.fail(function (xhr) {
					Utils.flash.warn("Problema não encontrado.");
					app.navigate(app.pageRoot, { trigger: true });
				}.bind(this))
		},

		createProblem: function (data) {
			this.pushComponent(ProblemForm.create({user: window.user}), 'problemForm');
		},

		editProblem: function (data) {
			$.getJSON('/api/problems/'+data.id)
				.done(function (response) {
					console.log('response, data', response);
					var problemItem = new Models.Problem(response.data);
					this.pushComponent(ProblemForm.edit({model: problemItem}), 'problemForm', {
						onClose: function () {
							app.navigate(app.pageRoot, { trigger: false });
						},
					});
				}.bind(this))
				.fail(function (xhr) {
					Utils.flash.warn("Problema não encontrado.");
					app.navigate(app.pageRoot, { trigger: true });
				}.bind(this))
		},

		editPost: function (data) {
			$.getJSON('/api/posts/'+data.id)
				.done(function (response) {
					console.log('response, data', response);
					var postItem = new Models.Post(response.data);
					this.pushComponent(PostForm.edit({model: postItem}), 'postForm', {
						onClose: function () {
							app.navigate(app.pageRoot, { trigger: false });
						}.bind(this),
					});
				}.bind(this))
				.fail(function (xhr) {
					Utils.flash.warn("Publicação não encontrada.");
					app.navigate(app.pageRoot, { trigger: true });
				}.bind(this))
		},

		createPost: function () {
			this.pushComponent(PostForm.create({user: window.user}), 'postForm', {
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
});

module.exports = {
	initialize: function () {
		window.app = new App;
		Backbone.history.start({ pushState:true, hashChange: false });
	},
};
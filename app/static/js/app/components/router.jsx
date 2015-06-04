
var $ = require('jquery')
var _ = require('lodash')
var Backbone = require('backbone')
var React = require('react')
require('react.backbone')

window._ = _
Backbone.$ = $

var Flasher = require('../components/flasher.jsx')
var Dialog = require('../components/dialog.jsx')
var Models = require('../components/models.js')
var Tour = require('../components/tour.js')

var CardTemplates = require('../views/components/cardTemplates.jsx')
var Interests = require('../views/interests.jsx')
var Stream = require('../views/stream.jsx')

var Forms = {
	Problem: require('../views/problemForm.jsx'),
	ProblemSet: require('../views/ProblemSetForm.jsx'),
	Post: require('../views/postForm.jsx'),
}

var Views = {
	Post: require('../views/PostView.jsx'),
	Problem: require('../views/problemView.jsx'),
	ProblemSet: require('../views/ProblemSetView.jsx'),
}

var Pages = {
	Olympiads: require('../pages/olympiads.jsx'),
	Settings: require('../pages/settings.jsx'),
	Profile: require('../pages/profile.jsx'),
	Labs: require('../pages/labs.jsx'),
}

$(function () {
	function bindFollowButton() {
		$('body').on('click', '.btn-follow', function (evt) {
			var action = this.dataset.action
			if (action !== 'follow' && action !== 'unfollow') {
				throw new Error('What?')
			}

			var neew = (action==='follow')?'unfollow':'follow'
			if (this.dataset.user) {
				$.ajax({
					type: 'post',
					dataType: 'json',
					url: '/api/users/'+this.dataset.user+'/'+action,
				}).done((response) => {
					if (response.error) {
						if (app && Utils.flash) {
							Utils.flash.alert(data.message || 'Erro!')
						}
						console.warn('ERRO!', response.error)
					} else {
						this.dataset.action = neew
					}
				}).fail((xhr) => {
					if (app && Utils.flash) {
						Utils.flash.alert(xhr.responseJSON.message || 'Erro!')
					}
				})
			}
		})
	}

  if (window.__flash_messages && window.__flash_messages.length) {
  	var wrapper = document.getElementById('flash-messages');
  	if (!wrapper) {
  		console.warn('We had flash messages to show here...'+
  			'Too bad the wrapper for those messsages was not found.');
  		return;
  	}
    var messages = window.__flash_messages;
    for (var type in messages)
    if (messages.hasOwnProperty(type)) {
      for (var i=0; i<messages[type].length; ++i) {
        var m = messages[type][i];
        $(wrapper).append($('<li class=\''+type+'\'>'+m+
        	'<i class=\'close-btn\' onClick=\'$(this.parentElement).slideUp()\'></i></li>'))
      }
    }
  }

	bindFollowButton()

	if (window.user) {
		require('../components/bell.jsx')
		require('../components/karma.jsx')
		$('#nav-karma').ikarma()
		$('#nav-bell').bell()
	}

	if (window.user && window.location.hash === '#tour') {
		Tour()
	}

	if (window.user && window.location.hash === '#fff') {
		Dialog.FFFDialog()
	}
})



/*
 * Organizes the allocatin and disposal of pages on the screen.
 */
var ComponentStack = function (defaultOptions) {
	var pages = [];
	var chopCounter = 0;

	function chop() {
		// Remove body scrollbar.
		if (chopCounter === 0) {
			$('body').addClass('chop');
		}
		++chopCounter;
	}

	function unchop() {
		// Show body scrollbar?
		--chopCounter;
		if (chopCounter === 0) {
			$('body').removeClass('chop');
		}
	}

	class Page {
		constructor(component, opts) {
			var opts = _.extend({}, defaultOptions, opts);

			var makeContainer = (opts) => {
				var el = document.createElement('div');
				el.classList.add(opts.defaultClass);
				if (opts.defaultClass) {
					el.classList.add(opts.defaultClass);
				}
				if (opts.class) {
					el.classList.add(opts.class);
				}
				if (opts.pageTag) {
					el.dataset.page = opts.pageTag;
				}
				return el;
			}

			this.onClose = opts.onClose;

			this.el = makeContainer(opts);
			this.component = component;
			this.destroyed = false;
			this.component.props.page = this;
			this.el.style.opacity = '0%';

			// I don't like this
			if (opts.container) {
				opts.container.appendChild(this.el);
			} else {
				document.body.appendChild(this.el);
			}

			// Save page state values to restore later.
			this.old = {};

			if (opts.chop) { // Remove scrollbars?
				this.old.chopped = true;
				chop();
			}

			if (opts.pageRoot) { // Save body[data-root] and replace by new
				// Cacilds!
				var root = document.body.dataset.root;
				this.old.pageRoot = root;
				if (root) {
					$('[data-activate-root='+root+']').removeClass('active');
				}
				$('[data-activate-root='+opts.pageRoot+']').addClass('active');
				document.body.dataset.root = opts.pageRoot;
			}

			React.render(component, this.el, () => {
				$(this.el).show();
			});
		}

		destroy() {
			if (this.destroyed) {
				console.warn('Destroy for page '+this.opts.pageTag+' being called multiple times.');
				return;
			}
			this.destroyed = true;

			pages.splice(pages.indexOf(this), 1);
			React.unmountComponentAtNode(this.el);
			$(this.el).remove();

			this._cleanUp();

			if (this.onClose) {
				this.onClose(this, this.el);
			}
		}

		_cleanUp() {
			if (this.old.chopped) {
				unchop();
			}
			if (this.old.title) {
				document.title = this.old.title;
			}
			if (this.old.pageRoot) {
				$('[data-activate-root='+document.body.dataset.root+']').removeClass('active');
				$('[data-activate-root='+this.old.pageRoot+']').addClass('active');
				document.body.dataset.root = this.old.pageRoot;
			}
		}

		set title(str)  {
			this.old.title = document.title;
			document.title = str;
		}

		hide() {
			this.old.display = this.el.css.display;
			this.el.css.display = 'none';
		}

		show() {
			if (this.old.display) {
				this.el.css.display = this.old.display;
			}
		}
	}

	return {
		push: function (component, dataPage, opts) {
			opts = opts || {};
			if (!opts.onClose) {
				opts.onClose = function(){}
			}
			opts.pageTag = dataPage;
			var page = new Page(component, opts);
			// Hide previous pages.
			for (var i=0; i<pages.length; ++i) {
				pages[i].hide();
			}
			pages.push(page);
		},

		getActive: function () {
			if (!pages.length) {
				return null;
			}
			return pages[pages.length-1];
		},

		pop: function () {
			pages.pop().destroy();
			if (pages.length) {
				pages[pages.length-1].show();
			}
		},

		closeAll: function () {
			pages.forEach(function (page) {
				page.destroy();
			});
			pages = [];
		},
	}
};

/**
 * Customized Backbone Router, supporting triggering of components.
 */
var Router = Backbone.Router.extend({
	initialize: function () {
		this._bindComponentTriggers();
		this._bindComponentCalls();
		this._components = new ComponentStack({
			defaultClass: 'component-container',
			chop: true,
		});
	},

	_bindComponentTriggers: function () {
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
				app.navigate(href, { trigger: true, replace: false });
			} else {
				if (typeof app === 'undefined' || !app.components) {
					if (dataset.href)
						window.location.href = dataset.href;
					else
						console.error('Can\'t trigger component '+dataset.component+' in unexistent app object.');
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

	getActiveComponent: function () {
		return this._components.getActive();
	},

	closeComponents: function () {
		this._components.closeAll();
	},

	pushComponent: function () {
		this._components.push.apply(this._components, arguments);
	},

	components: {},
})

/**
 * Renders results in el.
 * - setup(collection model, react class for rendering)
 * - renderData(results)
 * - renderPath(url, query, callback)
 * - renderResultsOr(fallbackPath)
 */
function FeedWall (el) {

	'use strict';

	var isSetup = false,
			coll = null,
			tmpl = null,
			stream = null;

	/*
	 * Setup stream collection and template.
	 * This MUST be called before rending.
	 */
	this.setup = function (_Coll, _tmpl) {
		// TODO improve comment
		// Component routes can be called multiple times within the lifespan of a
		// single page load, so we have to prevent setup() from being called
		// multiple times too. Otherwise, the feed would reset everytime a component
		// call is made.
		if (isSetup) {
			console.log('ignoring another setup() call.')
			return;
		}

		// _Coll must be a Backbone collection, and _tmpl a React class.
		coll = new _Coll([]);
		tmpl = React.createFactory(_tmpl);
		isSetup = true;
		stream = React.render(
			<Stream
				wall={conf.isWall}
				collection={coll}
				template={tmpl} />,
			el);
		stream.setCollection(coll);
		stream.setTemplate(tmpl);
	}

	/*
	 * Update results wall with data in feed object.
	 * (usually data bootstraped into page)
	 */
	this.renderData = function (results) {
		console.log('called renderData')
		// Reset wall with results bootstraped into the page
		if (!isSetup) {
			throw 'Call setup() before rendering data.';
		}

		if (!results) {
			throw 'WHAT';
		}

		coll.url = results.url || window.conf.postsRoot;
		coll.reset(results.docs);
		coll.initialized = true;
		coll.minDate = 1*new Date(results.minDate);

		if (results.eof) {
			coll.trigger('eof');
		}

		return this;
	};

	/*
	 * Render wall with results from a REST resource, using a certain querystring.
	 */
	this.renderPath = function (url, query, cb) {
		console.log('called renderPath')
		if (!isSetup) {
			throw 'Call setup() before rendering data.';
		}

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

		return this;
	};

	/*
	 * ???
	 */
	this.renderResultsOr = function (fallbackPath) {
		console.log('called renderResultsOr')
		if (!isSetup) {
			throw 'Call setup() before rendering data.';
		}

		if (window.conf.results) {
			this.renderData(window.conf.results);
		} else {
			this.renderPath(fallbackPath);
		}

		return this;
	}.bind(this);
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
				MathJax.Hub.Queue(['Typeset',MathJax.Hub]);
			} else {
				console.warn('MathJax object not found.');
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


var BoxWrapper = React.createClass({

	changeOptions: 'add reset remove change',

	componentWillMount: function () {
		if (!React.isValidElement(this.props.children)) {
			if (this.props.children instanceof Array) {
				throw new Error('BoxWrapper only accepts a single component as its children.');
			}
			throw new Error('Invalid children passed to BoxWrapper.');
		}

		this.props.children.props.page = this.props.page;
		// if (this.props.title) {
		// 	this.props.page.title = this.props.title;
		// }
	},

	close: function () {
		this.props.page.destroy();
	},

	componentDidMount: function () {
		// Close when user clicks directly on element (meaning the faded black background)
		var self = this;
		$(this.getDOMNode().parentElement).on('click', function onClickOut (e) {
			if (e.target === this || e.target === self.getDOMNode()) {
				self.close();
				$(this).unbind('click', onClickOut);
			}
		});
	},

	render: function () {
		return (
			<div className='BoxWrapper qi-box'>
				<i className='close-btn icon-clear' data-action='close-page' onClick={this.close}></i>
				{this.props.children}
			</div>
		);
	},
});

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
			console.log('No stream container found.');
		}
	},

	routes: {
		'@:username':
			function (username) {
				Pages.Profile(this);

				$('[role=tab][data-tab-type]').removeClass('active');
				$('[role=tab][data-tab-type=\'posts\']').addClass('active');

				this.FeedWall.setup(Models.PostList, CardTemplates.Post);
				this.FeedWall.renderPath('/api/users/'+window.user_profile.id+'/posts')
			},
		'@:username/seguindo':
			function (username) {
				Pages.Profile(this);

				$('[role=tab][data-tab-type]').removeClass('active');
				$('[role=tab][data-tab-type=\'following\']').addClass('active');

				app.FeedWall.setup(Models.UserList, CardTemplates.User);
				app.FeedWall.renderPath('/api/users/'+window.user_profile.id+'/following');
			},
		'@:username/seguidores':
			function (username) {
				Pages.Profile(this);

				$('[role=tab][data-tab-type]').removeClass('active');
				$('[role=tab][data-tab-type=\'followers\']').addClass('active');

				app.FeedWall.setup(Models.UserList, CardTemplates.User);
				app.FeedWall.renderPath('/api/users/'+window.user_profile.id+'/followers');
			},
		// problemas
		'olimpiadas':
			function () {
				// Pages.Olympiads(this);
			},
		'olimpiadas/colecoes/novo':
			function (postId) {
				// Pages.Olympiads(this);
				this.trigger('createProblemSet');
			},
		'olimpiadas/colecoes/:psetSlug/editar':
			function (slug) {
				// Pages.Olympiads(this);
				this.trigger('editProblemSet', { slug: slug });
			},
		'olimpiadas/colecoes/:psetSlug':
			function (psetSlug) {
				// Pages.Olympiads(this);
				this.trigger('viewProblemSet', { slug: psetSlug });
			},
		'olimpiadas/colecoes/:psetSlug/:pindex':
			function (psetSlug, pindex) {
				// Pages.Olympiads(this);
				this.trigger('viewProblemSetProblem',
				 { slug: psetSlug, pindex: parseInt(pindex) });
			},
		'olimpiadas/problemas/:problemId':
			function (problemId) {
				// Pages.Olympiads(this);
				this.trigger('viewProblem', { id: problemId });
			},
		'olimpiadas/problemas/novo':
			function (postId) {
				// Pages.Olympiads(this);
				this.trigger('createProblem');
			},
		'olimpiadas/problemas/:problemId/editar':
			function (problemId) {
				// Pages.Olympiads(this);
				this.trigger('editProblem', { id: problemId });
			},
		// posts
		'posts/:postId':
			function (postId) {
				this.trigger('viewPost', { id: postId });
				Pages.Labs(this);
				this.FeedWall.setup(Models.PostList, CardTemplates.Post);
				this.FeedWall.renderPath();
			},
		'posts/:postId/editar':
			function (postId) {
				this.trigger('editPost', { id: postId });
				Pages.Labs(this);
				this.FeedWall.setup(Models.PostList, CardTemplates.Post);
				this.FeedWall.renderPath();
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
				this.FeedWall.setup(Models.PostList, CardTemplates.Post);
				this.FeedWall.renderPath();

			},
		'labs/:labSlug':
			function (labSlug) {
				var lab = _.find(pageMap, function (u) { return labSlug === u.slug; });
				if (!lab) {
					app.navigate('/', { trigger: true });
					return;
				}
				Pages.Labs.oneLab(this, lab);
				this.FeedWall.setup(Models.PostList, CardTemplates.Post);

				if (window.conf.results) { // Check if feed came with the html
					this.FeedWall.renderData(window.conf.results);
				} else {
					this.FeedWall.renderPath('/api/labs/'+lab.id+'/all');
				}
			},
		'':
			function () {
				Pages.Labs(this);
				this.FeedWall.setup(Models.PostList, CardTemplates.Post);
				this.FeedWall.renderResultsOr('/api/labs/all');
			},
	},

	_viewBox: function(Factory, className) {
		this.pushComponent(
			<BoxWrapper>
				{Factory}
			</BoxWrapper>,
			className,
			{
				onClose: () => {
					app.navigate(app.pageRoot, { trigger: false });
				}
			});
	},

	components: {
		viewPost: function (data) {
			if (!data || !data.id) {
				throw new Error('No postId supplied to viewPost.'+data+' '+resource);
			}

			var viewData = (data) => {
				this._viewBox(<Views.Post model={new Models.Post(data)} />, 'post');
			}

			var resource = window.conf.resource;
			if (resource && resource.type === 'post' && resource.data.id === data.id) {
				window.conf.resource = undefined;
				viewData(resource.data);
			} else {
				$.getJSON('/api/posts/'+data.id)
					.done((response) => {
						viewData(response.data);
					})
					.fail((xhr) => {
						if (xhr.responseJSON && xhr.responseJSON.error) {
							Utils.flash.alert(xhr.responseJSON.message || 'Erro! <i class=\'icon-sad\'></i>');
						} else {
							Utils.flash.alert('Contato com o servidor perdido. Tente novamente.');
						}
						app.navigate(app.pageRoot, { trigger: false });
					});
			}
		},

		viewProblem: function (data) {
			var probId = data.id;
			var resource = window.conf.resource;

			var viewModel = (model) => {
				this.pushComponent(
					<BoxWrapper title={model.getTitle()}>
						<Views.Problem model={model} />
					</BoxWrapper>,
					'problem',
					{
						onClose: function () {
							app.navigate(app.pageRoot, { trigger: false });
						}
					});
			}

			if (resource && resource.type === 'problem' && resource.data.id === probId) {
				// Remove window.conf.problem, so closing and re-opening post forces us to fetch
				// it again. Otherwise, the use might lose updates.
				window.conf.resource = undefined;
				viewModel(new Models.Problem(resource.data))
			} else {
				$.getJSON('/api/problems/'+postId)
					.done((response) => { viewModel(new Models.Problem(response.data)); })
					.fail((xhr) => {
						if (xhr.status === 404) {
							Utils.flash.alert('Ops! Não conseguimos encontrar essa publicação. Ela pode ter sido excluída.');
						} else {
							Utils.flash.alert('Ops.');
						}
						app.navigate(app.pageRoot, { trigger: false });
					});
			}
		},

		viewProblemSet: function (data) {
			var psetId = data.id;
			var resource = window.conf.resource;

			var viewModel = (model) => {
				this.pushComponent(
					<BoxWrapper title={model.getTitle()}>
						<Views.ProblemSet model={model} />
					</BoxWrapper>,
					'problem-set',
					{
						onClose: function () {
							app.navigate(app.pageRoot, { trigger: false });
						}
					});
			}

			if (resource && resource.type === 'problem-set' && resource.data.id === psetId) {
				// Remove window.conf.problem, so closing and re-opening post forces us
				// to fetch it again. Otherwise, the use might lose updates.
				window.conf.resource = undefined;
				viewModel(new Models.ProblemSet(resource.data));
			} else {
				var psetSlug = data.slug;
				$.getJSON('/api/psets/s/'+psetSlug)
					.done((response) => { viewModel(new Models.ProblemSet(response.data)); })
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

		viewProblemSetProblem: function (data) {
			var postId = data.id;
			var resource = window.conf.resource;

			var viewModel = (model) => {
				this.pushComponent(
					<BoxWrapper title={model.getTitle()}>
						<Views.ProblemSet model={model} />
					</BoxWrapper>,
					'problem-set',
					{
						onClose: function () {
							app.navigate(app.pageRoot, { trigger: false });
						}
					});
			}

			if (resource && resource.type === 'problem-set' && resource.data.id === postId) {
				// Remove window.conf.problem, so closing and re-opening post forces us
				// to fetch it again. Otherwise, the use might lose updates.
				window.conf.resource = undefined;
				viewModel(new Models.ProblemSet(resource.data));
			} else {
				var psetSlug = data.slug;
				$.getJSON('/api/psets/s/'+psetSlug)
					.done(function (response) {
						viewModel(new Models.ProblemSet(response.data));
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
			this.pushComponent(Forms.ProblemSet.Create({user: window.user}), 'psetForm');
		},

		editProblemSet: function (data) {
			if (!data || !data.slug) {
				throw new Error('data.slug not found');
			}

			$.getJSON('/api/psets/s/'+data.slug)
				.done((response) => {
					var psetItem = new Models.ProblemSet(response.data);
					this.pushComponent(
						<BoxWrapper rclass={Forms.ProblemSet} model={psetItem} />,
						'problemForm',
						{
							onClose: () => {
								app.navigate(app.pageRoot, { trigger: false });
							},
						}
					);
				}).fail((xhr) => {
					Utils.flash.warn('Problema não encontrado.');
					app.navigate(app.pageRoot, { trigger: true });
				})
		},

		createProblem: function (data) {
			this.pushComponent(
				<BoxWrapper title='Criando novo problema'>
					{Forms.Problem.create({ user: window.user })}
				</BoxWrapper>,
				'problemForm',
				{
					onClose: () => {
						app.navigate(app.pageRoot, { trigger: false });
					},
				}
			);
		},

		editProblem: function (data) {
			$.getJSON('/api/problems/'+data.id)
				.done((response) => {
					var problemItem = new Models.Problem(response.data);
					this.pushComponent(
						<BoxWrapper>
							{Forms.problem.edit({model: problemitem})}
						</BoxWrapper>,
						'problemForm',
						{
							onClose: () => {
								app.navigate(app.pageRoot, { trigger: false });
							},
						});
				})
				.fail((xhr) => {
					Utils.flash.warn('Problema não encontrado.');
					app.navigate(app.pageRoot, { trigger: true });
				})
		},

		editPost: function (data) {
			$.getJSON('/api/posts/'+data.id)
				.done((response) => {
					var postItem = new Models.Post(response.data);
					this.pushComponent(
						<BoxWrapper>
							{Forms.Post.edit({model: postItem})}
						</BoxWrapper>,
						'postForm',
						{
							onClose: () => {
								app.navigate(app.pageRoot, { trigger: false });
							},
						});
				}).fail((xhr) => {
					Utils.flash.warn('Publicação não encontrada.');
					app.navigate(app.pageRoot, { trigger: true });
				})
		},

		createPost: function () {
			this.pushComponent(Forms.Post.create({user: window.user}), 'postForm', {
				onClose: function () {
				}
			});
		},

		selectInterests: function (data) {
			new Interests({}, function () { });
		},
	},
});

module.exports = {
	initialize: function () {
		window.app = new App;
		Backbone.history.start({ pushState:true, hashChange: false });
	},
};
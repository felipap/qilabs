
'use strict'

var $ = require('jquery')
window.$ = window.jQuery = $;

var _ = require('lodash')
var Backbone = require('backbone')
var React = require('react')
require('react.backbone')
require('./common.js')

window._ = _
Backbone.$ = $

var Flasher = require('./lib/flasher.jsx')
var Dialog = require('./lib/dialogs.jsx')
var CardTemplates = require('./components/cardTemplates.jsx')
var Models = require('./lib/models.js')
var Tour = require('./lib/tour.js')

var Router = require('./lib/router.js')
var FeedWall = require('./lib/feedWall.jsx')


var Forms = {
	Problem: require('./components/ProblemForm.jsx'),
	ProblemSet: require('./components/ProblemSetForm.jsx'),
	Post: require('./components/PostForm.jsx'),
}

var Views = {
	Interests: require('./components/InterestsBox.jsx'),
	Post: require('./components/PostView.jsx'),
	Problem: require('./components/ProblemView.jsx'),
	ProblemSet: require('./components/ProblemSetView.jsx'),
}

var Pages = {
	Olympiads: require('./pages/olympiads.jsx'),
	Settings: require('./pages/settings.jsx'),
	Profile: require('./pages/profile.jsx'),
	Labs: require('./pages/labs.jsx'),
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
		require('./lib/bell.jsx')
		require('./lib/karma.jsx')
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

	// Routes must call routeDefaultPage() to specify what this.pages handler
	// should be used for the current underlying page (beneath the component).
	// A routeDefaultPage() call has effect only once per document load,
	// meaning that the first route to call it will define the shape of
	// the page.
	//
	// This is important because of the way SPA works in QI Labs. We may choose
	// to app.navigate to a certain path (say '/posts/abcde') while in a profile's
	// page, in order to show a PostView and allow the user to save that url. But
	// when opening a '/posts/abcde' url in a fresh tab, the underlying document
	// structure will be that of a global stream of posts (not a profile page).
	//
	// README:
	// We could simplify this solution by declaring two route objects: the first
	// one being called only once, on page load, to decide what must be rendered
	// depending on the initial (and constant!) app.pageRoot variable, while the
	// second listens to route changes all the time (the usual Backbone routing
	// dynamics).
	//
	// TODO: hack Backbone to provide this extra-routing?
	routeDefaultPage: function (pageName) {
		if (!(pageName in this.pages)) {
			throw new Error('Failed to routeDefaultPage to unexisting page '+
				pageName);
		}
		if (this._renderedPage) {
			return;
		}
		this._renderedPage = pageName;
		this.pages[pageName].call(this);
	},

	pages: {
		Profile: function () {
		  app.FeedWall.setup(Models.PostList, CardTemplates.Post);
		  app.FeedWall.renderPath('/api/users/'+window.user_profile.id+'/posts');
			$('[role=tab][data-tab-type]').removeClass('active');
			$('[role=tab][data-tab-type=\'posts\']').addClass('active');
		},
		ProfileFollowing: function () {
			$('[role=tab][data-tab-type]').removeClass('active');
			$('[role=tab][data-tab-type=\'following\']').addClass('active');
			app.FeedWall.setup(Models.UserList, CardTemplates.User);
			app.FeedWall.renderPath('/api/users/'+window.user_profile.id+'/following');
		},
		ProfileFollowers: function () {
			$('[role=tab][data-tab-type]').removeClass('active');
			$('[role=tab][data-tab-type=\'followers\']').addClass('active');
			app.FeedWall.setup(Models.UserList, CardTemplates.User);
			app.FeedWall.renderPath('/api/users/'+window.user_profile.id+'/followers');
		},
		Labs: function () {
			Pages.Labs(this);
			this.FeedWall.setup(Models.PostList, CardTemplates.Post);
			this.FeedWall.renderPath(window.conf.postsUrl || '/api/labs/all');
		},
	},

	routes: {
		'@:username':
			function (username) {
				this.routeDefaultPage('Profile')
			},
		'@:username/seguindo':
			function (username) {
				this.routeDefaultPage('ProfileFollowing')
			},
		'@:username/seguidores':
			function (username) {
				this.routeDefaultPage('ProfileFollowers')
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
				this.routeDefaultPage('Labs');
			},
		'posts/:postId/editar':
			function (postId) {
				this.trigger('editPost', { id: postId });
				this.routeDefaultPage('Labs');
			},
		// misc
		'settings':
			function () {
				Pages.Settings(this);
			},
		'novo':
			function (postId) {
				this.trigger('createPost');
				this.routeDefaultPage('Labs');
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
				this.routeDefaultPage('Labs');
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
			this._viewBox(<Views.Interests {...data} />, 'interests-dialog')
		},
	},
});

module.exports = {
	initialize: function () {
		window.app = new App;
		Backbone.history.start({ pushState:true, hashChange: false });
	},
};
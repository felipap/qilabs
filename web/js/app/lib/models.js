
var $ = require('jquery');
var Backbone = require('backbone');

Backbone.$ = $;

function trim(str) {
	return str.replace(/(^\s+)|(\s+$)/gi, '');
}

function pureMDText(str) {
	// TODO! Ignore images and links.
	return str;
}

var BaseModel = Backbone.Model.extend({
	constructor: function () {
		Backbone.Model.apply(this, arguments);
		this.updateFromMeta(); // watching, liked, solved, ...
		this.on('change:_meta', this.updateFromMeta.bind(this));
	},
	/**
	 * Updates the model with attributes from this.attribute._meta.
	 */
	updateFromMeta: function () {
		// _meta by default. May be overriden.
		var newMeta = this.attributes[this.metaAttribute || '_meta'];
		if (newMeta) {
			for (var i in newMeta) {
				if (newMeta.hasOwnProperty(i)) {
					this[i] = newMeta[i];
				}
			}
		}
	}
});

var GenericPostItem = BaseModel.extend({
	url: function () {
		return this.get('apiPath');
	},

	constructor: function () {
		BaseModel.apply(this, arguments);

		if (this.get('author') && app.user) {
			this.userIsAuthor = app.user.id === this.get('author').id;
		} else {
			this.userIsAuthor = false;
		}

		this.on('invalid', function (model, error) {
			if (Utils.flash) {
				Utils.flash.warn('Falha ao salvar '+
					(this.modelName && this.modelName.toLowerCase() || 'publicação')+
					': '+error);
			} else {
				console.warn('Utils.flash not found.');
			}
		});
	},

	toggleWatching: function () {
		if (!app.user.logged) {
			window.Utils.pleaseLoginTo('receber atualizações dessa discussão');
			return;
		}

		if (this.togglingWatching) { // Don't overhelm the API
			return;
		}

		this.togglingWatching = true;

		$.ajax({
			type: 'post',
			dataType: 'json',
			timeout: 4000,
			url: this.get('apiPath')+(this.watching?'/unwatch':'/watch'),
		})
		.done((response) => {
			this.togglingWatching = false;
			if (response.error) {
				if (Utils.flash) {
					Utils.flash.alert(response.message || 'Erro!');
				}
			} else {
				this.watching = response.watching;
				this.attributes._meta.watching = response.watching;
				this.trigger('change');
			}
		}).fail((xhr) => {
			this.togglingWatching = false;
			if (xhr.responseJSON && xhr.responseJSON.limitError) {
				Utils.flash.alert('Espere um pouco para realizar essa ação.');
			} else if (xhr.responseJSON && xhr.responseJSON.msg) {
				Utils.flash.alert(xhr.responseJSON.msg);
			} else {
				Utils.flash.alert('Erro.');
			}
		});
	},

	toggleVote: function () {
		if (!app.user.logged) {
			Utils.flash.info('Entre para favoritar textos e comentários.');
			return;
		}

		if (this.togglingVote) { // Don't overhelm the API
			return;
		}

		this.togglingVote = true;
		$.ajax({
			type: 'post',
			dataType: 'json',
			timeout: 4000, // timeout so togglingVote doesn't last too long
			url: this.get('apiPath')+(this.liked?'/unupvote':'/upvote'),
		}).done((response) => {
			this.togglingVote = false;
			// console.log('response', response);
			if (response.error) {
				Utils.flash.alert(response.message || 'Erro!');
				return
			}

			this.liked = response.liked;
			this.attributes._meta.liked = this.liked;
			this.attributes.counts.likes += this.liked?1:-1;
			this.trigger('change');
		}).fail((xhr) => {
			this.togglingVote = false;
			if (xhr.responseJSON && xhr.responseJSON.limitError) {
				Utils.flash.alert('Espere um pouco para realizar essa ação.');
			} else if (xhr.responseJSON && xhr.responseJSON.msg) {
				Utils.flash.alert(xhr.responseJSON.msg);
			} else {
				Utils.flash.alert('Erro.');
			}
		});
	},
});

var ProblemSetItem = GenericPostItem.extend({
	modelName: 'ProblemSet',

	defaults: {
		title: '',
		slug: '',
		description: '',
	},

	getTitle: function () {
		return this.get('name');
	},

	url: function () {
		return this.get('apiPath') || '/api/psets';
	},

	initialize: function () {
		var problems = this.get('problems');
		if (problems) {
			this.problems = new ProblemList(problems);
		}
	},

});

var PostItem = GenericPostItem.extend({
	defaults: {
		content: { body: '',
		},
	},
	getTitle: function () {
		return this.get('content').title;
	},
	initialize: function () {
		var comments = this.get('comments');
		if (comments) {
			this.comments = new CommentCollection(comments);
		}
	},
	validate: function (attrs, options) {
		var title = trim(attrs.content.title).replace('\n', ''),
			body = attrs.content.body;
		if (title.length === 0) {
			return 'Escreva um título.';
		}
		if (title.length < 10) {
			return 'Esse título é muito pequeno.';
		}
		if (title.length > 100) {
			return 'Esse título é muito grande.';
		}
		if (!body) {
			return 'Escreva um corpo para a sua publicação.';
		}
		if (body.length > 20*1000) {
			return 'Ops. Texto muito grande.';
		}
		if (pureMDText(body).length < 20) {
			return 'Ops. Texto muito pequeno.';
		}
	},
});

var CommentItem = GenericPostItem.extend({
	defaults: {
		content: { body: '' },
	},
	validate: function (attrs, options) {
		var body = attrs.content.body;
		if (body.length <= 3)
			return 'Seu comentário é muito pequeno.';
		if (body.length >= 10000)
			return 'Seu comentário é muito grande.';
		return false;
	},
});

var CommentCollection = Backbone.Collection.extend({
	model: CommentItem,
	endDate: new Date(),
	comparator: function (i) {
		return 1*new Date(i.get('created_at'));
	},
	url: function () {
		return this.postItem.get('apiPath') + '/comments';
	},
	parse: function (response, options) {
		this.endDate = new Date(response.endDate);
		return Backbone.Collection.prototype.parse.call(this, response.data, options);
		// comparators: {
		// 	'votes': function (i) {
		// 		return -i.get('voteSum');
		// 	},
		// 	'younger': function (i) {
		// 		return -1*new Date(i.get('created_at'));
		// 	},
		// },
	},
});

var ProblemItem = PostItem.extend({
	modelName: 'Coleção de problemas',

	getTitle: function () {
		return this.get('title');
	},

	getUserStatus: function () {
		if (this.userSolved) {
			return 'solved';
		} else if (this.userTriesLeft === 0) {
			return 'missed';
		} else if (this.userTries && this.userTriesLeft) {
			return 'trying';
		} else {
			return 'not-tried';
		}
	},

	validate: function (attrs, options) {
		function isValidAnswer(opt) {
			// console.log(opt)
			// return Math.floor(parseInt(opt)) === parseInt(opt);
			return true;
		}
		var title = trim(attrs.title).replace('\n', ''),
				body = attrs.body;
		if (!body) {
			return 'Escreva um corpo para a sua publicação.';
		}
		if (body.length > 20*1000) {
			return 'Ops. Texto muito grande.';
		}
		if (pureMDText(body).length < 20) {
			return 'Ops. Texto muito pequeno.';
		}
		if (attrs.isMultipleChoice) {
			var ansOptions = attrs.answer.options;
			for (var i=0; i<ansOptions.length; i++) {
				if (/^\s+$/.test(ansOptions[i])) {
					return 'A '+(i+1)+'ª opção de resposta é inválida.';
				}
				// if (!isValidAnswer(ansOptions[i])) {
				// 	console.log(ansOptions[i])
				// }
			}
		} else {
			if (!isValidAnswer(attrs.answer.value)) {
				return 'Opção de resposta inválida.';
			}
		}
		return false;
	},

	try: function (data) {
		if (!app.user.logged) {
			window.Utils.pleaseLoginTo('solucionar esse problema');
			return;
		}

		$.ajax({
			type: 'post',
			dataType: 'json',
			url: this.get('apiPath')+'/try',
			data: data
		}).done((response) => {
			if (response.error) {
				Utils.flash.alert(response.message || 'Erro!');
				return
			}

			this.attributes._meta.userTries += 1;
			this.attributes._meta.userTried = true;
			this.attributes._meta.userTriesLeft -= 1;

			if (response.result) {
				this.attributes._meta.userSolved = true;
				Utils.flash.info('Resposta certa!');
			} else {
				Utils.flash.warn('Resposta errada...');
			}

			this.updateFromMeta();
			this.trigger('change');
		}).fail((xhr) => {
			var response = xhr.responseJSON || {};

			var message = {
				'TriesExceeded': 'Tentativas excedidas.',
				'AlreadyAnswered': 'Questão já respondida.',
			}[response.error] || response.message;

			Utils.flash.alert(message || 'Erro!');
		});
	}
});

var ProblemList = Backbone.Collection.extend({
	model: ProblemItem,
	comparator: function (i) {
		return -i*this.get('index');
	},
});

///

var NotificationItem = Backbone.Model.extend({

	initialize: function () {
	},

	getDate: function () {
	},

});

var NotificationList = Backbone.Collection.extend({
	model: NotificationItem,
	url: '/api/me/notifications',

	POOL_INTERVAL: 1000*60*3,

	initialize: function () {
		this._startPoolNotifications();
		this.lastFetched = new Date();
	},

	_startPoolNotifications: function () {
		// http://stackoverflow.com/questions/19519535
		var isVisible = (function (){
			var stateKey, eventKey, keys = {
					hidden: "visibilitychange",
					webkitHidden: "webkitvisibilitychange",
					mozHidden: "mozvisibilitychange",
					msHidden: "msvisibilitychange"
			};
			for (stateKey in keys) {
					if (stateKey in document) {
							eventKey = keys[stateKey];
							break;
					}
			}
			return function (c) {
					if (c) document.addEventListener(eventKey, c);
					return !document[stateKey];
			}
		})();

		var self = this;
		var interval = this.POOL_INTERVAL;

		setTimeout(function fetchMore() {
			if (isVisible()) {
				console.log('VISIBLE')
				$.getJSON('/api/me/notifications/since?since='+1*self.lastFetched,
					(data) => {
						if (data.hasUpdates) {
							self.fetch()
						}
						setTimeout(fetchMore, interval)
					}, () => {
						console.log('handled')
						setTimeout(fetchMore, interval)
					})
			} else {
				console.log('not visible')
				// console.log('NOT VISIBLE')
				setTimeout(fetchMore, interval)
			}
		}, interval)
	},

	parse: function (response, options) {
		this.lastUpdated = new Date(response.lastUpdate);
		this.lastSeen = new Date(response.lastSeen);

		var all = Backbone.Collection.prototype.parse.call(this, response.items, options);
		return _.map(response.items, function (i) {
			i.seen = i.updated < this.lastSeen;
			return i;
		}.bind(this))
	},

	fetch: function (opts) {
		Backbone.Collection.prototype.fetch.call(this, {
			success: (collection, response, options) => {
				this.lastFetched = new Date();
				this.trigger('fetch', {
					notSeen: this.filter((i) => {
							return new Date(i.get('updated')) > new Date(this.lastSeen)
						}).length,
					allSeen: collection.lastSeen > collection.lastUpdated,
				});

				if (opts && opts.success) {
					opts.success.apply(this, arguments);
				}
			},
			error: (collection, response, opts) => {
				Utils.flash.alert("Falha ao obter notificações.");

				if (opts && opts.error) {
					opts.error.apply(this, arguments);
				}
			},
		});
	},
});


/**
 * All stream items are required to have a timestamp attribute.
 */
var ResultsCollection = Backbone.Collection.extend({
	constructor: function (models, options) {
		Backbone.Collection.apply(this, arguments);
		if (options && options.url) {
			this.url = options.url;
		}
		this.reset(models);
		this.on('eof', function () {
			this.EOF = true;
		}.bind(this));
	},

	comparator: function (i) {
		return -i.get('timestamp');
	},

	reset: function (items) {
		this.EOF = false;
		this.query = {};
		this.lt = Date.now();
		if (items) {
			if (items.length === 0) {
				this.EOF = true;
			} else {
				this.lt = 1*new Date(_.min(items, 'timestamp').timestamp);
			}
		}
		return Backbone.Collection.prototype.reset.apply(this, arguments);
	},

	setQuery: function (query) {
		this.query = query;
	},

	parse: function (response, options) {
		if (response && response.data && response.data.length === 0 &&
			this.length === 0) {
			this.empty = true;
		}
		if (response.eof) {
			this.trigger('eof');
			if (response.data.length === 0) {
				return;
			}
		}
		this.fetching = false;
		this.lt = 1*new Date(_.min(response.data, 'timestamp').timestamp);
		return Backbone.Collection.prototype.parse.call(this, response.data, options);
	},

	tryFetchMore: function () {
		if (this.fetching || this.EOF) return;
		this.fetching = true;
		$('#stream-load-indicator').fadeIn();
		console.log('fetch more?', this.lt)
		// Create query, appending the lt stuff.
		var data = _.extend(this.query || {}, { lt: this.lt-1 });
		this.fetch({ data: data, remove: false });
	},
});

var PostList = ResultsCollection.extend({
	model: PostItem,
});


module.exports = {
	Post: PostItem,
	Problem: ProblemItem,
	Comment: CommentItem,
	PostList: PostList,
	UserList: ResultsCollection,
	ProblemSet: ProblemSetItem,
	ProblemList: ProblemList,
	Notification: NotificationItem,
	NotificationList: NotificationList,
}
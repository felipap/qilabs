
var $ = require('jquery');
var Backbone = require('backbone');

Backbone.$ = $;

function trim (str) {
	return str.replace(/(^\s+)|(\s+$)/gi, '');
}

function pureText (str) {
	return str.replace(/(<([^>]+)>)/ig,'');
}

var GenericPostItem = Backbone.Model.extend({
	url: function () {
		return this.get('apiPath');
	},
	constructor: function () {
		Backbone.Model.apply(this, arguments);
		if (window.user && window.user.id) {
			console.assert(this.get('author'), 'Author attribute not found.');
			this.userIsAuthor = window.user.id === this.get('author').id;
		}
		// META
		if (this.attributes._meta) { // watching, liked, solved, ...
			for (var i in this.attributes._meta)
			if (this.attributes._meta.hasOwnProperty(i)) {
				this[i] = this.attributes._meta[i];
			}
		}
		this.on('invalid', function (model, error) {
			if (app.flash) {
				app.flash.warn('Falha ao salvar '+
					(this.modelName && this.modelName.toLowerCase() || 'publicação')+
					': '+error);
			} else {
				console.warn('app.flash not found.');
			}
		});
		this.on('change:_meta', function () {
			if (this.attributes._meta) {
				console.log('changed');
				for (var i in this.attributes._meta)
				if (this.attributes._meta.hasOwnProperty(i)) {
					this[i] = this.attributes._meta[i];
				}
			}
		}, this);
	},
	toggleWatching: function () {
		if (!window.user) {
			app.utils.pleaseLoginTo('receber atualizações dessa discussão');
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
		.done(function (response) {
			this.togglingWatching = false;
			if (response.error) {
				if (app.flash) {
					app.flash.alert(response.message || 'Erro!');
				}
			} else {
				this.watching = response.watching;
				this.attributes._meta.watching = response.watching;
				this.trigger('change');
			}
		}.bind(this))
		.fail(function (xhr) {
			this.togglingWatching = false;
			if (xhr.responseJSON && xhr.responseJSON.limitError) {
				app.flash.alert('Espere um pouco para realizar essa ação.');
			} else if (xhr.responseJSON && xhr.responseJSON.msg) {
				app.flash.alert(xhr.responseJSON.msg);
			} else {
				app.flash.alert('Erro.');
			}
		}.bind(this));
	},
	toggleVote: function () {
		if (!window.user) {
			app.flash.info('Entre para favoritar textos e comentários.');
			return;
		}

		if (this.togglingVote) { // Don't overhelm the API
			return;
		}
		this.togglingVote = true;
		// console.log('toggle vote', this.attributes, this.liked)
		$.ajax({
			type: 'post',
			dataType: 'json',
			timeout: 4000, // timeout so togglingVote doesn't last too long
			url: this.get('apiPath')+(this.liked?'/unupvote':'/upvote'),
		})
		.done(function (response) {
			this.togglingVote = false;
			// console.log('response', response);
			if (response.error) {
				if (app.flash) {
					app.flash.alert(response.message || 'Erro!');
				}
			} else {
				this.liked = !this.liked;
				this.attributes._meta.liked = !this.liked;
				this.attributes.counts.votes += this.liked?1:-1;
				this.trigger('change');
			}
		}.bind(this))
		.fail(function (xhr) {
			this.togglingVote = false;
			if (xhr.responseJSON && xhr.responseJSON.limitError) {
				app.flash.alert('Espere um pouco para realizar essa ação.');
			} else if (xhr.responseJSON && xhr.responseJSON.msg) {
				app.flash.alert(xhr.responseJSON.msg);
			} else {
				app.flash.alert('Erro.');
			}
		}.bind(this));
	},
});


var ProblemSetItem = Backbone.Model.extend({
	modelName: 'Pset',
	url: function () {
		return this.get('apiPath');
	},
	constructor: function () {
		Backbone.Model.apply(this, arguments);
		if (window.user && window.user.id) {
			console.assert(this.get('author'), 'Author attribute not found.');
			this.userIsAuthor = window.user.id === this.get('author').id;
		}
		// META
		if (this.attributes._meta) { // watching, liked, solved, ...
				for (var i in this.attributes._meta) {
					this[i] = this.attributes._meta[i];
				}
		}
		this.on('invalid', function (model, error) {
			if (app.flash) {
				var objectName = this.modelName?this.modelName.toLowerCase():'publicação';
				app.flash.warn('Falha ao salvar '+objectName+': '+error);
			} else {
				console.warn('app.flash not found.');
			}
		});
		this.on('change:_meta', function () {
			if (this.attributes._meta) {
				for (var i in this.attributes._meta)
				if (this.attributes._meta.hasOwnProperty(i)) {
					this[i] = this.attributes._meta[i];
				}
			}
		}, this);
	},
	toggleVote: function () {
		if (!window.user) {
			app.flash.info('Entre para favoritar textos e comentários.');
			return;
		}

		if (this.togglingVote) { // Don't overhelm the API
			return;
		}
		this.togglingVote = true;
		// console.log('toggle vote', this.attributes, this.liked)
		$.ajax({
			type: 'post',
			dataType: 'json',
			timeout: 4000, // timeout so togglingVote doesn't last too long
			url: this.get('apiPath')+(this.liked?'/unupvote':'/upvote'),
		})
		.done(function (response) {
			this.togglingVote = false;
			// console.log('response', response);
			if (response.error) {
				if (app.flash) {
					app.flash.alert(response.message || 'Erro!');
				}
			} else {
				this.liked = !this.liked;
				this.attributes._meta.liked = !this.liked;
				this.attributes.counts.votes += this.liked?1:-1;
				this.trigger('change');
			}
		}.bind(this))
		.fail(function (xhr) {
			this.togglingVote = false;
			if (xhr.responseJSON && xhr.responseJSON.limitError) {
				if (app.flash) {
					app.flash.alert('Espere um pouco para realizar essa ação.');
				}
			}
		}.bind(this));
	},
});

var PostItem = GenericPostItem.extend({
	defaults: {
		content: { body: '',
		},
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
		if (pureText(body).length < 20) {
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
	modelName: 'Problema',
	validate: function (attrs, options) {
		function isValidAnswer (opt) {
			// console.log(opt)
			// return Math.floor(parseInt(opt)) === parseInt(opt);
			return true;
		}
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
		if (pureText(body).length < 20) {
			return 'Ops. Texto muito pequeno.';
		}
		if (attrs.answer.is_mc) {
			var ansOptions = attrs.answer.ansOptions;
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
		if (!window.user) {
			app.utils.pleaseLoginTo('solucionar esse problema');
			return;
		}
		console.log('trying answer', data);
		$.ajax({
			type: 'post',
			dataType: 'json',
			url: this.get('apiPath')+'/try',
			data: data
		}).done(function (response) {
			if (response.error) {
				app.flash.alert(response.message || 'Erro!');
			} else {
				this.attributes._meta.userTries += 1;
				this.attributes._meta.userTried = true;
				this.attributes._meta.userTriesLeft -= 1;
				if (response.correct) {
					this.attributes._meta.userSolved = true;
					app.flash.info('Because you know me so well.');
				} else {
					app.flash.warn('Resposta errada.');
				}
				if (this.attributes._meta) {
					for (var i in this.attributes._meta) {
						this[i] = this.attributes._meta[i];
					}
				}
				this.trigger('change');
			}
		}.bind(this)).fail(function (xhr) {
			app.flash.alert(xhr.responseJSON && xhr.responseJSON.message || 'Erro!');
		}.bind(this));
	}
});

///

/**
 * All stream items are required to have a timestamp attribute.
 */
var StreamItems = Backbone.Collection.extend({
	constructor: function (models, options) {
		var val = Backbone.Collection.apply(this, arguments);
		if (options && options.url) {
			this.url = options.url;
		}
		this.on('reset ')
		this.reset();
		return val;
	},

	comparator: function (i) {
		return -i.get('timestamp');
	},

	reset: function (options) {
		this.EOF = false;
		this.lt = Date.now();
		this.empty = false;
		this.query = {};
		console.log('reset', this.lt)
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
			this.EOF = true;
			this.trigger('eof');
			if (response.data.length === 0) {
				return;
			}
		}
		this.fetching = false;
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

var PostList = StreamItems.extend({
	model: PostItem,
});

var ProblemList = StreamItems.extend({
	model: ProblemItem,
});

module.exports = {
	Post: PostItem,
	Problem: ProblemItem,
	ProblemSet: ProblemSetItem,
	Comment: CommentItem,
	PostList: PostList,
	ProblemList: ProblemList,
	UserList: StreamItems,
}
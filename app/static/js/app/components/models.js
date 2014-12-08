
var $ = require('jquery')
var Backbone = require('backbone')

Backbone.$ = $;

function trim (str) {
	return str.replace(/(^\s+)|(\s+$)/gi, '')
}

function pureText (str) {
	return str.replace(/(<([^>]+)>)/ig,"")
}

var GenericPostItem = Backbone.Model.extend({
	url: function () {
		return this.get('apiPath');
	},
	constructor: function () {
		Backbone.Model.apply(this, arguments);
		if (window.user && window.user.id) {
			this.userIsAuthor = window.user.id === this.get('author').id;
		}
		// META
		if (this.attributes._meta) { // watching, liked, solved, ...
				for (var i in this.attributes._meta) {
					this[i] = this.attributes._meta[i];
				}
		} else {
			console.log(this.attributes)
		}
		this.on("invalid", function (model, error) {
			if (app && app.flash) {
				app.flash.warn('Falha ao salvar '+
					(this.modelName && this.modelName.toLowerCase() || 'publicação')+
					': '+error);
			} else {
				console.warn('app.flash not found.');
			}
		});
		this.on('change:_meta', function () {
			if (this.attributes._meta) {
				console.log('changed')
				for (var i in this.attributes._meta) {
					this[i] = this.attributes._meta[i];
				}
			}
		}, this);
	},
	toggleWatching: function () {
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
			console.log('response', response);
			if (response.error) {
				app.flash && app.flash.alert(response.message || "Erro!")
			} else {
				this.watching = response.watching;
				this.attributes._meta.watching = response.watching;
				this.trigger('change');
			}
		}.bind(this))
		.fail(function (xhr) {
			this.togglingWatching = false;
			if (xhr.responseJSON && xhr.responseJSON.limitError) {
				app.flash && app.flash.alert("Espere um pouco para realizar essa ação.");
			}
		}.bind(this));
	},
	toggleVote: function () {
		if (this.togglingVote) { // Don't overhelm the API
			return;
		}
		this.togglingVote = true;
		console.log('toggle vote', this.attributes, this.liked)
		$.ajax({
			type: 'post',
			dataType: 'json',
			timeout: 4000, // timeout so togglingVote doesn't last too long
			url: this.get('apiPath')+(this.liked?'/unupvote':'/upvote'),
		})
		.done(function (response) {
			this.togglingVote = false;
			console.log('response', response);
			if (response.error) {
				app.flash && app.flash.alert(response.message || "Erro!")
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
				app.flash && app.flash.alert("Espere um pouco para realizar essa ação.");
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
		if (title.length === 0)
			return "Escreva um título."
		if (title.length < 10)
			return "Esse título é muito pequeno.";
		if (title.length > 100)
			return "Esse título é muito grande.";
		if (!body)
			return "Escreva um corpo para a sua publicação.";
		if (body.length > 20*1000)
			return "Ops. Texto muito grande.";
		if (pureText(body).length < 20)
			return "Ops. Texto muito pequeno.";
	},
});

var CommentItem = GenericPostItem.extend({
	defaults: {
		content: { body: '',
		},
	},
	validate: function (attrs, options) {
		var body = attrs.content.body;
		if (body.length <= 3)
			return "Seu comentário é muito pequeno.";
		if (body.length >= 1000)
			return "Seu comentário é muito grande.";
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
	},
	// comparators: {
	// 	'votes': function (i) {
	// 		return -i.get('voteSum');
	// 	},
	// 	'younger': function (i) {
	// 		return -1*new Date(i.get('created_at'));
	// 	},
	// },
});

var ProblemItem = PostItem.extend({
	modelName: 'Problema',
	validate: function (attrs, options) {
		function isValidAnswer (opt) {
			console.log(opt)
			return typeof opt === 'number' && Math.floor(opt) === opt;
		}
		var title = trim(attrs.content.title).replace('\n', ''),
			body = attrs.content.body;
		if (title.length === 0) {
			return "Escreva um título.";
		}
		if (title.length < 10) {
			return "Esse título é muito pequeno.";
		}
		if (title.length > 100) {
			return "Esse título é muito grande.";
		}
		if (!body) {
			return "Escreva um corpo para a sua publicação.";
		}
		if (body.length > 20*1000) {
			return "Ops. Texto muito grande.";
		}
		if (pureText(body).length < 20) {
			return "Ops. Texto muito pequeno.";
		}
		if (attrs.answer.is_mc) {
			var options = attrs.answer.options;
			for (var i=0; i<options.length; i++) {
				if (/^\s+$/.test(options[i])) {
					return "A "+(i+1)+"ª opção de resposta é inválida.";
				}
				// if (!isValidAnswer(options[i])) {
				// 	console.log(options[i])
				// }
			}
		} else {
			if (!isValidAnswer(attrs.answer.value)) {
				return "Opção de resposta inválida.";
			}
		}
		return false;
	},
	try: function (data) {
		console.log("trying answer", data)
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
					app.flash.info("Because you know me so well.");
				} else {
					app.flash.warn("Resposta errada.");
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

var FeedList = Backbone.Collection.extend({
	model: PostItem,

	constructor: function (models, options) {
		Backbone.Collection.apply(this, arguments);
		this.url = options.url;

		this.EOF = false; // has reached end
		this.minDate = Date.now();
		this.empty = false;
	},
	comparator: function (i) {
		return -1*new Date(i.get('created_at'));
	},
	// fetch: function (options) {
	// 	// Customize fetch to save query o
	// 	var queryCopy = JSON.parse(JSON.stringify(options));
	// 	return Backbone.Collection.prototype.fetch.apply(this, arguments);
	// },
	reset: function (options) {
		console.log('reset')
		this.EOF = false;
		this.minDate = Date.now();
		this.empty = false;
		this.query = {};
		return Backbone.Collection.prototype.reset.apply(this, arguments);
	},
	setQuery: function (query) {
		this.query = query;
	},
	parse: function (response, options) {
		console.log('parse')
		if (response.minDate === 0) {
			console.log("EOF!!!!!")
			this.EOF = true;
			this.trigger('eof');
		}
		if (response && response.data && response.data.length == 0 && this.length == 0) {
			this.empty = true;
		}
		$('#stream-load-indicator').fadeOut();
		this.minDate = 1*new Date(response.minDate);
		this.fetching = false;
		var data = Backbone.Collection.prototype.parse.call(this, response.data, options);
		// Filter for non-null results. NO. Expect non null;
		return data;
	},
	tryFetchMore: function () {
		if (this.fetching) {
			console.log("Already fetching.")
			return;
		}
		$('#stream-load-indicator').fadeIn();
		this.fetching = true;
		console.log('fetch more')
		if (this.minDate < 1) {
			return;
		}
		console.log('fetch?')
		var data = _.extend(this.query || {}, { maxDate: this.minDate-1 });
		this.fetch({data: data, remove:false});
	},
});

module.exports = {
	postItem: PostItem,
	problemItem: ProblemItem,
	commentItem: CommentItem,
	feedList: FeedList,
}
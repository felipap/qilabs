
var $ = require('jquery')
var _ = require('underscore')
var Backbone = require('backbone')
var React = require('react')

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
		if (this.get('votes')) {
			this.liked = !!~this.get('votes').indexOf(user.id);
		}
	},
});

var ProblemItem = GenericPostItem.extend({
	initialize: function () {
		var children = this.get('children') || [];
		this.answers = new CommentCollection(children.Answer);

		this.on("invalid", function (model, error) {
			if (app && app.flash) {
				app.flash.warn('Falha ao salvar publicação: '+error);
			} else {
				console.warn('app.flash not found.');
			}
		});
		this.togglingVote = false;
	},

	handleToggleVote: function () {
		if (this.togglingVote) { // Don't overhelm the API
			return;
		}
		this.togglingVote = true;
		$.ajax({
			type: 'post',
			dataType: 'json',
			timeout: 4000, // timeout so togglingVote doesn't last too long
			url: this.get('apiPath')+(this.liked?'/unupvote':'/upvote'),
		}).done(function (response) {
			this.togglingVote = false;
			console.log('response', response);
			if (!response.error) {
				this.liked = !this.liked;
				if (response.data.author) {
					delete response.data.author;
				}
				this.set(response.data);
				this.trigger('change');
			}
		}.bind(this));
	},
	validate: function (attrs, options) {
		function isValidAnswer (text) {
			console.log(text, text.replace(/\s/gi,''))
			if (!text || !text.replace(/\s/gi,'')) {
				return false;
			}
			return true;
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
			if (options.length != 5) {
				return "Número de respostas inválida.";
			}
			for (var i=0; i<5; i++) {
				if (!isValidAnswer(options[i])) {
					console.log(options[i])
					return "A "+(i+1)+"ª opção de resposta é inválida.";
				}
			}
		} else {
			if (!isValidAnswer(attrs.answer.value)) {
				return "Opção de resposta inválida.";
			}
		}
		return false;
	},
});

var PostItem = GenericPostItem.extend({
	defaults: {
		content: {
			body: '',
		},
	},
	initialize: function () {
		var children = this.get('children');
		if (children) {
			this.children = new CommentCollection(children);
		}
		this.on("invalid", function (model, error) {
			if (app && app.flash) {
				app.flash.warn('Falha ao salvar publicação: '+error);
			} else {
				console.warn('app.flash not found.');
			}
		});
		this.togglingVote = false;
	},

	handleToggleVote: function () {
		if (this.togglingVote) { // Don't overhelm the API
			return;
		}
		this.togglingVote = true;
		$.ajax({
			type: 'post',
			dataType: 'json',
			url: this.get('apiPath')+(this.liked?'/unupvote':'/upvote'),
		}).done(function (response) {
			this.togglingVote = false;
			console.log('response', response);
			if (!response.error) {
				this.liked = !this.liked;
				if (response.data.author) {
					delete response.data.author;
				}
				this.set(response.data);
				this.trigger('change');
			}
		}.bind(this));
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


var FeedList = Backbone.Collection.extend({
	model: PostItem,

	constructor: function (models, options) {
		Backbone.Collection.apply(this, arguments);
		this.url = options.url;
		this.EOF = false; // has reached end
		this.on('remove', function () {
			console.log('removed!');
		});
		this.on('add', function () {
			console.log('addd!');
		});
		this.on('update', function () {
			console.log('updated!');
		});
	},
	comparator: function (i) {
		return -1*new Date(i.get('created_at'));
	},
	parse: function (response, options) {
		if (response.minDate < 1) {
			this.EOF = true;
			this.trigger('EOF');
		}
		this.minDate = 1*new Date(response.minDate);
		var data = Backbone.Collection.prototype.parse.call(this, response.data, options);
		// Filter for non-null results.
		return _.filter(data, function (i) { return !!i; });
	},
	tryFetchMore: function () {
		console.log('fetch more')
		if (this.minDate < 1) {
			return;
		}
		this.fetch({data: {maxDate:this.minDate-1}, remove:false});
	},
});

var CommentItem = PostItem.extend({
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

module.exports = {
	postItem: PostItem,
	problemItem: ProblemItem,
	commentItem: CommentItem,
	feedList: FeedList,
}
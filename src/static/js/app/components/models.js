
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
	}
});

var ProblemItem = GenericPostItem.extend({
	url: function () {
		return this.get('apiPath');
	},

	handleToggleVote: function () {
		var self = this;
		$.ajax({
			type: 'post',
			dataType: 'json',
			url: this.get('apiPath')+(this.liked?'/unupvote':'/upvote'),
		}).done(function (response) {
			console.log('response', response);
			if (!response.error) {
				self.liked = !self.liked;
				if (response.data.author) {
					delete response.data.author;
				}
				self.set(response.data);
				self.trigger('change');
			}
		});
	},

	initialize: function () {
		var children = this.get('children') || [];
		this.answers = new CommentCollection(children.Answer);
	},
});

var PostItem = GenericPostItem.extend({
	url: function () {
		return this.get('apiPath');
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

	handleToggleVote: function () {
		var self = this;
		$.ajax({
			type: 'post',
			dataType: 'json',
			url: this.get('apiPath')+(this.liked?'/unupvote':'/upvote'),
		}).done(function (response) {
			console.log('response', response);
			if (!response.error) {
				self.liked = !self.liked;
				if (response.data.author) {
					delete response.data.author;
				}
				self.set(response.data);
				self.trigger('change');
			}
		});
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
	},
});

var FeedList = Backbone.Collection.extend({
	model: PostItem,

	constructor: function (models, options) {
		Backbone.Collection.apply(this, arguments);
		this.url = options.url;
		this.EOF = false;
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
			return "Seu comentário é muito pequeno."
		if (body.length >= 1000)
			return "Seu comentário é muito grande."
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
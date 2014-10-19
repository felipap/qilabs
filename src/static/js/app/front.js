/** @jsx React.DOM */

// require('jquery-cookie')
var Backbone = require('backbone')
var _ = require('underscore')
var React = require('react')
// var NProgress = require('nprogress')
var Flasher = require('./components/flash.js')
var $ = require('jquery')

Backbone.$ = $;
window._ = _;
window.$ = window.jQuery = $;

var common = require('./common.js')
var StreamView 		= require('./views/stream.js')

// $(document).ajaxStart(function() {
// 	NProgress.start()
// });
// $(document).ajaxComplete(function() {
// 	NProgress.done()
// });

var PostItem = Backbone.Model.extend({
	url: function () {
		return this.get('apiPath');
	},
	defaults: {
		content: {
			body: '',
		},
	},
});

var FeedList = Backbone.Collection.extend({
	model: PostItem,

	constructor: function (models, options) {
		Backbone.Collection.apply(this, arguments);
		this.url = options.url;
		this.EOF = false; // has reached end
		this.on('remove', function () {
			// console.log('removed!');
		});
		this.on('add', function () {
			// console.log('addd!');
		});
		this.on('update', function () {
			// console.log('updated!');
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
		this.fetching = false
		var data = Backbone.Collection.prototype.parse.call(this, response.data, options);
		// Filter for non-null results.
		return _.filter(data, function (i) { return !!i; });
	},
});


window.loadFB = function (cb) {

	if (window.FB)
		return cb();

	var id = $('meta[property=fb:app_id]').attr('content');

	if (!id)
		throw "Meta tag fb:app_id not found.";

  window.fbAsyncInit = function () {
	  FB.init({
	    appId      : id,
	    xfbml      : true,
	    version    : 'v2.1'
	  });
	  cb()
	};

	(function(d, s, id){
	   var js, fjs = d.getElementsByTagName(s)[0];
	   if (d.getElementById(id)) {return;}
	   js = d.createElement(s); js.id = id;
	   js.src = "//connect.facebook.net/en_US/sdk.js";
	   fjs.parentNode.insertBefore(js, fjs);
	 }(document, 'script', 'facebook-jssdk'));
}

setTimeout(function updateCounters () {
	$('[data-time-count]').each(function () {
		this.innerHTML = calcTimeFrom(parseInt(this.dataset.timeCount), !!this.dataset.short);
	});
	setTimeout(updateCounters, 5000);
}, 1000);

// Central functionality of the app.
var WorkspaceRouter = Backbone.Router.extend({
	initialize: function () {
		window.app = this;
	},

	// flash: new Flasher,

	renderWall: function (url) {
		if (!document.getElementById('qi-stream-wrap')) {
			console.warn("Not stream container found.");
			return;
		}

		console.log('renderwall')

		if (!this.postList) {
			this.postList = new FeedList([], {url:url});
		}
		if (!this.postWall) {
			this.postWall = React.renderComponent(
				StreamView({ wall: true }),
				document.getElementById('qi-stream-wrap'));
			// this.postWall = StreamView({ wall: conf.streamRender !== "ListView" });
		}

		if (!url) { // ?
			app.fetchStream();
			this.postList.url = url;
			this.postList.reset();
			this.postList.fetch({reset:true});
		} else {
			this.postList.reset();
			this.postList.url = url;
			this.postList.fetch({reset:true});
			return;
		}
	},

	routes: {
		'':
			function () {
				this.renderWall('/api/openwall');
			},
	},
});

function initialize () {
	new WorkspaceRouter;
	// Backbone.history.start({ pushState:false, hashChange:true });
	Backbone.history.start({ pushState:false, hashChange: false });
}

initialize()
/** @jsx React.DOM */

var $ = require('jquery')
var _ = require('lodash')
var React = require('react')
var Backbone = require('backbone')
var Favico = require('favico')
var PopoverList = require('./parts/popover_list.js')

Backbone.$ = $

try {
	var favico = new Favico({
	    animation:'slide',
	    // position : 'up',
	    bgColor : '#ff6038',
	});
} catch (e) {
	console.warn("Failed to initialize favico", e);
}

function updateFavicon (num) {
	if (favico) {
		try {
			favico.badge(num);
		} catch (e) {
			console.warn("Failed to update favico.", e);
		}
	}
}

// ReplyComment: 'ReplyComment'
// MsgTemplates =
// 	PostComment: '<%= agentName %> comentou na sua publicação.'
// 	PopularPost100: '<%= agentName %> alcançou 1000 visualizações.'
// 	NewFollower: '<%= agentName %> começou a te seguir.'
// 	ReplyComment: '<%= agentName %> respondeu ao seu comentário.'

var handlers = {
	NewFollower: function (item) {
		var ndata = {};
		// generate message
		if (item.instances.length === 1) {
			var name = item.instances[0].name.split(' ')[0];
			// return name+" votou na sua publicação '"+item.name+"'"
			ndata.message = name.split(' ')[0]+" começou a te seguir"
		} else {
			var names = _.map(item.instances.slice(0, Math.min(item.instances.length-1, 3)),
				function (i) {
					return i.name.split(' ')[0];
				}).join(', ')
			names += " e "+(item.instances[item.instances.length-1].name.split(' '))[0]+" ";
			ndata.message = names+" começaram a te seguir";
		}
		ndata.path = window.user.path+'/seguidores';
		return ndata;
	}
}

var Notification = React.createClass({displayName: 'Notification',
	componentWillMount: function () {
 		this.ndata = handlers[this.props.model.get('type')](this.props.model.attributes);
	},
	handleClick: function () {
		window.location.href = this.ndata.path;
	},

	render: function () {
		var date = window.calcTimeFrom(this.props.model.get('updated_at'));
		return (
			React.DOM.li( {onClick:this.handleClick}, 
				JSON.stringify(this.props.model.atributes),
				React.DOM.div( {className:"left"}, 
					
						this.props.model.get('thumbnail')?
						React.DOM.div( {className:"thumbnail",
							style:{ backgroundImage: 'url('+this.props.model.get('thumbnail')+')' }}
						)
						:null
					
				),
				React.DOM.div( {className:"right body"}, 
					React.DOM.span( {dangerouslySetInnerHTML:{__html: this.ndata.message}} ),
					React.DOM.time(null, date)
				)
			)
		);
	},
});

var nl = new (Backbone.Collection.extend({
	// model: NotificationItem,
	url: '/api/me/notifications',
	parse: function (response, options) {
		this.last_seen = new Date(window.user.lsn || 0);
		var all = Backbone.Collection.prototype.parse.call(this, response.items, options);
		return _.map(response.items, function (i) {
			i.seen = i.updated_at < this.last_seen;
			return i;
		}.bind(this));
	},
}))

/**
 * Export and also serve as jquery plugin.
 */

module.exports = $.fn.bell = function (opts) {
	if (this.data('xbell'))
		return;
	this.data('xbell', true);

	// Do it.
	var all_seen = false
	var pl = PopoverList(this[0], nl, Notification, {
		onClick: function () {
			// Check cookies for last fetch
			if (!all_seen) {
				all_seen = true
				$.post('/api/me/notifications/see');
				updateUnseenNotifs(0)
				updateFavicon(0);
			}
		},
	})

	(function fetchMore () {
		$.getJSON('/api/me/notification/since?since='+(1*new Date(window.user.lsn)),
		function (data) {
			console.log(data)
			setTimeout(function () {
				fetchMore();
			}, 5*1000);
		})
	})();

	var updateUnseenNotifs = function (num) {
		$('[data-info=unseen-notifs]').html(num)
		$('[data-info=unseen-notifs]').addClass(num?'nonzero':'zero')
		if (num) {
			this.addClass('active');
		} else {
			this.removeClass('active');
		}
	}.bind(this);

	nl.fetch({
		success: function (collection, response, options) {
			var items = _.sortBy(nl.toJSON(), function (i) {
				return -i.updated_at;
			})
			var notSeen = _.filter(items, function(i){
				console.log(i.updated_at, nl.last_seen)
				return new Date(i.updated_at) > new Date(nl.last_seen)
			})
			all_seen = notSeen.length==0;
			updateFavicon(notSeen.length)
			updateUnseenNotifs(notSeen.length)
		}.bind(this),
		error: function (collection, response, options) {
			app.flash.alert("Falha ao obter notificações.")
		}.bind(this),
	})
}
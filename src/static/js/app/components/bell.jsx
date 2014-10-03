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

var Handlers = {
	NewFollower: function (item) {
		var ndata = {};
		function renderPerson (p) {
			function makeAvatar (p) {
				return '<div class="user-avatar"><div class="avatar"'+
						'style="background-image: url('+p.object.avatarUrl+')"></div>'+
					'</div>';
			}
			return "<a href='"+p.path+"'>"+makeAvatar(p)+'&nbsp;'+p.object.name.split(' ')[0]+"</a>";
		}
		// generate message
		if (item.instances.length === 1) {
			var i = item.instances[0]
			var name = i.object.name.split(' ')[0]
			// return name+" votou na sua publicação '"+item.name+"'"
			ndata.html = renderPerson(i)+" começou a te seguir"
		} else {
			var all = _.map(item.instances, renderPerson)
			ndata.html = all.slice(0,all.length-1).join(', ')+" e "+all[all.length-1]+
			" começaram a te seguir";
		}
		ndata.path = window.user.path+'/seguidores';
		ndata.leftHtml = false;
		return ndata;
	}
}

/**
 * React component the PopoverList items.
 */

var Notification = React.createClass({
	componentWillMount: function () {
 		this.ndata = Handlers[this.props.model.get('type')](this.props.model.attributes);
	},
	handleClick: function () {
		window.location.href = this.ndata.path;
	},

	// {
	// 	this.props.model.get('thumbnail')?
	// 	<div className="thumbnail"
	// 		style={{ backgroundImage: 'url('+this.props.model.get('thumbnail')+')' }}>
	// 	</div>
	// 	:null
	// }

	render: function () {
		var date = window.calcTimeFrom(this.props.model.get('updated_at'));
		return (
			<li onClick={this.handleClick} className={this.ndata.leftHtml?"hasThumb":""}>
				{JSON.stringify(this.props.model.atributes)}
				{
					this.ndata.leftHtml?
					<div className="left" dangerouslySetInnerHTML={{__html: this.ndata.leftHtml}} />
					:null
				}
				<div className="right body">
					<span className="message" dangerouslySetInnerHTML={{__html: this.ndata.html}} />
					<time>{date}</time>
				</div>
			</li>
		);
	},
});

/**
 * Backbone collection for notifications.
 * Overrides default parse method to calculate seen attribute for each notification.
 */

var nl = new (Backbone.Collection.extend({
	// model: NotificationItem,
	url: '/api/me/notifications',
	parse: function (response, options) {
		this.last_update = new Date(response.last_update);
		this.last_seen = new Date(response.last_seen);
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
	var all_seen = true // default, so that /see isn't triggered before nl.fetch returns
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
		className: 'bell-list',
	})

	var TIMEOUT = 5*60*1000
	setTimeout(function fetchMore () {
		$.getJSON('/api/me/notifications/since?since='+(1*new Date(window.user.meta.last_seen_notifications)),
		function (data) {
			setTimeout(fetchMore, TIMEOUT);
		})
	}, TIMEOUT)

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
			var notSeen = _.filter(nl.toJSON(), function(i){
				console.log(i.updated_at, nl.last_seen)
				return new Date(i.updated_at) > new Date(nl.last_seen)
			})
			all_seen = collection.last_seen > collection.last_update;
			updateFavicon(notSeen.length)
			updateUnseenNotifs(notSeen.length)
		}.bind(this),
		error: function (collection, response, options) {
			app.flash.alert("Falha ao obter notificações.")
		}.bind(this),
	})
}

var $ = require('jquery')
var _ = require('lodash')
var React = require('react')
var Backbone = require('backbone')
var Favico = require('favico')
var PopoverList = require('./parts/popover_list.jsx')
var Models = require('../components/models.js')

Backbone.$ = $

try {
	var favico = new Favico({
			animation:'slide',
			// position : 'up',
			bgColor : '#ff6038',
	})
} catch (e) {
	console.warn("Failed to initialize favico", e)
}

var Templater = new (function(){

	function makeAvatar(img) {
		return '<div class="user-avatar"><div class="avatar"'+
				'style="background-image: url('+img+')"></div>'+
			'</div>';
	}

	function renderPerson(p) {
		return p.name.split(' ')[0];
		// function makeAvatar (p) {
		// 	return '<div class="user-avatar"><div class="avatar"'+
		// 			'style="background-image: url('+p.data.avatarUrl+')"></div>'+
		// 		'</div>';
		// }
		// return "<a href='"+p.path+"'>"+makeAvatar(p)+'&nbsp;'+p.data.name.split(' ')[0]+"</a>"
	}

	function reticent(text, max) {
		if (text.length <= max) {
			return text;
		}
		var lastWord = text.match(/\s?(\S+)\s*$/)[1];
		if (lastWord.length > 20) {
			return text.slice(0, max-3)+"...";
		} else {
			var words = text.slice(0, max-3).split(/\s/);
			return words.slice(0, words.length-2).join(' ')+"...";
		}
	}

	function virgulify(list) {
		return list.slice(0, list.length-1).join(', ')+' e '+list[list.length-1]
	}

	return {
		Follow: function(n) {
			var rdata = {
				path: window.user.path+'/seguidores',
			}

			if (n.instances.length === 0) {
				console.warn('Can\'t render Follow notification with 0 instances.')
				return null
			} else if (n.instances.length === 1) {
				rdata.html = renderPerson(n.instances[0].data.follower)+' começou a te seguir'
			} else {
				var people = _.map(
					_.pluck(_.pluck(n.instances, 'data'), 'follower'), // follower objs
					renderPerson)
				rdata.html = virgulify(people)+' começaram a te seguir'
			}

			rdata.left = makeAvatar(n.instances[0].data.follower.avatarUrl)

			return rdata
		},

		Welcome: function() {
			return {
				path: 'http://qilabs.org/#tour',
				left: makeAvatar('/static/images/icon128.png'),
				html: 'Bem-vindo ao QI Labs! <strong>Clique aqui</strong> '+
					'para rever o tour.',
			}
		},

		CommentReply: function(n) {
			var rdata = {
				path: n.data.post.path,
			}

			if (n.instances.length === 0) {
				console.warn('Can\'t render CommentReply notification with 0 instances.')
				return null
			} else if (n.instances.length === 1) {
				var inst = n.instances[0]
				rdata.html = renderPerson(inst.data.author)+
					' respondeu o seu comentário "'+
					reticent(n.data.comment.excerpt, 70)+
					'" em <strong>'+reticent(n.data.post.title, 60)+'</strong>'
			} else {
				var people = _.map(
					_.pluck(_.pluck(n.instances, 'data'), 'author'),
					renderPerson)
				rdata.html = virgulify(people)+
					' responderam ao seu comentário "'+
					reticent(n.data.comment.excerpt, 70)+
					'" em <strong>'+reticent(n.data.post.title, 60)+'</strong>'
			}

			rdata.left = makeAvatar(n.instances[0].data.author.avatarUrl)

			return rdata
		},

		CommentMention: function(n) {
			var rdata = {
				path: n.data.post.path,
			}

			if (n.instances.length === 0) {
				console.warn('Can\'t render CommentMention notification with 0 instances.')
				return null
			} else if (n.instances.length === 1) {
				var inst = n.instances[0]
				rdata.html = renderPerson(inst.data.author)+
					' comentou "'+
					reticent(inst.data.mention.excerpt, 70)+
					'" em <strong>'+
					reticent(n.data.post.title, 60)+'</strong>'
			} else {
				var people = _.map(
					_.pluck(_.pluck(n.instances, 'data'), 'author'),
					renderPerson)
				rdata.html = virgulify(people)+
					' mencionaram você nos comentários de <strong>'+
					reticent(n.data.post.title, 60)+'</strong>'
			}

			rdata.left = makeAvatar(n.instances[0].data.author.avatarUrl)

			return rdata
		},

		PostComment: function(n) {
			var rdata = {
				path: n.data.post.path,
			}

			if (n.instances.length === 0) {
				console.warn('Can\'t render PostComment notification with 0 instances.')
				return null
			} else if (n.instances.length === 1) {
				var inst = n.instances[0]
				rdata.html = renderPerson(inst.data.author)+
					' comentou "'+
					reticent(inst.data.comment.excerpt, 70)+
					'" em <strong>'+
					reticent(n.data.post.title, 60)+'</strong>'
			} else {
				var people = _.map(
					_.pluck(_.pluck(n.instances, 'data'), 'author'),
					renderPerson)
				rdata.html = virgulify(people)+
					' comentaram em <strong>'+
					reticent(n.data.post.title, 60)+'</strong>'
			}

			rdata.left = makeAvatar(n.instances[0].data.author.avatarUrl)

			return rdata
		},


	}
})

/**
 * React component for PopoverList item.
 */

var Notification = React.createClass({
	componentWillMount: function() {
		var handler = Templater[this.props.model.get('type')]
		if (handler) {
			this.ndata = handler(this.props.model.attributes)
		} else {
			console.warn("Handler for notification of type "+this.props.model.get('type')+
				" does not exist.")
			this.ndata = null
		}
	},
	handleClick: function() {
		window.location.href = this.ndata.path
	},
	render: function() {
		if (!this.ndata) {
			return null
		}
		var date = window.calcTimeFrom(
			this.props.model.get('updated') || this.props.model.get('created'))
		return (
			<li onClick={this.handleClick} className={this.ndata.left?"hasThumb":""}>
				{JSON.stringify(this.props.model.atributes)}
				{
					this.ndata.left?
					<div className="left" dangerouslySetInnerHTML={{__html: this.ndata.left}} />
					:null
				}
				<div className="right body">
					<span className="message" dangerouslySetInnerHTML={{__html: this.ndata.html}} />
					<time>{date}</time>
				</div>
			</li>
		)
	},
})

var NotificationHeader = React.createClass({
	render: function() {
		return (
			<div className="popover-header">
				NOTIFICAÇÕES
			</div>
		)
	},
})

/**
 * Backbone collection for notifications.
 * Overrides default parse method to calculate seen attribute for each notification.
 */
var nl = new Models.NotificationList();

/**
 * Export and also serve as jquery plugin.
 */

module.exports = $.fn.bell = function(opts) {
	if (this.data('xbell')) {
		return;
	}
	this.data('xbell', true);

	var last_fetched = new Date();
	var all_seen = true; // default, so that /see isn't triggered before nl.fetch returns
	var pl = PopoverList(this[0], nl, Notification, NotificationHeader, {
		onClick: function() {
			// Check cookies for last fetch
			console.log(1)
			nl.fetch();
			if (!all_seen) {
				console.log(2)
				all_seen = true
				$.post('/api/me/notifications/see')
				window.user.meta.last_seen_notifications = new Date()
				updateUnseenNotifs(0)
				updateFavicon(0)
			}
		},
		className: 'bell-list',
	});


	function updateFavicon (num) {
		if (favico) {
			try {
				favico.badge(num)
			} catch (e) {
				console.warn("Failed to update favico.", e)
			}
		}
	}
	function startPoolNewNotificationsLoop () {
		// http://stackoverflow.com/questions/19519535
		var visible = (function(){
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
			return function(c) {
					if (c) document.addEventListener(eventKey, c);
					return !document[stateKey];
			}
		})();

		var INTERVAL = 60*3000
		setTimeout(function fetchMore () {
			if (visible()) {
				// console.log('VISIBLE')
				$.getJSON('/api/me/notifications/since?since='+(1*new Date(last_fetched)),
				function(data) {
					if (data.hasUpdates) {
						nl.fetch()
					}
					setTimeout(fetchMore, INTERVAL)
				}, function() {
					// console.log("Handled", arguments)
					setTimeout(fetchMore, INTERVAL)
				})
			} else {
				// console.log('NOT VISIBLE')
				setTimeout(fetchMore, INTERVAL)
			}
		}, INTERVAL)
	}

	startPoolNewNotificationsLoop()

	nl.bind('fetch', function(data) {
		last_fetched = new Date();
		updateUnseenNotifs(data.notSeen)
		updateFavicon(data.notSeen)
	})

	var updateUnseenNotifs = function(num) {
		$('[data-info=unseen-notifs]').html(num)
		$('[data-info=unseen-notifs]').addClass(num?'nonzero':'zero')
		if (num) {
			this.addClass('active')
		} else {
			this.removeClass('active')
		}
	}.bind(this)

	if (new Date(user.meta.last_seen_notifications) <
		new Date(user.meta.last_received_notifications)) {
		nl.fetch()
	}
}
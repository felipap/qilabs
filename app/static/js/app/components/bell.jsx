
var $ = require('jquery')
var _ = require('lodash')
var React = require('react')
var Backbone = require('backbone')
var Favico = require('favico')
var PopoverList = require('./parts/PopoverList.jsx')
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
		// function makeAvatar(p) {
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
});

var Notification = React.createClass({

	componentWillMount: function() {
		var handler = Templater[this.props.model.get('type')];
		if (typeof handler !== 'undefined') {
			this.ndata = handler(this.props.model.attributes);
		} else {
			console.warn("Handler for notification of type "+
				this.props.model.get('type')+" does not exist.")
			this.ndata = null;
		}
	},

	render: function() {
		if (!this.ndata) {
			return null;
		}

		var handleClick = () => {
			window.location.href = this.ndata.path;
		}

		return (
			<li onClick={handleClick} className={this.ndata.left?"hasThumb":""}>
				{JSON.stringify(this.props.model.atributes)}
				{
					this.ndata.left?
					<div className="left" dangerouslySetInnerHTML={{__html: this.ndata.left}} />
					:null
				}
				<div className="right body">
					<span className="message" dangerouslySetInnerHTML={{__html: this.ndata.html}} />
					<time>{window.calcTimeFrom(this.props.model.get('updated'))}</time>
				</div>
			</li>
		)
	},
});

var NotificationHeader = React.createClass({

	render: function() {
		return (
			<div className="popover-header">
				NOTIFICAÇÕES
			</div>
		)
	},
});

module.exports = $.fn.bell = function(opts) {
	if (this.data('xbell')) {
		console.warn("$.bell plugin was already called for this element.")
		return;
	}
	this.data('xbell', true);

	// default to true, so that /see isn't triggered before nl.fetch returns
	var allSeen = true;

	function updateFavicon(num) {
		if (favico) {
			try {
				favico.badge(num)
			} catch (e) {
				console.warn("Failed to update favico.", e)
			}
		}
	}

	var updateUnseenNotifs = function(num) {
		$('[data-info=unseen-notifs]').html(num)
		$('[data-info=unseen-notifs]').addClass(num?'nonzero':'zero')
		if (num) {
			this.addClass('active')
		} else {
			this.removeClass('active')
		}
	}.bind(this)

	var nl = new Models.NotificationList();
	nl.on('fetch', function(data) {
		updateUnseenNotifs(data.notSeen);
		updateFavicon(data.notSeen);
		allSeen = data.allSeen;
	});

	PopoverList(this[0], nl,
		React.createFactory(Notification),
		React.createFactory(NotificationHeader),
		{
			onClick: function() {
				if (!allSeen) {
					console.log(2)
					allSeen = true
					$.post('/api/me/notifications/see')
					window.user.meta.lastSeenNotifications = new Date()
					updateUnseenNotifs(0)
					updateFavicon(0)
				} else {
					nl.fetch();
				}
			},
			className: 'bell-list',
		});

	if (new Date(window.user.meta.lastSeenNotifications) <
		new Date(window.user.meta.lastNotified)) {
		nl.fetch()
	}
}
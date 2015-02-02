/** @jsx React.DOM */

var $ = require('jquery')
var _ = require('lodash')
var React = require('react')
var Backbone = require('backbone')
var Favico = require('favico')
var PopoverList = require('./parts/popover_list.jsx')

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

function updateFavicon (num) {
	if (favico) {
		try {
			favico.badge(num)
		} catch (e) {
			console.warn("Failed to update favico.", e)
		}
	}
}

function reticentSlice (str, max) {
	if (str.length <= max)
		return str;
	var last = str.match(/\s?(\w+)\s*$/)[1];
	if (last.length > 20)
		return str.slice(0, max-3)+"...";
	else {
		var words = str.slice(0, max-3).split(/\s/);
		return words.slice(0,words.length-2).join(' ')+"...";
	}
}

function renderPerson (p) {
	function makeAvatar (p) {
		return '<div class="user-avatar"><div class="avatar"'+
				'style="background-image: url('+p.object.avatarUrl+')"></div>'+
			'</div>'
	}
	// return "<a href='"+p.path+"'>"+makeAvatar(p)+'&nbsp;'+p.object.name.split(' ')[0]+"</a>"
	return p.object.name.split(' ')[0];
}

var Handlers = {
	NewFollower: function (item) {
		var ndata = {}
		// generate message
		if (item.instances.length === 1) {
			var i = item.instances[0]
			var name = i.object.name.split(' ')[0]
			ndata.html = renderPerson(i)+" começou a te seguir"
		} else {
			var all = _.map(item.instances, renderPerson)
			ndata.html = all.slice(0,all.length-1).join(', ')+" e "+all[all.length-1]+
			" começaram a te seguir"
		}
		ndata.path = window.user.path+'/seguidores'
		ndata.leftHtml = false
		// var thumbnail = item.object.thumbnail;
		// if (thumbnail) {
			var user_img = item.instances[0].object.avatarUrl;
			ndata.leftHtml = '<div class="user-avatar"><div class="avatar" style="background-image:url('+user_img+')"></div></div>'
		// }
		return ndata
	},
	PostComment: function (item) {
		var ndata = {}
		// generate message
		if (item.instances.length === 1) {
			var i = item.instances[0]
			var name = i.object.name.split(' ')[0]
			ndata.html = renderPerson(i)+" comentou na sua publicação <strong>"+item.object.name+"</strong>"
		} else {
			var all = _.map(item.instances, renderPerson)
			ndata.html = all.slice(0,all.length-1).join(', ')+" e "+all[all.length-1]+" comentaram na sua publicação"
		}
		ndata.path = item.path
		// var thumbnail = item.object.thumbnail;
		// if (thumbnail) {
		// 	ndata.leftHtml = '<div class="thumbnail" style="background-image:url('+thumbnail+')"></div>'
		// }
		// var thumbnail = item.object.thumbnail;
		// if (thumbnail) {
			var user_img = item.instances[0].object.avatarUrl;
			ndata.leftHtml = '<div class="user-avatar"><div class="avatar" style="background-image:url('+user_img+')"></div></div>'
		// }
		return ndata
	},
	CommentReply: function (item) {
		var ndata = {}
		// generate message
		if (item.instances.length === 1) {
			var i = item.instances[0]
			var name = i.object.name.split(' ')[0]
			ndata.html = renderPerson(i)+" respondeu ao seu comentário: \""+reticentSlice(i.object.excerpt, 70)+"\" em <strong>\""+
			reticentSlice(item.object.title, 60)+"\"</strong>"
		} else {
			var all = _.map(item.instances, renderPerson)
			ndata.html = all.slice(0,all.length-1).join(', ')+" e "+all[all.length-1]+
			" responderam ao seu comentário \""+reticentSlice(item.object.excerpt, 70)+"\" em <strong>\""+
			reticentSlice(item.object.title, 60)+"\"</strong>"
		}
		ndata.path = item.path
		ndata.leftHtml = false
		// var thumbnail = item.object.thumbnail;
		// if (thumbnail) {
		// 	ndata.leftHtml = '<div class="thumbnail" style="background-image:url('+thumbnail+')"></div>'
		// }
		// var thumbnail = item.object.thumbnail;
		// if (thumbnail) {
			var user_img = item.instances[0].object.avatarUrl;
			ndata.leftHtml = '<div class="user-avatar"><div class="avatar" style="background-image:url('+user_img+')"></div></div>'
		// }

		return ndata
	},
	CommentMention: function (item) {
		var ndata = {}
		// generate message
		if (item.instances.length === 1) {
			var i = item.instances[0]
			var name = i.object.name.split(' ')[0]
			ndata.html = renderPerson(i)+" mencionou você em no comentário \""+
			reticentSlice(i.object.excerpt, 70)+"\" em <strong>\""+
			reticentSlice(item.object.title, 60)+"\"</strong>"
		} else {
			var all = _.map(item.instances, renderPerson)
			ndata.html = all.slice(0,all.length-1).join(', ')+" e "+all[all.length-1]+
			" mencionaram você em comentários em <strong>\""+
			reticentSlice(item.object.title, 60)+"\"</strong>"
		}
		ndata.path = item.path
		ndata.leftHtml = false
		// var thumbnail = item.object.thumbnail;
		// if (thumbnail) {
		// 	ndata.leftHtml = '<div class="thumbnail" style="background-image:url('+thumbnail+')"></div>'
		// }
		var user_img = item.instances[0].object.avatarUrl;
		ndata.leftHtml = '<div class="user-avatar"><div class="avatar" style="background-image:url('+user_img+')"></div></div>'

		return ndata
	}
}

/**
 * React component the PopoverList items.
 */

var Notification = React.createClass({
	componentWillMount: function () {
		var handler = Handlers[this.props.model.get('type')]
		if (handler) {
			this.ndata = handler(this.props.model.attributes)
		} else {
			console.warn("Handler for notification of type "+this.props.model.get('type')+
				" does not exist.")
			this.ndata = null
		}
	},
	handleClick: function () {
		window.location.href = this.ndata.path
	},
	render: function () {
		if (!this.ndata) {
			return null
		}
		var date = window.calcTimeFrom(this.props.model.get('updated_at'))
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
		)
	},
})

var NotificationHeader = React.createClass({
	render: function () {
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

var nl = new (Backbone.Collection.extend({
	// model: NotificationItem,
	url: '/api/me/notifications',
	parse: function (response, options) {
		this.last_update = new Date(response.last_update)
		this.last_seen = new Date(response.last_seen)
		var all = Backbone.Collection.prototype.parse.call(this, response.items, options)
		return _.map(response.items, function (i) {
			i.seen = i.updated_at < this.last_seen
			return i
		}.bind(this))
	},
}))

/**
 * Export and also serve as jquery plugin.
 */

var last_fetched = new Date();

module.exports = $.fn.bell = function (opts) {
	if (this.data('xbell'))
		return
	this.data('xbell', true)

	// Do it.
	var all_seen = true // default, so that /see isn't triggered before nl.fetch returns
	var pl = PopoverList(this[0], nl, Notification, NotificationHeader, {
		onClick: function () {
			// Check cookies for last fetch
			console.log(1)
			fetchNL();
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
	})

	function startFetchLoop () {
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
				function (data) {
					if (data.hasUpdates) {
						fetchNL()
					}
					setTimeout(fetchMore, INTERVAL)
				}, function () {
					// console.log("Handled", arguments)
					setTimeout(fetchMore, INTERVAL)
				})
			} else {
				// console.log('NOT VISIBLE')
				setTimeout(fetchMore, INTERVAL)
			}
		}, INTERVAL)
	}

	startFetchLoop()

	var fetchNL = function () {
		nl.fetch({
			success: function (collection, response, options) {
				last_fetched = new Date();
				var notSeen = _.filter(nl.toJSON(), function(i){
					return new Date(i.updated_at) > new Date(nl.last_seen)
				})
				all_seen = collection.last_seen > collection.last_update
				updateFavicon(notSeen.length)
				updateUnseenNotifs(notSeen.length)
			}.bind(this),
			error: function (collection, response, options) {
				app.flash.alert("Falha ao obter notificações.")
			}.bind(this),
		})
	}

	var updateUnseenNotifs = function (num) {
		$('[data-info=unseen-notifs]').html(num)
		$('[data-info=unseen-notifs]').addClass(num?'nonzero':'zero')
		if (num) {
			this.addClass('active')
		} else {
			this.removeClass('active')
		}
	}.bind(this)

	// fetchNL()
}
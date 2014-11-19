(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);throw new Error("Cannot find module '"+o+"'")}var f=n[o]={exports:{}};t[o][0].call(f.exports,function(e){var n=t[o][1][e];return s(n?n:e)},f,f.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){

var $ = require('jquery')
window.$ = window.jQuery = $;

require('backbone')

var common = require('./common.js')
var router = require('./components/router.jsx')
router.initialize()
},{"./common.js":2,"./components/router.jsx":8,"backbone":28,"jquery":36}],2:[function(require,module,exports){

// From http://detectmobilebrowsers.com
(function detectMobile (a,b){
	if (/(android|bb\d+|meego).+mobile|avantgo|bada\/|blackberry|blazer|compal|elaine|fennec|hiptop|iemobile|ip(hone|od)|iris|kindle|lge |maemo|midp|mmp|mobile.+firefox|netfront|opera m(ob|in)i|palm( os)?|phone|p(ixi|re)\/|plucker|pocket|psp|series(4|6)0|symbian|treo|up\.(browser|link)|vodafone|wap|windows ce|xda|xiino/i.test(a)||/1207|6310|6590|3gso|4thp|50[1-6]i|770s|802s|a wa|abac|ac(er|oo|s\-)|ai(ko|rn)|al(av|ca|co)|amoi|an(ex|ny|yw)|aptu|ar(ch|go)|as(te|us)|attw|au(di|\-m|r |s )|avan|be(ck|ll|nq)|bi(lb|rd)|bl(ac|az)|br(e|v)w|bumb|bw\-(n|u)|c55\/|capi|ccwa|cdm\-|cell|chtm|cldc|cmd\-|co(mp|nd)|craw|da(it|ll|ng)|dbte|dc\-s|devi|dica|dmob|do(c|p)o|ds(12|\-d)|el(49|ai)|em(l2|ul)|er(ic|k0)|esl8|ez([4-7]0|os|wa|ze)|fetc|fly(\-|_)|g1 u|g560|gene|gf\-5|g\-mo|go(\.w|od)|gr(ad|un)|haie|hcit|hd\-(m|p|t)|hei\-|hi(pt|ta)|hp( i|ip)|hs\-c|ht(c(\-| |_|a|g|p|s|t)|tp)|hu(aw|tc)|i\-(20|go|ma)|i230|iac( |\-|\/)|ibro|idea|ig01|ikom|im1k|inno|ipaq|iris|ja(t|v)a|jbro|jemu|jigs|kddi|keji|kgt( |\/)|klon|kpt |kwc\-|kyo(c|k)|le(no|xi)|lg( g|\/(k|l|u)|50|54|\-[a-w])|libw|lynx|m1\-w|m3ga|m50\/|ma(te|ui|xo)|mc(01|21|ca)|m\-cr|me(rc|ri)|mi(o8|oa|ts)|mmef|mo(01|02|bi|de|do|t(\-| |o|v)|zz)|mt(50|p1|v )|mwbp|mywa|n10[0-2]|n20[2-3]|n30(0|2)|n50(0|2|5)|n7(0(0|1)|10)|ne((c|m)\-|on|tf|wf|wg|wt)|nok(6|i)|nzph|o2im|op(ti|wv)|oran|owg1|p800|pan(a|d|t)|pdxg|pg(13|\-([1-8]|c))|phil|pire|pl(ay|uc)|pn\-2|po(ck|rt|se)|prox|psio|pt\-g|qa\-a|qc(07|12|21|32|60|\-[2-7]|i\-)|qtek|r380|r600|raks|rim9|ro(ve|zo)|s55\/|sa(ge|ma|mm|ms|ny|va)|sc(01|h\-|oo|p\-)|sdk\/|se(c(\-|0|1)|47|mc|nd|ri)|sgh\-|shar|sie(\-|m)|sk\-0|sl(45|id)|sm(al|ar|b3|it|t5)|so(ft|ny)|sp(01|h\-|v\-|v )|sy(01|mb)|t2(18|50)|t6(00|10|18)|ta(gt|lk)|tcl\-|tdg\-|tel(i|m)|tim\-|t\-mo|to(pl|sh)|ts(70|m\-|m3|m5)|tx\-9|up(\.b|g1|si)|utst|v400|v750|veri|vi(rg|te)|vk(40|5[0-3]|\-v)|vm40|voda|vulc|vx(52|53|60|61|70|80|81|83|85|98)|w3c(\-| )|webc|whit|wi(g |nc|nw)|wmlb|wonu|x700|yas\-|your|zeto|zte\-/i.test(a.substr(0,4))) {
		window._isMobile = true;
		document.body.className += " mobile";
		return true;
	}
	window._isMobile = false;
	return false;
})(navigator.userAgent||navigator.vendor||window.opera)

window.calcTimeFrom = function (arg, short) {
	var now = new Date(),
		then = new Date(arg),
		diff = now-then;

	if (diff < 1000*60) {
		return 'agora';
	} else if (diff < 1000*60*60) {
		var m = Math.floor(diff/1000/60);
		return short?('há '+m+'m'):('há '+m+' minuto'+(m>1?'s':''));
	} else if (diff < 1000*60*60*30) { // até 30 horas
		var m = Math.floor(diff/1000/60/60);
		return short?('há '+m+'h'):('há '+m+' hora'+(m>1?'s':''));
	} else if (diff < 1000*60*60*24*14) {
		var m = Math.floor(diff/1000/60/60/24);
		return short?('há '+m+'d'):('há '+m+' dia'+(m>1?'s':''));
	} else {
		var m = Math.floor(diff/1000/60/60/24/7);
		return short?('há '+m+'sem'):('há '+m+' semana'+(m>1?'s':''));
	}
};

window.formatFullDate = function (date) {
	date = new Date(date);
	return ''+date.getDate()+' de '+['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio',
	'Junho', 'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro',
	'Dezembro'][date.getMonth()]+', '+date.getFullYear()+' '+(date.getHours()>12?
		''+(date.getHours()-12)+':'+date.getMinutes()+'pm':
		''+(date.getHours())+':'+date.getMinutes()+'am');
}

require('es5-shim')

var $ = require('jquery')
var modernizr = require('modernizr')
var plugins = require('./plugins.js')
var bootstrap_tooltip = require('../vendor/bootstrap/tooltip.js')
var bootstrap_button = require('../vendor/bootstrap/button.js')
var bootstrap_dropdown = require('../vendor/bootstrap/dropdown.js')

$("body").tooltip({selector:'[data-toggle=tooltip]'});
$("[data-toggle=dialog]").xdialog();
$('.btn').button();

(function setCSRFToken () {
	$.ajaxPrefilter(function(options, _, xhr) {
		if (!options.crossDomain) {
			xhr.setRequestHeader('X-CSRF-Token',
				$("meta[name='csrf-token']").attr('content'));
		}
	});
})();

var CanvasImage = function(e, t) {
    this.image = t;
    this.element = e;
    this.element.width = Math.min(this.image.width, $(this.element).parent().width());
    this.element.width
    this.element.height = this.image.height;
    var chrome = navigator.userAgent.toLowerCase().indexOf("chrome") > -1,
        mac = navigator.appVersion.indexOf("Mac") > -1;
    if (chrome && mac) {
	    this.element.width = Math.min(this.element.width, $(window).width());
	    this.element.height = Math.min(this.element.height, 200);
    }
		this.context = this.element.getContext("2d");
    this.context.drawImage(this.image, 0, 0);
};

CanvasImage.prototype = {
    blur: function(e) {
        this.context.globalAlpha = .5;
        for (var t = -e; e >= t; t += 2)
            for (var n = -e; e >= n; n += 2) this.context.drawImage(this.element, n, t), n >= 0 && t >= 0 && this.context.drawImage(this.element, -(n - 1), -(t - 1));
        this.context.globalAlpha = 1
    }
}
$(function () {
    var e, t, n;
    $("canvas.blur").each(function() {
        n = this
        e = new Image
        e.onload = function () {
            t = new CanvasImage(n, this)
            t.blur(4)
        }
        e.src = $(this).attr("src")
    })
})

// GOSTAVA TANTO DE NUTELLA

$("a[data-ajax-post-href],button[data-ajax-post-href]").click(function () {
	var href = this.dataset['ajaxPostHref'],
		redirect = this.dataset['redirectHref'];
	$.post(href, function () {
		if (redirect)
			window.location.href = redirect;
		else
			window.location.reload();
	});
});
},{"../vendor/bootstrap/button.js":30,"../vendor/bootstrap/dropdown.js":31,"../vendor/bootstrap/tooltip.js":33,"./plugins.js":14,"es5-shim":34,"jquery":36,"modernizr":42}],3:[function(require,module,exports){
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

var Notification = React.createClass({displayName: 'Notification',
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
			React.createElement("li", {onClick: this.handleClick, className: this.ndata.leftHtml?"hasThumb":""}, 
				JSON.stringify(this.props.model.atributes), 
				
					this.ndata.leftHtml?
					React.createElement("div", {className: "left", dangerouslySetInnerHTML: {__html: this.ndata.leftHtml}})
					:null, 
				
				React.createElement("div", {className: "right body"}, 
					React.createElement("span", {className: "message", dangerouslySetInnerHTML: {__html: this.ndata.html}}), 
					React.createElement("time", null, date)
				)
			)
		)
	},
})

var NotificationHeader = React.createClass({displayName: 'NotificationHeader',
	render: function () {
		return (
			React.createElement("div", {className: "popover-header"}, 
				"NOTIFICAÇÕES"
			)
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

		var INTERVAL = 60*1000
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

	fetchNL()
}
},{"./parts/popover_list.jsx":7,"backbone":28,"favico":35,"jquery":36,"lodash":39,"react":45}],4:[function(require,module,exports){
/** @jsx React.DOM */

var $ = require('jquery')
var React = require('react')

var FlashDiv = React.createClass({displayName: 'FlashDiv',
	getInitialState: function () {
		return {message:'', action:''};
	},
	message: function (text, className, wait) {
		var wp = this.refs.message.getDOMNode();
		$(wp).fadeOut(function () {
			function removeAfterWait() {
				setTimeout(function () {
					$(this).fadeOut();
				}.bind(this), wait || 5000);
			}
			$(this.refs.messageContent.getDOMNode()).html(text);
			$(wp).prop('class', 'message '+className).fadeIn('fast', removeAfterWait);
		}.bind(this));
	},
	hide: function () {
		$(this.refs.message.getDOMNode()).fadeOut();
	},
	render: function () {
		return (
			React.createElement("div", {ref: "message", className: "message", style: { 'display': 'none'}, onClick: this.hide}, 
				React.createElement("span", {ref: "messageContent"}), " ", React.createElement("i", {className: "close-btn", onClick: this.hide})
			)
		);
	},
});

module.exports = (function FlashNotifier (message, className, wait) {
	this.fd = React.render(React.createElement(FlashDiv, null), $('<div class=\'flasher\'>').appendTo('body')[0]);
	this.warn = function (message, wait) {
		this.fd.message(message, 'warn', wait || 5000);
	}
	this.info = function (message, wait) {
		this.fd.message(message, 'info', wait || 5000);
	}
	this.alert = function (message, wait) {
		this.fd.message(message, 'error', wait || 5000);
	}
});
},{"jquery":36,"react":45}],5:[function(require,module,exports){
/** @jsx React.DOM */

var $ = require('jquery')
var _ = require('lodash')
var React = require('react')
var Backbone = require('backbone')
var Favico = require('favico')
var PopoverList = require('./parts/popover_list.jsx')

Backbone.$ = $

var Points = {
	'PostUpvote': 10,
};

var Handlers = {
	PostUpvote: function (item) {
		var obj = {};
		if (item.instances.length === 0) {
			return null;
		} else if (item.instances.length === 1) {
			var name = item.instances[0].name.split(' ')[0];
			// return name+" votou na sua publicação '"+item.name+"'"
			obj.html = '<i class="icon-favorite"></i> '+name+" votou"
		} else {
			var names = _.map(item.instances.slice(0, item.instances.length-1),
				function (i) {
					return i.name.split(' ')[0];
				}).join(', ')
			names += " e "+(item.instances[item.instances.length-1].name.split(' '))[0]+" ";
			obj.html = '<i class="icon-favorite"></i> '+names+" votaram";
		}
		obj.path = item.path;
		return obj;
	}
}

/**
 * React component the PopoverList items.
 */

var KarmaItem = React.createClass({displayName: 'KarmaItem',
	componentWillMount: function () {
 		this.kdata = Handlers[this.props.model.get('type')](this.props.model.attributes);
	},
	handleClick: function () {
		if (this.kdata.path) {
			window.location.href = this.kdata.path;
		}
	},
	render: function () {
		if (!this.kdata) {
			return null;
		}

		var ptype = this.props.model.get('object').postType;

		var date = window.calcTimeFrom(this.props.model.get('updated_at'));
		var delta = Points[this.props.model.get('type')]*this.props.model.get('multiplier');
		// <time>{date}</time>
		return (
			React.createElement("li", {onClick: this.handleClick, className: "hasThumb"}, 
				React.createElement("div", {className: "left"}, 
					React.createElement("div", {className: "delta"}, 
						"+", delta
					)
				), 
				React.createElement("div", {className: "right body"}, 
					React.createElement("span", {className: "name"}, this.props.model.get('object').name), 
					React.createElement("span", {className: "read", 
						dangerouslySetInnerHTML: {__html: this.kdata.html}})
				)
			)
		);
	},
});

/**
 * Backbone collection for karma items.
 * Overrides default parse method to calculate seen attribute for each item.
 */

var kl = new (Backbone.Collection.extend({
	url: '/api/me/karma',
	parse: function (response, options) {
		this.last_seen = new Date(window.user.meta.last_seen_notification || 0);
		this.karma = response.karma;
		var all = Backbone.Collection.prototype.parse.call(this, response.items, options);
		return _.map(response.items, function (i) {
			i.seen = i.updated_at < this.last_seen;
			return i;
		}.bind(this));
	},
}));

var KarmaHeader = React.createClass({displayName: 'KarmaHeader',
	render: function () {
		return (
			React.createElement("div", {className: "popover-header"}, 
				"PONTOS"
			)
		)
	},
})


/**
 * Export and also serve as jquery plugin.
 */

module.exports = $.fn.ikarma = function (opts) {
	if (this.data('ikarma'))
		return;
	this.data('ikarma', true);

	// Do it.
	var all_seen = false
	var pl = PopoverList(this[0], kl, KarmaItem, KarmaHeader, {
		onClick: function () {
			// // Check cookies for last fetch
			// if (!all_seen) {
			// 	all_seen = true
			// 	$.post('/api/me/karma/see');
			// }
		},
		className: 'karma-list',
	})

	var updateKarma = function (num) {
		$('[data-info=user-karma]').html(num)
	};

	kl.fetch({
		success: function (collection, response, options) {
			updateKarma(collection.jarma)
		}.bind(this),
		error: function (collection, response, options) {
			app.flash.alert("Falha ao obter notificações.")
		}.bind(this),
	})
}
},{"./parts/popover_list.jsx":7,"backbone":28,"favico":35,"jquery":36,"lodash":39,"react":45}],6:[function(require,module,exports){

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
		if (response.minDate === 0) {
			console.log("EOF!!!!!")
			this.EOF = true;
			this.trigger('eof');
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
		this.fetch({data: {maxDate:this.minDate-1}, remove:false});
	},
});

module.exports = {
	postItem: PostItem,
	problemItem: ProblemItem,
	commentItem: CommentItem,
	feedList: FeedList,
}
},{"backbone":28,"jquery":36}],7:[function(require,module,exports){
/** @jsx React.DOM */

var React = require('react')
var $ = require('jquery')
var bootstrap_popover = require('bootstrap.popover')

/**
 * Extend bootstrap's popover to accept React components as their content.
 */

$.extend($.fn.popover.Constructor.DEFAULTS, {react: false})
var oldSetContent = $.fn.popover.Constructor.prototype.setContent

$.fn.popover.Constructor.prototype.setContent = function() {
	if (!this.options.react) {
		return oldSetContent.call(this)
	}
	var $tip = this.tip()
	var title = this.getTitle()
	var content = this.getContent()
	$tip.removeClass('fade top bottom left right in')
	if (!$tip.find('.popover-content').html()) {
		var $title = $tip.find('.popover-title')
		if (title) {
			React.render(title, $title[0])
		} else {
			$title.hide()
		}
		React.render(content, $tip.find('.popover-content')[0])
	}
}

/**
 * React component for the list of items in the popover.
 */

var List = React.createClass({displayName: 'List',
	componentWillMount: function () {
		this.props.collection.on('add reset update change', function () {
			this.forceUpdate()
		}.bind(this))
	},
	render: function () {
		if (this.props.collection.models.length === 0) {
			return (
				React.createElement("div", {className: "popover-inner"}, 
					React.createElement("span", {dangerouslySetInnerHTML: {__html: this.props.messageEmpty}}
					)
				)
			)
		}
		var items = this.props.collection.map(function (i) {
			return this.props.itemComponent({ key: i.cid, model: i })
		}.bind(this))
		return (
			React.createElement("div", {className: "popover-inner popover-list notification-list"}, 
				
					this.props.headerComponent?
					this.props.headerComponent(this.props)
					:null, 
				
				items
			)
		)
	}
})

/**
 * ... main function?
 */

module.exports = function (el, collection, item, header, data) {

	if (!data) { // header is optional
		data = header;
		header = undefined;
	}

	if (!el) {
		console.warn("Failed to create popover list with unexistent item.");
		return;
	}

	$(el).popover({
		react: true,
		content: List({
			itemComponent: item,
			headerComponent: header,
			collection: collection,
			destroy: function () {
				$(el).popover('destroy')
			},
			messageEmpty: "<div class='msg-empty'>Nada aqui por enquanto.</div>"
		}),
		placement: 'bottom',
		container: 'body',
		trigger: 'manual',
	})

	var $popover = $($(el).data('bs.popover').tip());

	// Hack. Force right-align of list on el (btsp tries to center it on el)
	var rightOffset = $(window).width() - $(el).offset().left - $(el).outerWidth()-20;
	$popover.addClass((data.className || '')+ " popoverlist")

	// Hide popover when mouse-click happens outside of popover/button.
	$(document).mouseup(function (e) {
		var button = $(el)
		if (!button.is(e.target) && // button isn't target
	 		button.has(e.target).length === 0 && // button isn't target parent
			$(e.target).parents('.popover.in').length === 0) { // target isn't inside popover
			$(el).popover('hide')
		}
	}.bind(this))

	$(el).bind('hide.bs.popover', function () {
		$(el).removeClass('open-popover');
	});
	$(el).bind('show.bs.popover', function () {
		$(el).addClass('open-popover');
	});

	$(el).click(function (evt) {
		var $el = $(el)
		if ($el.data('bs.popover') && $el.data('bs.popover').tip().hasClass('in')) {
			$el.popover('hide')
		} else {
			$el.popover('show')
			$popover.css('left', 'auto').css('right', rightOffset+'px');
		}
		data.onClick && data.onClick(evt)
	})
}
},{"bootstrap.popover":32,"jquery":36,"react":45}],8:[function(require,module,exports){
/** @jsx React.DOM */

var $ = require('jquery')
// require('jquery-cookie')
var Backbone = require('backbone')
var _ = require('lodash')
var React = require('react')
var NProgress = require('nprogress')

window._ = _;
Backbone.$ = $;

var models 				= require('../components/models.js')
var Flasher 			= require('../components/flash.jsx')
var Tour					= require('../components/tour.js')
var PostForm 			= require('../views/postForm.jsx')
var ProblemForm 	= require('../views/problemForm.jsx')
var Follows 			= require('../views/follows.jsx')
var FullPost 			= require('../views/fullItem.jsx')
var Interests 		= require('../views/interests.jsx')
var Stream 				= require('../views/stream.jsx')
var ProfileView 	= require('../pages/profile.js')
var LabView 			= require('../pages/lab.js')
var LabsView 			= require('../pages/labs.js')
var ProblemsView 	= require('../pages/problems.jsx')

if (window.user) {
	require('../components/karma.jsx')
	require('../components/bell.jsx')
	$('#nav-karma').ikarma();
	$('#nav-bell').bell();
}

//////////////////////////////////////////////////////////////////////////////////////////

$(document).ajaxStart(function() {
	NProgress.start()
});
$(document).ajaxComplete(function() {
	NProgress.done()
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

//////////////////////////////////////////////////////////////////////////////////////////

$('body').on("click", ".btn-follow", function (evt) {
	var action = this.dataset.action;
	if (action !== 'follow' && action !== 'unfollow') {
		throw "What?";
	}

	var neew = (action==='follow')?'unfollow':'follow';
	if (this.dataset.user) {
		$.ajax({
			type: 'post',
			dataType: 'json',
			url: '/api/users/'+this.dataset.user+'/'+action,
		}).done(function (response) {
			if (response.error) {
				if (app && app.flash) {
					app.flash.alert(data.message || "Erro!");
				}
				console.warn("ERRO!", response.error);
			} else {
				this.dataset.action = neew;
			}
		}.bind(this)).fail(function (xhr) {
			if (app && app.flash) {
				app.flash.alert(xhr.responseJSON.message || 'Erro!');
			}
		});
	}
});

$('body').on('click', '[data-trigger=component]', function (e) {
	e.preventDefault();
	// Call router method
	var dataset = this.dataset;
	// Too coupled. This should be implemented as callback, or smthng. Perhaps triggered on navigation.
	$('body').removeClass('sidebarOpen');
	if (dataset.route) {
		var href = $(this).data('href') || $(this).attr('href');
		if (href)
			console.warn('Component href attribute is set to '+href+'.');
		app.navigate(href, {trigger:true, replace:false});
	} else {
		if (typeof app === 'undefined' || !app.components) {
			if (dataset.href)
				window.location.href = dataset.href;
			else
				console.error("Can't trigger component "+dataset.component+" in unexistent app object.");
			return;
		}
		if (dataset.component in app.components) {
			var data = {};
			if (dataset.args) {
				try {
					data = JSON.parse(dataset.args);
				} catch (e) {
					console.error('Failed to parse data-args '+dataset.args+' as JSON object.');
					console.error(e.stack);
					return;
				}
			}
			// Pass parsed data and element that triggered.
			app.components[dataset.component].call(app, data, this);
		} else {
			console.warn('Router doesn\'t contain component '+dataset.component+'.')
		}
	}
});

$('body').on('click', 'button[data-src]', function (e) {
	app.renderWall(this.dataset.src);
	$('button[data-src]').removeClass('active');
	$('button[data-src=\''+this.dataset.src+'\']').addClass('active');
})

setTimeout(function updateCounters () {
	$('[data-time-count]').each(function () {
		this.innerHTML = calcTimeFrom(parseInt(this.dataset.timeCount), this.dataset.short !== 'false');
	});
	setTimeout(updateCounters, 15000);
}, 1000);


if (window.location.hash == "#tour" || window.conf.showTour) {
	Tour()
}

if (window.conf && window.conf.showInterestsBox) {
	setTimeout(function () {
		app.triggerComponent(app.components.selectInterests);
	}, 500)
}

/**
 * Trigger when mouse-click happens outside of elements.
 */
function triggerClickOutsideElements (elems, cb) {
	if (elems instanceof window.Element)
		elems = $(elems);
	$(document).one('mouseup', function (event) {
		if (!$(event.target).is(elems) && // Not the elements.
			!elems.has($(event.target)).length) { // Not a child of the elements.
			cb(event);
		}
	});
}


var Pages = function () {

	var pages = [];

	this.push = function (component, dataPage, opts) {
		var opts = _.extend({
			onClose: function () {}
		}, opts || {});

		var e = document.createElement('div');
		var oldTitle = document.title;
		var destroyed = false;

		// Adornate element and page.
		if (!opts.navbar)
			$(e).addClass('pcontainer');
		if (opts.class)
			$(e).addClass(opts.class);
		$(e).addClass('invisble');
		if (dataPage)
			e.dataset.page = dataPage;
		if (opts.title) {
			document.title = opts.title;
		}

		var obj = {
			target: e,
			component: component,
			destroy: function (dismissOnClose) {
				if (destroyed) {
					console.warn("Destroy for page "+dataPage+" being called multiple times.");
					return;
				}
				destroyed = true;
				pages.splice(pages.indexOf(this), 1);
				$(e).addClass('invisible');
				React.unmountComponentAtNode(e);
				$(e).remove();
				document.title = oldTitle;
				$('html').removeClass(opts.crop?'crop':'place-crop');
				opts.onClose && opts.onClose();
			}.bind(this),
		};
		component.props.page = obj;
		pages.push(obj);

		// DOIT
		$(e).hide().appendTo('body');
		$('html').addClass(opts.crop?'crop':'place-crop'); // Remove scrollbars?

		React.render(component, e, function () {
			$(e).show().removeClass('invisible');
		});

		return obj;
	};

	this.pop = function () {
		this.pages.pop().destroy();
	};

	// find a good final name
	this.close = this.closeAll = function () {
		for (var i=0; i<pages.length; i++) {
			pages[i].destroy();
		}
		pages = [];
	};
};

/**
 * Central functionality of the app.
 */
var WorkspaceRouter = Backbone.Router.extend({

	pages: new Pages(),
	pageRoot: window.conf && window.conf.pageRoot,
	flash: new Flasher,

	initialize: function () {
		console.log('initialized')

		if (document.getElementById('qi-stream-wrap')) {
			$(document).scroll(_.throttle(function() {
				// Detect scroll up?
				// http://stackoverflow.com/questions/9957860/detect-user-scroll-down-or-scroll-up-in-jquery
				if ($(document).height() - ($(window).scrollTop() + $(window).height()) < 50) {
					this.postList && this.postList.tryFetchMore();
				}
			}.bind(this), 2000));
		}

		for (var id in pageMap) if (pageMap.hasOwnProperty(id)) {
			(function (id) {
				var path = pageMap[id].path;
				if (path[0] === '/')
					path = path.slice(1);
				this.route(path, function () {
					this.renderWall('/api/labs/'+id+'/all');
				}.bind(this));
			}.bind(this))(id);
		}
	},

	triggerComponent: function (comp, args) {
		comp.call(this, args);
	},

	renderWall: function (url, query) {
		if (this.postList && (!query && (!url || this.postList.url === url))) {
			// If there already is a postList and no specific url, app.fetchStream() should
			// have been called instead.
			return;
		}
		// '/api/me/global/posts' '/api/me/inbox/posts' '/api/me/problems'

		if (!document.getElementById('qi-stream-wrap')) {
			console.log("No stream container found.");
			return;
		}

		url = url || (window.conf && window.conf.postsRoot);

		console.log('renderwall')

		if (!this.postList) {
			this.postList = new models.feedList([], {url:url});
		}
		if (!this.postWall) {
			this.postWall = React.render(
				React.createElement(Stream, {wall: !conf.isListView}),
				document.getElementById('qi-stream-wrap'));
		}

		this.postList.reset();
		this.postList.url = url;
		this.postList.fetch({ reset: true, data: query || {} });
	},

	routes: {
		'tour':
			function () {
				// detect if chrome // say: "we only support chrome right now"
				if ('WebkitAppearance' in document.documentElement.style);
				this.renderWall();
			},
		'@:username':
			function (username) {
				ProfileView(this)
				this.renderWall()
			},
		'@:username/seguindo':
			function (username) {
				ProfileView(this)
				if (window.user_profile && window.user_profile.username === username) {
					// We really are in <username>'s profile page, and we have its id.
					this.navigate('/@'+username, { trigger: false })
					this.renderWall()
					this.triggerComponent(this.components.following,{
						id: window.user_profile.id
					})
				} else {
					// We don't have his/her id, so redirect to his/her profile
					location.href = '/@'+username+'/seguindo'
				}
			},
		'@:username/seguidores':
			function (username) {
				ProfileView(this)
				if (window.user_profile && window.user_profile.username === username) {
					// We really are in <username>'s profile page, and we have its id.
					this.navigate('/@'+username, { trigger: false })
					this.renderWall()
					this.triggerComponent(this.components.followers,{
						id: window.user_profile.id
					})
				} else {
					// We don't have his/her id, so redirect to his/her profile
					location.href = '/@'+username+'/seguidores'
				}
			},
		// problemas
		'problemas':
			function () {
				ProblemsView(this)
				this.renderWall("/api/labs/all/problems")
			},
		'problemas/novo':
			function (postId) {
				ProblemsView(this)
				this.triggerComponent(this.components.createProblem)
				this.renderWall("/api/labs/all/problems")
			},
		'problemas/:problemId':
			function (problemId) {
				ProblemsView(this)
				this.triggerComponent(this.components.viewProblem,{id:problemId})
				this.renderWall("/api/labs/all/problems")
			},
		'problemas/:problemId/editar':
			function (problemId) {
				ProblemsView(this)
				this.triggerComponent(this.components.editProblem,{id:problemId})
				this.renderWall("/api/labs/all/problems")
			},
		// posts
		'posts/:postId':
			function (postId) {
				this.triggerComponent(this.components.viewPost,{id:postId})
				this.renderWall()
			},
		'posts/:postId/editar':
			function (postId) {
				this.triggerComponent(this.components.editPost,{id:postId})
				this.renderWall()
			},
		'novo':
			function (postId) {
				this.triggerComponent(this.components.createPost)
				this.renderWall()
			},
		'interesses':
			function (postId) {
				this.triggerComponent(this.components.selectInterests);
				this.renderWall();
			},
		'labs':
			function () {
				this.pages.closeAll();
				this.renderWall();
			},
		'':
			function () {
				this.pages.closeAll();
				this.renderWall();
			},
	},

	components: {
		viewPost: function (data) {
			this.pages.closeAll();
			var postId = data.id;
			var resource = window.conf.resource;

			if (!postId) {
				console.warn("No postId supplied to viewPost.", data, resource);
				throw "WTF";
			}

			// Check if resource object came with the html
			if (resource && resource.type === 'post' && resource.data.id === postId) {
			// Resource available on page
				var postItem = new models.postItem(resource.data);
				// Remove window.conf.post, so closing and re-opening post forces us to fetch
				// it again. Otherwise, the use might lose updates.
				window.conf.resource = undefined;
				this.pages.push(React.createElement(FullPost, {type: postItem.get('type'), model: postItem}), 'post', {
					title: resource.data.content.title+' | QI Labs',
					crop: true,
					onClose: function () {
						app.navigate(app.pageRoot || '/', { trigger: false });
					}
				});
			} else {
			// No. Fetch it by hand.
				$.getJSON('/api/posts/'+postId)
					.done(function (response) {
						if (response.data.parent) {
							return app.navigate('/posts/'+response.data.parent, {trigger:true});
						}
						console.log('response, data', response);
						var postItem = new models.postItem(response.data);
						this.pages.push(React.createElement(FullPost, {type: postItem.get('type'), model: postItem}), 'post', {
							title: postItem.get('content').title+' | QI Labs',
							crop: true,
							onClose: function () {
								app.navigate(app.pageRoot || '/', { trigger: false });
							}
						});
					}.bind(this))
					.fail(function (xhr) {
						if (xhr.responseJSON && xhr.responseJSON.error) {
							app.flash.alert(xhr.responseJSON.message || 'Erro! <i class="icon-sad"></i>');
						} else {
							app.flash.alert('Contato com o servidor perdido. Tente novamente.');
						}
					}.bind(this));
			}
		},

		viewProblem: function (data) {
			this.pages.closeAll();
			var postId = data.id;
			var resource = window.conf.resource;
			if (resource && resource.type === 'problem' && resource.data.id === postId) {
				var postItem = new models.problemItem(resource.data);
				// Remove window.conf.problem, so closing and re-opening post forces us to fetch
				// it again. Otherwise, the use might lose updates.
				window.conf.resource = undefined;
				this.pages.push(React.createElement(FullPost, {type: "Problem", model: postItem}), 'problem', {
					title: resource.data.content.title+' | QI Labs',
					crop: true,
					onClose: function () {
						app.navigate(app.pageRoot || '/', { trigger: false });
					}
				});
			} else {
				$.getJSON('/api/problems/'+postId)
					.done(function (response) {
						if (response.data.parent) {
							return app.navigate('/problems/'+response.data.parent, {trigger:true});
						}
						console.log('response, data', response);
						var postItem = new models.problemItem(response.data);
						this.pages.push(React.createElement(FullPost, {type: "Problem", model: postItem}), 'problem', {
							title: postItem.get('content').title+' | QI Labs',
							crop: true,
							onClose: function () {
								app.navigate(app.pageRoot || '/', { trigger: false });
							}
						});
					}.bind(this))
					.fail(function (xhr) {
						if (xhr.status === 404) {
							app.flash.alert('Ops! Não conseguimos encontrar essa publicação. Ela pode ter sido excluída.');
						} else {
							app.flash.alert('Ops.');
						}
					}.bind(this));
			}
		},

		createProblem: function (data) {
			this.pages.closeAll();
			this.pages.push(ProblemForm.create({user: window.user}), 'problemForm', {
				crop: true,
				onClose: function () {
				}
			});
		},

		editProblem: function (data) {
			this.pages.closeAll();
			$.getJSON('/api/problems/'+data.id)
				.done(function (response) {
					console.log('response, data', response)
					var problemItem = new models.problemItem(response.data);
					this.pages.push(ProblemForm.edit({model: problemItem}), 'problemForm', {
						crop: true,
						onClose: function () {
							app.navigate(app.pageRoot || '/', { trigger: false });
						},
					});
				}.bind(this))
				.fail(function (xhr) {
					app.flash.warn("Problema não encontrado.");
					app.navigate('/', { trigger: true });
				}.bind(this));
		},

		editPost: function (data) {
			this.pages.closeAll();
			$.getJSON('/api/posts/'+data.id)
				.done(function (response) {
					if (response.data.parent) {
						return alert('eerrooo');
					}
					console.log('response, data', response)
					var postItem = new models.postItem(response.data);
					this.pages.push(PostForm.edit({model: postItem}), 'postForm', {
						crop: true,
						onClose: function () {
							app.navigate(app.pageRoot || '/', { trigger: false });
						}.bind(this),
					});
				}.bind(this))
				.fail(function (xhr) {
					app.flash.warn("Publicação não encontrada.");
					app.navigate('/', { trigger: true });
				}.bind(this));
		},

		createPost: function () {
			this.pages.closeAll();
			this.pages.push(PostForm.create({user: window.user}), 'postForm', {
				crop: true,
				onClose: function () {
				}
			});
		},

		selectInterests: function (data) {
			var self = this;
			new Interests({}, function () {
			})
		},

		following: function (data) {
			var userId = data.id;
			var self = this;
			$.getJSON('/api/users/'+userId+'/following')
				.done(function (response) {
					self.pages.push(React.createElement(Follows, {list: response.data, isFollowing: true, profile: user_profile}),
						'listView', {
							navbar: false,
							crop: true,
						});
				})
				.fail(function (xhr) {
					alert('vish');
				});
		},

		followers: function (data) {
			var userId = data.id;
			var self = this;
			$.getJSON('/api/users/'+userId+'/followers')
				.done(function (response) {
					self.pages.push(React.createElement(Follows, {list: response.data, isFollowing: false, profile: user_profile}),
						'listView', {
							navbar: false,
							crop: true,
						});
				})
				.fail(function (xhr) {
					alert('vish');
				});
		},

		openSidebarPlane: function (data, e) {
			var e = document.getElementById(e.dataset.plane);
			if ($(e).hasClass('open')) {
				$(e).removeClass('open');
				return;
			}
			$(e).addClass('open');
			triggerClickOutsideElements(e, function () {
				$(e).removeClass('open');
			})
		},

		// notifications: function (data) {
		// 	this.pages.closeAll();
		// 	this.pages.push(<NotificationsPage />, 'notifications', { navbar: false, crop: false });
		// },
	},

	utils: {
		refreshLatex: function () {
			setTimeout(function () {
				if (window.MathJax)
					MathJax.Hub.Queue(["Typeset",MathJax.Hub]);
				else
					console.warn("MathJax object not found.")
			}, 100);
		},
		renderMarkdown: function (txt) {
			var marked = require('marked');
			var renderer = new marked.Renderer();
			renderer.codespan = function (html) { // Ignore codespans in md (they're actually 'latex')
				return '`'+html+'`';
			}
			marked.setOptions({
				renderer: renderer,
				gfm: false,
				tables: false,
				breaks: false,
				pedantic: false,
				sanitize: true,
				smartLists: true,
				smartypants: true,
			})
			return marked(txt);
		},
	}
});

module.exports = {
	initialize: function () {
		window.app = new WorkspaceRouter;
		// Backbone.history.start({ pushState:false, hashChange:true });
		Backbone.history.start({ pushState:true, hashChange: false });
	},
};
},{"../components/bell.jsx":3,"../components/flash.jsx":4,"../components/karma.jsx":5,"../components/models.js":6,"../components/tour.js":9,"../pages/lab.js":10,"../pages/labs.js":11,"../pages/problems.jsx":12,"../pages/profile.js":13,"../views/follows.jsx":15,"../views/fullItem.jsx":16,"../views/interests.jsx":17,"../views/postForm.jsx":22,"../views/problemForm.jsx":24,"../views/stream.jsx":26,"backbone":28,"jquery":36,"lodash":39,"marked":40,"nprogress":43,"react":45}],9:[function(require,module,exports){

$ = require('jquery')
_ = require('lodash')
require('bootstrap-tour')

defaultOpts = {
	steps: [
		{
			content: "<div class=''><div class='header'><i class='icon-bulb'></i><h1>Bem-vindo ao <strong>QI Labs</strong>!</i></div><p>Nós conectamos jovens interessados nas mesmas atividades (como <strong>Olimpíadas Científicas</strong>, <strong>Empreendedorismo</strong>, <strong>Vestibulares Militares</strong> etc), através de comunidades (que nós chamamos de <strong>laboratórios</strong>).</p><p>Clique nas bolinhas azuis pela interface para aprender como usar melhor o site. :)</p></div>",
			placement: 'bottom',
			orphan: true,
			backdrop: true,
		},
		// {
		// 	title: "Menu dos laboratórios",
		// 	content: "<h1>Notificações</h1><p>Nós notificamos você sobre respostas aos seus comentários e publicações, e sobre atualizações da plataforma.</p>",
		// 	element: '#tour-nav-bell',
		// 	placement: 'bottom',
		// 	// backdrop: true,
		// },
		// {
		// 	content: "<h1>Reputação</h1><p>No QI Labs você recebe pontos por votos nos seus posts. Mais = melhor.</p>",
		// 	element: '#tour-karma',
		// 	placement: 'bottom',
		// 	// backdrop: true,
		// },
		// {
		// 	// title: "Menu dos laboratórios",
		// 	content: "Nessa barra lateral você pode acessar nossas guias e laboratórios. Os laboratórios são grupos separados por assuntos.",
		// 	element: '#sidebar',
		// 	placement: 'right',
		// 	// backdrop: true,
		// },
	],
	template:
	"<div class='popover tour'>"+
		"<div class='arrow'></div>"+
		"<h3 class='popover-title'></h3>"+
		"<div class='popover-content'></div>"+
		"<div class='popover-navigation'>"+
				// "<button class='btn btn-default' data-role='prev'>« Voltar</button>"+
				// "<span data-role='separator'>|</span>"+
				"<button class='btn btn-default' data-role='next'>Próximo</button>"+
				"<button class='btn btn-default' data-role='end'>Fechar</button>"+
		"</div>"+
		"</nav>"+
	"</div>",
	debug: true,
}

var Tipit = new (function () {

	this.makeTip = function (target, data) {

		var html = '<div class="tip animate" data-id="1" data-target="menu">'+
			'<div class="tip-cta">'+
				'<span class="tip-center"></span>'+
				'<span class="tip-beacon"></span>'+
			'</div>'+
			'<div class="tip-box">'+
				'<div class="header">'+data.header+'</div>'+
				'<p>'+data.text+'</p>'+
				'<div class="footer">'+
					'<a href="#" class="button blue tip-done">Done</a>'+
				'</div>'+
			'</div>'+
		'</div>';

		var x = $(target).offset().left+$(target).outerWidth()/2,
				y = $(target).offset().top+$(target).outerHeight()/2;

		var el = $(html).css({ top: y, left: x }).appendTo('body');
		if (x > $(window).width()/2) {
			$(el).addClass('tip-right');
		}
		$(el).find('.tip-done').click(function () {
			console.log('done');
			$(el).fadeOut().remove();
		});

		$(el).one('click', function (e) {
			console.log('click', $(e.target).find('.tip-box'))
			$(this).find('.tip-box').addClass('open');
			// if ($(this).find('.tip-box').hasClass('open')) {
			// 	$(this).find('.tip-box').animate({'opacity': 0}).removeClass('open');
			// } else {
			// }
		})
	};

	this.init = function (tips, opts) {
		for (var i=0; i<tips.length; ++i) {
			this.makeTip(tips[i].el, tips[i]);
		}
	}
});

module.exports = function (options) {

	Tipit.init([{
		el: '#tip-bell',
		header: "<i class='icon-notifications'></i> Notificações",
		text: "Aqui você recebe respostas para as suas publicações, para os seus comentários etc.",
	}, {
		el: '#tip-karma',
		header: "<i class='icon-atom'></i> Pontos",
		text: "No QI Labs você ganha pontos quando usuários dão <i class='icon-thumbs-up3'></i> na sua publicação.",
	}, {
		el: '#tip-problems',
		header: "<i class='icon-extension'></i> Problemas",
		text: "Aqui você recebe respostas para as suas publicações, para os seus comentários etc.",
	}, {
		el: '#tip-labs',
		header: "<i class='icon-lab'></i> Laboratórios",
		text: "Clique aqui para entrar na página dos laboratórios.",
	}, {
		el: '#tip-guides',
		header: "<i class='icon-local-library'></i> Guias",
		text: "Aqui você pode acessar e colaborar com conteúdo sobre atividades extra-curriculares.",
	}, {
		el: '#tip-dd-menu',
		header: "<i class='icon-gear'></i> Menu",
		text: "Seu perfil, configurações, ajuda,... tá tudo aqui.",
	}, {
		el: '#tip-new-post',
		header: "<i class='icon-edit'></i> Nova Publicação",
		text: "Clique aqui para escrever um novo post.",
	}])

	// $(
	// 	"<div class='popover tour tour-tour-0'>"+
	// 	"<div class='popover-content'></div>"+
	// 	"<div class='popover-navigation'>"+
	// 			"<div class=''><div class='header'><i class='icon-bulb'></i><h1>Bem-vindo ao <strong>QI Labs</strong>!</i></div><p>Nós conectamos jovens interessados nas mesmas atividades (como <strong>Olimpíadas Científicas</strong>, <strong>Empreendedorismo</strong>, <strong>Vestibulares Militares</strong> etc), através de comunidades (que nós chamamos de <strong>laboratórios</strong>).</p><p>Continue o tour para aprender a usar o site.<br /> É rápidinho. :)</p></div>"+
	// 			"<button class='btn btn-default' data-role='next'>Continuar</button>"+
	// 	"</div>"+
	// 	"</nav>"+
	// "</div>"
	// ).appendTo('body').show();
	var tour = new Tour(_.extend(defaultOpts, options || {
		onEnd: function () {
			// console.log('tour ended')
			if (window.location.hash == '#tour') // if still tour. [why check?]
				window.location.hash = '';
		}
	}));
	// var tour = QTour({
	// })
	tour.init();
	setTimeout(function () {
	  tour.restart();
	}, 500)
	// window.t = tour;
	// Tour.start();

	// return
};
},{"bootstrap-tour":29,"jquery":36,"lodash":39}],10:[function(require,module,exports){

module.exports = function () {
};
},{}],11:[function(require,module,exports){

module.exports = function () {

};
},{}],12:[function(require,module,exports){
/** @jsx React.DOM */

var $ = require('jquery')
var React = require('react')
var selectize = require('selectize')

var Header = React.createClass({displayName: 'Header',

	getInitialState: function () {
		return { changed: false };
	},

	componentDidMount: function () {
		//
		var t = $(this.refs.topic.getDOMNode()).selectize({
			plugins: ['remove_button'],
			maxItems: 5,
			multiple: true,
			labelField: 'name',
			valueField: 'id',
			searchField: 'name',
			options: [
				{ name: 'Álgebra', id: 'algebra', },
				{ name: 'Combinatória', id: 'combinatorics', },
				{ name: 'Geometria', id: 'geometry', },
				{ name: 'Teoria dos Números', id: 'number-theory', }
			],
		});
		t[0].selectize.addItem('algebra')
		t[0].selectize.addItem('combinatorics')
		t[0].selectize.addItem('geometry')
		t[0].selectize.addItem('number-theory')
		t[0].selectize.on('change', this.onChangeSelect);
		//
		var l = $(this.refs.level.getDOMNode()).selectize({
				plugins: ['remove_button'],
				maxItems: 5,
				multiple: true,
				labelField: 'name',
				valueField: 'id',
				searchField: 'name',
				options: [
					{ name: 'Nível 1', id: 1, },
					{ name: 'Nível 2', id: 2, },
					{ name: 'Nível 3', id: 3, },
				],
		});
		l[0].selectize.addItem(1)
		l[0].selectize.addItem(2)
		l[0].selectize.addItem(3)
		l[0].selectize.on('change', this.onChangeSelect);
	},

	onChangeSelect: function () {
		this.setState({ changed: true });
	},

	query: function () {
		var topic = this.refs.topic.getDOMNode().selectize.getValue(),
				level = this.refs.level.getDOMNode().selectize.getValue();

		this.props.onQuery({ level: level, topic: topic },
			function () {
				this.setState({ changed: false })
			}.bind(this)
		)
	},

	render: function () {

		return (
			React.createElement("div", null, 
				React.createElement("div", {className: "label"}, 
					"Mostrando problemas"
				), 

				React.createElement("select", {ref: "topic", className: "select-topic"}
				), 

				React.createElement("select", {ref: "level", className: "select-level"}
				), 

				React.createElement("button", {className: "new-problem", 
					'data-trigger': "component", 'data-component': "createProblem"}, 
					"Novo Problema"
				), 

				
					this.state.changed?
					React.createElement("button", {className: "query", onClick: this.query}, 
						"Procurar"
					)
					:React.createElement("button", {disabled: true, className: "query"}, 
						"Procurar"
					)
				
			)
		);
	},
})


module.exports = function (app) {

	function changeQuery (data, cb) {
		console.log(arguments)
		app.postList.once('reset', function () {
			cb();
		})
		app.renderWall('/api/labs/all/problems',
			{ level: data.level, topic: data.topic })
	}


	React.render(React.createElement(Header, {onQuery: changeQuery}),
		document.getElementById('qi-header'));

	if (window._profileLoaded)
		return;

	window._profileLoaded = true;

	$("[data-action=edit-profile]").click(function () {
		$(".profileWrapper").addClass('editing');
	});
	$("[name=name1], [name=name2]").on('keydown', function (e) {
		if (e.keyCode == 32) {
			e.preventDefault();
		}
	});
	// Defer: allow page to render first (so that tooltip position is correct)
	setTimeout(function () {
		$('[data-action="edit-profile"]').tooltip('show');
	}, 1);
	$('.autosize').autosize();
	$("[data-action=save-profile]").click(function () {
		var profile = {
			bio: $("[name=bio]").val(),
			nome1: $("[name=name1]").val(),
			nome2: $("[name=name2]").val(),
			home: $("[name=home]").val(),
			location: $("[name=location]").val(),
		};

		$.ajax({
			type: 'PUT',
			dataType: 'JSON',
			url: '/api/me/profile',
			data: {
				profile: profile
			}
		}).done(function (response) {
			if (response.error) {
				if (response.message) {
					app.flash.alert(response.message);
				} else {
					console.warn('????',response);
				}
			} else if (response.data) {
				var me = response.data;
				$(".profileWrapper").removeClass('editing');
				$(".profileOutput.bio").html(me.profile.bio);
				$(".profileOutput.name").html(me.name);
				$(".profileOutput.home").html(me.profile.home);
				$(".profileOutput.location").html(me.profile.location);
			} else {
				app.flash.alert("Um erro pode ter ocorrido.");
			}
		}).fail(function () {
		});
	})
};
},{"jquery":36,"react":45,"selectize":46}],13:[function(require,module,exports){

module.exports = function () {

	if (window._profileLoaded) // what is this ??
		return;

	window._profileLoaded = true;

	if (window.user && window.user.id === window.user_profile.id) {
		if (document.querySelector("[data-action=edit-profile]")) {
			$("[data-action=edit-profile]").click(function () {
				$(".profileWrapper").addClass('editing');
			});
		}
		if (document.querySelector("[name=name1],[name=name2]")) {
			$("[name=name1], [name=name2]").on('keydown', function (e) {
				if (e.keyCode == 32) {
					e.preventDefault();
				}
			});
		}
		// Defer: allow page to render first (so that tooltip position is correct)
		setTimeout(function () {
			$('[data-action="edit-profile"]').tooltip('show');
		}, 100);
		$('.autosize').autosize();
		$("[data-action=save-profile]").click(function () {
			var profile = {
				bio: $("[name=bio]").val(),
				nome1: $("[name=name1]").val(),
				nome2: $("[name=name2]").val(),
				home: $("[name=home]").val(),
				location: $("[name=location]").val(),
			};

			$.ajax({
				type: 'PUT',
				dataType: 'JSON',
				url: '/api/me/profile',
				data: {
					profile: profile
				}
			}).done(function (response) {
				if (response.error) {
					if (response.message) {
						app.flash.alert(response.message);
					} else {
						console.warn('????',response);
					}
				} else if (response.data) {
					var me = response.data;
					$(".profileWrapper").removeClass('editing');
					$(".profileOutput.bio").html(me.profile.bio);
					$(".profileOutput.name").html(me.name);
					$(".profileOutput.home").html(me.profile.home);
					$(".profileOutput.location").html(me.profile.location);
				} else {
					app.flash.alert("Um erro pode ter ocorrido.");
				}
			}).fail(function () {
			});
		})
	}
};
},{}],14:[function(require,module,exports){

var $ = require('jquery') 

jQuery = $;

// // Custom popup
// $.fn.xpopup = function (options) {
// 	var $el = this;
// 	var options = _.extend({

// 	}, options);

// 	$el.hover(function (e) {
		
// 	});
// }

/*!
Autosize v1.18.7 - 2014-04-13
Automatically adjust textarea height based on user input.
(c) 2014 Jack Moore - http://www.jacklmoore.com/autosize
license: http://www.opensource.org/licenses/mit-license.php
*/
(function(e){var t,o={className:"autosizejs",id:"autosizejs",append:"",callback:!1,resizeDelay:10,placeholder:!0},i='<textarea tabindex="-1" style="position:absolute; top:-999px; left:0; right:auto; bottom:auto; border:0; padding: 0; -moz-box-sizing:content-box; -webkit-box-sizing:content-box; box-sizing:content-box; word-wrap:break-word; height:0 !important; min-height:0 !important; overflow:hidden; transition:none; -webkit-transition:none; -moz-transition:none;"/>',n=["fontFamily","fontSize","fontWeight","fontStyle","letterSpacing","textTransform","wordSpacing","textIndent"],a=e(i).data("autosize",!0)[0];a.style.lineHeight="99px","99px"===e(a).css("lineHeight")&&n.push("lineHeight"),a.style.lineHeight="",e.fn.autosize=function(i){return this.length?(i=e.extend({},o,i||{}),a.parentNode!==document.body&&e(document.body).append(a),this.each(function(){function o(){var t,o=window.getComputedStyle?window.getComputedStyle(u,null):!1;o?(t=u.getBoundingClientRect().width,(0===t||"number"!=typeof t)&&(t=parseInt(o.width,10)),e.each(["paddingLeft","paddingRight","borderLeftWidth","borderRightWidth"],function(e,i){t-=parseInt(o[i],10)})):t=Math.max(p.width(),0),a.style.width=t+"px"}function s(){var s={};if(t=u,a.className=i.className,a.id=i.id,d=parseInt(p.css("maxHeight"),10),e.each(n,function(e,t){s[t]=p.css(t)}),e(a).css(s).attr("wrap",p.attr("wrap")),o(),window.chrome){var r=u.style.width;u.style.width="0px",u.offsetWidth,u.style.width=r}}function r(){var e,n;t!==u?s():o(),a.value=!u.value&&i.placeholder?(p.attr("placeholder")||"")+i.append:u.value+i.append,a.style.overflowY=u.style.overflowY,n=parseInt(u.style.height,10),a.scrollTop=0,a.scrollTop=9e4,e=a.scrollTop,d&&e>d?(u.style.overflowY="scroll",e=d):(u.style.overflowY="hidden",c>e&&(e=c)),e+=w,n!==e&&(u.style.height=e+"px",f&&i.callback.call(u,u))}function l(){clearTimeout(h),h=setTimeout(function(){var e=p.width();e!==g&&(g=e,r())},parseInt(i.resizeDelay,10))}var d,c,h,u=this,p=e(u),w=0,f=e.isFunction(i.callback),z={height:u.style.height,overflow:u.style.overflow,overflowY:u.style.overflowY,wordWrap:u.style.wordWrap,resize:u.style.resize},g=p.width();p.data("autosize")||(p.data("autosize",!0),("border-box"===p.css("box-sizing")||"border-box"===p.css("-moz-box-sizing")||"border-box"===p.css("-webkit-box-sizing"))&&(w=p.outerHeight()-p.height()),c=Math.max(parseInt(p.css("minHeight"),10)-w||0,p.height()),p.css({overflow:"hidden",overflowY:"hidden",wordWrap:"break-word",resize:"none"===p.css("resize")||"vertical"===p.css("resize")?"none":"horizontal"}),"onpropertychange"in u?"oninput"in u?p.on("input.autosize keyup.autosize",r):p.on("propertychange.autosize",function(){"value"===event.propertyName&&r()}):p.on("input.autosize",r),i.resizeDelay!==!1&&e(window).on("resize.autosize",l),p.on("autosize.resize",r),p.on("autosize.resizeIncludeStyle",function(){t=null,r()}),p.on("autosize.destroy",function(){t=null,clearTimeout(h),e(window).off("resize",l),p.off("autosize").off(".autosize").css(z).removeData("autosize")}),r())})):this}})(jQuery);

$.fn.sshare = function (options) {

	// Prevent binding multiple times.
	if (this.find('.sn-share-btns').length)
		return;

	var defOptions = {
		trigger: 'hover',
		duration: 'fast',
		text: undefined,
		url: 'http://vempraruavem.org',
	};
	// Get options from default < element datset < arguments.
	var options = $.extend($.extend(defOptions, this.data()), options);

	var funcs = {
		twitter: function (e) {
			if (options.text || options.url)
				var url = 'http://twitter.com/share?'+(options.text && '&text='+encodeURIComponent(options.text))||('url='+encodeURIComponent(options.url));
			else throw "No url or text specified";
			window.open(url,'','width=500,height=350,toolbar=0,menubar=0,location=0','modal=yes');
		},
		facebook: function (e) {
			if (options.url)
				var url = 'http://www.facebook.com/sharer.php?u='+encodeURIComponent(options.url);
			else throw "No url or text specified";
			window.open(url,'','width=500,height=350,toolbar=0,menubar=0,location=0','modal=yes');
		},
		gplus: function (e) {
			if (options.url)
				var url = 'https://plusone.google.com/_/+1/confirm?hl=pt&url='+encodeURIComponent(options.url);
			else throw "No url or text specified";
			window.open(url,'','width=500,height=350,toolbar=0,menubar=0,location=0','modal=yes');
		},
	};

	this.addClass('sn-share');
	var html = $('<div class="sn-share-btns"><div class="btn-group"><button class="btn btn-xs btn-info btn-twitter"><i class="fa fa-twitter"></i></button><button class="btn btn-xs btn-info btn-facebook">&nbsp;<i class="fa fa-facebook"></i>&nbsp;</button><button class="btn btn-xs btn-info btn-gplus"><i class="fa fa-google-plus"></i></button></div><div class="arrow"></div></div>');

	html.find('.btn-twitter').click(funcs.twitter);
	html.find('.btn-facebook').click(funcs.facebook);
	html.find('.btn-gplus').click(funcs.gplus);
	html.appendTo(this);

	this.click(function(evt){
		evt.stopPropagation();
		evt.preventDefault();
		return false;
	})

	if (options.now === true) {
		html.fadeIn();
		this.on('click '+(options.trigger === 'hover'?'mouseenter':''), function (e) {
			html.fadeIn(options.duration);
		});
	} else {
		this.on('click '+(options.trigger === 'hover'?'mouseenter':''), function (e) {
			html.fadeIn(options.duration);
		});
	}
	this.on('mouseleave', function (e) {
		html.fadeOut(options.duration);
	});
};

$.fn.xdialog = function (options) {

	if (!this[0]) return;

	var anchor = this[0].hash || '#'+this[0].dataset.hash,
		$dialogEl = $(anchor),
		hideUrl = !!this.data('hide-url');

	this.click(function (evt) {
		evt.preventDefault();
		$dialogEl.addClass('active');
		if (!hideUrl)
			history.pushState({}, '', anchor)
	});

	$dialogEl.find('[data-action=close-dialog]').click(function (evt) {
		evt.preventDefault();
		console.log('clicked');
		$dialogEl.removeClass('active');
		if (!hideUrl)
			location.hash = '';
		return false;
	});
};
	
module.exports = $;
},{"jquery":36}],15:[function(require,module,exports){
/** @jsx React.DOM */

var $ = require('jquery')
var React = require('react')
var _ = require('lodash')

module.exports = React.createClass({displayName: 'exports',
	close: function () {
		this.props.page.destroy();
	},
	componentDidMount: function () {
		// Close when user clicks directly on element (meaning the faded black background)
		var self = this;
		$(this.getDOMNode().parentElement).on('click', function onClickOut (e) {
			if (e.target === this || e.target === self.getDOMNode()) {
				self.close();
				$(this).unbind('click', onClickOut);
			}
		});
	},
	render: function () {
		// <button className='btn-follow' data-action='unfollow'></button>
		var items = _.map(this.props.list, function (person) {
			console.log(person)
			return (
				React.createElement("li", {key: person.id}, 
					React.createElement("a", {href: person.path}, 
						React.createElement("div", {className: "user-avatar"}, 
							React.createElement("div", {className: "avatar", style:  {background: 'url('+person.avatarUrl+')'} })
						), 
						React.createElement("span", {className: "name"}, person.name)
					), 
					
						(!window.user || window.user.id === person.id)?
						null
						:(
							person.meta.followed?
							React.createElement("button", {className: "btn-follow", 'data-action': "unfollow", 'data-user': person.id})
							:React.createElement("button", {className: "btn-follow", 'data-action': "follow", 'data-user': person.id})
						)
					
				)
			);
		});
		if (this.props.isFollowing)
			var label = this.props.profile.name+' segue '+this.props.list.length+' pessoas';
		else
			var label = this.props.list.length+' pessoas seguem '+this.props.profile.name;

		return (
			React.createElement("div", {className: "qi-box white"}, 
				React.createElement("i", {className: "close-btn", onClick: this.close}), 
				React.createElement("label", null, label), 
				React.createElement("div", {className: "list"}, 
					items
				)
			)
		);
	},
});
},{"jquery":36,"lodash":39,"react":45}],16:[function(require,module,exports){
/** @jsx React.DOM */

var React = require('react')
var PostView = require('./postView.jsx')
var ProblemView = require('./problemView.jsx')

module.exports = React.createClass({displayName: 'exports',
	componentWillMount: function () {
		var update = function () {
			this.forceUpdate(function(){});
		}
		this.props.model.on('add reset remove change', update.bind(this));
	},

	close: function () {
		this.props.page.destroy();
	},

	onClickEdit: function () {
		// console.log('clicked')
		// this.props.page.destroy(true);
		// var url = this.props.model.get('path')+'/editar';
		// setTimeout(function () {
		// 	console.log('done')
		// 	app.navigate(url, { trigger: true, change: true });
		// },1);

		// Fuck this shit, this is too complicated.
		// This is necessary for problems (as opposed to just app.navigating to the edit
		// url) because some fields may only be loaded through an ajax call. OK-design?
		window.location.href = this.props.model.get('path')+'/editar';
	},

	onClickTrash: function () {
		if (confirm('Tem certeza que deseja excluir essa postagem?')) {
			this.props.model.destroy();
			this.close();
			// Signal to the wall that the post with this ID must be removed.
			// This isn't automatic (as in deleting comments) because the models on
			// the wall aren't the same as those on post FullPostView.
			console.log('id being removed:',this.props.model.get('id'))
			app.postList.remove({id:this.props.model.get('id')})
			$('.tooltip').remove(); // fuckin bug
		}
	},

	componentDidMount: function () {
		// Close when user clicks directly on element (meaning the faded black background)
		var self = this;
		$(this.getDOMNode().parentElement).on('click', function onClickOut (e) {
			if (e.target === this || e.target === self.getDOMNode()) {
				self.close();
				$(this).unbind('click', onClickOut);
			}
		});
	},

	render: function () {
		var post = this.props.model.attributes,
			author = this.props.model.get('author'),
			type = this.props.type;
		if (type === "Problem") {
			var View = React.createFactory(ProblemView);
		} else {
			var View = React.createFactory(PostView);
		}

		return (
			React.createElement("div", {className: "qi-box", 'data-post-type': this.props.model.get('type'), 'data-post-id': this.props.model.get('id')}, 
				React.createElement("i", {className: "close-btn icon-clear", 'data-action': "close-page", onClick: this.close}), 
				View({model: this.props.model, parent: this})
			)
		);
	},
});
},{"./postView.jsx":23,"./problemView.jsx":25,"react":45}],17:[function(require,module,exports){
/** @jsx React.DOM */

var $ = require('jquery')
var React = require('react')
var _ = require('lodash')

var Dialog = require('./parts/dialog.jsx')

var InterestsBox = React.createClass({displayName: 'InterestsBox',
	close: function () {
		this.props.page.destroy();
	},
	getInitialState: function () {
		return { interests: window.user.preferences.interests };
	},
	componentDidMount: function () {
		// Close when user clicks directly on element (meaning the faded black background)
		var self = this;
		$(this.getDOMNode().parentElement).on('click', function onClickOut (e) {
			if (e.target === this || e.target === self.getDOMNode()) {
				self.close();
				$(this).unbind('click', onClickOut);
			}
		});
		$(this.getDOMNode()).on('click', 'button[data-page]', function (evt) {
			self.selectInterest(this.dataset.page);
		});
	},
	selectInterest: function (key) {
		$.ajax({
			type: 'put',
			dataType: 'json',
			url: '/api/me/interests/toggle',
			data: { item: key }
		}).done(function (response) {
			if (response.error) {
				app.flash.alert("Puts.");
			} else {
				// $(self.getDOMNode()).find('[data-page="'+key+'"]')[0].dataset.action = select?"unfollow":"follow";
				window.user.preferences.interests = response.data;
				this.setState({ interests: response.data });
				app.flash.info("<i class='icon-tick'></i>");
			}
		}.bind(this)).fail(function (xhr) {
			app.flash.warn(xhr.responseJSON && xhr.responseJSON.message || "Erro.");
		}.bind(this));
	},
	render: function () {
		var self = this;
		if (!window.user)
			return null;

		var items = _.map(pageMap, function (page, key) {
			var pageFollowed = this.state.interests.indexOf(key) != -1;
			function toggleMe () {
				self.selectInterest(key, !pageFollowed);
			}
			return (
				React.createElement("li", {key: key, 'data-tag': key}, 
					React.createElement("a", {href: page.path}, 
						React.createElement("div", {className: "item"}, 
							React.createElement("i", {className: "circle tag-bg", 'data-tag': key}), 
							React.createElement("span", {className: "name"}, page.name)
						)
					), 
					
						pageFollowed?
						React.createElement("button", {className: "btn-follow", 'data-action': "unfollow", 'data-page': key})
						:React.createElement("button", {className: "btn-follow", 'data-action': "follow", 'data-page': key})
					
				)
			);
		}.bind(this));

		return (
			React.createElement("div", null, 
				React.createElement("label", null, "Selecione os seus interesses"), 
				React.createElement("div", {className: "list"}, 
					items
				)
			)
		);
	},
});


module.exports = function (data, onRender) {
	Dialog(
		InterestsBox(data),
		"interests-dialog",
		function (elm, component) {
			onRender && onRender.call(this, elm, component);
		}
	);
};

},{"./parts/dialog.jsx":19,"jquery":36,"lodash":39,"react":45}],18:[function(require,module,exports){
/** @jsx React.DOM */

var $ = require('jquery')
var _ = require('lodash')
var React = require('react')
require('jquery-textcomplete')
require('jquery-overlay')

var Models = require('../../components/models.js')

var CommentInput = React.createClass({displayName: 'CommentInput',

	getInitialState: function () {
		return { hasFocus: false };
	},

	componentDidMount: function () {
		var self = this;
		_.defer(function () {
			this.refs.input && $(this.refs.input.getDOMNode()).autosize({ append: false });
		}.bind(this));
		var mentions = _.filter(_.map(this.props.post.get('participations'), function (a) {
			return a.user.username;
		}), function (i) {
			return !!i && i !== window.user.username;
		});
		$(this.refs.input.getDOMNode()).textcomplete([{
				mentions: mentions,
				match: /\B@(\w*)$/,
				search: function (term, callback) {
						callback($.map(this.mentions, function (mention) {
								return mention.indexOf(term) === 0 ? mention : null;
						}));
				},
				index: 1,
				replace: function (mention) {
						return '@' + mention + ' ';
				}
		}
		], { appendTo: 'body' }).overlay([
				{
						match: /\B@\w+/g,
						css: {
								'background-color': '#d8dfea'
						}
				}
		]);
	},

	componentDidUpdate: function () {
		var self = this;
		$(this.refs.input.getDOMNode()).keyup(function(e) {
			if (e.keyCode == 27) { // ESC
				self.setState({ hasFocus: false });
				$(self.refs.input.getDOMNode()).blur();
				e.preventDefault();
			}
		});

		if (this.state.hasFocus) {
			setTimeout(function() {
				// console.log($(self.refs.input.getDOMNode()).css('background', '#eee'))
			}, 1000)
		}
	},

	handleSubmit: function (evt) {
		evt.preventDefault();

		var bodyEl = $(this.refs.input.getDOMNode());
		var self = this;

		var data = {
			content: { body: bodyEl.val() },
			replies_to: this.props.replies_to && this.props.replies_to.get('id')
		}

		$.ajax({
			type: 'post',
			dataType: 'json',
			url: this.props.post.get('apiPath')+'/comments',
			timeout: 8000,
			data: data
		}).done(function (response) {
			if (response.error) {
				app.flash.alert(response.message || 'Erro!');
			} else {
				self.setState({ hasFocus: false });
				bodyEl.val('');
				var item = new Models.commentItem(response.data);
				self.props.post.comments.add(item);
				if (self.props.on_reply)
					self.props.on_reply(item);
			}
		}).fail(function (xhr, textStatus) {
			if (xhr.responseJSON && xhr.responseJSON.message)
				app.flash.alert(xhr.responseJSON.message);
			else if (textStatus === 'timeout')
				app.flash.alert("Falha de comunicação com o servidor.");
			else
				app.flash.alert("Erro.");
		});
	},

	showMarkdownHelp: function () {
		Dialog.MarkdownDialog({
		});
	},

	focus: function () {
		this.setState({ hasFocus: true});
	},

	handleCancel: function() {
		if (this.props.replies_to) {
			this.props.cancel();
		} else {
			this.setState({ hasFocus: false });
		}
	},

	render: function () {
		var placeholder = "Participar da discussão.";
		if (this.props.replies_to) {
			placeholder = "Uma mensagem para "+this.props.replies_to.get('author').name+'...';
		}

		var text = '';
		if (this.props.nested) {
			text = '@'+this.props.replies_to.get('author').username+' ';
		} else {
			text = '';
		}

		return (
			React.createElement("div", {className: "comment-input"}, 
				React.createElement("div", {className: "comment-wrapper"}, 
					React.createElement("div", {className: "avatar-col"}, 
						React.createElement("div", {className: "user-avatar"}, 
							React.createElement("div", {className: "avatar", style: {background: 'url('+window.user.avatarUrl+')'}}
							)
						)
					), 
					React.createElement("div", {className: "content-col input"}, 
						React.createElement("textarea", {style: {height: (this.props.replies_to?'61px':'42px')}, defaultValue: text, onFocus: this.focus, required: "required", ref: "input", type: "text", 
							placeholder: placeholder}), 
						(this.state.hasFocus || this.props.replies_to)?(
							React.createElement("div", {className: "toolbar-editing"}, 
								React.createElement("ul", {className: "right"}, 
									React.createElement("li", null, 
										React.createElement("button", {className: "undo", onClick: this.handleCancel}, "Cancelar")
									), 
									React.createElement("li", null, 
										React.createElement("button", {className: "save", onClick: this.handleSubmit}, "Enviar")
									)
								)
							)
						):null
					)
				)
			)
		);
							// <div className="detail">
							// 	Você pode formatar o seu texto. <a href="#" tabIndex="-1" onClick={this.showMarkdownHelp}>Saiba como aqui.</a>
							// </div>
	},
});

var Comment = React.createClass({displayName: 'Comment',
	getInitialState: function () {
		return { replying: false, editing: false, hideChildren: false };
	},

	componentWillMount: function () {
		var update = function () {
			this.forceUpdate(function(){});
		}
		this.props.model.on('add reset remove change', update.bind(this));
	},

	componentDidMount: function () {
		if (window.user && this.props.model.get('author').id === window.user.id) {
		} else {
			this.editor = null;
		}
	},

	componentWillUnmount: function () {
	},

	componentDidUpdate: function () {
		if (!this.state.isEditing) {
		} else {
		}
	},

	toggleShowChildren: function () {
		this.setState({ hideChildren: !this.state.hideChildren });
	},

	// Replying

	reply: function () {
		this.setState({ replying: true, hideChildren: false });
	},

	onReplied: function () {
		this.setState({ replying: false });
	},

	// Editing

	edit: function () {
		$('.tooltip').remove();
		this.setState({ editing: true });
	},

	onClickSave: function () {
		if (!this.state.editing || !this.refs)
			return;

		var self = this;

		this.props.model.save({
			content: {
				body: this.refs.textarea.getDOMNode().value,
			},
		}, {
			success: function () {
				self.setState({ editing: false });
				self.forceUpdate();
			}
		});
	},

	onCancelEdit: function () {
		if (!this.editor)
			return;
		this.setState({ editing: false });
	},

	onClickTrash: function () {
		if (confirm('Tem certeza que quer excluir permanentemente essa publicação?')) {
			this.props.model.destroy({
				success: function (model, response, options) {
				},
				error: function (model, response, options) {
					// if (xhr.responseJSON && xhr.responseJSON.message)
					// 	app.flash.alert(xhr.responseJSON.message);
					if (response.responseJSON && response.responseJSON.message) {
						app.flash.alert(response.responseJSON.message);
					} else {
						if (response.textStatus === 'timeout')
							app.flash.alert("Falha de comunicação com o servidor.");
						else if (response.status === 429)
							app.flash.alert("Excesso de requisições. Espere alguns segundos.")
						else
							app.flash.alert("Erro.");
					}
				}
			});
		}
	},

	//

	render: function () {
		var doc = this.props.model.attributes;
		var authorIsDiscussionAuthor = this.props.post.get('author').id === doc.author.id;
		var childrenCount = this.props.children && this.props.children.length || 0;

		if (this.state.editing) {
			var Line = (
				React.createElement("div", {className: "comment-wrapper"}, 
					React.createElement("div", {className: "avatar-col", title: doc.author.username}, 
					React.createElement("a", {href: doc.author.path}, 
						React.createElement("div", {className: "user-avatar"}, 
							React.createElement("div", {className: "avatar", style: {background: 'url('+doc.author.avatarUrl+')'}}
							)
						)
					)
					), 
					React.createElement("div", {className: "content-col input"}, 
						React.createElement("textarea", {ref: "textarea", defaultValue:  doc.content.body}), 
						React.createElement("div", {className: "editing-toolbar"}, 
							React.createElement("button", {className: "control save", onClick: this.onClickSave}, 
								"Salvar"
							), 
							React.createElement("button", {className: "control delete", onClick: this.onClickTrash}, 
								"Excluir"
							)
						)
					)
				)
			);
		} else {
			var Line = (
				React.createElement("div", {className: "comment-wrapper"}, 
					React.createElement("div", {className: "avatar-col", title: doc.author.username}, 
						React.createElement("a", {href: doc.author.path}, 
							React.createElement("div", {className: "user-avatar"}, 
								React.createElement("div", {className: "avatar", style: {background: 'url('+doc.author.avatarUrl+')'}}
								)
							)
						)
					), 
					React.createElement("div", {className: "content-col"}, 
						React.createElement("span", {className: "top"}, 
							React.createElement("a", {className: "name", href: doc.author.path}, 
								doc.author.name
							), 
							authorIsDiscussionAuthor?(React.createElement("span", {className: "label"}, "autor")):null, 
							React.createElement("time", {'data-short': "false", 'data-time-count': 1*new Date(doc.created_at), title: formatFullDate(new Date(doc.created_at))}, 
								window.calcTimeFrom(doc.created_at, false)
							)
						), 
						React.createElement("div", {className: "body"}, 
							React.createElement("span", {dangerouslySetInnerHTML: {__html: doc.content.body}})
						), 
						React.createElement("div", {className: "toolbar"}, 
							React.createElement("li", {className: "votes"}, 
								React.createElement("span", {className: "count", title: "Votos"}, 
									doc.counts.votes
								), 
								React.createElement("button", {className: "up", 
								onClick: this.props.model.toggleVote.bind(this.props.model), 
								'data-voted': this.props.model.liked?"true":"", 
								disabled: this.props.model.userIsAuthor, 
								title: "Votar"}, 
									React.createElement("i", {className: "icon-thumb-up"})
								)
							), 
							React.createElement("li", {className: "separator"}, 
								React.createElement("i", {className: "icon-dot"})
							), 
							React.createElement("li", {className: "reply"}, 
								React.createElement("button", {onClick: this.reply, title: "Responder"}, 
									"Responder ", doc.counts.children?'('+doc.counts.children+')':null
								)
							), 
							
								this.props.model.userIsAuthor?
								React.createElement("li", {className: "separator"}, 
									React.createElement("i", {className: "icon-dot"})
								)
								:null, 
							
							
								this.props.model.userIsAuthor?
								React.createElement("li", {className: "edit"}, 
									React.createElement("button", {className: "edit", title: "Editar", onClick: this.edit}, 
										"Editar"
									)
								)
								:null
							
						)
					)
				)
			)
		}

		if (this.state.replying && window.user) {
			var self = this;
			var commentInput = (
				React.createElement(CommentInput, {
					nested: this.props.nested, 
					post: this.props.post, 
					replies_to: this.props.model, 
					cancel: function () { self.setState( { replying: false }) }, 
					on_reply: this.onReplied})
			);
		}

		if (childrenCount) {
			// var faces = _.map(this.props.children,
			// 	function (i) { return i.attributes.author.avatarUrl });
			// var ufaces = _.unique(faces);
			// var avatars = _.map(ufaces.slice(0,4), function (img) {
			// 		return (
			// 			<div className="user-avatar" key={img}>
			// 				<div className="avatar" style={{ backgroundImage: 'url('+img+')'}}>
			// 				</div>
			// 			</div>
			// 		);
			// 	}.bind(this));
							// <div className="right">
							// 	<i className="icon-ellipsis"></i> {avatars}
							// </div>
			if (this.state.hideChildren) {
				var Children = (
					React.createElement("div", {className: "children "+(this.state.hideChildren?"show":null)}, 
						React.createElement("div", {className: "children-info", onClick: this.toggleShowChildren}, 
							React.createElement("div", {className: "detail"}, 
								"Mostrar ", childrenCount, " resposta", childrenCount==1?'':'s', " ", React.createElement("i", {className: "icon-keyboard-arrow-down"})
							)
						), 
						commentInput, 
						React.createElement("ul", {className: "nodes"})
					)
				);
			} else {
				var childrenNotes = _.map(this.props.children || [], function (comment) {
					return (
						React.createElement(Comment, {model: comment, nested: true, key: comment.id, post: this.props.post})
					);
				}.bind(this));
				var Children = (
					React.createElement("ul", {className: "children"}, 
						React.createElement("div", {className: "children-info", onClick: this.toggleShowChildren}, 
							React.createElement("div", {className: "detail"}, 
								"Esconder ", childrenCount, " resposta", childrenCount==1?'':'s', ". ", React.createElement("i", {className: "icon-keyboard-arrow-up"})
							)
						), 
						childrenNotes, 
						commentInput
					)
				);
			}
		} else if (this.state.replying) {
			var Children = (
				React.createElement("div", {className: "children"}, 
					commentInput
				)
			);
		}

		return (
			React.createElement("div", {className: "exchange "+(this.state.editing?" editing":"")}, 
				Line, 
				Children
			)
		);
	},
});

module.exports = React.createClass({displayName: 'exports',
	getInitialState: function () {
		return { replying: false }
	},

	componentWillMount: function () {
		var update = function () {
			this.forceUpdate(function(){});
		}
		this.props.collection.on('add reset change remove', update.bind(this));
	},
	componentDidMount: function () {
		this.props.collection.trigger('mount');
		app.utils.refreshLatex();
		this.props.post.on('change:_meta', function () {
			console.log('meta changed')
			if (this.props.post.hasChanged('_meta')) {
				// Watching may have changed. Update.
				this.forceUpdate();
			}
		}.bind(this));
	},

	componentDidUpdate: function () {
		this.props.collection.trigger('update');
		app.utils.refreshLatex();
	},

	onClickReply: function () {
		this.setState({ replying: true })
	},

	render: function () {
		var levels = this.props.collection.groupBy(function (e) {
			return e.get('thread_root') || null;
		});

		// Get nodes that have no thread_roots.
		var exchangeNodes = _.map(levels[null], function (comment) {
			return (
				React.createElement(Comment, {model: comment, key: comment.id, post: this.props.post, nested: false}, 
					levels[comment.id]
				)
			);
		}.bind(this));

		return (
			React.createElement("div", {className: "comment-section"}, 
				React.createElement("div", {className: "comment-section-header"}, 
					React.createElement("label", null, 
						this.props.collection.models.length, " Comentário", this.props.collection.models.length>1?"s":""
					), 
					React.createElement("ul", null, 
						
							this.props.post.watching?
							React.createElement("button", {className: "follow active", onClick: this.props.post.toggleWatching, 
								'data-toggle': "tooltip", 'data-placement': "bottom", 'data-container': "bodY", 
								title: "Receber notificações quando essa discussão por atualizada."}, 
								React.createElement("i", {className: "icon-sound"}), " Seguindo"
							)
							:React.createElement("button", {className: "follow", onClick: this.toggleWatch, 
								'data-toggle': "tooltip", 'data-placement': "bottom", 'data-container': "bodY", 
								title: "Receber notificações quando essa discussão por atualizada."}, 
								React.createElement("i", {className: "icon-soundoff"}), " Seguir"
							)
						
					)
				), 
				
					window.user?
					React.createElement(CommentInput, {post: this.props.post})
					:null, 
				
				React.createElement("div", {className: "comment-section-list"}, 
					exchangeNodes
				)
			)
		);
		// <button className="reply" onClick={this.onClickReply}
		// 	data-toggle="tooltip" data-placement="bottom" data-container="bodY"
		// 	title="Participar dessa discussão.">
		// 	<i className="icon-arrow-back-outline"></i> Responder
		// </button>
	},
});
},{"../../components/models.js":6,"jquery":36,"jquery-overlay":37,"jquery-textcomplete":38,"lodash":39,"react":45}],19:[function(require,module,exports){
/** @jsx React.DOM */

var $ = require('jquery')
var _ = require('lodash')
window.React = require('react')

var Box = React.createClass({displayName: 'Box',
	close: function () {
		this.props.onClose();
	},
	render: function () {
		return (
			React.createElement("div", null, 
				React.createElement("div", {className: "dialog-blackout", onClick: this.close, 'data-action': "close-dialog"}), 
				React.createElement("div", {className: "dialog-box"}, 
					React.createElement("i", {className: "close-btn", onClick: this.close, 'data-action': "close-dialog"}), 
					this.props.children
				)
			)
		);
	}
});

var Dialog = module.exports = function (component, className, onRender) {
	var $el = $('<div class="dialog">').appendTo("body");
	if (className) {
		$el.addClass(className);
	}
	function onClose () {
		$el.fadeOut();
		React.unmountComponentAtNode($el[0]);
	}
	var c = React.render(React.createElement(Box, {onClose: onClose}, component), $el[0],
		function () {
			// Defer execution, so variable c is set.
			setTimeout(function () {
				$el.fadeIn();
				onRender && onRender($el[0], c);
			}, 10);
		});
}

var Share = React.createClass({displayName: 'Share',
	onClickBlackout: function () {
		$(this).fadeOut();
	},
	render: function () {
		var urls = {
			facebook: 'http://www.facebook.com/sharer.php?u='+encodeURIComponent(this.props.url)+
				'&ref=fbshare&t='+encodeURIComponent(this.props.title),
			gplus: 'https://plus.google.com/share?url='+encodeURIComponent(this.props.url),
			twitter: 'http://twitter.com/share?url='+encodeURIComponent(this.props.url)+
				'&ref=twitbtn&via=qilabsorg&text='+encodeURIComponent(this.props.title),
		}

		function genOnClick(url) {
			return function () {
				window.open(url,"mywindow","menubar=1,resizable=1,width=500,height=500");
			};
		}

		return (
			React.createElement("div", null, 
				React.createElement("label", null, this.props.message), 
				React.createElement("input", {type: "text", name: "url", readOnly: true, value: this.props.url}), 
				React.createElement("div", {className: "share-icons"}, 
					React.createElement("button", {className: "share-gp", onClick: genOnClick(urls.gplus), 
						title: "Compartilhe essa questão no Google+"}, 
						React.createElement("i", {className: "icon-google-plus-square"}), " Google+"
					), 
					React.createElement("button", {className: "share-fb", onClick: genOnClick(urls.facebook), 
						title: "Compartilhe essa questão no Facebook"}, 
						React.createElement("i", {className: "icon-facebook-square"}), " Facebook"
					), 
					React.createElement("button", {className: "share-tw", onClick: genOnClick(urls.twitter), 
						title: "Compartilhe essa questão no Twitter"}, 
						React.createElement("i", {className: "icon-twitter-square"}), " Twitter"
					)
				)
			)
		);
	},
});

var Markdown = React.createClass({displayName: 'Markdown',
	onClickBlackout: function () {
		$(this).fadeOut();
	},
	render: function () {
		return (
			React.createElement("div", null, 
				React.createElement("label", null, "Como usar Markdown"), 
				React.createElement("p", null, 
					"Markdown é um conjunto de códigos para formatar o seu código."
				), 
				React.createElement("table", {className: "table table-bordered"}, 
					React.createElement("thead", null, 
						React.createElement("tr", null, 
							React.createElement("th", null, "Resultado"), 
							React.createElement("th", null, "Markdown")
						)
					), 
					React.createElement("tr", null, 
						React.createElement("td", null, React.createElement("strong", null, "negrito")), 
						React.createElement("td", null, "**negrito**")
					), 
					React.createElement("tr", null, 
						React.createElement("td", null, React.createElement("a", {href: "#"}, "link")), 
						React.createElement("td", null, "[link](http://)")
					), 
					React.createElement("tr", null, 
						React.createElement("td", null, React.createElement("del", null, "Riscado")), 
						React.createElement("td", null, "~~Riscado~~")
					)
				)
			)
		);
	},
});

var PostEditHelp = React.createClass({displayName: 'PostEditHelp',
	onClickBlackout: function () {
		$(this).fadeOut();
	},
	render: function () {
		return (
			React.createElement("div", null, 
				"Para formatar o seu post, selecione a parte que você deseja formatar e seja feliz."
			)
		);
	},
});

module.exports.PostEditHelpDialog = function (data, onRender) {
	Dialog(
		PostEditHelp(data),
		"postedithelp-dialog",
		function (elm, component) {
			onRender && onRender.call(this, elm, component);
		}
	);
};

module.exports.ShareDialog = function (data, onRender) {
	Dialog(
		Share(data),
		"share-dialog",
		function (elm, component) {
			$(component.getDOMNode()).find('input').focus();
			onRender && onRender.call(this, elm, component);
		}
	);
};

module.exports.MarkdownDialog = function (data, onRender) {
	Dialog(
		Markdown(data),
		"markdown-dialog",
		function (elm, component) {
			onRender && onRender.call(this, elm, component);
		}
	);
};
},{"jquery":36,"lodash":39,"react":45}],20:[function(require,module,exports){
/** @jsx React.DOM */

var $ = require('jquery')
var _ = require('lodash')
var React = require('react')
var selectize = require('selectize')

module.exports = React.createClass({displayName: 'exports',
	getInitialState: function () {
		if (this.props.lab) {
			if (this.props.lab in this.props.pool) {
				return {
					disabled: false,
					placeholder: 'Tags relacionadas a '+this.props.pool[this.props.lab].name,
				};
			} else {
				console.warn('Invalid lab '+this.props.lab);
			}
		}
		return {
			disabled: true,
			placeholder: 'Selecione primeiro uma página para postar.',
		};
	},

	getValue: function () {
		return this.refs.select.getDOMNode().selectize.getValue();
	},

	changeLab: function (lab) {
		this.props.lab = lab;
		var selectize = this.refs.select.getDOMNode().selectize;
		selectize.clearOptions();
		var tags;
		if ((tags = this.getSubtags()) && tags.length) {
			for (var i=0; i<tags.length; ++i) {
				selectize.addOption(tags[i]);
			}
		}
		selectize.clear();
		selectize.refreshOptions(false);
		console.log(this.props.pool, lab)
		$(this.getDOMNode()).find('.selectize-input input').attr('placeholder',
			'Tags relacionadas a '+this.props.pool[lab].name );
	},

	getSubtags: function () {
		var lab = this.props.lab;
		if (lab && this.props.pool[lab]) {
			var tags = _.clone(this.props.pool[lab].children || {});
			for (var child in tags)
			if (tags.hasOwnProperty(child)) {
				tags[child].value = child;
			}
			return _.toArray(tags);
		}
		return null;
	},

	componentDidMount: function () {
		var options = this.getSubtags();

		if (options === null) {
			this.setState({ disabled: true });
			options = [];
		}

		$(this.refs.select.getDOMNode()).selectize({
			maxItems: 5,
			multiple: true,
			labelField: 'name',
			searchField: 'name',
			options: options,
			items: this.props.children || [],
			render: {
				option: function (item, escape) {
					if (item.description)
						return '<div><strong>'+item.name+'</strong><p>'+item.description+'</p></div>'
					return '<div><strong>'+item.name+'</strong></div>';
				}
			}
		});

		if (this.props.lab)
			this.changeLab(this.props.lab);
	},

	render: function () {
		return (
			React.createElement("div", {className: "tag-box"}, 
				React.createElement("i", {className: "etiqueta icon-tag3"}), 
				React.createElement("select", {ref: "select", disabled: this.state.disabled, name: "state[]", multiple: true}, 
					React.createElement("option", {ref: "Placeholder", value: ""}, this.state.placeholder)
				)
			)
		);
	},
});

},{"jquery":36,"lodash":39,"react":45,"selectize":46}],21:[function(require,module,exports){
/** @jsx React.DOM */

var React = require('react')

function GenerateBtn (className, icon, title) {
	return React.createClass({
		onClick: function () {
			if (this.props.cb) {
				this.props.cb()
			} else {
				$('#srry').fadeIn()
			}
		},
		render: function () {
			return (
				React.createElement("div", {className: 'item '+className+(this.props.active?' active ':''), onClick: this.onClick, 
					'data-toggle': "tooltip", title: title, 'data-placement': "right"}, 
					React.createElement("i", {className: icon}), React.createElement("span", {className: "text"}, this.props.text)
				)
			)
		}
	});
}

module.exports = {
	EditBtn: GenerateBtn('edit', 'icon-edit', 'Editar'),
	FlagBtn: GenerateBtn('flag', 'icon-flag2', 'Sinalizar publicação'),
	LikeBtn: GenerateBtn('like', 'icon-favorite', ''),
	HelpBtn: GenerateBtn('help', 'icon-help', 'Ajuda?'),
	SendBtn: GenerateBtn('send', 'icon-send-o', 'Salvar'),
	ShareBtn: GenerateBtn('share', 'icon-share', 'Compartilhar'),
	RemoveBtn: GenerateBtn('remove', 'icon-delete2', 'Excluir'),
	CancelPostBtn: GenerateBtn('cancel-post', 'icon-delete2', 'Cancelar'),
	PreviewBtn: GenerateBtn('preview', 'icon-search2', 'Preview'),
}
},{"react":45}],22:[function(require,module,exports){
/** @jsx React.DOM */

var $ = require('jquery')
var _ = require('lodash')
var React = require('react')

var models = require('../components/models.js')
var TagBox = require('./parts/tagBox.jsx')
var Toolbar = require('./parts/toolbar.jsx')
var Modal = require('./parts/dialog.jsx')
var marked = require('marked');

marked.setOptions({
	renderer: renderer,
	gfm: false,
	tables: false,
	breaks: false,
	pedantic: false,
	sanitize: true,
	smartLists: true,
	smartypants: true,
})

require('pagedown-editor')

var renderer = new marked.Renderer();
renderer.codespan = function (html) { // Ignore codespans in md (they're actually 'latex')
	return '`'+html+'`';
}

function refreshLatex () {
	setTimeout(function () {
		if (window.MathJax)
			MathJax.Hub.Queue(["Typeset",MathJax.Hub]);
		else
			console.warn("MathJax object not found.");
	}, 10);
}

window.S3Upload = (function() {

	S3Upload.prototype.s3_object_name = 'default_name';

	S3Upload.prototype.s3_sign_put_url = '/signS3put';

	S3Upload.prototype.file_dom_selector = 'file_upload';

	S3Upload.prototype.onFinishS3Put = function(public_url) {
		return console.log('base.onFinishS3Put()', public_url);
	};

	S3Upload.prototype.onProgress = function(percent, status) {
		return console.log('base.onProgress()', percent, status);
	};

	S3Upload.prototype.onError = function(status) {
		return console.log('base.onError()', status);
	};

	function S3Upload(files, options) {
		if (options == null) options = {};
		for (option in options) {
			this[option] = options[option];
		}
		// this.handleFileSelect(document.getElementById(this.file_dom_selector));
		this.handleFileSelect(files);
	}

	S3Upload.prototype.handleFileSelect = function(files) {
		var f, files, output, _i, _len, _results;
		this.onProgress(0, 'Upload started.');
		// files = file_element.files;
		output = [];
		_results = [];
		for (_i = 0, _len = files.length; _i < _len; _i++) {
			f = files[_i];
			_results.push(this.uploadFile(f));
		}
		return _results;
	};

	S3Upload.prototype.createCORSRequest = function(method, url) {
		var xhr;
		xhr = new XMLHttpRequest();
		if (xhr.withCredentials != null) {
			xhr.open(method, url, true);
		} else if (typeof XDomainRequest !== "undefined") {
			xhr = new XDomainRequest();
			xhr.open(method, url);
		} else {
			xhr = null;
		}
		return xhr;
	};

	S3Upload.prototype.executeOnSignedUrl = function(file, callback) {
		var this_s3upload, xhr;
		this_s3upload = this;
		xhr = new XMLHttpRequest();
		xhr.open('GET', this.s3_sign_put_url + '?s3_object_type=' + file.type + '&s3_object_name=' + this.s3_object_name, true);
		xhr.overrideMimeType('text/plain; charset=x-user-defined');
		xhr.onreadystatechange = function(e) {
			var result;
			if (this.readyState === 4 && this.status === 200) {
				try {
					result = JSON.parse(this.responseText);
				} catch (error) {
					this_s3upload.onError('Signing server returned some ugly/empty JSON: "' + this.responseText + '"');
					return false;
				}
				return callback(decodeURIComponent(result.signed_request), result.url);
			} else if (this.readyState === 4 && this.status !== 200) {
				return this_s3upload.onError('Could not contact request signing server. Status = ' + this.status);
			}
		};
		return xhr.send();
	};

	S3Upload.prototype.uploadToS3 = function(file, url, public_url) {
		var this_s3upload, xhr;
		this_s3upload = this;
		console.log('you say', arguments)
		xhr = this.createCORSRequest('PUT', url);
		if (!xhr) {
			this.onError('CORS not supported');
		} else {
			xhr.onload = function() {
				if (xhr.status === 200) {
					this_s3upload.onProgress(100, 'Upload completed.');
					return this_s3upload.onFinishS3Put(public_url);
				} else {
					return this_s3upload.onError('Upload error: ' + xhr.status);
				}
			};
			xhr.onerror = function() {
				return this_s3upload.onError('XHR error.');
			};
			xhr.upload.onprogress = function(e) {
				var percentLoaded;
				if (e.lengthComputable) {
					percentLoaded = Math.round((e.loaded / e.total) * 100);
					return this_s3upload.onProgress(percentLoaded, percentLoaded === 100 ? 'Finalizing.' : 'Uploading.');
				}
			};
		}
		xhr.setRequestHeader('Content-Type', file.type);
		xhr.setRequestHeader('x-amz-acl', 'public-read');
		return xhr.send(file);
	};

	S3Upload.prototype.uploadFile = function(file) {
		var this_s3upload;
		this_s3upload = this;
		return this.executeOnSignedUrl(file, function(signedURL, publicURL) {
			return this_s3upload.uploadToS3(file, signedURL, publicURL);
		});
	};

	return S3Upload;

})();

function s3_upload(){
  var status_elem = document.getElementById("status");
  var url_elem = document.getElementById("avatar_url");
  var preview_elem = document.getElementById("preview");
  var s3upload = new S3Upload({
    file_dom_selector: 'files',
    s3_sign_put_url: '/api/posts/sign_img_s3',
    onProgress: function(percent, message) {
        status_elem.innerHTML = 'Upload progress: ' + percent + '% ' + message;
    },
    onFinishS3Put: function(public_url) {
        status_elem.innerHTML = 'Upload completed. Uploaded to: '+ public_url;
        url_elem.value = public_url;
        preview_elem.innerHTML = '<img src="'+public_url+'" style="width:300px;" />';
    },
    onError: function(status) {
        status_elem.innerHTML = 'Upload error: ' + status;
    }
  });
}

//

var ImagesDisplay = React.createClass({displayName: 'ImagesDisplay',
	render: function () {
		var images = _.map(this.props.children, function (url) {
			var removeImage = function () {
				if (confirm('Deseja remover essa imagem da publicação?')) {
					var all = this.props.children.slice();
					all.splice(all.indexOf(url),1);
					this.props.update(all);
				}
			}.bind(this)
			var openImage = function (e) {
				if (e.target.localName !== 'i') {
					console.log(arguments)
					window.open(url);
				}
			}
			return (
				React.createElement("li", {key: url, onClick: openImage}, 
					React.createElement("div", {className: "background", style: {backgroundImage: 'url('+url+')'}}
					), 
					React.createElement("div", {className: "backdrop"}), 
					React.createElement("i", {className: "close-btn icon-clear", onClick: removeImage})
				)
			);
		}.bind(this));
		return (
			React.createElement("div", {className: "images-display"}, 
				images
			)
		);
	}
})

var PostEdit = React.createClass({displayName: 'PostEdit',
	getInitialState: function () {
		return {
			preview: null,
			showHelpNote: false,
			uploaded: this.props.model.get('content').images || [],
		};
	},
	componentDidMount: function () {
		var self = this;
		// Close when user clicks directly on element (meaning the faded black background)
		$(this.getDOMNode().parentElement).on('click', function onClickOut (e) {
			if (e.target === this || e.target === self.getDOMNode()) {
				self.close();
				$(this).unbind('click', onClickOut);
			}
		});
		$('body').addClass('crop');

		var postBody = this.refs.postBody.getDOMNode(),
				postTitle = this.refs.postTitle.getDOMNode();

		var converter = {
			makeHtml: function (txt) {
				return marked(txt);
			}
		}

		this.pdeditor = new Markdown.Editor(converter);
		this.pdeditor.run();

		var me = this.getDOMNode()
		function undrag () {
			// $(this.getDOMNode()).removeClass('dragging');
		}

		function dragnothing (e) {
			// $(this.getDOMNode()).addClass('dragging');
			e.stopPropagation();
		  e.preventDefault();
		}

		var self = this;

		function drop(e) {
		  e.stopPropagation();
		  e.preventDefault();

		  if (self.state.uploaded.length >= 3)
		  	return;

		  var dt = e.dataTransfer;
		  var files = dt.files;
		  console.log('files', files)
			var s3upload = new S3Upload(files, {
				file_dom_selector: 'files',
				s3_sign_put_url: '/api/posts/sign_img_s3',
				onProgress: function(percent, message) {
					app.flash.info('Upload progress: ' + percent + '% ' + message);
				},
				onFinishS3Put: function(public_url) {
					app.flash.info('Upload completed. Uploaded to: '+ public_url);
					// url_elem.value = public_url;
					// preview_elem.innerHTML = '<img src="'+public_url+'" style="width:300px;" />';
					self.setState({ uploaded: self.state.uploaded.concat(public_url) })
				},
				onError: function(status) {
					app.flash.info('Upload error: ' + status);
				}
			});
		}

		me.addEventListener("dragenter", dragnothing.bind(this), false);
		me.addEventListener("dragover", dragnothing.bind(this), false);
		me.addEventListener("dragleave", undrag.bind(this), false);
		me.addEventListener("drop", drop.bind(this), false);

		$(this.getDOMNode()).find('.wmd-help-button').click(function () {
			this.onClickHelp();
		}.bind(this))

		// $(self.refs.postBodyWrapper.getDOMNode()).on('click', function (e) {
		// 	if (e.target == self.refs.postBodyWrapper.getDOMNode()) {
		// 		$(self.refs.postBody.getDOMNode()).focus();
		// 	}
		// });

		if (this.refs.postLink) {
			var postLink = this.refs.postLink.getDOMNode();
			// $(postLink).on('input keyup keypress', function (e) {
			// 	if ((e.keyCode || e.charCode) == 13) {
			// 		e.preventDefault();
			// 		e.stopPropagation();
			// 		return;
			// 	}
			// }.bind(this));
			// _.defer(function () {
			// 	$(postLink).autosize();
			// });
		}

		$(postTitle).on('input keyup keypress', function (e) {
			if ((e.keyCode || e.charCode) == 13) {
				e.preventDefault();
				e.stopPropagation();
				return;
			}
		}.bind(this));

		_.defer(function () {
			$(postTitle).autosize();
			$(postBody).autosize();
		});
	},

	componentWillUnmount: function () {
		// Destroy this.editor and unbind autosize.
		// this.editor.deactivate();
		// $(this.editor.anchorPreview).remove();
		// $(this.editor.toolbar).remove();
		$(this.refs.postTitle.getDOMNode()).trigger('autosize.destroy');
		$('body').removeClass('crop');
	},

	//
	send: function () {
		if (this.props.isNew) {
			this.props.model.attributes.lab = this.refs.labSelect.getDOMNode().value;
			this.props.model.attributes.content.link = this.state.preview && this.state.preview.url;
		}
		this.props.model.attributes.tags = this.refs.tagBox.getValue();
		this.props.model.attributes.content.body = this.refs.postBody.getDOMNode().value;
		this.props.model.attributes.content.title = this.refs.postTitle.getDOMNode().value;
		this.props.model.attributes.content.images = this.state.uploaded;

		this.props.model.save(undefined, {
			url: this.props.model.url() || '/api/posts',
			success: function (model, response) {
				app.flash.info("Publicação salva :)");
				window.location.href = model.get('path');
			},
			error: function (model, xhr, options) {
				var data = xhr.responseJSON;
				if (data && data.message) {
					app.flash.alert(data.message);
				} else {
					app.flash.alert('Milton Friedman.');
				}
			}
		});
	},
	delete: function () {
		if (this.props.isNew) {
			if (confirm('Tem certeza que deseja descartar essa publicação?')) {
				this.props.model.destroy(); // Won't touch API, backbone knows better
				this.close();
			}
		} else if (confirm('Tem certeza que deseja excluir essa publicação?')) {
			this.props.model.destroy();
			this.props.page.destroy();
			// Signal to the wall that the post with this ID must be removed.
			// This isn't automatic (as in deleting comments) posbecause the models on
			// the wall aren't the same as those on post FullPostView.
			console.log('id being removed:',this.props.model.get('id'))
			app.postList.remove({id:this.props.model.get('id')})
			$('.tooltip').remove(); // fuckin bug
		}
	},
	close: function () {
		if (/^\s+$/.test(this.refs.postBody.getDOMNode().value)) {
			if (!confirm("Deseja descartar permanentemente as suas alterações?"))
				return;
		}
		this.props.page.destroy();
	},
	//
	preview: function () {
	// Show a preview of the rendered markdown text.
		var html = marked(this.refs.postBody.getDOMNode().value)
		var Preview = React.createClass({displayName: 'Preview',
			render: function () {
				return (
					React.createElement("div", null, 
						React.createElement("span", {className: "content", dangerouslySetInnerHTML: {__html: html}})
					)
				)
			}
		});
		Modal(React.createElement(Preview, null), "preview", function () {
			refreshLatex();
		});
	},

	//
	updateUploaded: function (urls) {
		this.setState({ uploaded: urls });
	},
	onChangeLink: function () {
		var link = this.refs.postLink.getDOMNode().value;
		var c = 0;

		function isValidUrl (url) {
			return !!url.match(
				/\b(https?|ftp|file):\/\/[\-A-Za-z0-9+&@#\/%?=~_|!:,.;]*[\-A-Za-z0-9+&@#\/%=~_|‌​]/
			);
		}

		if (!isValidUrl(link)) {
			this.refs.loadingLinks.getDOMNode().innerHTML = "<i class='icon-exclamation-circle'></i>"
			return;
		}

		this.setState({ preview: null });
		var interval = setInterval(function () {
			var e = this.refs.loadingLinks.getDOMNode();
			var ic;
			if (c == 2) ic = "<i class='icon-ellipsis'></i>"
			else if (c == 1) ic = "<i class='icon-dots'></i>"
			else if (c == 0) ic = "<i class='icon-dot'></i>"
			else ic = ""
			e.innerHTML = ic;
			c = (c+1)%3;
		}.bind(this), 700);
		$.getJSON('/api/posts/meta?link='+link)
			.done(function (data) {
				if (!data) {
					this.setState({ preview: false });
				}	else if (data.error) {
					app.flash.warn(data.message || "Problemas ao buscar essa url.");
					return;
				} if (data && !('is_scrapped' in data)) {
					this.setState({ preview: data });
					if (data.title) {
						this.refs.postTitle.getDOMNode().value = data.title;
						_.defer(function () {
							$(this.refs.postTitle.getDOMNode()).trigger('autosize.resize')
						}.bind(this))
					}
				}
			}.bind(this))
			.fail(function () {
			})
			.always(function () {
				clearInterval(interval);
				this.refs.loadingLinks.getDOMNode().innerHTML = '';
			}.bind(this))
	},
	onChangeLab: function () {
		this.props.model.set('lab', this.refs.labSelect.getDOMNode().value);
		this.refs.tagBox.changeLab(this.refs.labSelect.getDOMNode().value);
	},
	removeLink: function () {
		this.setState({ preview: null });
		this.refs.postLink.getDOMNode().value = '';
	},
	onClickHelp: function () {
		Modal.PostEditHelpDialog({})
	},
	closeHelpNote: function () {
		this.setState({ showHelpNote: false })
	},
	//
	render: function () {
		var doc = this.props.model.attributes;

		var pagesOptions = _.map(_.map(pageMap, function (obj, key) {
				return {
					id: key,
					name: obj.name,
					detail: obj.detail,
				};
			}), function (a, b) {
				return (
					React.createElement("option", {value: a.id, key: a.id}, a.name)
				);
			});

		return (
			React.createElement("div", {className: "qi-box"}, 
				React.createElement("i", {className: "close-btn icon-clear", 'data-action': "close-page", onClick: this.close}), 

				React.createElement("div", {className: "form-wrapper"}, 
					React.createElement("div", {className: "sideBtns"}, 
						React.createElement(Toolbar.SendBtn, {cb: this.send}), 
						React.createElement(Toolbar.PreviewBtn, {cb: this.preview}), 
						
							this.props.isNew?
							React.createElement(Toolbar.CancelPostBtn, {cb: this.delete})
							:React.createElement(Toolbar.RemoveBtn, {cb: this.delete}), 
						
						React.createElement(Toolbar.HelpBtn, {cb: this.onClickHelp})
					), 

					React.createElement("header", null, 
						React.createElement("div", {className: "icon"}, 
							React.createElement("i", {className: "icon-description"})
						), 
						React.createElement("div", {className: "label"}, 
							"Criar Novo Texto"
						)
					), 

					React.createElement("ul", {className: "inputs"}, 
						React.createElement("li", {className: "title"}, 
							React.createElement("textarea", {ref: "postTitle", name: "post_title", 
								placeholder: "Dê um título para a sua publicação", 
								defaultValue: doc.content.title}
							)
						), 
						
							this.props.isNew || doc.content.link?
							React.createElement("li", {className: "link"}, 
								React.createElement("input", {ref: "postLink", 
									disabled: !this.props.isNew, 
									className: "link", name: "post_link", 
									defaultValue: doc.content.link, 
									onChange: _.throttle(this.onChangeLink, 2000), 
									placeholder: "OPCIONAL: um link para compartilhar aqui"}), 
								React.createElement("div", {ref: "loadingLinks", className: "loading"}
								)
							)
							:null, 
						
						
							this.state.preview?
							React.createElement("li", {className: "link-preview"}, 
								React.createElement("i", {className: "icon-close", onClick: this.removeLink}), 
								
									this.state.preview.image && this.state.preview.image.url?
									React.createElement("div", {className: "thumbnail", style: {backgroundImage:'url('+this.state.preview.image.url+')'}}, 
										React.createElement("div", {className: "blackout"}), 
										React.createElement("i", {className: "icon-link"})
									)
									:null, 
								
								React.createElement("div", {className: "right"}, 
									
										this.state.preview.title?
										React.createElement("div", {className: "title"}, 
											React.createElement("a", {href: this.state.preview.url}, 
												this.state.preview.title
											)
										)
										:React.createElement("div", {className: ""}, 
											React.createElement("a", {href: this.state.preview.url}, 
												this.state.preview.url
											)
										), 
									
									React.createElement("div", {className: "description"}, 
										this.state.preview.description
									), 
									React.createElement("div", {className: "hostname"}, 
										React.createElement("a", {href: this.state.preview.url}, 
											URL && new URL(this.state.preview.url).hostname
										)
									)
								)
							)
							:(
								this.state.preview === false?
								React.createElement("li", {className: "link-preview"}, 
									React.createElement("div", {className: "preview messaging"}, 
										React.createElement("div", {className: "message"}, 
											"Link não encontrado. ", React.createElement("i", {className: "icon-sad"})
										)
									)
								)
								:null
							), 
						
						React.createElement("li", {className: "selects"}, 
							React.createElement("div", {className: "select-wrapper lab-select-wrapper ", disabled: !this.props.isNew}, 
								React.createElement("i", {className: "icon-group-work", 
								'data-toggle': this.props.isNew?"tooltip":null, 'data-placement': "left", 'data-container': "body", 
								title: "Selecione um laboratório."}), 
								React.createElement("select", {ref: "labSelect", 
									defaultValue: doc.lab, 
									disabled: !this.props.isNew, 
									onChange: this.onChangeLab}, 
									pagesOptions
								)
							), 
							React.createElement(TagBox, {ref: "tagBox", lab: doc.lab, pool: pageMap}, 
								doc.tags
							)
						), 
						React.createElement("li", {className: "body", ref: "postBodyWrapper"}, 
							React.createElement("div", {className: "pagedown-button-bar", id: "wmd-button-bar"}), 
							React.createElement("textarea", {ref: "postBody", id: "wmd-input", 
								placeholder: "Descreva o problema usando markdown e latex com ` x+3 `.", 
								'data-placeholder': "Escreva o seu texto aqui.", 
								defaultValue:  doc.content.body})
						), 
						React.createElement(ImagesDisplay, {ref: "images", maxSize: 1, update: this.updateUploaded}, 
							this.state.uploaded
						)
					), 

					
						this.state.showHelpNote?
						React.createElement("div", {className: "post-form-note"}, 
							React.createElement("i", {className: "close-btn", onClick: this.closeHelpNote, 'data-action': "close-dialog"}), 
							React.createElement("p", null, 
								"Dicas de formatação:", React.createElement("br", null), 
								"Para escrever em ", React.createElement("strong", null, "negrito"), ", escreva **<seu texto aqui>**." + ' ' +
								"Para escrever em ", React.createElement("em", null, "itálico"), ", escreva _<seu texto aqui>_."
							)
						)
						:null
					
				), 

				React.createElement("div", {className: "form-drag-aim"}, 
					React.createElement("div", {className: "message"}, 
						React.createElement("div", {className: "icons"}, 
							React.createElement("i", {className: "icon-description"})
						), 
						React.createElement("div", {className: "text"}, 
							"Arraste uma imagem aqui para enviar."
						)
					)
				)
			)
		);
						// <div id="wmd-preview" className="wmd-panel wmd-preview"></div>
	},
});

var PostCreate = function (data) {
	if (!window.user)
		return;
	var postModel = new models.postItem({
		author: window.user,
		lab: 'application',
		content: {
			title: '',
			body: '',
		},
	});
	return React.createElement(PostEdit, {model: postModel, page: data.page, isNew: true})
};

module.exports = {
	create: PostCreate,
	edit: PostEdit,
};
},{"../components/models.js":6,"./parts/dialog.jsx":19,"./parts/tagBox.jsx":20,"./parts/toolbar.jsx":21,"jquery":36,"lodash":39,"marked":40,"pagedown-editor":44,"react":45}],23:[function(require,module,exports){
/** @jsx React.DOM */

var $ = require('jquery')
var _ = require('lodash')
var React = require('react')
var marked = require('marked');

var Toolbar = require('./parts/toolbar.jsx')
var Dialog 	= require('./parts/dialog.jsx')
var Comments= require('./parts/comments.jsx')

var renderer = new marked.Renderer();
renderer.codespan = function (html) {
	// Don't consider codespans in markdown (they're actually 'latex')
	return '`'+html+'`';
}

marked.setOptions({
	renderer: renderer,
	gfm: false,
	tables: false,
	breaks: false,
	pedantic: false,
	sanitize: true,
	smartLists: true,
	smartypants: true,
})

var PostHeader = React.createClass({displayName: 'PostHeader',
	onClickShare: function () {
		Dialog.ShareDialog({
			message: 'Compartilhe essa publicação',
			title: this.props.model.get('content').title,
			url: 'http://www.qilabs.org'+this.props.model.get('path'),
		});
	},

	render: function () {
		var post = this.props.model.attributes;

		var FollowBtn = null;
		if (window.user) {
			if (!this.props.model.userIsAuthor && post._meta && typeof post._meta.authorFollowed !== 'undefined') {
				if (post._meta.authorFollowed) {
					FollowBtn = (
						React.createElement("button", {className: "btn-follow", 'data-action': "unfollow", 'data-user': post.author.id})
					)
				} else {
					FollowBtn = (
						React.createElement("button", {className: "btn-follow", 'data-action': "follow", 'data-user': post.author.id})
					)
				}
			}
		}

		var pageObj;
		var tagNames = [];
		var subtagsUniverse = {};
		if (post.lab && post.lab in pageMap) {
			pageObj = pageMap[post.lab];

			if (post.lab && pageMap[post.lab] && pageMap[post.lab].children)
				subtagsUniverse = pageMap[post.lab].children;

			if (pageObj) {
				tagNames.push(_.extend(pageObj, { id: post.lab }));
				_.each(post.tags, function (id) {
					if (id in subtagsUniverse)
						tagNames.push({
							id: id,
							name: subtagsUniverse[id].name,
							path: pageMap[post.lab].path+'?tag='+id
						});
				});
			}
		}

		var views;
		if (post._meta.views) {
			var count = post._meta.views || 1; // Math.floor(post._meta.views/10)*10;
			views = (
				React.createElement("span", {className: "views"}, 
					React.createElement("i", {className: "icon-dot"}), " ", React.createElement("i", {className: "icon-eye2"}), " ", count
				)
			);
		}
		return (
			React.createElement("div", {className: "postHeader"}, 
				React.createElement("div", {className: "tags"}, 
					_.map(tagNames, function (obj) {
						if (obj.path)
							return (
								React.createElement("a", {className: "tag tag-bg", 'data-tag': obj.id, href: obj.path, key: obj.name}, 
									"#", obj.name
								)
							);
						return (
							React.createElement("div", {className: "tag tag-bg", 'data-tag': obj.id, key: obj.name}, 
								"#", obj.name
							)
						);
					})
				), 
				React.createElement("div", {className: "postTitle"}, 
					post.content.title
				), 
				React.createElement("div", {className: "stats"}, 
					React.createElement("span", {title: formatFullDate(new Date(post.created_at))}, 
					"publicado ", 
					React.createElement("time", {'data-time-count': 1*new Date(post.created_at), 'data-short': "false"}, 
						window.calcTimeFrom(post.created_at)
					)
					), 
					(post.updated_at && 1*new Date(post.updated_at) > 1*new Date(post.created_at))?
						(React.createElement("span", null, 
							", ", React.createElement("span", {title: formatFullDate(post.updated_at)}, "editado")
						)
						)
						:null, 
					
					views
				), 

				React.createElement("div", {className: "author"}, 
					React.createElement("a", {href: post.author.path, className: "username"}, 
						React.createElement("div", {className: "user-avatar"}, 
							React.createElement("div", {className: "avatar", style:  { background: 'url('+post.author.avatarUrl+')'} })
						), 
						post.author.name
					), 
					FollowBtn
				), 

				
					(this.props.model.userIsAuthor)?
					React.createElement("div", {className: "sideBtns"}, 
						React.createElement(Toolbar.LikeBtn, {
							cb: function () {}, 
							active: true, 
							text: post.counts.vote}), 
						React.createElement(Toolbar.EditBtn, {cb: this.props.parent.onClickEdit}), 
						React.createElement(Toolbar.ShareBtn, {cb: this.onClickShare})
					)
					:React.createElement("div", {className: "sideBtns"}, 
						React.createElement(Toolbar.LikeBtn, {
							cb: this.props.model.toggleVote.bind(this.props.model), 
							active: this.props.model.liked, 
							text: post.counts.votes}), 
						React.createElement(Toolbar.ShareBtn, {cb: this.onClickShare}), 
						React.createElement(Toolbar.FlagBtn, {cb: this.onClickFlag})
					)
				
			)
		);
	}
});

var LinkPreview = React.createClass({displayName: 'LinkPreview',
	propTypes: {
		link: React.PropTypes.string.isRequired,
		data: React.PropTypes.object.isRequired,
	},

	open: function () {
		window.open(this.props.link, '_blank');
	},

	render: function () {

		var hostname = URL && new URL(this.props.link).hostname;

		return (
			React.createElement("div", {className: "linkDisplay", onClick: this.open, tabIndex: 1}, 
				
					this.props.data.link_image?
					React.createElement("div", {className: "thumbnail", style: {backgroundImage:'url('+this.props.data.link_image+')'}}, 
						React.createElement("div", {className: "blackout"}), 
						React.createElement("i", {className: "icon-paperclip"})
					)
					:React.createElement("div", {className: "thumbnail show-icon"}, 
						React.createElement("div", {className: "blackout"}), 
						React.createElement("i", {className: "icon-paperclip"})
					), 
				
				React.createElement("div", {className: "right"}, 
					React.createElement("div", {className: "title"}, 
						React.createElement("a", {href: this.props.link}, 
							this.props.data.link_title
						)
					), 
					React.createElement("div", {className: "description"}, this.props.data.link_description), 
					React.createElement("div", {className: "hostname"}, 
						React.createElement("a", {href: this.props.link}, 
							hostname
						)
					)
				)
			)
		);
	}
});

module.exports = React.createClass({displayName: 'exports',
	componentWillMount: function () {
		var update = function () {
			this.forceUpdate(function(){});
		}
		this.props.model.on('add reset remove change', update.bind(this));
	},

	render: function () {
		var post = this.props.model.attributes;
		var body = this.props.model.get('content').body;
		// var body = marked(this.props.model.get('content').body);
		if (true) {
			body = marked(body);
			if (post.content.cover)
				body = "<img src='"+post.content.cover+"' />"+body;
			for (var i=0; i<post.content.images.length; ++i)
				body += "<img src='"+post.content.images[i]+"' />"
		}

		return (
			React.createElement("div", {className: "postCol"}, 
				React.createElement(PostHeader, {model: this.props.model, parent: this.props.parent}), 

				
					post.content.link?
					React.createElement(LinkPreview, {data: post.content, link: post.content.link})
					:null, 
				

				React.createElement("div", {className: "postBody", dangerouslySetInnerHTML: {__html: body}}), 

				React.createElement("div", {className: "postInfobar"}, 
					React.createElement("ul", {className: "left"})
				), 

				React.createElement("div", {className: "postFooter"}, 
					React.createElement(Comments, {collection: this.props.model.comments, post: this.props.model})
				)
			)
		);
	},
});
},{"./parts/comments.jsx":18,"./parts/dialog.jsx":19,"./parts/toolbar.jsx":21,"jquery":36,"lodash":39,"marked":40,"react":45}],24:[function(require,module,exports){
/** @jsx React.DOM */

var $ = require('jquery')
var _ = require('lodash')
var React = require('react')
var selectize = require('selectize')

var models = require('../components/models.js')
var Toolbar = require('./parts/toolbar.jsx')
var Modal = require('./parts/dialog.jsx')
var TagBox = require('./parts/tagBox.jsx')
// var Mixins = require('./parts/mixins.js')

//

var ProblemEdit = React.createClass({displayName: 'ProblemEdit',
	propTypes: {
		model: React.PropTypes.any.isRequired,
		page: React.PropTypes.any.isRequired,
	},
	//
	getInitialState: function () {
		return {
			answerIsMC: this.props.model.get('answer').is_mc,
			subject: this.props.model.get('subject'),
		};
	},
	//
	componentDidMount: function () {
		// Close when user clicks directly on element (meaning the faded black background)
		$(this.getDOMNode().parentElement).on('click', function onClickOut (e) {
			// console.log('oooo', e.target, this.getDOMNode().parentElement)
			if (e.target === this.getDOMNode().parentElement) {
				if (confirm("Deseja descartar permanentemente as suas alterações?")) {
					this.close();
					$(this).unbind('click', onClickOut);
				}
			}
		}.bind(this));

		// Prevent newlines in title
		$(this.refs.postTitle.getDOMNode()).on('input keyup keypress', function (e) {
			if ((e.keyCode || e.charCode) == 13) {
				e.preventDefault();
				e.stopPropagation();
				return;
			}
		}.bind(this));

		var converter = {
			makeHtml: function (txt) {
				return app.utils.renderMarkdown(txt);
			}
		}

		// Set state on subject change, so that topics are changed accordingly.
		$(this.refs.subjectSelect.getDOMNode()).on('change', function (e) {
			this.setState({ subject: this.refs.subjectSelect.getDOMNode().value })
		}.bind(this))

		this.pdeditor = new Markdown.Editor(converter);
		this.pdeditor.run();

		// Let textareas autoadjust
		_.defer(function () {
			app.utils.refreshLatex();
			$(this.refs.postTitle.getDOMNode()).autosize();
			$(this.refs.postBody.getDOMNode()).autosize();
		}.bind(this));
		//
		$('body').addClass('crop');
	},
	componentWillUnmount: function () {
		$(this.refs.postTitle.getDOMNode()).trigger('autosize.destroy');
		$('body').removeClass('crop');
		$('.tooltip').remove(); // fuckin bug
	},
	//
	onClickSend: function () {
		this.send();
	},
	onClickTrash: function () {
		if (this.props.isNew) {
			if (confirm('Tem certeza que deseja descartar esse problema?')) {
				this.props.model.destroy(); // Won't touch API, backbone knows better
				this.close();
			}
		} else {
			if (confirm('Tem certeza que deseja excluir esse postagem?')) {
				this.props.model.destroy();
				this.close();
				// Signal to the wall that the post with this ID must be removed.
				// This isn't automatic (as in deleting comments) because the models on
				// the wall aren't the same as those on post FullPostView.
				console.log('id being removed:',this.props.model.get('id'))
				app.postList.remove({id:this.props.model.get('id')})
			}
		}
	},
	//
	onClickMCChoice: function () {
		var selection = this.refs.multipleChoiceSelection.getDOMNode();
		var selected = $(selection).find('label.btn.active')[0];
		if (selected.dataset.value == 'yes') {
			this.setState({ answerIsMC: true });
		} else {
			this.setState({ answerIsMC: false });
		}
	},
	preview: function () {
	// Show a preview of the rendered markdown text.
		var html = app.utils.renderMarkdown(this.refs.postBody.getDOMNode().value)
		var Preview = React.createClass({displayName: 'Preview',
			render: function () {
				return (
					React.createElement("div", null, 
						React.createElement("h1", null, "Seu texto vai ficar assim:"), 
						React.createElement("span", {className: "content", dangerouslySetInnerHTML: {__html: html}}), 
						React.createElement("small", null, 
							"(clique fora da caixa para sair)"
						)
					)
				)
			}
		});
		Modal(React.createElement(Preview, null), "preview", function () {
			app.utils.refreshLatex();
		});
	},
	send: function () {
		this.props.model.attributes.content.body = this.refs.postBody.getDOMNode().value;
		this.props.model.attributes.content.source = this.refs.postSource.getDOMNode().value;
		this.props.model.attributes.content.title = this.refs.postTitle.getDOMNode().value;
		this.props.model.attributes.topic = this.refs.topicSelect.getDOMNode().value;
		this.props.model.attributes.level = parseInt(this.refs.levelSelect.getDOMNode().value);
		this.props.model.attributes.subject = this.refs.subjectSelect.getDOMNode().value;

		if (this.state.answerIsMC) {
			var options = [];
			$(this.refs.mcPool.getDOMNode()).find('input').each(function () {
				options.push(this.value);
			});
			this.props.model.attributes.answer = {
				is_mc: true,
				options: options,
			};
		} else {
			this.props.model.attributes.answer = {
				is_mc: false,
				value: this.refs['right-ans'].getDOMNode().value,
			};
		}

		this.props.model.save(undefined, {
			url: this.props.model.url() || '/api/problems',
			success: function (model) {
				window.location.href = model.get('path');
				app.flash.info("Problema salvo.");
			},
			error: function (model, xhr, options) {
				var data = xhr.responseJSON;
				if (data && data.message) {
					app.flash.alert(data.message);
				} else {
					app.flash.alert('Friedman... Milton Friedman.');
				}
			}
		});
	},
	close: function () {
		this.props.page.destroy();
	},
	//
	render: function () {
		var doc = this.props.model.attributes;

		var subjectOptions = _.map(_.map(_.filter(pageMap, function (obj, key) {
			return obj.hasProblems;
		}), function (obj, key) {
			return {
				id: obj.id,
				name: obj.name,
				detail: obj.detail,
			};
		}), function (a, b) {
				return (
					React.createElement("option", {value: a.id, key: a.id}, a.name)
				);
			});

		if (this.state.subject && this.state.subject in pageMap) {
			if (!pageMap[this.state.subject].hasProblems || !pageMap[this.state.subject].topics)
				console.warn("WTF, não tem tópico nenhum aqui.");
			var TopicOptions = _.map(pageMap[this.state.subject].topics, function (obj) {
				return (
					React.createElement("option", {value: obj.value}, obj.name)
				)
			});
		}

		return (
			React.createElement("div", {className: "qi-box"}, 
				React.createElement("i", {className: "close-btn icon-clear", 'data-action': "close-page", onClick: this.close}), 

				React.createElement("div", {className: "form-wrapper"}, 
					React.createElement("div", {className: "sideBtns"}, 
						React.createElement(Toolbar.SendBtn, {cb: this.onClickSend}), 
						React.createElement(Toolbar.PreviewBtn, {cb: this.preview}), 
						
							this.props.isNew?
							React.createElement(Toolbar.CancelPostBtn, {cb: this.onClickTrash})
							:React.createElement(Toolbar.RemoveBtn, {cb: this.onClickTrash}), 
						
						React.createElement(Toolbar.HelpBtn, null)
					), 

					React.createElement("header", null, 
						React.createElement("div", {className: "icon"}, 
							React.createElement("i", {className: "icon-extension"})
						), 
						React.createElement("div", {className: "label"}, 
							"Criar Novo Problema"
						)
					), 

					React.createElement("ul", {className: "inputs"}, 
						React.createElement("li", {className: "title"}, 
							React.createElement("textarea", {ref: "postTitle", name: "post_title", 
								placeholder: "Título para o seu problema", 
								defaultValue: doc.content.title}
							)
						), 

						React.createElement("li", {className: "selects"}, 
							React.createElement("div", {className: "select-wrapper lab-select-wrapper "}, 
								React.createElement("i", {className: "icon-group-work", 
								'data-toggle': this.props.isNew?"tooltip":null, 'data-placement': "left", 'data-container': "body", 
								title: "Selecione um laboratório."}), 
								React.createElement("select", {ref: "subjectSelect", 
									defaultValue: doc.subject, 
									onChange: this.onChangeLab}, 
									React.createElement("option", {value: "false"}, "Tópico"), 
									subjectOptions
								)
							), 
							React.createElement("div", {className: "select-wrapper level-select-wrapper ", disabled: !this.props.isNew}, 
								React.createElement("select", {ref: "levelSelect", defaultValue: doc.level}, 
									React.createElement("option", {value: "false"}, "Dificuldade"), 
									React.createElement("option", {value: "1"}, "Nível 1"), 
									React.createElement("option", {value: "2"}, "Nível 2"), 
									React.createElement("option", {value: "3"}, "Nível 3"), 
									React.createElement("option", {value: "4"}, "Nível 4"), 
									React.createElement("option", {value: "5"}, "Nível 5")
								)
							), 
							React.createElement("div", {className: "select-wrapper topic-select-wrapper ", disabled: !this.props.isNew}, 
								React.createElement("select", {ref: "topicSelect", defaultvalue: doc.topic}, 
									TopicOptions
								)
							)
						), 

						React.createElement("li", {className: "source"}, 
							React.createElement("input", {type: "text", ref: "postSource", name: "post_source", 
								placeholder: "Cite a fonte desse problema (opcional)", 
								defaultValue: doc.content.source})
						), 

						React.createElement("li", {className: "body"}, 
							React.createElement("div", {className: "pagedown-button-bar", id: "wmd-button-bar"}), 
							React.createElement("textarea", {ref: "postBody", id: "wmd-input", 
								placeholder: "Descreva o problema usando markdown e latex com ` x+3 `.", 
								'data-placeholder': "Escreva o seu texto aqui. Selecione partes dele para formatar.", 
								defaultValue:  doc.content.body})
						)
					), 

					React.createElement("section", {className: "options"}, 
						React.createElement("div", {className: "left"}
						), 
						React.createElement("div", {className: "right"}, 
							React.createElement("div", {className: "group check-btns"}, 
								React.createElement("label", null, "Múltipla Escolha"), 
								React.createElement("div", {className: "btn-group", 'data-toggle': "buttons", ref: "multipleChoiceSelection"}, 
									React.createElement("label", {
										className: "btn btn-primary "+(this.state.answerIsMC?"active":""), 
										'data-value': "yes", 
										onClick: this.onClickMCChoice}, 
										React.createElement("input", {type: "radio", name: "options", onChange: function(){}, checked: true}), " Sim"
									), 
									React.createElement("label", {
										className: "btn btn-primary "+(this.state.answerIsMC?"":"active"), 
										'data-value': "no", 
										onClick: this.onClickMCChoice}, 
										React.createElement("input", {type: "radio", name: "options", onChange: function(){}}), " Não"
									)
								)
							), 
							React.createElement("div", {className: "tab", style:  (this.state.answerIsMC)?{ display: "none" }:{}}, 
								React.createElement("div", {className: "group answer-input"}, 
									React.createElement("input", {className: "single-ans", ref: "right-ans", type: "text", 
										defaultValue: doc.answer.value, 
										placeholder: "A resposta certa"})
								)
							), 
							React.createElement("div", {className: "tab", style:  (this.state.answerIsMC)?{}:{ display: "none" }}, 
								React.createElement("div", {className: "group answer-input", ref: "mcPool"}, 
									React.createElement("ul", null, 
										
											_.map(doc.answer.mc_options || ['','','','',''], function (value, index) {
												if (index == 0)
													return (
														React.createElement("input", {className: "right-ans", type: "text", 
															defaultValue: value, 
															placeholder: "A resposta certa"})
													)
												else
													return (
														React.createElement("input", {className: "wrong-ans", type: "text", 
															defaultValue: value, 
															placeholder: "Uma opção incorreta"})
													)
											})
										
									)
								)
							)
						)
					)
				)
			)
		);
	},
});

var ProblemCreate = function (data) {
	var postModel = new models.problemItem({
		author: window.user,
		answer: {
			is_mc: true,
		},
		content: {
			title: '',
			body: '',
		},
	});
	return (
		React.createElement(ProblemEdit, {model: postModel, page: data.page, isNew: true})
	)
};

module.exports = {
	create: ProblemCreate,
	edit: ProblemEdit,
};
},{"../components/models.js":6,"./parts/dialog.jsx":19,"./parts/tagBox.jsx":20,"./parts/toolbar.jsx":21,"jquery":36,"lodash":39,"react":45,"selectize":46}],25:[function(require,module,exports){
/** @jsx React.DOM */

var $ = require('jquery')
var _ = require('lodash')
var React = require('react')

var Toolbar = require('./parts/toolbar.jsx')
var Modal = require('./parts/dialog.jsx')

//

module.exports = React.createClass({displayName: 'exports',

	componentDidMount: function () {
		app.utils.refreshLatex();
	},

	componentDidUpdate: function () {
		app.utils.refreshLatex();
	},

	componentWillMount: function () {
		var update = function () {
			this.forceUpdate(function(){});
		}
		this.props.model.on('add reset remove change', update.bind(this));
	},

	//

	onClickShare: function () {
		Modal.ShareDialog({
			message: "Compartilhe esse problema",
			title: this.props.model.get('content').title,
			url: 'http://www.qilabs.org'+this.props.model.get('path'),
		});
	},

	tryAnswer: function (e) {
		if (this.props.model.get('answer').is_mc) {
			var data = { value: e.target.dataset.value };
		} else {
			var data = { value: this.refs.answerInput.getDOMNode().value };
		}
		this.props.model.try(data);
	},

	render: function () {
		var doc = this.props.model.attributes;

		// if window.user.id in this.props.model.get('hasSeenAnswer'), show answers
		var source = doc.content.source;
		var isAdaptado = source && (!!source.match(/(^\[adaptado\])|(adaptado)/));

		var inputLeftCol = (
			React.createElement("div", {className: "left"}
			)
		);

		//---------------------------------------------------------------
		// MAKE LEFT COL ------------------------------------------------

		/**
		 * Situations:
		 * 0. User is author
		 * 1. User solved problem
		 * 2. User never interacted with this problem
		 * 3. User answered wrong and HAS NO tried left
		 * 4. User answered wrong and HAS tries left
		 * 5. User chose just to see answers
		 */

		console.log(this.props.model.get('_meta'))
		var m = this.props.model;

		if (m.userIsAuthor) { // 0
			console.log(0)
			var inputEnabled = false;
			var inputLeftCol = (
				React.createElement("div", {className: "left"}, 
					React.createElement("div", {className: "info"}, 
						React.createElement("div", {className: "main"}, "Você criou esse problema."), 
						React.createElement("div", {className: "sub"}, 
							"Que isso, hein..."
						), 
						React.createElement("button", {className: "see-solutions"}, 
							"Ver solução"
						)
					)
				)
			);
		} else if (m.userSolved) { // 1
			console.log(1)
			var inputEnabled = false;
			var inputLeftCol = (
				React.createElement("div", {className: "left"}, 
					React.createElement("div", {className: "info"}, 
						React.createElement("div", {className: "main"}, "Você ", React.createElement("strong", null, "acertou"), " esse problema. :)"), 
						React.createElement("div", {className: "sub"}, 
							"E ganhou um biscoito!"
						), 
						React.createElement("button", {className: "see-solutions"}, 
							"Ver solução"
						)
					)
				)
			);
		} else if (!m.userTried && !m.userSawAnswer) { // 2
			console.log(2)
			var inputEnabled = true;
			var inputLeftCol = (
				React.createElement("div", {className: "left"}, 
					React.createElement("div", {className: "info"}, 
						React.createElement("div", {className: "main"}, "Acerte esse problema, mano."), 
						React.createElement("div", {className: "sub"}, 
							"E ganhe um biscoito."
						), 
						React.createElement("button", {className: "see-solutions"}, 
							"Ver solução"
						)
					)
				)
			);
		} else if (m.userTried && !m.userSolved && !m.userTriesLeft) { // 3
			console.log(3)
			var inputEnabled = false;
			var inputLeftCol = (
				React.createElement("div", {className: "left"}, 
					React.createElement("div", {className: "info"}, 
						React.createElement("div", {className: "main"}, "Foi mal, você é burro."), 
						React.createElement("div", {className: "sub"}, 
							"Da próxima vez..."
						), 
						React.createElement("button", {className: "see-solutions"}, 
							"Ver solução"
						)
					)
				)
			);
		} else if (m.userTried && !m.userSolved && m.userTriesLeft) { // 4
			console.log(4)
			var inputEnabled = true;
			var inputLeftCol = (
				React.createElement("div", {className: "left"}, 
					React.createElement("div", {className: "info"}, 
						React.createElement("div", {className: "main"}, "Você foi burro, mas ainda pode não ser (?)."), 
						React.createElement("div", {className: "sub"}, 
							"Lute pelo seu biscoito. Você ainda tem ", m.userTriesLeft, " chances."
						), 
						React.createElement("button", {className: "see-solutions"}, 
							"Ver solução"
						)
					)
				)
			);
		} else if (m.userSawAnswer) { // 5
			console.log(5)
			var inputEnabled = false;
			var inputLeftCol = (
				React.createElement("div", {className: "left"}, 
					React.createElement("div", {className: "info"}, 
						React.createElement("div", {className: "main"}, "Você não respondeu esse problema."), 
						React.createElement("button", {className: "see-solutions"}, 
							"Ver solução"
						)
					)
				)
			)
		}

		if (doc.answer.is_mc) {
			var lis = _.map(doc.answer.mc_options, function (item, index) {
				return (
					React.createElement("li", null, 
						React.createElement("button", {className: inputEnabled?'':(index==0?"right-choice":"wrong-choice"), 
							onClick: this.tryAnswer, disabled: !inputEnabled, 
							'data-index': index, 'data-value': item}, 
							item
						)
					)
				)
			}.bind(this));
			if (inputEnabled) {
				var inputRightCol = (
					React.createElement("div", {className: "right"}, 
						React.createElement("div", {className: "multiple-choice"}, 
						lis
						)
					)
				);
			} else {
				var inputRightCol = (
					React.createElement("div", {className: "right"}, 
						React.createElement("div", {className: "multiple-choice disabled"}, 
						lis
						)
					)
				);
			}
		} else {
			if (inputEnabled) {
				var inputRightCol = (
					React.createElement("div", {className: "right"}, 
						React.createElement("div", {className: "answer-input"}, 
							React.createElement("input", {ref: "answerInput", defaultValue: doc.answer.value, placeholder: "Resultado"}), 
							React.createElement("button", {className: "try-answer", onClick: this.tryAnswer}, "Responder")
						)
					)
				);
			} else {
				var inputRightCol = (
					React.createElement("div", {className: "right"}, 
						React.createElement("div", {className: "answer-input disabled"}, 
							React.createElement("input", {ref: "answerInput", defaultValue: doc.answer.value, placeholder: "Resultado"}), 
							React.createElement("button", {className: "try-answer", onClick: this.tryAnswer}, "Responder")
						)
					)
				);
			}
		}

		//-------------------------------------------------
		// Generate FollowBtn
		var FollowBtn = null;
		if (window.user) {
			if (!this.props.model.userIsAuthor && doc._meta && typeof doc._meta.authorFollowed !== 'undefined') {
				if (doc._meta.authorFollowed) {
					FollowBtn = (
						React.createElement("button", {className: "btn-follow", 'data-action': "unfollow", 'data-user': doc.author.id})
					)
				} else {
					FollowBtn = (
						React.createElement("button", {className: "btn-follow", 'data-action': "follow", 'data-user': doc.author.id})
					)
				}
			}
		}

		//-------------------------------------------------
		// Gen level element
		var Level = (
			React.createElement("div", {className: "level"}, 
				"Nível ", doc.level
			)
		);
		// Gen subject element
		var Subject = (
			React.createElement("div", {className: "subject tag-color", 'data-tag': doc.subject}, 
				React.createElement("a", {href: "#"}, doc.materia)
			)
		);
		// Gen topic element
		var Topic = (
			React.createElement("div", {className: "topic tag-color", 'data-tag': doc.topic}, 
				React.createElement("a", {href: "#"}, doc.topico)
			)
		);

		var classSolved = m.userSolved && "solved" || null;
		var classFailed = !m.userSolved && m.userTriesLeft===0 && !m.userIsAuthor || null;

		return (
			React.createElement("div", {className: "problem"}, 
				React.createElement("div", {className: "problem-header"}, 
					React.createElement("div", {className: "breadcrumbs"}, 
						Subject, " >", 
						Topic, " >", 
						Level
					), 

					
						(this.props.model.userIsAuthor)?
						React.createElement("div", {className: "sideBtns"}, 
							Toolbar.LikeBtn({
								cb: function () {},
								active: true,
								text: doc.counts.votes
							}), 
							React.createElement(Toolbar.EditBtn, {cb: this.props.parent.onClickEdit}), 
							React.createElement(Toolbar.ShareBtn, {cb: this.onClickShare})
						)
						:React.createElement("div", {className: "sideBtns"}, 
							React.createElement(Toolbar.LikeBtn, {
								cb: this.props.model.toggleVote.bind(this.props.model), 
								active: this.props.model.liked, 
								text: doc.counts.vote}), 
							React.createElement(Toolbar.ShareBtn, {cb: this.onClickShare}), 
							React.createElement(Toolbar.FlagBtn, {cb: this.onClickShare})
						)
					
				), 

				React.createElement("div", {className: "problem-content"}, 
					React.createElement("div", {className: "title"}, 
						doc.content.title
					), 
					
						doc.content.image &&
						React.createElement("div", {className: "image"}, React.createElement("img", {src: doc.content.image})), 
					
					React.createElement("div", {className: "body", dangerouslySetInnerHTML: {__html: app.utils.renderMarkdown(doc.content.body)}})
				), 

				React.createElement("div", {className: "problem-footer"}, 
					React.createElement("ul", null, 
						React.createElement("li", {className: "author"}, 
							React.createElement("a", {href: doc.author.path, className: "username"}, 
								React.createElement("div", {className: "user-avatar"}, 
									React.createElement("div", {className: "avatar", style:  { background: 'url('+doc.author.avatarUrl+')'} })
								), 
								doc.author.name
							)
						), 
						React.createElement("li", null, 
							React.createElement("i", {className: "icon-dot"}), 
							React.createElement("time", {'data-time-count': 1*new Date(doc.created_at), 'data-short': "false", title: formatFullDate(new Date(doc.created_at))}, 
								window.calcTimeFrom(doc.created_at, false)
							)
						)
					), 
					React.createElement("ul", {className: "right"}, 
						React.createElement("li", {className: "solved"}, 
						
							!doc.counts.solved?
							"Ninguém resolveu"
							:(doc.counts.solved === 1)?
								"1 resolveu"
								:''+doc.counts.solved+" resolveram"
						
						)
					)
				), 

				React.createElement("div", {className: "problem-input "+classSolved+" "+classFailed}, 
					inputLeftCol, 
					inputRightCol
				), 
				
					source?
					React.createElement("div", {className: "sauce"}, source)
					:null
				
			)
		);
	},
})
},{"./parts/dialog.jsx":19,"./parts/toolbar.jsx":21,"jquery":36,"lodash":39,"react":45}],26:[function(require,module,exports){

var $ = require('jquery')
var _ = require('lodash')
var React = require('react')
var AwesomeGrid = require('awesome-grid')

var backboneModel = {
	propTypes: {
		model: React.PropTypes.any.isRequired,
	},
	componentWillMount: function () {
		var update = function () {
			this.forceUpdate(function(){});
		}
		this.props.model.on('add reset remove change', update.bind(this));
	},
};

/////////////////////////////////////////////////////

var Card = React.createClass({displayName: 'Card',
	mixins: [backboneModel],
	render: function () {
		function gotoPost () {
			if (window.user)
				app.navigate(post.path, {trigger:true});
			else
				window.location.href = post.path;
		}
		var post = this.props.model.attributes;

		var pageName;
		var tagNames = [];
		if (post.lab && post.lab in pageMap) {
			pageName = pageMap[post.lab].name;

			var subtagsUniverse = {};
			if (pageMap[post.lab].children)
				subtagsUniverse = pageMap[post.lab].children;

			if (pageName) {
				tagNames.push(pageName);
				_.each(post.tags, function (id) {
					if (id in subtagsUniverse)
						tagNames.push(subtagsUniverse[id].name);
				});
			}
		}

		// Get me at most 2
		var bodyTags =  (
			React.createElement("div", {className: "card-body-tags"}, 
				_.map(tagNames.slice(0,2), function (name) {
					return (
						React.createElement("div", {className: "tag", key: name}, 
							"#", name
						)
					);
				})
			)
		);

		if (!post.content.cover && post.content.link_image) {
			post.content.cover = post.content.link_image;
		}

		if (window.conf && window.conf.lastAccess) {
			// console.log(new Date(window.conf.lastAccess), post.created_at)
			if (new Date(window.conf.lastAccess) < new Date(post.created_at))
				var blink = true;
		}

		return (
			React.createElement("div", {className: "card "+(blink?"blink":null), onClick: gotoPost, style: {display: 'none'}, 'data-lab': post.lab}, 
				React.createElement("div", {className: "card-icons"}, 
					React.createElement("i", {className: post.content.link?"icon-paperclip":"icon-description"})
				), 

				React.createElement("div", {className: "card-stats"}, 
					React.createElement("span", {className: "count"}, post.counts.votes), 
					React.createElement("i", {className: "icon-heart "+((this.props.model.liked || this.props.model.userIsAuthor)?"liked":"")})
				), 

				
					post.content.cover?
					React.createElement("div", {className: "card-body cover"}, 
						React.createElement("div", {className: "card-body-cover"}, 
							React.createElement("div", {className: "bg", style: { backgroundImage: 'url('+post.content.cover+')'}}), 
							React.createElement("div", {className: "user-avatar"}, 
								React.createElement("div", {className: "avatar", style: { backgroundImage: 'url('+post.author.avatarUrl+')'}})
							), 
							React.createElement("div", {className: "username"}, 
								"por ", post.author.name
							)
						), 
						React.createElement("div", {className: "card-body-span", ref: "cardBodySpan"}, 
							post.content.title
						), 
						bodyTags
					)
					:React.createElement("div", {className: "card-body"}, 
						React.createElement("div", {className: "user-avatar"}, 
							React.createElement("div", {className: "avatar", style: { backgroundImage: 'url('+post.author.avatarUrl+')'}})
						), 
						React.createElement("div", {className: "right"}, 
						React.createElement("div", {className: "card-body-span", ref: "cardBodySpan"}, 
							post.content.title
						), 
						bodyTags
						)
					)
				
			)
		);
	}
});

var ProblemCard = React.createClass({displayName: 'ProblemCard',
	mixins: [backboneModel],
	render: function () {
		function gotoPost () {
			if (window.user)
				app.navigate(post.path, {trigger:true});
			else
				window.location.href = post.path;
		}
		var post = this.props.model.attributes;

		var pageName;
		var tagNames = ['Nível '+post.level, post.translatedTopic];
		var bodyTags =  (
			React.createElement("div", {className: "card-body-tags"}, 
				_.map(tagNames, function (name) {
					return (
						React.createElement("div", {className: "tag", key: name}, 
							"#", name
						)
					);
				})
			)
		);

		if (!post.content.cover && post.content.link_image) {
			post.content.cover = post.content.link_image;
		}

		return (
			React.createElement("div", {className: "card problem", onClick: gotoPost, style: {display: 'none'}, 'data-lab': post.lab}, 

				React.createElement("div", {className: "card-icons"}
				), 

				React.createElement("div", {className: "card-stats"}, 
					React.createElement("span", {className: "count"}, post.counts.votes), 
					React.createElement("i", {className: "icon-heart "+(this.props.model.liked?"liked":"")}), 
					React.createElement("i", {className: "icon-tick "+(this.props.model.solved?"solved":"")})
				), 

				
					post.content.cover?
					React.createElement("div", {className: "card-body cover"}, 
						React.createElement("div", {className: "card-body-cover"}, 
							React.createElement("div", {className: "user-avatar"}, 
								React.createElement("div", {className: "avatar", style: { backgroundImage: 'url('+post.author.avatarUrl+')'}})
							), 
							React.createElement("div", {className: "username"}, 
								"por ", post.author.name.split(' ')[0]
							)
						), 
						React.createElement("div", {className: "card-body-span", ref: "cardBodySpan"}, 
							post.content.title
						), 
						bodyTags
					)
					:React.createElement("div", {className: "card-body"}, 
						React.createElement("div", {className: "user-avatar"}, 
							React.createElement("div", {className: "avatar", style: { backgroundImage: 'url('+post.author.avatarUrl+')'}})
						), 
						React.createElement("div", {className: "right"}, 
						React.createElement("div", {className: "card-body-span", ref: "cardBodySpan"}, 
							post.content.title
						), 
						bodyTags
						)
					)
				
			)
		);
	}
});

var ListItem = React.createClass({displayName: 'ListItem',
	mixins: [backboneModel],
	componentDidMount: function () {
	},
	render: function () {
		function gotoPost () {
			if (window.user)
				app.navigate(post.path, {trigger:true});
			else
				window.location.href = post.path;
		}
		var post = this.props.model.attributes;
		var pageName;
		if (post.lab && post.lab in pageMap) {
			pageName = pageMap[post.lab].name;
			var subtagsUniverse = pageMap[post.lab].children || {};
			var tagNames = [];
			_.each(post.tags, function (id) {
				if (id in subtagsUniverse)
					tagNames.push(subtagsUniverse[id].name);
			});
		}
		var tagList = (
			React.createElement("div", {className: "tags"}, 
				_.map(tagNames, function (name) {
					return (
						React.createElement("div", {className: "tag", key: name}, 
							"#", name
						)
					);
				})
			)
		);

		// var l = _.find(post.participations, function (i) { return i.user.id === post.author.id })
		// console.log(l)

		var participations = (post.participations || []).slice();
		if (!_.find(participations, { user: { id: post.author.id } })) {
			participations.push({
				user: post.author,
				count: 1
			})
		}
		var participants = _.map(participations.slice(0, 6), function (one) {
			return (
				React.createElement("div", {className: "user-avatar", key: one.user.id, 
					'data-toggle': "tooltip", 'data-placement': "bottom", title: one.user.name, 'data-container': "body"}, 
					React.createElement("div", {className: "avatar", style: { backgroundImage: 'url('+one.user.avatarUrl+')'}})
				)
			);
		});

		var thumbnail = post.content.link_image || post.content.cover;

		return (
			React.createElement("div", {className: "hcard", onClick: gotoPost, 
				'data-liked': this.props.model.liked, 
				'data-watching': this.props.model.watching}, 
				React.createElement("div", {className: "cell lefty"}, 
					React.createElement("div", {className: "item-col likes-col"}, 
						React.createElement("div", {className: "stats-likes"}, 
							
								this.props.model.liked?
								React.createElement("i", {className: "icon-thumbs-up3 icon-orange"})
								:React.createElement("i", {className: "icon-thumbs-up3"}), 
							
							React.createElement("span", {className: "count"}, post.counts.votes)
						)
					)
				), 
				React.createElement("div", {className: "cell center"}, 
					React.createElement("div", {className: "title"}, 
						React.createElement("span", {ref: "cardBodySpan"}, post.content.title), 
						
							this.props.model.watching?
							React.createElement("span", {className: "watching-indicator"}, React.createElement("i", {className: "icon-eye2"}))
							:null
						
					), 
					React.createElement("div", {className: "info-bar"}, 
						tagList, 
						React.createElement("a", {href: post.author.path, className: "username"}, 
							React.createElement("span", {className: "pre"}, "por"), " ", post.author.name
						), 
						React.createElement("i", {className: "icon-dot"}), 
						React.createElement("time", {'data-time-count': 1*new Date(post.created_at), title: formatFullDate(new Date(post.created_at))}, 
							window.calcTimeFrom(post.created_at)
						)
					)
				), 
				React.createElement("div", {className: "cell righty"}, 
					React.createElement("div", {className: "item-col participants"}, 
						participants
					), 
					React.createElement("div", {className: "item-col stats-col"}, 
						React.createElement("div", {className: "stats-comments"}, 
							React.createElement("i", {className: "icon-comment"}), 
							React.createElement("span", {className: "count"}, post.counts.children)
						)
					)
				), 
				
					thumbnail?
					React.createElement("div", {className: "cell thumbnail", style: { backgroundImage: 'url('+thumbnail+')'}})
					:null
				
			)
		);
	}
});

var ListItem2 = React.createClass({displayName: 'ListItem2',
	mixins: [backboneModel],
	componentDidMount: function () {
	},
	render: function () {
		function gotoPost () {
			if (window.user)
				app.navigate(post.path, {trigger:true});
			else
				window.location.href = post.path;
		}

		var post = this.props.model.attributes;
		var pageName;
		if (post.lab && post.lab in pageMap) {
			pageName = pageMap[post.lab].name;
			var subtagsUniverse = pageMap[post.lab].children || {};
			var tagNames = [pageMap[post.lab]];
			_.each(post.tags, function (id) {
				if (id in subtagsUniverse)
					tagNames.push(subtagsUniverse[id]);
			});
		}
		var tagList = (
			React.createElement("div", {className: "tags"}, 
				_.map(tagNames, function (obj) {
					return (
						React.createElement("div", {className: "tag tag-bg", key: obj.id, 'data-tag': obj.id}, 
							"#", obj.name
						)
					);
				})
			)
		);

		// var l = _.find(post.participations, function (i) { return i.user.id === post.author.id })
		// console.log(l)

		var participations = (post.participations || []).slice();
		if (!_.find(participations, function (i) { return i.user.id === post.author.id })) {
			participations.push({
				user: post.author,
				count: 1
			})
		}
		participations = _.unique(participations, function (i) { return i.user.id });
		var participants = _.map(participations.slice(0, 6), function (one) {
			return (
				React.createElement("div", {className: "user-avatar", key: one.user.id, title: one.user.name, 'data-container': "body"}, 
					React.createElement("div", {className: "avatar", style: { backgroundImage: 'url('+one.user.avatarUrl+')'}})
				)
			);
		});

		var thumbnail = post.content.link_image || post.content.cover || post.author.avatarUrl;

		return (
			React.createElement("div", {className: "vcard", onClick: gotoPost, 
				'data-liked': this.props.model.liked, 
				'data-watching': this.props.model.watching}, 
				React.createElement("div", {className: "left"}, 
					React.createElement("div", {className: "thumbnail", style: { backgroundImage: 'url('+thumbnail+')'}}), 
					React.createElement("div", {className: "backdrop"}), 
					React.createElement("div", {className: "over"}, 
						React.createElement("div", null, 
							
								this.props.model.liked?
								React.createElement("i", {className: "icon-thumb-up icon-orange"})
								:React.createElement("i", {className: "icon-thumb-up"}), 
							
							React.createElement("span", {className: "count"}, post.counts.votes)
						)
					)
				), 
				React.createElement("div", {className: "right"}, 
					React.createElement("div", {className: "header"}, 
						React.createElement("div", {className: "title"}, 
							post.content.title
						), 
						React.createElement("div", {className: "info"}, 
							React.createElement("a", {href: post.author.path, className: "author"}, 
								React.createElement("span", {className: "pre"}, "por"), " ", post.author.name
							), 
							React.createElement("i", {className: "icon-dot"}), 
							React.createElement("time", {'data-time-count': 1*new Date(post.created_at), 'data-short': "false", title: formatFullDate(new Date(post.created_at))}, 
								window.calcTimeFrom(post.created_at, false)
							)
						)
					), 
					React.createElement("div", {className: "body"}, 
						post.content.body.slice(0,130)
					), 
					React.createElement("div", {className: "footer"}, 
						React.createElement("ul", null, 
							React.createElement("div", {className: "stats"}
							), 
							tagList
						), 
						React.createElement("ul", {className: "right"}, 
							React.createElement("div", {className: "participations"}, 
								React.createElement("span", {className: "count"}, post.counts.children), 
								React.createElement("i", {className: "icon-insert-comment"}), 
								participants
							)
						)
					)
				)
			)
		);
	}
});

module.exports = React.createClass({displayName: 'exports',
	getInitialState: function () {
		return { EOF: false };
	},
	componentWillMount: function () {
		var update = function (model, xhr) {
			this.forceUpdate(function(){});
			this.hasUpdated = true;
		}
		var eof = function (model, xhr) {
			this.setState({ EOF: true });
			console.log('eof')
		}
		var reset = function (model, xhr) {
			// console.log('update')
			this.checkedItems = {}
			this.forceUpdate(function(){});
			this.hasUpdated = true;
		}
		this.checkedItems = {};
		app.postList.on('add Achange remove', update.bind(this));
		app.postList.on('reset', reset.bind(this));
		app.postList.on('eof', eof.bind(this));
	},
	componentDidMount: function () {
		if (this.props.wall) {
			// Defer to prevent miscalculating cards' width
			setTimeout(function () {
				$(this.refs.stream.getDOMNode()).AwesomeGrid({
					rowSpacing  : 30,    	// row gutter spacing
					colSpacing  : 30,    	// column gutter spacing
					initSpacing : 20,     // apply column spacing for the first elements
					mobileSpacing: 10,
					responsive  : true,  	// itching for responsiveness?
					fadeIn      : true,// allow fadeIn effect for an element?
					hiddenClass : false, 	// ignore an element having this class or false for none
					item        : '.card',// item selector to stack on the grid
					onReady     : function(item){},  // callback fired when an element is stacked
					columns     : {
						'defaults': 5,
					    1500: 4,
					    1100: 3,
					    800: 2, // when viewport <= 800, show 2 columns
					    550: 1,
					},
					context: 'self'
				})
			}.bind(this), 400)
		}
	},
	componentDidUpdate: function () {
		if (this.props.wall) {
			if (_.isEmpty(this.checkedItems)) { // updating
				// console.log('refreshed', this.checkedItems)
				$(this.refs.stream.getDOMNode()).trigger('ag-refresh');
				var ni = $(this.refs.stream.getDOMNode()).find('> .card, > .hcard');
				for (var i=0; i<ni.length; ++i) {
					var key = $(ni[i]).data('reactid');
					this.checkedItems[key] = true;
				}
			} else if (this.props.wall) {
				var ni = $(this.refs.stream.getDOMNode()).find('> .card, > .hcard');
				for (var i=0; i<ni.length; ++i) {
					var key = $(ni[i]).data('reactid');
					if (this.checkedItems[key])
						continue;
					this.checkedItems[key] = true;
					$(this.refs.stream.getDOMNode()).trigger('ag-refresh-one', ni[i]);
				}
			}
		}
	},
	render: function () {
		var cards = app.postList.map(function (doc) {
			if (this.props.type == 'Problem') {
				return (
					React.createElement(ListItem2, {model: doc, key: doc.id})
				);
			}
			if (this.props.wall)
				return React.createElement(Card, {model: doc, key: doc.id})
			else
				return React.createElement(ListItem2, {model: doc, key: doc.id})
		}.bind(this));
		if (app.postList.length) {
			return (
				React.createElement("div", {ref: "stream", className: "stream"}, 
					cards, 
					
						this.state.EOF?
						React.createElement("div", {className: "stream-msg eof"}, 
							"EOF."
						)
						:React.createElement("div", {className: "stream-msg"}, 
							React.createElement("span", {style: {float:'right',display:'none'}, id: "stream-load-indicator", className: "loader"}, React.createElement("span", {className: "loader-inner"}))
						)
					
				)
			);
		} else {
			return (
				React.createElement("div", {ref: "stream", className: "stream"}, 
					
						this.hasUpdated?
						React.createElement("div", {className: "stream-msg"}, 
							"Nenhum resultado por aqui. ", React.createElement("i", {className: "icon-sad"})
						)
						:React.createElement("div", {className: "stream-msg"}, 
							"Carregando..."
						)
					
				)
			);
		}
	},
});
},{"awesome-grid":27,"jquery":36,"lodash":39,"react":45}],27:[function(require,module,exports){
/*
The MIT License (MIT)

AwesomeGrid v1.0.1

Copyright (c) 2014 M. Kamal Khan <http://bhittani.com/jquery/awesome-grid/>

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in
all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
THE SOFTWARE.
*/

// Modified for QI Labs

(function($){
    "use strict";

    var AwesomeGridObj = {

        _widthGrid : 0,
        _widthItem : 0,
        _ColumnsArr : [],
        _Columns : [],
        _$items : null,

        init : function(options, elem)
        {
            var self = this;
            self.elem = elem;
            self.$elem = $(elem);
            self.options = $.extend({}, $.fn.AwesomeGrid.options, options);

            self._ColumnsArr = self.sortCols(self.options.columns);

            self.extract();
            self.layout();

            if(self.options.responsive)
            {
                $(window).resize(function(){
                    self.extract();
                    self.layout();
                });
            }

            // listen for new items...
            self.$elem.on('ag-add', function(event, item){
                self.$elem.append(item);
                self.add_one(item);
            });
            self.$elem.on('ag-refresh-one', function(event, item){
                self.add_one($(item));
            });
            self.$elem.on('ag-refresh', function (event, item) {
                self.extract();
                self.layout();
            });
        },

        sortCols : function(columns)
        {
            var results = [];

            for (var e in columns)
            if (columns.hasOwnProperty(e) && !isNaN(parseInt(e))) {
                results.push([parseInt(e), columns[e]]);
            }

            results.sort(function (a, b) {
                return a[0] < b[0];
            });

            if (columns.defaults)
                results.push(columns.defaults);

            return results;
        },

        get_columns : function()
        // Get amount of columns to use
        {
            var self = this;

            var C = self._ColumnsArr;
            var columns = C[C.length - 1];
            var context = self.options.context == 'self'
                ? self.$elem.width()
                : window.innerWidth;
            for(var i = 0; i < C.length; i++)
            {
                if(C[i][0] && (context <= C[i][0]))
                {
                    columns = C[i][1];
                }
            }

            return columns;
        },

        extract : function()
        // Set columns positions (through self._Columns)
        {
            var self = this;
            self._$items = $(' > ' + self.options.item, self.$elem);
            self._widthGrid = self.$elem.innerWidth();
            var columns = self.get_columns();
            var space = self.options.colSpacing;
            self._widthItem = Math.floor((space + self._widthGrid - (columns * space)) / columns);
            var left = 0;
            self._Columns = [];
            for(var i = 0; i < columns; i++)
            {
                self._Columns[i] = {
                    'height' : 0,
                    'left' : left + 'px'
                };
                left += self._widthItem + self.options.colSpacing;
            }
            self.$elem.css('position', 'relative');
        },

        smallest : function()
        // Get smallest column
        {
            var self = this;
            var index = 0;
            var value = self._Columns.length > 0 ? self._Columns[0].height : 0;
            for(var i = 0; i < self._Columns.length; i++)
            {
                if(self._Columns[i].height < value)
                {
                    index = i;
                    value = self._Columns[i].height;
                }
            }
            return index;
        },

        largest : function(Arr)
        {
            var self = this;
            var index = 0;
            var value = Arr[0];
            for(var i = 0; i < Arr.length; i++)
            {
                if(self._Columns[Arr[i]].height > value)
                {
                    index = i;
                    value = self._Columns[Arr[i]].height;
                }
            }
            return index;
        },

        layout : function()
        // Refresh layout (add_one for all)
        {
            var self = this;
            self._$items.each(function(index, element){
                self.add_one($(this));
            });
        },

        add_one : function(item)
        {
            var self = this;
            var top, size, I;
            if(!(self.options.hiddenClass && item.hasClass(self.options.hiddenClass)))
            {
                item.outerWidth(self._widthItem);
                I = [];
                I[0] = self.smallest();
                size = item.data('x');
                if(size)
                {
                    size = (size >= self._Columns.length) ? self._Columns.length : size;
                    item.outerWidth( (self._widthItem * size) + ((size-1)*self.options.colSpacing));
                    if((I[0] + size) >= self._Columns.length)
                    {
                        I[0] -= (I[0] + size - self._Columns.length);
                    }
                    for(var i = 1; i < size; i++)
                    {
                        I[i] = I[i-1]+1;
                    }
                }

                if (self._Columns.length > 1) {
                    top = self._Columns[I[self.largest(I)]].height
                        + (self._Columns[I[self.largest(I)]].height == 0
                           ? self.options.initSpacing
                           : self.options.rowSpacing);
                }
                else {
                    // Use little row spacing for when there's only one column (for mobile)
                    top = self._Columns[I[self.largest(I)]].height + self.options.mobileSpacing;
                }
                item.css({
                    position : 'absolute',
                    left : self._Columns[I[0]].left,
                    top : top +'px'
                }).addClass('ag-col-'+(I[0]+1));

                for(var x = 0; x < I.length; x++)
                // Runs more than once only if data-x is set.
                {
                    self._Columns[I[x]].height = top + item.outerHeight();
                }

                // Get max height.
                var max = 0;
                for (var i=0; i<self._Columns.length; ++i) {
                    if (self._Columns[i].height > max)
                        max = self._Columns[i].height;
                }
                self.$elem.height(max);

                if(self.options.fadeIn)
                {
                    item.fadeIn('fast');
                }

                if(self.options.onReady)
                {
                    self.options.onReady(item);
                }
            }
        }

    };

    $.fn.AwesomeGrid = function(options) {
        return this.each(function(){
            var Obj = function(){
                function F(){};
                F.prototype = AwesomeGridObj;
                return new F();
            }();
            Obj.init(options, this);
        });
    };

    $.fn.AwesomeGrid.options = {
        rowSpacing  : 20,
        colSpacing  : 20,
        initSpacing : 0,
        mobileSpacing: 10,
        columns     : 2,
        context     : 'window',
        responsive  : true,
        fadeIn      : true,
        hiddenClass : false,
        item        : 'li',
        onReady     : function(item){}
    };

})(jQuery);
},{}],28:[function(require,module,exports){
(function(t,e){if(typeof define==="function"&&define.amd){define(["lodash","jquery","exports"],function(i,r,s){t.Backbone=e(t,s,i,r)})}else if(typeof exports!=="undefined"){var i=require("lodash");e(t,exports,i)}else{t.Backbone=e(t,{},t._,t.jQuery||t.Zepto||t.ender||t.$)}})(this,function(t,e,i,r){var s=t.Backbone;var n=[];var a=n.push;var o=n.slice;var h=n.splice;e.VERSION="1.1.2";e.$=r;e.noConflict=function(){t.Backbone=s;return this};e.emulateHTTP=false;e.emulateJSON=false;var u=e.Events={on:function(t,e,i){if(!c(this,"on",t,[e,i])||!e)return this;this._events||(this._events={});var r=this._events[t]||(this._events[t]=[]);r.push({callback:e,context:i,ctx:i||this});return this},once:function(t,e,r){if(!c(this,"once",t,[e,r])||!e)return this;var s=this;var n=i.once(function(){s.off(t,n);e.apply(this,arguments)});n._callback=e;return this.on(t,n,r)},off:function(t,e,r){var s,n,a,o,h,u,l,f;if(!this._events||!c(this,"off",t,[e,r]))return this;if(!t&&!e&&!r){this._events=void 0;return this}o=t?[t]:i.keys(this._events);for(h=0,u=o.length;h<u;h++){t=o[h];if(a=this._events[t]){this._events[t]=s=[];if(e||r){for(l=0,f=a.length;l<f;l++){n=a[l];if(e&&e!==n.callback&&e!==n.callback._callback||r&&r!==n.context){s.push(n)}}}if(!s.length)delete this._events[t]}}return this},trigger:function(t){if(!this._events)return this;var e=o.call(arguments,1);if(!c(this,"trigger",t,e))return this;var i=this._events[t];var r=this._events.all;if(i)f(i,e);if(r)f(r,arguments);return this},stopListening:function(t,e,r){var s=this._listeningTo;if(!s)return this;var n=!e&&!r;if(!r&&typeof e==="object")r=this;if(t)(s={})[t._listenId]=t;for(var a in s){t=s[a];t.off(e,r,this);if(n||i.isEmpty(t._events))delete this._listeningTo[a]}return this}};var l=/\s+/;var c=function(t,e,i,r){if(!i)return true;if(typeof i==="object"){for(var s in i){t[e].apply(t,[s,i[s]].concat(r))}return false}if(l.test(i)){var n=i.split(l);for(var a=0,o=n.length;a<o;a++){t[e].apply(t,[n[a]].concat(r))}return false}return true};var f=function(t,e){var i,r=-1,s=t.length,n=e[0],a=e[1],o=e[2];switch(e.length){case 0:while(++r<s)(i=t[r]).callback.call(i.ctx);return;case 1:while(++r<s)(i=t[r]).callback.call(i.ctx,n);return;case 2:while(++r<s)(i=t[r]).callback.call(i.ctx,n,a);return;case 3:while(++r<s)(i=t[r]).callback.call(i.ctx,n,a,o);return;default:while(++r<s)(i=t[r]).callback.apply(i.ctx,e);return}};var d={listenTo:"on",listenToOnce:"once"};i.each(d,function(t,e){u[e]=function(e,r,s){var n=this._listeningTo||(this._listeningTo={});var a=e._listenId||(e._listenId=i.uniqueId("l"));n[a]=e;if(!s&&typeof r==="object")s=this;e[t](r,s,this);return this}});u.bind=u.on;u.unbind=u.off;i.extend(e,u);var p=e.Model=function(t,e){var r=t||{};e||(e={});this.cid=i.uniqueId("c");this.attributes={};if(e.collection)this.collection=e.collection;if(e.parse)r=this.parse(r,e)||{};r=i.defaults({},r,i.result(this,"defaults"));this.set(r,e);this.changed={};this.initialize.apply(this,arguments)};i.extend(p.prototype,u,{changed:null,validationError:null,idAttribute:"id",initialize:function(){},toJSON:function(t){return i.clone(this.attributes)},sync:function(){return e.sync.apply(this,arguments)},get:function(t){return this.attributes[t]},escape:function(t){return i.escape(this.get(t))},has:function(t){return this.get(t)!=null},set:function(t,e,r){var s,n,a,o,h,u,l,c;if(t==null)return this;if(typeof t==="object"){n=t;r=e}else{(n={})[t]=e}r||(r={});if(!this._validate(n,r))return false;a=r.unset;h=r.silent;o=[];u=this._changing;this._changing=true;if(!u){this._previousAttributes=i.clone(this.attributes);this.changed={}}c=this.attributes,l=this._previousAttributes;if(this.idAttribute in n)this.id=n[this.idAttribute];for(s in n){e=n[s];if(!i.isEqual(c[s],e))o.push(s);if(!i.isEqual(l[s],e)){this.changed[s]=e}else{delete this.changed[s]}a?delete c[s]:c[s]=e}if(!h){if(o.length)this._pending=r;for(var f=0,d=o.length;f<d;f++){this.trigger("change:"+o[f],this,c[o[f]],r)}}if(u)return this;if(!h){while(this._pending){r=this._pending;this._pending=false;this.trigger("change",this,r)}}this._pending=false;this._changing=false;return this},unset:function(t,e){return this.set(t,void 0,i.extend({},e,{unset:true}))},clear:function(t){var e={};for(var r in this.attributes)e[r]=void 0;return this.set(e,i.extend({},t,{unset:true}))},hasChanged:function(t){if(t==null)return!i.isEmpty(this.changed);return i.has(this.changed,t)},changedAttributes:function(t){if(!t)return this.hasChanged()?i.clone(this.changed):false;var e,r=false;var s=this._changing?this._previousAttributes:this.attributes;for(var n in t){if(i.isEqual(s[n],e=t[n]))continue;(r||(r={}))[n]=e}return r},previous:function(t){if(t==null||!this._previousAttributes)return null;return this._previousAttributes[t]},previousAttributes:function(){return i.clone(this._previousAttributes)},fetch:function(t){t=t?i.clone(t):{};if(t.parse===void 0)t.parse=true;var e=this;var r=t.success;t.success=function(i){if(!e.set(e.parse(i,t),t))return false;if(r)r(e,i,t);e.trigger("sync",e,i,t)};q(this,t);return this.sync("read",this,t)},save:function(t,e,r){var s,n,a,o=this.attributes;if(t==null||typeof t==="object"){s=t;r=e}else{(s={})[t]=e}r=i.extend({validate:true},r);if(s&&!r.wait){if(!this.set(s,r))return false}else{if(!this._validate(s,r))return false}if(s&&r.wait){this.attributes=i.extend({},o,s)}if(r.parse===void 0)r.parse=true;var h=this;var u=r.success;r.success=function(t){h.attributes=o;var e=h.parse(t,r);if(r.wait)e=i.extend(s||{},e);if(i.isObject(e)&&!h.set(e,r)){return false}if(u)u(h,t,r);h.trigger("sync",h,t,r)};q(this,r);n=this.isNew()?"create":r.patch?"patch":"update";if(n==="patch")r.attrs=s;a=this.sync(n,this,r);if(s&&r.wait)this.attributes=o;return a},destroy:function(t){t=t?i.clone(t):{};var e=this;var r=t.success;var s=function(){e.trigger("destroy",e,e.collection,t)};t.success=function(i){if(t.wait||e.isNew())s();if(r)r(e,i,t);if(!e.isNew())e.trigger("sync",e,i,t)};if(this.isNew()){t.success();return false}q(this,t);var n=this.sync("delete",this,t);if(!t.wait)s();return n},url:function(){var t=i.result(this,"urlRoot")||i.result(this.collection,"url")||M();if(this.isNew())return t;return t.replace(/([^\/])$/,"$1/")+encodeURIComponent(this.id)},parse:function(t,e){return t},clone:function(){return new this.constructor(this.attributes)},isNew:function(){return!this.has(this.idAttribute)},isValid:function(t){return this._validate({},i.extend(t||{},{validate:true}))},_validate:function(t,e){if(!e.validate||!this.validate)return true;t=i.extend({},this.attributes,t);var r=this.validationError=this.validate(t,e)||null;if(!r)return true;this.trigger("invalid",this,r,i.extend(e,{validationError:r}));return false}});var v=["keys","values","pairs","invert","pick","omit"];i.each(v,function(t){p.prototype[t]=function(){var e=o.call(arguments);e.unshift(this.attributes);return i[t].apply(i,e)}});var g=e.Collection=function(t,e){e||(e={});if(e.model)this.model=e.model;if(e.comparator!==void 0)this.comparator=e.comparator;this._reset();this.initialize.apply(this,arguments);if(t)this.reset(t,i.extend({silent:true},e))};var m={add:true,remove:true,merge:true};var y={add:true,remove:false};i.extend(g.prototype,u,{model:p,initialize:function(){},toJSON:function(t){return this.map(function(e){return e.toJSON(t)})},sync:function(){return e.sync.apply(this,arguments)},add:function(t,e){return this.set(t,i.extend({merge:false},e,y))},remove:function(t,e){var r=!i.isArray(t);t=r?[t]:i.clone(t);e||(e={});var s,n,a,o;for(s=0,n=t.length;s<n;s++){o=t[s]=this.get(t[s]);if(!o)continue;delete this._byId[o.id];delete this._byId[o.cid];a=this.indexOf(o);this.models.splice(a,1);this.length--;if(!e.silent){e.index=a;o.trigger("remove",o,this,e)}this._removeReference(o,e)}return r?t[0]:t},set:function(t,e){e=i.defaults({},e,m);if(e.parse)t=this.parse(t,e);var r=!i.isArray(t);t=r?t?[t]:[]:i.clone(t);var s,n,a,o,h,u,l;var c=e.at;var f=this.model;var d=this.comparator&&c==null&&e.sort!==false;var v=i.isString(this.comparator)?this.comparator:null;var g=[],y=[],_={};var b=e.add,w=e.merge,x=e.remove;var E=!d&&b&&x?[]:false;for(s=0,n=t.length;s<n;s++){h=t[s]||{};if(h instanceof p){a=o=h}else{a=h[f.prototype.idAttribute||"id"]}if(u=this.get(a)){if(x)_[u.cid]=true;if(w){h=h===o?o.attributes:h;if(e.parse)h=u.parse(h,e);u.set(h,e);if(d&&!l&&u.hasChanged(v))l=true}t[s]=u}else if(b){o=t[s]=this._prepareModel(h,e);if(!o)continue;g.push(o);this._addReference(o,e)}o=u||o;if(E&&(o.isNew()||!_[o.id]))E.push(o);_[o.id]=true}if(x){for(s=0,n=this.length;s<n;++s){if(!_[(o=this.models[s]).cid])y.push(o)}if(y.length)this.remove(y,e)}if(g.length||E&&E.length){if(d)l=true;this.length+=g.length;if(c!=null){for(s=0,n=g.length;s<n;s++){this.models.splice(c+s,0,g[s])}}else{if(E)this.models.length=0;var k=E||g;for(s=0,n=k.length;s<n;s++){this.models.push(k[s])}}}if(l)this.sort({silent:true});if(!e.silent){for(s=0,n=g.length;s<n;s++){(o=g[s]).trigger("add",o,this,e)}if(l||E&&E.length)this.trigger("sort",this,e)}return r?t[0]:t},reset:function(t,e){e||(e={});for(var r=0,s=this.models.length;r<s;r++){this._removeReference(this.models[r],e)}e.previousModels=this.models;this._reset();t=this.add(t,i.extend({silent:true},e));if(!e.silent)this.trigger("reset",this,e);return t},push:function(t,e){return this.add(t,i.extend({at:this.length},e))},pop:function(t){var e=this.at(this.length-1);this.remove(e,t);return e},unshift:function(t,e){return this.add(t,i.extend({at:0},e))},shift:function(t){var e=this.at(0);this.remove(e,t);return e},slice:function(){return o.apply(this.models,arguments)},get:function(t){if(t==null)return void 0;return this._byId[t]||this._byId[t.id]||this._byId[t.cid]},at:function(t){return this.models[t]},where:function(t,e){if(i.isEmpty(t))return e?void 0:[];return this[e?"find":"filter"](function(e){for(var i in t){if(t[i]!==e.get(i))return false}return true})},findWhere:function(t){return this.where(t,true)},sort:function(t){if(!this.comparator)throw new Error("Cannot sort a set without a comparator");t||(t={});if(i.isString(this.comparator)||this.comparator.length===1){this.models=this.sortBy(this.comparator,this)}else{this.models.sort(i.bind(this.comparator,this))}if(!t.silent)this.trigger("sort",this,t);return this},pluck:function(t){return i.invoke(this.models,"get",t)},fetch:function(t){t=t?i.clone(t):{};if(t.parse===void 0)t.parse=true;var e=t.success;var r=this;t.success=function(i){var s=t.reset?"reset":"set";r[s](i,t);if(e)e(r,i,t);r.trigger("sync",r,i,t)};q(this,t);return this.sync("read",this,t)},create:function(t,e){e=e?i.clone(e):{};if(!(t=this._prepareModel(t,e)))return false;if(!e.wait)this.add(t,e);var r=this;var s=e.success;e.success=function(t,i){if(e.wait)r.add(t,e);if(s)s(t,i,e)};t.save(null,e);return t},parse:function(t,e){return t},clone:function(){return new this.constructor(this.models)},_reset:function(){this.length=0;this.models=[];this._byId={}},_prepareModel:function(t,e){if(t instanceof p)return t;e=e?i.clone(e):{};e.collection=this;var r=new this.model(t,e);if(!r.validationError)return r;this.trigger("invalid",this,r.validationError,e);return false},_addReference:function(t,e){this._byId[t.cid]=t;if(t.id!=null)this._byId[t.id]=t;if(!t.collection)t.collection=this;t.on("all",this._onModelEvent,this)},_removeReference:function(t,e){if(this===t.collection)delete t.collection;t.off("all",this._onModelEvent,this)},_onModelEvent:function(t,e,i,r){if((t==="add"||t==="remove")&&i!==this)return;if(t==="destroy")this.remove(e,r);if(e&&t==="change:"+e.idAttribute){delete this._byId[e.previous(e.idAttribute)];if(e.id!=null)this._byId[e.id]=e}this.trigger.apply(this,arguments)}});var _=["forEach","each","map","collect","reduce","foldl","inject","reduceRight","foldr","find","detect","filter","select","reject","every","all","some","any","include","contains","invoke","max","min","toArray","size","first","head","take","initial","rest","tail","drop","last","without","difference","indexOf","shuffle","lastIndexOf","isEmpty","chain","sample"];i.each(_,function(t){g.prototype[t]=function(){var e=o.call(arguments);e.unshift(this.models);return i[t].apply(i,e)}});var b=["groupBy","countBy","sortBy","indexBy"];i.each(b,function(t){g.prototype[t]=function(e,r){var s=i.isFunction(e)?e:function(t){return t.get(e)};return i[t](this.models,s,r)}});var w=e.View=function(t){this.cid=i.uniqueId("view");t||(t={});i.extend(this,i.pick(t,E));this._ensureElement();this.initialize.apply(this,arguments);this.delegateEvents()};var x=/^(\S+)\s*(.*)$/;var E=["model","collection","el","id","attributes","className","tagName","events"];i.extend(w.prototype,u,{tagName:"div",$:function(t){return this.$el.find(t)},initialize:function(){},render:function(){return this},remove:function(){this.$el.remove();this.stopListening();return this},setElement:function(t,i){if(this.$el)this.undelegateEvents();this.$el=t instanceof e.$?t:e.$(t);this.el=this.$el[0];if(i!==false)this.delegateEvents();return this},delegateEvents:function(t){if(!(t||(t=i.result(this,"events"))))return this;this.undelegateEvents();for(var e in t){var r=t[e];if(!i.isFunction(r))r=this[t[e]];if(!r)continue;var s=e.match(x);var n=s[1],a=s[2];r=i.bind(r,this);n+=".delegateEvents"+this.cid;if(a===""){this.$el.on(n,r)}else{this.$el.on(n,a,r)}}return this},undelegateEvents:function(){this.$el.off(".delegateEvents"+this.cid);return this},_ensureElement:function(){if(!this.el){var t=i.extend({},i.result(this,"attributes"));if(this.id)t.id=i.result(this,"id");if(this.className)t["class"]=i.result(this,"className");var r=e.$("<"+i.result(this,"tagName")+">").attr(t);this.setElement(r,false)}else{this.setElement(i.result(this,"el"),false)}}});e.sync=function(t,r,s){var n=T[t];i.defaults(s||(s={}),{emulateHTTP:e.emulateHTTP,emulateJSON:e.emulateJSON});var a={type:n,dataType:"json"};if(!s.url){a.url=i.result(r,"url")||M()}if(s.data==null&&r&&(t==="create"||t==="update"||t==="patch")){a.contentType="application/json";a.data=JSON.stringify(s.attrs||r.toJSON(s))}if(s.emulateJSON){a.contentType="application/x-www-form-urlencoded";a.data=a.data?{model:a.data}:{}}if(s.emulateHTTP&&(n==="PUT"||n==="DELETE"||n==="PATCH")){a.type="POST";if(s.emulateJSON)a.data._method=n;var o=s.beforeSend;s.beforeSend=function(t){t.setRequestHeader("X-HTTP-Method-Override",n);if(o)return o.apply(this,arguments)}}if(a.type!=="GET"&&!s.emulateJSON){a.processData=false}if(a.type==="PATCH"&&k){a.xhr=function(){return new ActiveXObject("Microsoft.XMLHTTP")}}var h=s.xhr=e.ajax(i.extend(a,s));r.trigger("request",r,h,s);return h};var k=typeof window!=="undefined"&&!!window.ActiveXObject&&!(window.XMLHttpRequest&&(new XMLHttpRequest).dispatchEvent);var T={create:"POST",update:"PUT",patch:"PATCH","delete":"DELETE",read:"GET"};e.ajax=function(){return e.$.ajax.apply(e.$,arguments)};var $=e.Router=function(t){t||(t={});if(t.routes)this.routes=t.routes;this._bindRoutes();this.initialize.apply(this,arguments)};var S=/\((.*?)\)/g;var H=/(\(\?)?:\w+/g;var A=/\*\w+/g;var I=/[\-{}\[\]+?.,\\\^$|#\s]/g;i.extend($.prototype,u,{initialize:function(){},route:function(t,r,s){if(!i.isRegExp(t))t=this._routeToRegExp(t);if(i.isFunction(r)){s=r;r=""}if(!s)s=this[r];var n=this;e.history.route(t,function(i){var a=n._extractParameters(t,i);n.execute(s,a);n.trigger.apply(n,["route:"+r].concat(a));n.trigger("route",r,a);e.history.trigger("route",n,r,a)});return this},execute:function(t,e){if(t)t.apply(this,e)},navigate:function(t,i){e.history.navigate(t,i);return this},_bindRoutes:function(){if(!this.routes)return;this.routes=i.result(this,"routes");var t,e=i.keys(this.routes);while((t=e.pop())!=null){this.route(t,this.routes[t])}},_routeToRegExp:function(t){t=t.replace(I,"\\$&").replace(S,"(?:$1)?").replace(H,function(t,e){return e?t:"([^/?]+)"}).replace(A,"([^?]*?)");return new RegExp("^"+t+"(?:\\?([\\s\\S]*))?$")},_extractParameters:function(t,e){var r=t.exec(e).slice(1);return i.map(r,function(t,e){if(e===r.length-1)return t||null;return t?decodeURIComponent(t):null})}});var N=e.History=function(){this.handlers=[];i.bindAll(this,"checkUrl");if(typeof window!=="undefined"){this.location=window.location;this.history=window.history}};var R=/^[#\/]|\s+$/g;var O=/^\/+|\/+$/g;var P=/msie [\w.]+/;var C=/\/$/;var j=/#.*$/;N.started=false;i.extend(N.prototype,u,{interval:50,atRoot:function(){return this.location.pathname.replace(/[^\/]$/,"$&/")===this.root},getHash:function(t){var e=(t||this).location.href.match(/#(.*)$/);return e?e[1]:""},getFragment:function(t,e){if(t==null){if(this._hasPushState||!this._wantsHashChange||e){t=decodeURI(this.location.pathname+this.location.search);var i=this.root.replace(C,"");if(!t.indexOf(i))t=t.slice(i.length)}else{t=this.getHash()}}return t.replace(R,"")},start:function(t){if(N.started)throw new Error("Backbone.history has already been started");N.started=true;this.options=i.extend({root:"/"},this.options,t);this.root=this.options.root;this._wantsHashChange=this.options.hashChange!==false;this._wantsPushState=!!this.options.pushState;this._hasPushState=!!(this.options.pushState&&this.history&&this.history.pushState);var r=this.getFragment();var s=document.documentMode;var n=P.exec(navigator.userAgent.toLowerCase())&&(!s||s<=7);this.root=("/"+this.root+"/").replace(O,"/");if(n&&this._wantsHashChange){var a=e.$('<iframe src="javascript:0" tabindex="-1">');this.iframe=a.hide().appendTo("body")[0].contentWindow;this.navigate(r)}if(this._hasPushState){e.$(window).on("popstate",this.checkUrl)}else if(this._wantsHashChange&&"onhashchange"in window&&!n){e.$(window).on("hashchange",this.checkUrl)}else if(this._wantsHashChange){this._checkUrlInterval=setInterval(this.checkUrl,this.interval)}this.fragment=r;var o=this.location;if(this._wantsHashChange&&this._wantsPushState){if(!this._hasPushState&&!this.atRoot()){this.fragment=this.getFragment(null,true);this.location.replace(this.root+"#"+this.fragment);return true}else if(this._hasPushState&&this.atRoot()&&o.hash){this.fragment=this.getHash().replace(R,"");this.history.replaceState({},document.title,this.root+this.fragment)}}if(!this.options.silent)return this.loadUrl()},stop:function(){e.$(window).off("popstate",this.checkUrl).off("hashchange",this.checkUrl);if(this._checkUrlInterval)clearInterval(this._checkUrlInterval);N.started=false},route:function(t,e){this.handlers.unshift({route:t,callback:e})},checkUrl:function(t){var e=this.getFragment();if(e===this.fragment&&this.iframe){e=this.getFragment(this.getHash(this.iframe))}if(e===this.fragment)return false;if(this.iframe)this.navigate(e);this.loadUrl()},loadUrl:function(t){t=this.fragment=this.getFragment(t);return i.any(this.handlers,function(e){if(e.route.test(t)){e.callback(t);return true}})},navigate:function(t,e){if(!N.started)return false;if(!e||e===true)e={trigger:!!e};var i=this.root+(t=this.getFragment(t||""));t=t.replace(j,"");if(this.fragment===t)return;this.fragment=t;if(t===""&&i!=="/")i=i.slice(0,-1);if(this._hasPushState){this.history[e.replace?"replaceState":"pushState"]({},document.title,i)}else if(this._wantsHashChange){this._updateHash(this.location,t,e.replace);if(this.iframe&&t!==this.getFragment(this.getHash(this.iframe))){if(!e.replace)this.iframe.document.open().close();this._updateHash(this.iframe.location,t,e.replace)}}else{return this.location.assign(i)}if(e.trigger)return this.loadUrl(t)},_updateHash:function(t,e,i){if(i){var r=t.href.replace(/(javascript:|#).*$/,"");t.replace(r+"#"+e)}else{t.hash="#"+e}}});e.history=new N;var U=function(t,e){var r=this;var s;if(t&&i.has(t,"constructor")){s=t.constructor}else{s=function(){return r.apply(this,arguments)}}i.extend(s,r,e);var n=function(){this.constructor=s};n.prototype=r.prototype;s.prototype=new n;if(t)i.extend(s.prototype,t);s.__super__=r.prototype;return s};p.extend=g.extend=$.extend=w.extend=N.extend=U;var M=function(){throw new Error('A "url" property or function must be specified')};var q=function(t,e){var i=e.error;e.error=function(r){if(i)i(t,r,e);t.trigger("error",t,r,e)}};return e});
},{"lodash":39}],29:[function(require,module,exports){
/* ========================================================================
 * bootstrap-tour - v0.10.1
 * http://bootstraptour.com
 * ========================================================================
 * Copyright 2012-2013 Ulrich Sossou
 *
 * ========================================================================
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 * ========================================================================
 */

+function(t){"use strict";function e(e){return this.each(function(){var n=t(this),i=n.data("bs.tooltip"),r="object"==typeof e&&e;(i||"destroy"!=e)&&(i||n.data("bs.tooltip",i=new o(this,r)),"string"==typeof e&&i[e]())})}var o=function(t,e){this.type=this.options=this.enabled=this.timeout=this.hoverState=this.$element=null,this.init("tooltip",t,e)};o.VERSION="3.2.0",o.DEFAULTS={animation:!0,placement:"top",selector:!1,template:'<div class="tooltip" role="tooltip"><div class="tooltip-arrow"></div><div class="tooltip-inner"></div></div>',trigger:"hover focus",title:"",delay:0,html:!1,container:!1,viewport:{selector:"body",padding:0}},o.prototype.init=function(e,o,n){this.enabled=!0,this.type=e,this.$element=t(o),this.options=this.getOptions(n),this.$viewport=this.options.viewport&&t(this.options.viewport.selector||this.options.viewport);for(var i=this.options.trigger.split(" "),r=i.length;r--;){var s=i[r];if("click"==s)this.$element.on("click."+this.type,this.options.selector,t.proxy(this.toggle,this));else if("manual"!=s){var a="hover"==s?"mouseenter":"focusin",p="hover"==s?"mouseleave":"focusout";this.$element.on(a+"."+this.type,this.options.selector,t.proxy(this.enter,this)),this.$element.on(p+"."+this.type,this.options.selector,t.proxy(this.leave,this))}}this.options.selector?this._options=t.extend({},this.options,{trigger:"manual",selector:""}):this.fixTitle()},o.prototype.getDefaults=function(){return o.DEFAULTS},o.prototype.getOptions=function(e){return e=t.extend({},this.getDefaults(),this.$element.data(),e),e.delay&&"number"==typeof e.delay&&(e.delay={show:e.delay,hide:e.delay}),e},o.prototype.getDelegateOptions=function(){var e={},o=this.getDefaults();return this._options&&t.each(this._options,function(t,n){o[t]!=n&&(e[t]=n)}),e},o.prototype.enter=function(e){var o=e instanceof this.constructor?e:t(e.currentTarget).data("bs."+this.type);return o||(o=new this.constructor(e.currentTarget,this.getDelegateOptions()),t(e.currentTarget).data("bs."+this.type,o)),clearTimeout(o.timeout),o.hoverState="in",o.options.delay&&o.options.delay.show?(o.timeout=setTimeout(function(){"in"==o.hoverState&&o.show()},o.options.delay.show),void 0):o.show()},o.prototype.leave=function(e){var o=e instanceof this.constructor?e:t(e.currentTarget).data("bs."+this.type);return o||(o=new this.constructor(e.currentTarget,this.getDelegateOptions()),t(e.currentTarget).data("bs."+this.type,o)),clearTimeout(o.timeout),o.hoverState="out",o.options.delay&&o.options.delay.hide?(o.timeout=setTimeout(function(){"out"==o.hoverState&&o.hide()},o.options.delay.hide),void 0):o.hide()},o.prototype.show=function(){var e=t.Event("show.bs."+this.type);if(this.hasContent()&&this.enabled){this.$element.trigger(e);var o=t.contains(document.documentElement,this.$element[0]);if(e.isDefaultPrevented()||!o)return;var n=this,i=this.tip(),r=this.getUID(this.type);this.setContent(),i.attr("id",r),this.$element.attr("aria-describedby",r),this.options.animation&&i.addClass("fade");var s="function"==typeof this.options.placement?this.options.placement.call(this,i[0],this.$element[0]):this.options.placement,a=/\s?auto?\s?/i,p=a.test(s);p&&(s=s.replace(a,"")||"top"),i.detach().css({top:0,left:0,display:"block"}).addClass(s).data("bs."+this.type,this),this.options.container?i.appendTo(this.options.container):i.insertAfter(this.$element);var h=this.getPosition(),l=i[0].offsetWidth,u=i[0].offsetHeight;if(p){var c=s,d=this.$element.parent(),f=this.getPosition(d);s="bottom"==s&&h.top+h.height+u-f.scroll>f.height?"top":"top"==s&&h.top-f.scroll-u<0?"bottom":"right"==s&&h.right+l>f.width?"left":"left"==s&&h.left-l<f.left?"right":s,i.removeClass(c).addClass(s)}var m=this.getCalculatedOffset(s,h,l,u);this.applyPlacement(m,s);var v=function(){n.$element.trigger("shown.bs."+n.type),n.hoverState=null};t.support.transition&&this.$tip.hasClass("fade")?i.one("bsTransitionEnd",v).emulateTransitionEnd(150):v()}},o.prototype.applyPlacement=function(e,o){var n=this.tip(),i=n[0].offsetWidth,r=n[0].offsetHeight,s=parseInt(n.css("margin-top"),10),a=parseInt(n.css("margin-left"),10);isNaN(s)&&(s=0),isNaN(a)&&(a=0),e.top=e.top+s,e.left=e.left+a,t.offset.setOffset(n[0],t.extend({using:function(t){n.css({top:Math.round(t.top),left:Math.round(t.left)})}},e),0),n.addClass("in");var p=n[0].offsetWidth,h=n[0].offsetHeight;"top"==o&&h!=r&&(e.top=e.top+r-h);var l=this.getViewportAdjustedDelta(o,e,p,h);l.left?e.left+=l.left:e.top+=l.top;var u=l.left?2*l.left-i+p:2*l.top-r+h,c=l.left?"left":"top",d=l.left?"offsetWidth":"offsetHeight";n.offset(e),this.replaceArrow(u,n[0][d],c)},o.prototype.replaceArrow=function(t,e,o){this.arrow().css(o,t?50*(1-t/e)+"%":"")},o.prototype.setContent=function(){var t=this.tip(),e=this.getTitle();t.find(".tooltip-inner")[this.options.html?"html":"text"](e),t.removeClass("fade in top bottom left right")},o.prototype.hide=function(){function e(){"in"!=o.hoverState&&n.detach(),o.$element.trigger("hidden.bs."+o.type)}var o=this,n=this.tip(),i=t.Event("hide.bs."+this.type);return this.$element.removeAttr("aria-describedby"),this.$element.trigger(i),i.isDefaultPrevented()?void 0:(n.removeClass("in"),t.support.transition&&this.$tip.hasClass("fade")?n.one("bsTransitionEnd",e).emulateTransitionEnd(150):e(),this.hoverState=null,this)},o.prototype.fixTitle=function(){var t=this.$element;(t.attr("title")||"string"!=typeof t.attr("data-original-title"))&&t.attr("data-original-title",t.attr("title")||"").attr("title","")},o.prototype.hasContent=function(){return this.getTitle()},o.prototype.getPosition=function(e){e=e||this.$element;var o=e[0],n="BODY"==o.tagName;return t.extend({},"function"==typeof o.getBoundingClientRect?o.getBoundingClientRect():null,{scroll:n?document.documentElement.scrollTop||document.body.scrollTop:e.scrollTop(),width:n?t(window).width():e.outerWidth(),height:n?t(window).height():e.outerHeight()},n?{top:0,left:0}:e.offset())},o.prototype.getCalculatedOffset=function(t,e,o,n){return"bottom"==t?{top:e.top+e.height,left:e.left+e.width/2-o/2}:"top"==t?{top:e.top-n,left:e.left+e.width/2-o/2}:"left"==t?{top:e.top+e.height/2-n/2,left:e.left-o}:{top:e.top+e.height/2-n/2,left:e.left+e.width}},o.prototype.getViewportAdjustedDelta=function(t,e,o,n){var i={top:0,left:0};if(!this.$viewport)return i;var r=this.options.viewport&&this.options.viewport.padding||0,s=this.getPosition(this.$viewport);if(/right|left/.test(t)){var a=e.top-r-s.scroll,p=e.top+r-s.scroll+n;a<s.top?i.top=s.top-a:p>s.top+s.height&&(i.top=s.top+s.height-p)}else{var h=e.left-r,l=e.left+r+o;h<s.left?i.left=s.left-h:l>s.width&&(i.left=s.left+s.width-l)}return i},o.prototype.getTitle=function(){var t,e=this.$element,o=this.options;return t=e.attr("data-original-title")||("function"==typeof o.title?o.title.call(e[0]):o.title)},o.prototype.getUID=function(t){do t+=~~(1e6*Math.random());while(document.getElementById(t));return t},o.prototype.tip=function(){return this.$tip=this.$tip||t(this.options.template)},o.prototype.arrow=function(){return this.$arrow=this.$arrow||this.tip().find(".tooltip-arrow")},o.prototype.validate=function(){this.$element[0].parentNode||(this.hide(),this.$element=null,this.options=null)},o.prototype.enable=function(){this.enabled=!0},o.prototype.disable=function(){this.enabled=!1},o.prototype.toggleEnabled=function(){this.enabled=!this.enabled},o.prototype.toggle=function(e){var o=this;e&&(o=t(e.currentTarget).data("bs."+this.type),o||(o=new this.constructor(e.currentTarget,this.getDelegateOptions()),t(e.currentTarget).data("bs."+this.type,o))),o.tip().hasClass("in")?o.leave(o):o.enter(o)},o.prototype.destroy=function(){clearTimeout(this.timeout),this.hide().$element.off("."+this.type).removeData("bs."+this.type)};var n=t.fn.tooltip;t.fn.tooltip=e,t.fn.tooltip.Constructor=o,t.fn.tooltip.noConflict=function(){return t.fn.tooltip=n,this}}(jQuery),+function(t){"use strict";function e(e){return this.each(function(){var n=t(this),i=n.data("bs.popover"),r="object"==typeof e&&e;(i||"destroy"!=e)&&(i||n.data("bs.popover",i=new o(this,r)),"string"==typeof e&&i[e]())})}var o=function(t,e){this.init("popover",t,e)};if(!t.fn.tooltip)throw new Error("Popover requires tooltip.js");o.VERSION="3.2.0",o.DEFAULTS=t.extend({},t.fn.tooltip.Constructor.DEFAULTS,{placement:"right",trigger:"click",content:"",template:'<div class="popover" role="tooltip"><div class="arrow"></div><h3 class="popover-title"></h3><div class="popover-content"></div></div>'}),o.prototype=t.extend({},t.fn.tooltip.Constructor.prototype),o.prototype.constructor=o,o.prototype.getDefaults=function(){return o.DEFAULTS},o.prototype.setContent=function(){var t=this.tip(),e=this.getTitle(),o=this.getContent();t.find(".popover-title")[this.options.html?"html":"text"](e),t.find(".popover-content").empty()[this.options.html?"string"==typeof o?"html":"append":"text"](o),t.removeClass("fade top bottom left right in"),t.find(".popover-title").html()||t.find(".popover-title").hide()},o.prototype.hasContent=function(){return this.getTitle()||this.getContent()},o.prototype.getContent=function(){var t=this.$element,e=this.options;return t.attr("data-content")||("function"==typeof e.content?e.content.call(t[0]):e.content)},o.prototype.arrow=function(){return this.$arrow=this.$arrow||this.tip().find(".arrow")},o.prototype.tip=function(){return this.$tip||(this.$tip=t(this.options.template)),this.$tip};var n=t.fn.popover;t.fn.popover=e,t.fn.popover.Constructor=o,t.fn.popover.noConflict=function(){return t.fn.popover=n,this}}(jQuery),function(t,e){var o,n;return n=e.document,o=function(){function o(o){var n;try{n=e.localStorage}catch(i){n=!1}this._options=t.extend({name:"tour",steps:[],container:"body",autoscroll:!0,keyboard:!0,storage:n,debug:!1,backdrop:!1,backdropPadding:0,redirect:!0,orphan:!1,duration:!1,delay:!1,basePath:"",template:'<div class="popover" role="tooltip"> <div class="arrow"></div> <h3 class="popover-title"></h3> <div class="popover-content"></div> <div class="popover-navigation"> <div class="btn-group"> <button class="btn btn-sm btn-default" data-role="prev">&laquo; Prev</button> <button class="btn btn-sm btn-default" data-role="next">Next &raquo;</button> <button class="btn btn-sm btn-default" data-role="pause-resume" data-pause-text="Pause" data-resume-text="Resume">Pause</button> </div> <button class="btn btn-sm btn-default" data-role="end">End tour</button> </div> </div>',afterSetState:function(){},afterGetState:function(){},afterRemoveState:function(){},onStart:function(){},onEnd:function(){},onShow:function(){},onShown:function(){},onHide:function(){},onHidden:function(){},onNext:function(){},onPrev:function(){},onPause:function(){},onResume:function(){}},o),this._force=!1,this._inited=!1,this.backdrop={overlay:null,$element:null,$background:null,backgroundShown:!1,overlayElementShown:!1}}return o.prototype.addSteps=function(t){var e,o,n;for(o=0,n=t.length;n>o;o++)e=t[o],this.addStep(e);return this},o.prototype.addStep=function(t){return this._options.steps.push(t),this},o.prototype.getStep=function(e){return null!=this._options.steps[e]?t.extend({id:"step-"+e,path:"",placement:"right",title:"",content:"<p></p>",next:e===this._options.steps.length-1?-1:e+1,prev:e-1,animation:!0,container:this._options.container,autoscroll:this._options.autoscroll,backdrop:this._options.backdrop,backdropPadding:this._options.backdropPadding,redirect:this._options.redirect,orphan:this._options.orphan,duration:this._options.duration,delay:this._options.delay,template:this._options.template,onShow:this._options.onShow,onShown:this._options.onShown,onHide:this._options.onHide,onHidden:this._options.onHidden,onNext:this._options.onNext,onPrev:this._options.onPrev,onPause:this._options.onPause,onResume:this._options.onResume},this._options.steps[e]):void 0},o.prototype.init=function(t){return this._force=t,this.ended()?(this._debug("Tour ended, init prevented."),this):(this.setCurrentStep(),this._initMouseNavigation(),this._initKeyboardNavigation(),this._onResize(function(t){return function(){return t.showStep(t._current)}}(this)),null!==this._current&&this.showStep(this._current),this._inited=!0,this)},o.prototype.start=function(t){var e;return null==t&&(t=!1),this._inited||this.init(t),null===this._current&&(e=this._makePromise(null!=this._options.onStart?this._options.onStart(this):void 0),this._callOnPromiseDone(e,this.showStep,0)),this},o.prototype.next=function(){var t;return t=this.hideStep(this._current),this._callOnPromiseDone(t,this._showNextStep)},o.prototype.prev=function(){var t;return t=this.hideStep(this._current),this._callOnPromiseDone(t,this._showPrevStep)},o.prototype.goTo=function(t){var e;return e=this.hideStep(this._current),this._callOnPromiseDone(e,this.showStep,t)},o.prototype.end=function(){var o,i;return o=function(o){return function(){return t(n).off("click.tour-"+o._options.name),t(n).off("keyup.tour-"+o._options.name),t(e).off("resize.tour-"+o._options.name),o._setState("end","yes"),o._inited=!1,o._force=!1,o._clearTimer(),null!=o._options.onEnd?o._options.onEnd(o):void 0}}(this),i=this.hideStep(this._current),this._callOnPromiseDone(i,o)},o.prototype.ended=function(){return!this._force&&!!this._getState("end")},o.prototype.restart=function(){return this._removeState("current_step"),this._removeState("end"),this.start()},o.prototype.pause=function(){var t;return t=this.getStep(this._current),t&&t.duration?(this._paused=!0,this._duration-=(new Date).getTime()-this._start,e.clearTimeout(this._timer),this._debug("Paused/Stopped step "+(this._current+1)+" timer ("+this._duration+" remaining)."),null!=t.onPause?t.onPause(this,this._duration):void 0):this},o.prototype.resume=function(){var t;return t=this.getStep(this._current),t&&t.duration?(this._paused=!1,this._start=(new Date).getTime(),this._duration=this._duration||t.duration,this._timer=e.setTimeout(function(t){return function(){return t._isLast()?t.next():t.end()}}(this),this._duration),this._debug("Started step "+(this._current+1)+" timer with duration "+this._duration),null!=t.onResume&&this._duration!==t.duration?t.onResume(this,this._duration):void 0):this},o.prototype.hideStep=function(e){var o,n,i;return(i=this.getStep(e))?(this._clearTimer(),n=this._makePromise(null!=i.onHide?i.onHide(this,e):void 0),o=function(o){return function(){var n;return n=t(i.element),n.data("bs.popover")||n.data("popover")||(n=t("body")),n.popover("destroy").removeClass("tour-"+o._options.name+"-element tour-"+o._options.name+"-"+e+"-element"),i.reflex&&n.removeClass("tour-step-element-reflex").off(""+o._reflexEvent(i.reflex)+".tour-"+o._options.name),i.backdrop&&o._hideBackdrop(),null!=i.onHidden?i.onHidden(o):void 0}}(this),this._callOnPromiseDone(n,o),n):void 0},o.prototype.showStep=function(t){var o,i,r,s;return this.ended()?(this._debug("Tour ended, showStep prevented."),this):(s=this.getStep(t))?(r=t<this._current,o=this._makePromise(null!=s.onShow?s.onShow(this,t):void 0),i=function(e){return function(){var o,i,a;if(e.setCurrentStep(t),i=function(){switch({}.toString.call(s.path)){case"[object Function]":return s.path();case"[object String]":return this._options.basePath+s.path;default:return s.path}}.call(e),o=[n.location.pathname,n.location.hash].join(""),e._isRedirect(i,o))return e._redirect(s,i),void 0;if(e._isOrphan(s)){if(!s.orphan)return e._debug("Skip the orphan step "+(e._current+1)+".\nOrphan option is false and the element does not exist or is hidden."),r?e._showPrevStep():e._showNextStep(),void 0;e._debug("Show the orphan step "+(e._current+1)+". Orphans option is true.")}return s.backdrop&&e._showBackdrop(e._isOrphan(s)?void 0:s.element),a=function(){return e.getCurrentStep()===t?(null!=s.element&&s.backdrop&&e._showOverlayElement(s),e._showPopover(s,t),null!=s.onShown&&s.onShown(e),e._debug("Step "+(e._current+1)+" of "+e._options.steps.length)):void 0},s.autoscroll?e._scrollIntoView(s.element,a):a(),s.duration?e.resume():void 0}}(this),s.delay?(this._debug("Wait "+s.delay+" milliseconds to show the step "+(this._current+1)),e.setTimeout(function(t){return function(){return t._callOnPromiseDone(o,i)}}(this),s.delay)):this._callOnPromiseDone(o,i),o):void 0},o.prototype.getCurrentStep=function(){return this._current},o.prototype.setCurrentStep=function(t){return null!=t?(this._current=t,this._setState("current_step",t)):(this._current=this._getState("current_step"),this._current=null===this._current?null:parseInt(this._current,10)),this},o.prototype._setState=function(t,e){var o,n;if(this._options.storage){n=""+this._options.name+"_"+t;try{this._options.storage.setItem(n,e)}catch(i){o=i,o.code===DOMException.QUOTA_EXCEEDED_ERR&&this.debug("LocalStorage quota exceeded. State storage failed.")}return this._options.afterSetState(n,e)}return null==this._state&&(this._state={}),this._state[t]=e},o.prototype._removeState=function(t){var e;return this._options.storage?(e=""+this._options.name+"_"+t,this._options.storage.removeItem(e),this._options.afterRemoveState(e)):null!=this._state?delete this._state[t]:void 0},o.prototype._getState=function(t){var e,o;return this._options.storage?(e=""+this._options.name+"_"+t,o=this._options.storage.getItem(e)):null!=this._state&&(o=this._state[t]),(void 0===o||"null"===o)&&(o=null),this._options.afterGetState(t,o),o},o.prototype._showNextStep=function(){var t,e,o;return o=this.getStep(this._current),e=function(t){return function(){return t.showStep(o.next)}}(this),t=this._makePromise(null!=o.onNext?o.onNext(this):void 0),this._callOnPromiseDone(t,e)},o.prototype._showPrevStep=function(){var t,e,o;return o=this.getStep(this._current),e=function(t){return function(){return t.showStep(o.prev)}}(this),t=this._makePromise(null!=o.onPrev?o.onPrev(this):void 0),this._callOnPromiseDone(t,e)},o.prototype._debug=function(t){return this._options.debug?e.console.log("Bootstrap Tour '"+this._options.name+"' | "+t):void 0},o.prototype._isRedirect=function(t,e){return null!=t&&""!==t&&("[object RegExp]"==={}.toString.call(t)&&!t.test(e)||"[object String]"==={}.toString.call(t)&&t.replace(/\?.*$/,"").replace(/\/?$/,"")!==e.replace(/\/?$/,""))},o.prototype._redirect=function(e,o){return t.isFunction(e.redirect)?e.redirect.call(this,o):e.redirect===!0?(this._debug("Redirect to "+o),n.location.href=o):void 0},o.prototype._isOrphan=function(e){return null==e.element||!t(e.element).length||t(e.element).is(":hidden")&&"http://www.w3.org/2000/svg"!==t(e.element)[0].namespaceURI},o.prototype._isLast=function(){return this._current<this._options.steps.length-1},o.prototype._showPopover=function(e,o){var n,i,r,s;return t(".tour-"+this._options.name).remove(),s=t.extend({},this._options),r=this._isOrphan(e),e.template=this._template(e,o),r&&(e.element="body",e.placement="top"),n=t(e.element),n.addClass("tour-"+this._options.name+"-element tour-"+this._options.name+"-"+o+"-element"),e.options&&t.extend(s,e.options),e.reflex&&!r&&(n.addClass("tour-step-element-reflex"),n.off(""+this._reflexEvent(e.reflex)+".tour-"+this._options.name),n.on(""+this._reflexEvent(e.reflex)+".tour-"+this._options.name,function(t){return function(){return t._isLast()?t.next():t.end()}}(this))),n.popover({placement:e.placement,trigger:"manual",title:e.title,content:e.content,html:!0,animation:e.animation,container:e.container,template:e.template,selector:e.element}).popover("show"),i=n.data("bs.popover")?n.data("bs.popover").tip():n.data("popover").tip(),i.attr("id",e.id),this._reposition(i,e),r?this._center(i):void 0},o.prototype._template=function(e,o){var n,i,r,s;return s=t.isFunction(e.template)?t(e.template(o,e)):t(e.template),n=s.find(".popover-navigation"),r=n.find('[data-role="prev"]'),i=n.find('[data-role="next"]'),this._isOrphan(e)&&s.addClass("orphan"),s.addClass("tour-"+this._options.name+" tour-"+this._options.name+"-"+o),e.prev<0&&n.find('[data-role="prev"]').addClass("disabled"),e.next<0&&n.find('[data-role="next"]').addClass("disabled"),e.duration||n.find('[data-role="pause-resume"]').remove(),s.clone().wrap("<div>").parent().html()},o.prototype._reflexEvent=function(t){return"[object Boolean]"==={}.toString.call(t)?"click":t},o.prototype._reposition=function(e,o){var i,r,s,a,p,h,l;if(a=e[0].offsetWidth,r=e[0].offsetHeight,l=e.offset(),p=l.left,h=l.top,i=t(n).outerHeight()-l.top-e.outerHeight(),0>i&&(l.top=l.top+i),s=t("html").outerWidth()-l.left-e.outerWidth(),0>s&&(l.left=l.left+s),l.top<0&&(l.top=0),l.left<0&&(l.left=0),e.offset(l),"bottom"===o.placement||"top"===o.placement){if(p!==l.left)return this._replaceArrow(e,2*(l.left-p),a,"left")}else if(h!==l.top)return this._replaceArrow(e,2*(l.top-h),r,"top")},o.prototype._center=function(o){return o.css("top",t(e).outerHeight()/2-o.outerHeight()/2)},o.prototype._replaceArrow=function(t,e,o,n){return t.find(".arrow").css(n,e?50*(1-e/o)+"%":"")},o.prototype._scrollIntoView=function(o,n){var i,r,s,a,p,h;return i=t(o),i.length?(r=t(e),a=i.offset().top,h=r.height(),p=Math.max(0,a-h/2),this._debug("Scroll into view. ScrollTop: "+p+". Element offset: "+a+". Window height: "+h+"."),s=0,t("body, html").stop(!0,!0).animate({scrollTop:Math.ceil(p)},function(t){return function(){return 2===++s?(n(),t._debug("Scroll into view.\nAnimation end element offset: "+i.offset().top+".\nWindow height: "+r.height()+".")):void 0}}(this))):n()},o.prototype._onResize=function(o,n){return t(e).on("resize.tour-"+this._options.name,function(){return clearTimeout(n),n=setTimeout(o,100)})},o.prototype._initMouseNavigation=function(){var e;return e=this,t(n).off("click.tour-"+this._options.name,".popover.tour-"+this._options.name+" *[data-role='prev']").off("click.tour-"+this._options.name,".popover.tour-"+this._options.name+" *[data-role='next']").off("click.tour-"+this._options.name,".popover.tour-"+this._options.name+" *[data-role='end']").off("click.tour-"+this._options.name,".popover.tour-"+this._options.name+" *[data-role='pause-resume']").on("click.tour-"+this._options.name,".popover.tour-"+this._options.name+" *[data-role='next']",function(t){return function(e){return e.preventDefault(),t.next()}}(this)).on("click.tour-"+this._options.name,".popover.tour-"+this._options.name+" *[data-role='prev']",function(t){return function(e){return e.preventDefault(),t.prev()}}(this)).on("click.tour-"+this._options.name,".popover.tour-"+this._options.name+" *[data-role='end']",function(t){return function(e){return e.preventDefault(),t.end()}}(this)).on("click.tour-"+this._options.name,".popover.tour-"+this._options.name+" *[data-role='pause-resume']",function(o){var n;return o.preventDefault(),n=t(this),n.text(e._paused?n.data("pause-text"):n.data("resume-text")),e._paused?e.resume():e.pause()})},o.prototype._initKeyboardNavigation=function(){return this._options.keyboard?t(n).on("keyup.tour-"+this._options.name,function(t){return function(e){if(e.which)switch(e.which){case 39:return e.preventDefault(),t._isLast()?t.next():t.end();case 37:if(e.preventDefault(),t._current>0)return t.prev();break;case 27:return e.preventDefault(),t.end()}}}(this)):void 0},o.prototype._makePromise=function(e){return e&&t.isFunction(e.then)?e:null},o.prototype._callOnPromiseDone=function(t,e,o){return t?t.then(function(t){return function(){return e.call(t,o)}}(this)):e.call(this,o)},o.prototype._showBackdrop=function(){return this.backdrop.backgroundShown?void 0:(this.backdrop=t("<div>",{"class":"tour-backdrop"}),this.backdrop.backgroundShown=!0,t("body").append(this.backdrop))},o.prototype._hideBackdrop=function(){return this._hideOverlayElement(),this._hideBackground()},o.prototype._hideBackground=function(){return this.backdrop?(this.backdrop.remove(),this.backdrop.overlay=null,this.backdrop.backgroundShown=!1):void 0},o.prototype._showOverlayElement=function(e){var o,n;return o=t(e.element),o&&0!==o.length&&!this.backdrop.overlayElementShown?(this.backdrop.overlayElementShown=!0,this.backdrop.$element=o.addClass("tour-step-backdrop"),this.backdrop.$background=t("<div>",{"class":"tour-step-background"}),n={width:o.innerWidth(),height:o.innerHeight(),offset:o.offset()},this.backdrop.$background.appendTo("body"),e.backdropPadding&&(n=this._applyBackdropPadding(e.backdropPadding,n)),this.backdrop.$background.width(n.width).height(n.height).offset(n.offset)):void 0},o.prototype._hideOverlayElement=function(){return this.backdrop.overlayElementShown?(this.backdrop.$element.removeClass("tour-step-backdrop"),this.backdrop.$background.remove(),this.backdrop.$element=null,this.backdrop.$background=null,this.backdrop.overlayElementShown=!1):void 0},o.prototype._applyBackdropPadding=function(t,e){return"object"==typeof t?(null==t.top&&(t.top=0),null==t.right&&(t.right=0),null==t.bottom&&(t.bottom=0),null==t.left&&(t.left=0),e.offset.top=e.offset.top-t.top,e.offset.left=e.offset.left-t.left,e.width=e.width+t.left+t.right,e.height=e.height+t.top+t.bottom):(e.offset.top=e.offset.top-t,e.offset.left=e.offset.left-t,e.width=e.width+2*t,e.height=e.height+2*t),e},o.prototype._clearTimer=function(){return e.clearTimeout(this._timer),this._timer=null,this._duration=null},o}(),e.Tour=o}(jQuery,window);
},{}],30:[function(require,module,exports){
/* ========================================================================
 * Bootstrap: button.js v3.2.0
 * http://getbootstrap.com/javascript/#buttons
 * ========================================================================
 * Copyright 2011-2014 Twitter, Inc.
 * Licensed under MIT (https://github.com/twbs/bootstrap/blob/master/LICENSE)
 * ======================================================================== */


+function ($) {
  'use strict';

  // BUTTON PUBLIC CLASS DEFINITION
  // ==============================

  var Button = function (element, options) {
    this.$element  = $(element)
    this.options   = $.extend({}, Button.DEFAULTS, options)
    this.isLoading = false
  }

  Button.VERSION  = '3.2.0'

  Button.DEFAULTS = {
    loadingText: 'loading...'
  }

  Button.prototype.setState = function (state) {
    var d    = 'disabled'
    var $el  = this.$element
    var val  = $el.is('input') ? 'val' : 'html'
    var data = $el.data()

    state = state + 'Text'

    if (data.resetText == null) $el.data('resetText', $el[val]())

    $el[val](data[state] == null ? this.options[state] : data[state])

    // push to event loop to allow forms to submit
    setTimeout($.proxy(function () {
      if (state == 'loadingText') {
        this.isLoading = true
        $el.addClass(d).attr(d, d)
      } else if (this.isLoading) {
        this.isLoading = false
        $el.removeClass(d).removeAttr(d)
      }
    }, this), 0)
  }

  Button.prototype.toggle = function () {
    var changed = true
    var $parent = this.$element.closest('[data-toggle="buttons"]')

    if ($parent.length) {
      var $input = this.$element.find('input')
      if ($input.prop('type') == 'radio') {
        if ($input.prop('checked') && this.$element.hasClass('active')) changed = false
        else $parent.find('.active').removeClass('active')
      }
      if (changed) $input.prop('checked', !this.$element.hasClass('active')).trigger('change')
    }

    if (changed) this.$element.toggleClass('active')
  }


  // BUTTON PLUGIN DEFINITION
  // ========================

  function Plugin(option) {
    return this.each(function () {
      var $this   = $(this)
      var data    = $this.data('bs.button')
      var options = typeof option == 'object' && option

      if (!data) $this.data('bs.button', (data = new Button(this, options)))

      if (option == 'toggle') data.toggle()
      else if (option) data.setState(option)
    })
  }

  var old = $.fn.button

  $.fn.button             = Plugin
  $.fn.button.Constructor = Button


  // BUTTON NO CONFLICT
  // ==================

  $.fn.button.noConflict = function () {
    $.fn.button = old
    return this
  }


  // BUTTON DATA-API
  // ===============

  $(document).on('click.bs.button.data-api', '[data-toggle^="button"]', function (e) {
    var $btn = $(e.target)
    if (!$btn.hasClass('btn')) $btn = $btn.closest('.btn')
    Plugin.call($btn, 'toggle')
    e.preventDefault()
  })

}(jQuery);

},{}],31:[function(require,module,exports){
/* ========================================================================
 * Bootstrap: dropdown.js v3.2.0
 * http://getbootstrap.com/javascript/#dropdowns
 * ========================================================================
 * Copyright 2011-2014 Twitter, Inc.
 * Licensed under MIT (https://github.com/twbs/bootstrap/blob/master/LICENSE)
 * ======================================================================== */


+function ($) {
  'use strict';

  // DROPDOWN CLASS DEFINITION
  // =========================

  var backdrop = '.dropdown-backdrop'
  var toggle   = '[data-toggle="dropdown"]'
  var Dropdown = function (element) {
    $(element).on('click.bs.dropdown', this.toggle)
  }

  Dropdown.VERSION = '3.2.0'

  Dropdown.prototype.toggle = function (e) {
    var $this = $(this)

    if ($this.is('.disabled, :disabled')) return

    var $parent  = getParent($this)
    var isActive = $parent.hasClass('open')

    clearMenus()

    if (!isActive) {
      if ('ontouchstart' in document.documentElement && !$parent.closest('.navbar-nav').length) {
        // if mobile we use a backdrop because click events don't delegate
        $('<div class="dropdown-backdrop"/>').insertAfter($(this)).on('click', clearMenus)
      }

      var relatedTarget = { relatedTarget: this }
      $parent.trigger(e = $.Event('show.bs.dropdown', relatedTarget))

      if (e.isDefaultPrevented()) return

      $this.trigger('focus')

      $parent
        .toggleClass('open')
        .trigger('shown.bs.dropdown', relatedTarget)
    }

    return false
  }

  Dropdown.prototype.keydown = function (e) {
    if (!/(38|40|27)/.test(e.keyCode)) return

    var $this = $(this)

    e.preventDefault()
    e.stopPropagation()

    if ($this.is('.disabled, :disabled')) return

    var $parent  = getParent($this)
    var isActive = $parent.hasClass('open')

    if (!isActive || (isActive && e.keyCode == 27)) {
      if (e.which == 27) $parent.find(toggle).trigger('focus')
      return $this.trigger('click')
    }

    var desc = ' li:not(.divider):visible a'
    var $items = $parent.find('[role="menu"]' + desc + ', [role="listbox"]' + desc)

    if (!$items.length) return

    var index = $items.index($items.filter(':focus'))

    if (e.keyCode == 38 && index > 0)                 index--                        // up
    if (e.keyCode == 40 && index < $items.length - 1) index++                        // down
    if (!~index)                                      index = 0

    $items.eq(index).trigger('focus')
  }

  function clearMenus(e) {
    if (e && e.which === 3) return
    $(backdrop).remove()
    $(toggle).each(function () {
      var $parent = getParent($(this))
      var relatedTarget = { relatedTarget: this }
      if (!$parent.hasClass('open')) return
      $parent.trigger(e = $.Event('hide.bs.dropdown', relatedTarget))
      if (e.isDefaultPrevented()) return
      $parent.removeClass('open').trigger('hidden.bs.dropdown', relatedTarget)
    })
  }

  function getParent($this) {
    var selector = $this.attr('data-target')

    if (!selector) {
      selector = $this.attr('href')
      selector = selector && /#[A-Za-z]/.test(selector) && selector.replace(/.*(?=#[^\s]*$)/, '') // strip for ie7
    }

    var $parent = selector && $(selector)

    return $parent && $parent.length ? $parent : $this.parent()
  }


  // DROPDOWN PLUGIN DEFINITION
  // ==========================

  function Plugin(option) {
    return this.each(function () {
      var $this = $(this)
      var data  = $this.data('bs.dropdown')

      if (!data) $this.data('bs.dropdown', (data = new Dropdown(this)))
      if (typeof option == 'string') data[option].call($this)
    })
  }

  var old = $.fn.dropdown

  $.fn.dropdown             = Plugin
  $.fn.dropdown.Constructor = Dropdown


  // DROPDOWN NO CONFLICT
  // ====================

  $.fn.dropdown.noConflict = function () {
    $.fn.dropdown = old
    return this
  }


  // APPLY TO STANDARD DROPDOWN ELEMENTS
  // ===================================

  $(document)
    .on('click.bs.dropdown.data-api', clearMenus)
    .on('click.bs.dropdown.data-api', '.dropdown form', function (e) { e.stopPropagation() })
    .on('click.bs.dropdown.data-api', toggle, Dropdown.prototype.toggle)
    .on('keydown.bs.dropdown.data-api', toggle + ', [role="menu"], [role="listbox"]', Dropdown.prototype.keydown)

}(jQuery);

},{}],32:[function(require,module,exports){
/* ========================================================================
 * Bootstrap: popover.js v3.2.0
 * http://getbootstrap.com/javascript/#popovers
 * ========================================================================
 * Copyright 2011-2014 Twitter, Inc.
 * Licensed under MIT (https://github.com/twbs/bootstrap/blob/master/LICENSE)
 * ======================================================================== */


+function ($) {
  'use strict';

  // POPOVER PUBLIC CLASS DEFINITION
  // ===============================

  var Popover = function (element, options) {
    this.init('popover', element, options)
  }

  if (!$.fn.tooltip) throw new Error('Popover requires tooltip.js')

  Popover.VERSION  = '3.2.0'

  Popover.DEFAULTS = $.extend({}, $.fn.tooltip.Constructor.DEFAULTS, {
    placement: 'right',
    trigger: 'click',
    content: '',
    template: '<div class="popover" role="tooltip"><div class="arrow"></div><h3 class="popover-title"></h3><div class="popover-content"></div></div>'
  })


  // NOTE: POPOVER EXTENDS tooltip.js
  // ================================

  Popover.prototype = $.extend({}, $.fn.tooltip.Constructor.prototype)

  Popover.prototype.constructor = Popover

  Popover.prototype.getDefaults = function () {
    return Popover.DEFAULTS
  }

  Popover.prototype.setContent = function () {
    var $tip    = this.tip()
    var title   = this.getTitle()
    var content = this.getContent()

    $tip.find('.popover-title')[this.options.html ? 'html' : 'text'](title)
    $tip.find('.popover-content').empty()[ // we use append for html objects to maintain js events
      this.options.html ? (typeof content == 'string' ? 'html' : 'append') : 'text'
    ](content)

    $tip.removeClass('fade top bottom left right in')

    // IE8 doesn't accept hiding via the `:empty` pseudo selector, we have to do
    // this manually by checking the contents.
    if (!$tip.find('.popover-title').html()) $tip.find('.popover-title').hide()
  }

  Popover.prototype.hasContent = function () {
    return this.getTitle() || this.getContent()
  }

  Popover.prototype.getContent = function () {
    var $e = this.$element
    var o  = this.options

    return $e.attr('data-content')
      || (typeof o.content == 'function' ?
            o.content.call($e[0]) :
            o.content)
  }

  Popover.prototype.arrow = function () {
    return (this.$arrow = this.$arrow || this.tip().find('.arrow'))
  }

  Popover.prototype.tip = function () {
    if (!this.$tip) this.$tip = $(this.options.template)
    return this.$tip
  }


  // POPOVER PLUGIN DEFINITION
  // =========================

  function Plugin(option) {
    return this.each(function () {
      var $this   = $(this)
      var data    = $this.data('bs.popover')
      var options = typeof option == 'object' && option

      if (!data && option == 'destroy') return
      if (!data) $this.data('bs.popover', (data = new Popover(this, options)))
      if (typeof option == 'string') data[option]()
    })
  }

  var old = $.fn.popover

  $.fn.popover             = Plugin
  $.fn.popover.Constructor = Popover


  // POPOVER NO CONFLICT
  // ===================

  $.fn.popover.noConflict = function () {
    $.fn.popover = old
    return this
  }

}(jQuery);

},{}],33:[function(require,module,exports){
/* ========================================================================
 * Bootstrap: tooltip.js v3.2.0
 * http://getbootstrap.com/javascript/#tooltip
 * Inspired by the original jQuery.tipsy by Jason Frame
 * ========================================================================
 * Copyright 2011-2014 Twitter, Inc.
 * Licensed under MIT (https://github.com/twbs/bootstrap/blob/master/LICENSE)
 * ======================================================================== */


+function ($) {
  'use strict';

  // TOOLTIP PUBLIC CLASS DEFINITION
  // ===============================

  var Tooltip = function (element, options) {
    this.type       =
    this.options    =
    this.enabled    =
    this.timeout    =
    this.hoverState =
    this.$element   = null

    this.init('tooltip', element, options)
  }

  Tooltip.VERSION  = '3.2.0'

  Tooltip.DEFAULTS = {
    animation: true,
    placement: 'top',
    selector: false,
    template: '<div class="tooltip" role="tooltip"><div class="tooltip-arrow"></div><div class="tooltip-inner"></div></div>',
    trigger: 'hover focus',
    title: '',
    delay: 0,
    html: false,
    container: false,
    viewport: {
      selector: 'body',
      padding: 0
    }
  }

  Tooltip.prototype.init = function (type, element, options) {
    this.enabled   = true
    this.type      = type
    this.$element  = $(element)
    this.options   = this.getOptions(options)
    this.$viewport = this.options.viewport && $(this.options.viewport.selector || this.options.viewport)

    var triggers = this.options.trigger.split(' ')

    for (var i = triggers.length; i--;) {
      var trigger = triggers[i]

      if (trigger == 'click') {
        this.$element.on('click.' + this.type, this.options.selector, $.proxy(this.toggle, this))
      } else if (trigger != 'manual') {
        var eventIn  = trigger == 'hover' ? 'mouseenter' : 'focusin'
        var eventOut = trigger == 'hover' ? 'mouseleave' : 'focusout'

        this.$element.on(eventIn  + '.' + this.type, this.options.selector, $.proxy(this.enter, this))
        this.$element.on(eventOut + '.' + this.type, this.options.selector, $.proxy(this.leave, this))
      }
    }

    this.options.selector ?
      (this._options = $.extend({}, this.options, { trigger: 'manual', selector: '' })) :
      this.fixTitle()
  }

  Tooltip.prototype.getDefaults = function () {
    return Tooltip.DEFAULTS
  }

  Tooltip.prototype.getOptions = function (options) {
    options = $.extend({}, this.getDefaults(), this.$element.data(), options)

    if (options.delay && typeof options.delay == 'number') {
      options.delay = {
        show: options.delay,
        hide: options.delay
      }
    }

    return options
  }

  Tooltip.prototype.getDelegateOptions = function () {
    var options  = {}
    var defaults = this.getDefaults()

    this._options && $.each(this._options, function (key, value) {
      if (defaults[key] != value) options[key] = value
    })

    return options
  }

  Tooltip.prototype.enter = function (obj) {
    var self = obj instanceof this.constructor ?
      obj : $(obj.currentTarget).data('bs.' + this.type)

    if (!self) {
      self = new this.constructor(obj.currentTarget, this.getDelegateOptions())
      $(obj.currentTarget).data('bs.' + this.type, self)
    }

    clearTimeout(self.timeout)

    self.hoverState = 'in'

    if (!self.options.delay || !self.options.delay.show) return self.show()

    self.timeout = setTimeout(function () {
      if (self.hoverState == 'in') self.show()
    }, self.options.delay.show)
  }

  Tooltip.prototype.leave = function (obj) {
    var self = obj instanceof this.constructor ?
      obj : $(obj.currentTarget).data('bs.' + this.type)

    if (!self) {
      self = new this.constructor(obj.currentTarget, this.getDelegateOptions())
      $(obj.currentTarget).data('bs.' + this.type, self)
    }

    clearTimeout(self.timeout)

    self.hoverState = 'out'

    if (!self.options.delay || !self.options.delay.hide) return self.hide()

    self.timeout = setTimeout(function () {
      if (self.hoverState == 'out') self.hide()
    }, self.options.delay.hide)
  }

  Tooltip.prototype.show = function () {
    var e = $.Event('show.bs.' + this.type)

    if (this.hasContent() && this.enabled) {
      this.$element.trigger(e)

      var inDom = $.contains(document.documentElement, this.$element[0])
      if (e.isDefaultPrevented() || !inDom) return
      var that = this

      var $tip = this.tip()

      var tipId = this.getUID(this.type)

      this.setContent()
      $tip.attr('id', tipId)
      this.$element.attr('aria-describedby', tipId)

      if (this.options.animation) $tip.addClass('fade')

      var placement = typeof this.options.placement == 'function' ?
        this.options.placement.call(this, $tip[0], this.$element[0]) :
        this.options.placement

      var autoToken = /\s?auto?\s?/i
      var autoPlace = autoToken.test(placement)
      if (autoPlace) placement = placement.replace(autoToken, '') || 'top'

      $tip
        .detach()
        .css({ top: 0, left: 0, display: 'block' })
        .addClass(placement)
        .data('bs.' + this.type, this)

      this.options.container ? $tip.appendTo(this.options.container) : $tip.insertAfter(this.$element)

      var pos          = this.getPosition()
      var actualWidth  = $tip[0].offsetWidth
      var actualHeight = $tip[0].offsetHeight

      if (autoPlace) {
        var orgPlacement = placement
        var $parent      = this.$element.parent()
        var parentDim    = this.getPosition($parent)

        placement = placement == 'bottom' && pos.top   + pos.height       + actualHeight - parentDim.scroll > parentDim.height ? 'top'    :
                    placement == 'top'    && pos.top   - parentDim.scroll - actualHeight < 0                                   ? 'bottom' :
                    placement == 'right'  && pos.right + actualWidth      > parentDim.width                                    ? 'left'   :
                    placement == 'left'   && pos.left  - actualWidth      < parentDim.left                                     ? 'right'  :
                    placement

        $tip
          .removeClass(orgPlacement)
          .addClass(placement)
      }

      var calculatedOffset = this.getCalculatedOffset(placement, pos, actualWidth, actualHeight)

      this.applyPlacement(calculatedOffset, placement)

      var complete = function () {
        that.$element.trigger('shown.bs.' + that.type)
        that.hoverState = null
      }

      $.support.transition && this.$tip.hasClass('fade') ?
        $tip
          .one('bsTransitionEnd', complete)
          .emulateTransitionEnd(150) :
        complete()
    }
  }

  Tooltip.prototype.applyPlacement = function (offset, placement) {
    var $tip   = this.tip()
    var width  = $tip[0].offsetWidth
    var height = $tip[0].offsetHeight

    // manually read margins because getBoundingClientRect includes difference
    var marginTop = parseInt($tip.css('margin-top'), 10)
    var marginLeft = parseInt($tip.css('margin-left'), 10)

    // we must check for NaN for ie 8/9
    if (isNaN(marginTop))  marginTop  = 0
    if (isNaN(marginLeft)) marginLeft = 0

    offset.top  = offset.top  + marginTop
    offset.left = offset.left + marginLeft

    // $.fn.offset doesn't round pixel values
    // so we use setOffset directly with our own function B-0
    $.offset.setOffset($tip[0], $.extend({
      using: function (props) {
        $tip.css({
          top: Math.round(props.top),
          left: Math.round(props.left)
        })
      }
    }, offset), 0)

    $tip.addClass('in')

    // check to see if placing tip in new offset caused the tip to resize itself
    var actualWidth  = $tip[0].offsetWidth
    var actualHeight = $tip[0].offsetHeight

    if (placement == 'top' && actualHeight != height) {
      offset.top = offset.top + height - actualHeight
    }

    var delta = this.getViewportAdjustedDelta(placement, offset, actualWidth, actualHeight)

    if (delta.left) offset.left += delta.left
    else offset.top += delta.top

    var arrowDelta          = delta.left ? delta.left * 2 - width + actualWidth : delta.top * 2 - height + actualHeight
    var arrowPosition       = delta.left ? 'left'        : 'top'
    var arrowOffsetPosition = delta.left ? 'offsetWidth' : 'offsetHeight'

    $tip.offset(offset)
    this.replaceArrow(arrowDelta, $tip[0][arrowOffsetPosition], arrowPosition)
  }

  Tooltip.prototype.replaceArrow = function (delta, dimension, position) {
    this.arrow().css(position, delta ? (50 * (1 - delta / dimension) + '%') : '')
  }

  Tooltip.prototype.setContent = function () {
    var $tip  = this.tip()
    var title = this.getTitle()

    $tip.find('.tooltip-inner')[this.options.html ? 'html' : 'text'](title)
    $tip.removeClass('fade in top bottom left right')
  }

  Tooltip.prototype.hide = function () {
    var that = this
    var $tip = this.tip()
    var e    = $.Event('hide.bs.' + this.type)

    this.$element.removeAttr('aria-describedby')

    function complete() {
      if (that.hoverState != 'in') $tip.detach()
      that.$element.trigger('hidden.bs.' + that.type)
    }

    this.$element.trigger(e)

    if (e.isDefaultPrevented()) return

    $tip.removeClass('in')

    $.support.transition && this.$tip.hasClass('fade') ?
      $tip
        .one('bsTransitionEnd', complete)
        .emulateTransitionEnd(150) :
      complete()

    this.hoverState = null

    return this
  }

  Tooltip.prototype.fixTitle = function () {
    var $e = this.$element
    if ($e.attr('title') || typeof ($e.attr('data-original-title')) != 'string') {
      $e.attr('data-original-title', $e.attr('title') || '').attr('title', '')
    }
  }

  Tooltip.prototype.hasContent = function () {
    return this.getTitle()
  }

  Tooltip.prototype.getPosition = function ($element) {
    $element   = $element || this.$element
    var el     = $element[0]
    var isBody = el.tagName == 'BODY'
    return $.extend({}, (typeof el.getBoundingClientRect == 'function') ? el.getBoundingClientRect() : null, {
      scroll: isBody ? document.documentElement.scrollTop || document.body.scrollTop : $element.scrollTop(),
      width:  isBody ? $(window).width()  : $element.outerWidth(),
      height: isBody ? $(window).height() : $element.outerHeight()
    }, isBody ? { top: 0, left: 0 } : $element.offset())
  }

  Tooltip.prototype.getCalculatedOffset = function (placement, pos, actualWidth, actualHeight) {
    return placement == 'bottom' ? { top: pos.top + pos.height,   left: pos.left + pos.width / 2 - actualWidth / 2  } :
           placement == 'top'    ? { top: pos.top - actualHeight, left: pos.left + pos.width / 2 - actualWidth / 2  } :
           placement == 'left'   ? { top: pos.top + pos.height / 2 - actualHeight / 2, left: pos.left - actualWidth } :
        /* placement == 'right' */ { top: pos.top + pos.height / 2 - actualHeight / 2, left: pos.left + pos.width   }

  }

  Tooltip.prototype.getViewportAdjustedDelta = function (placement, pos, actualWidth, actualHeight) {
    var delta = { top: 0, left: 0 }
    if (!this.$viewport) return delta

    var viewportPadding = this.options.viewport && this.options.viewport.padding || 0
    var viewportDimensions = this.getPosition(this.$viewport)

    if (/right|left/.test(placement)) {
      var topEdgeOffset    = pos.top - viewportPadding - viewportDimensions.scroll
      var bottomEdgeOffset = pos.top + viewportPadding - viewportDimensions.scroll + actualHeight
      if (topEdgeOffset < viewportDimensions.top) { // top overflow
        delta.top = viewportDimensions.top - topEdgeOffset
      } else if (bottomEdgeOffset > viewportDimensions.top + viewportDimensions.height) { // bottom overflow
        delta.top = viewportDimensions.top + viewportDimensions.height - bottomEdgeOffset
      }
    } else {
      var leftEdgeOffset  = pos.left - viewportPadding
      var rightEdgeOffset = pos.left + viewportPadding + actualWidth
      if (leftEdgeOffset < viewportDimensions.left) { // left overflow
        delta.left = viewportDimensions.left - leftEdgeOffset
      } else if (rightEdgeOffset > viewportDimensions.width) { // right overflow
        delta.left = viewportDimensions.left + viewportDimensions.width - rightEdgeOffset
      }
    }

    return delta
  }

  Tooltip.prototype.getTitle = function () {
    var title
    var $e = this.$element
    var o  = this.options

    title = $e.attr('data-original-title')
      || (typeof o.title == 'function' ? o.title.call($e[0]) :  o.title)

    return title
  }

  Tooltip.prototype.getUID = function (prefix) {
    do prefix += ~~(Math.random() * 1000000)
    while (document.getElementById(prefix))
    return prefix
  }

  Tooltip.prototype.tip = function () {
    return (this.$tip = this.$tip || $(this.options.template))
  }

  Tooltip.prototype.arrow = function () {
    return (this.$arrow = this.$arrow || this.tip().find('.tooltip-arrow'))
  }

  Tooltip.prototype.validate = function () {
    if (!this.$element[0].parentNode) {
      this.hide()
      this.$element = null
      this.options  = null
    }
  }

  Tooltip.prototype.enable = function () {
    this.enabled = true
  }

  Tooltip.prototype.disable = function () {
    this.enabled = false
  }

  Tooltip.prototype.toggleEnabled = function () {
    this.enabled = !this.enabled
  }

  Tooltip.prototype.toggle = function (e) {
    var self = this
    if (e) {
      self = $(e.currentTarget).data('bs.' + this.type)
      if (!self) {
        self = new this.constructor(e.currentTarget, this.getDelegateOptions())
        $(e.currentTarget).data('bs.' + this.type, self)
      }
    }

    self.tip().hasClass('in') ? self.leave(self) : self.enter(self)
  }

  Tooltip.prototype.destroy = function () {
    clearTimeout(this.timeout)
    this.hide().$element.off('.' + this.type).removeData('bs.' + this.type)
  }


  // TOOLTIP PLUGIN DEFINITION
  // =========================

  function Plugin(option) {
    return this.each(function () {
      var $this   = $(this)
      var data    = $this.data('bs.tooltip')
      var options = typeof option == 'object' && option

      if (!data && option == 'destroy') return
      if (!data) $this.data('bs.tooltip', (data = new Tooltip(this, options)))
      if (typeof option == 'string') data[option]()
    })
  }

  var old = $.fn.tooltip

  $.fn.tooltip             = Plugin
  $.fn.tooltip.Constructor = Tooltip


  // TOOLTIP NO CONFLICT
  // ===================

  $.fn.tooltip.noConflict = function () {
    $.fn.tooltip = old
    return this
  }

}(jQuery);

},{}],34:[function(require,module,exports){
/*!
 * https://github.com/es-shims/es5-shim
 * @license es5-shim Copyright 2009-2014 by contributors, MIT License
 * see https://github.com/es-shims/es5-shim/blob/v4.0.3/LICENSE
 */
(function(t,e){if(typeof define==="function"&&define.amd){define(e)}else if(typeof exports==="object"){module.exports=e()}else{t.returnExports=e()}})(this,function(){var t=Array.prototype;var e=Object.prototype;var r=Function.prototype;var n=String.prototype;var i=Number.prototype;var a=t.slice;var o=t.splice;var l=t.push;var u=t.unshift;var s=r.call;var f=e.toString;var c=function(t){return e.toString.call(t)==="[object Function]"};var h=function(t){return e.toString.call(t)==="[object RegExp]"};var p=function ve(t){return f.call(t)==="[object Array]"};var v=function ge(t){return f.call(t)==="[object String]"};var g=function ye(t){var e=f.call(t);var r=e==="[object Arguments]";if(!r){r=!p(t)&&t!==null&&typeof t==="object"&&typeof t.length==="number"&&t.length>=0&&c(t.callee)}return r};var y=Object.defineProperty&&function(){try{Object.defineProperty({},"x",{});return true}catch(t){return false}}();var d;if(y){d=function(t,e,r,n){if(!n&&e in t){return}Object.defineProperty(t,e,{configurable:true,enumerable:false,writable:true,value:r})}}else{d=function(t,e,r,n){if(!n&&e in t){return}t[e]=r}}var m=function(t,r,n){for(var i in r){if(e.hasOwnProperty.call(r,i)){d(t,i,r[i],n)}}};function w(t){t=+t;if(t!==t){t=0}else if(t!==0&&t!==1/0&&t!==-(1/0)){t=(t>0||-1)*Math.floor(Math.abs(t))}return t}function b(t){var e=typeof t;return t===null||e==="undefined"||e==="boolean"||e==="number"||e==="string"}function x(t){var e,r,n;if(b(t)){return t}r=t.valueOf;if(c(r)){e=r.call(t);if(b(e)){return e}}n=t.toString;if(c(n)){e=n.call(t);if(b(e)){return e}}throw new TypeError}var S=function(t){if(t==null){throw new TypeError("can't convert "+t+" to object")}return Object(t)};var O=function de(t){return t>>>0};function T(){}m(r,{bind:function me(t){var e=this;if(!c(e)){throw new TypeError("Function.prototype.bind called on incompatible "+e)}var r=a.call(arguments,1);var n=function(){if(this instanceof u){var n=e.apply(this,r.concat(a.call(arguments)));if(Object(n)===n){return n}return this}else{return e.apply(t,r.concat(a.call(arguments)))}};var i=Math.max(0,e.length-r.length);var o=[];for(var l=0;l<i;l++){o.push("$"+l)}var u=Function("binder","return function ("+o.join(",")+"){return binder.apply(this,arguments)}")(n);if(e.prototype){T.prototype=e.prototype;u.prototype=new T;T.prototype=null}return u}});var j=s.bind(e.hasOwnProperty);var E;var N;var I;var D;var _;if(_=j(e,"__defineGetter__")){E=s.bind(e.__defineGetter__);N=s.bind(e.__defineSetter__);I=s.bind(e.__lookupGetter__);D=s.bind(e.__lookupSetter__)}var M=function(){var t=[1,2];var e=t.splice();return t.length===2&&p(e)&&e.length===0}();m(t,{splice:function we(t,e){if(arguments.length===0){return[]}else{return o.apply(this,arguments)}}},M);var F=function(){var e={};t.splice.call(e,0,0,1);return e.length===1}();m(t,{splice:function be(t,e){if(arguments.length===0){return[]}var r=arguments;this.length=Math.max(w(this.length),0);if(arguments.length>0&&typeof e!=="number"){r=a.call(arguments);if(r.length<2){r.push(this.length-t)}else{r[1]=w(e)}}return o.apply(this,r)}},!F);var R=[].unshift(0)!==1;m(t,{unshift:function(){u.apply(this,arguments);return this.length}},R);m(Array,{isArray:p});var k=Object("a");var C=k[0]!=="a"||!(0 in k);var U=function xe(t){var e=true;var r=true;if(t){t.call("foo",function(t,r,n){if(typeof n!=="object"){e=false}});t.call([1],function(){"use strict";r=typeof this==="string"},"x")}return!!t&&e&&r};m(t,{forEach:function Se(t){var e=S(this),r=C&&v(this)?this.split(""):e,n=arguments[1],i=-1,a=r.length>>>0;if(!c(t)){throw new TypeError}while(++i<a){if(i in r){t.call(n,r[i],i,e)}}}},!U(t.forEach));m(t,{map:function Oe(t){var e=S(this),r=C&&v(this)?this.split(""):e,n=r.length>>>0,i=Array(n),a=arguments[1];if(!c(t)){throw new TypeError(t+" is not a function")}for(var o=0;o<n;o++){if(o in r){i[o]=t.call(a,r[o],o,e)}}return i}},!U(t.map));m(t,{filter:function Te(t){var e=S(this),r=C&&v(this)?this.split(""):e,n=r.length>>>0,i=[],a,o=arguments[1];if(!c(t)){throw new TypeError(t+" is not a function")}for(var l=0;l<n;l++){if(l in r){a=r[l];if(t.call(o,a,l,e)){i.push(a)}}}return i}},!U(t.filter));m(t,{every:function je(t){var e=S(this),r=C&&v(this)?this.split(""):e,n=r.length>>>0,i=arguments[1];if(!c(t)){throw new TypeError(t+" is not a function")}for(var a=0;a<n;a++){if(a in r&&!t.call(i,r[a],a,e)){return false}}return true}},!U(t.every));m(t,{some:function Ee(t){var e=S(this),r=C&&v(this)?this.split(""):e,n=r.length>>>0,i=arguments[1];if(!c(t)){throw new TypeError(t+" is not a function")}for(var a=0;a<n;a++){if(a in r&&t.call(i,r[a],a,e)){return true}}return false}},!U(t.some));var A=false;if(t.reduce){A=typeof t.reduce.call("es5",function(t,e,r,n){return n})==="object"}m(t,{reduce:function Ne(t){var e=S(this),r=C&&v(this)?this.split(""):e,n=r.length>>>0;if(!c(t)){throw new TypeError(t+" is not a function")}if(!n&&arguments.length===1){throw new TypeError("reduce of empty array with no initial value")}var i=0;var a;if(arguments.length>=2){a=arguments[1]}else{do{if(i in r){a=r[i++];break}if(++i>=n){throw new TypeError("reduce of empty array with no initial value")}}while(true)}for(;i<n;i++){if(i in r){a=t.call(void 0,a,r[i],i,e)}}return a}},!A);var P=false;if(t.reduceRight){P=typeof t.reduceRight.call("es5",function(t,e,r,n){return n})==="object"}m(t,{reduceRight:function Ie(t){var e=S(this),r=C&&v(this)?this.split(""):e,n=r.length>>>0;if(!c(t)){throw new TypeError(t+" is not a function")}if(!n&&arguments.length===1){throw new TypeError("reduceRight of empty array with no initial value")}var i,a=n-1;if(arguments.length>=2){i=arguments[1]}else{do{if(a in r){i=r[a--];break}if(--a<0){throw new TypeError("reduceRight of empty array with no initial value")}}while(true)}if(a<0){return i}do{if(a in r){i=t.call(void 0,i,r[a],a,e)}}while(a--);return i}},!P);var Z=Array.prototype.indexOf&&[0,1].indexOf(1,2)!==-1;m(t,{indexOf:function De(t){var e=C&&v(this)?this.split(""):S(this),r=e.length>>>0;if(!r){return-1}var n=0;if(arguments.length>1){n=w(arguments[1])}n=n>=0?n:Math.max(0,r+n);for(;n<r;n++){if(n in e&&e[n]===t){return n}}return-1}},Z);var J=Array.prototype.lastIndexOf&&[0,1].lastIndexOf(0,-3)!==-1;m(t,{lastIndexOf:function _e(t){var e=C&&v(this)?this.split(""):S(this),r=e.length>>>0;if(!r){return-1}var n=r-1;if(arguments.length>1){n=Math.min(n,w(arguments[1]))}n=n>=0?n:r-Math.abs(n);for(;n>=0;n--){if(n in e&&t===e[n]){return n}}return-1}},J);var z=!{toString:null}.propertyIsEnumerable("toString"),$=function(){}.propertyIsEnumerable("prototype"),G=["toString","toLocaleString","valueOf","hasOwnProperty","isPrototypeOf","propertyIsEnumerable","constructor"],B=G.length;m(Object,{keys:function Me(t){var e=c(t),r=g(t),n=t!==null&&typeof t==="object",i=n&&v(t);if(!n&&!e&&!r){throw new TypeError("Object.keys called on a non-object")}var a=[];var o=$&&e;if(i||r){for(var l=0;l<t.length;++l){a.push(String(l))}}else{for(var u in t){if(!(o&&u==="prototype")&&j(t,u)){a.push(String(u))}}}if(z){var s=t.constructor,f=s&&s.prototype===t;for(var h=0;h<B;h++){var p=G[h];if(!(f&&p==="constructor")&&j(t,p)){a.push(p)}}}return a}});var H=Object.keys&&function(){return Object.keys(arguments).length===2}(1,2);var L=Object.keys;m(Object,{keys:function Fe(e){if(g(e)){return L(t.slice.call(e))}else{return L(e)}}},!H);var X=-621987552e5;var Y="-000001";var q=Date.prototype.toISOString&&new Date(X).toISOString().indexOf(Y)===-1;m(Date.prototype,{toISOString:function Re(){var t,e,r,n,i;if(!isFinite(this)){throw new RangeError("Date.prototype.toISOString called on non-finite value.")}n=this.getUTCFullYear();i=this.getUTCMonth();n+=Math.floor(i/12);i=(i%12+12)%12;t=[i+1,this.getUTCDate(),this.getUTCHours(),this.getUTCMinutes(),this.getUTCSeconds()];n=(n<0?"-":n>9999?"+":"")+("00000"+Math.abs(n)).slice(0<=n&&n<=9999?-4:-6);e=t.length;while(e--){r=t[e];if(r<10){t[e]="0"+r}}return n+"-"+t.slice(0,2).join("-")+"T"+t.slice(2).join(":")+"."+("000"+this.getUTCMilliseconds()).slice(-3)+"Z"}},q);var K=false;try{K=Date.prototype.toJSON&&new Date(NaN).toJSON()===null&&new Date(X).toJSON().indexOf(Y)!==-1&&Date.prototype.toJSON.call({toISOString:function(){return true}})}catch(Q){}if(!K){Date.prototype.toJSON=function ke(t){var e=Object(this),r=x(e),n;if(typeof r==="number"&&!isFinite(r)){return null}n=e.toISOString;if(typeof n!=="function"){throw new TypeError("toISOString property is not callable")}return n.call(e)}}var V=Date.parse("+033658-09-27T01:46:40.000Z")===1e15;var W=!isNaN(Date.parse("2012-04-04T24:00:00.500Z"))||!isNaN(Date.parse("2012-11-31T23:59:59.000Z"));var te=isNaN(Date.parse("2000-01-01T00:00:00.000Z"));if(!Date.parse||te||W||!V){Date=function(t){function e(r,n,i,a,o,l,u){var s=arguments.length;if(this instanceof t){var f=s===1&&String(r)===r?new t(e.parse(r)):s>=7?new t(r,n,i,a,o,l,u):s>=6?new t(r,n,i,a,o,l):s>=5?new t(r,n,i,a,o):s>=4?new t(r,n,i,a):s>=3?new t(r,n,i):s>=2?new t(r,n):s>=1?new t(r):new t;f.constructor=e;return f}return t.apply(this,arguments)}var r=new RegExp("^"+"(\\d{4}|[+-]\\d{6})"+"(?:-(\\d{2})"+"(?:-(\\d{2})"+"(?:"+"T(\\d{2})"+":(\\d{2})"+"(?:"+":(\\d{2})"+"(?:(\\.\\d{1,}))?"+")?"+"("+"Z|"+"(?:"+"([-+])"+"(\\d{2})"+":(\\d{2})"+")"+")?)?)?)?"+"$");var n=[0,31,59,90,120,151,181,212,243,273,304,334,365];function i(t,e){var r=e>1?1:0;return n[e]+Math.floor((t-1969+r)/4)-Math.floor((t-1901+r)/100)+Math.floor((t-1601+r)/400)+365*(t-1970)}function a(e){return Number(new t(1970,0,1,0,0,0,e))}for(var o in t){e[o]=t[o]}e.now=t.now;e.UTC=t.UTC;e.prototype=t.prototype;e.prototype.constructor=e;e.parse=function l(e){var n=r.exec(e);if(n){var o=Number(n[1]),l=Number(n[2]||1)-1,u=Number(n[3]||1)-1,s=Number(n[4]||0),f=Number(n[5]||0),c=Number(n[6]||0),h=Math.floor(Number(n[7]||0)*1e3),p=Boolean(n[4]&&!n[8]),v=n[9]==="-"?1:-1,g=Number(n[10]||0),y=Number(n[11]||0),d;if(s<(f>0||c>0||h>0?24:25)&&f<60&&c<60&&h<1e3&&l>-1&&l<12&&g<24&&y<60&&u>-1&&u<i(o,l+1)-i(o,l)){d=((i(o,l)+u)*24+s+g*v)*60;d=((d+f+y*v)*60+c)*1e3+h;if(p){d=a(d)}if(-864e13<=d&&d<=864e13){return d}}return NaN}return t.parse.apply(this,arguments)};return e}(Date)}if(!Date.now){Date.now=function Ce(){return(new Date).getTime()}}var ee=i.toFixed&&(8e-5.toFixed(3)!=="0.000"||.9.toFixed(0)!=="1"||1.255.toFixed(2)!=="1.25"||0xde0b6b3a7640080.toFixed(0)!=="1000000000000000128");var re={base:1e7,size:6,data:[0,0,0,0,0,0],multiply:function Ue(t,e){var r=-1;while(++r<re.size){e+=t*re.data[r];re.data[r]=e%re.base;e=Math.floor(e/re.base)}},divide:function Ae(t){var e=re.size,r=0;while(--e>=0){r+=re.data[e];re.data[e]=Math.floor(r/t);r=r%t*re.base}},numToString:function Pe(){var t=re.size;var e="";while(--t>=0){if(e!==""||t===0||re.data[t]!==0){var r=String(re.data[t]);if(e===""){e=r}else{e+="0000000".slice(0,7-r.length)+r}}}return e},pow:function Ze(t,e,r){return e===0?r:e%2===1?Ze(t,e-1,r*t):Ze(t*t,e/2,r)},log:function Je(t){var e=0;while(t>=4096){e+=12;t/=4096}while(t>=2){e+=1;t/=2}return e}};m(i,{toFixed:function ze(t){var e,r,n,i,a,o,l,u;e=Number(t);e=e!==e?0:Math.floor(e);if(e<0||e>20){throw new RangeError("Number.toFixed called with invalid number of decimals")}r=Number(this);if(r!==r){return"NaN"}if(r<=-1e21||r>=1e21){return String(r)}n="";if(r<0){n="-";r=-r}i="0";if(r>1e-21){a=re.log(r*re.pow(2,69,1))-69;o=a<0?r*re.pow(2,-a,1):r/re.pow(2,a,1);o*=4503599627370496;a=52-a;if(a>0){re.multiply(0,o);l=e;while(l>=7){re.multiply(1e7,0);l-=7}re.multiply(re.pow(10,l,1),0);l=a-1;while(l>=23){re.divide(1<<23);l-=23}re.divide(1<<l);re.multiply(1,1);re.divide(2);i=re.numToString()}else{re.multiply(0,o);re.multiply(1<<-a,0);i=re.numToString()+"0.00000000000000000000".slice(2,2+e)}}if(e>0){u=i.length;if(u<=e){i=n+"0.0000000000000000000".slice(0,e-u+2)+i}else{i=n+i.slice(0,u-e)+"."+i.slice(u-e)}}else{i=n+i}return i}},ee);var ne=n.split;if("ab".split(/(?:ab)*/).length!==2||".".split(/(.?)(.?)/).length!==4||"tesst".split(/(s)*/)[1]==="t"||"test".split(/(?:)/,-1).length!==4||"".split(/.?/).length||".".split(/()()/).length>1){(function(){var e=/()??/.exec("")[1]===void 0;n.split=function(r,n){var i=this;if(r===void 0&&n===0){return[]}if(f.call(r)!=="[object RegExp]"){return ne.call(this,r,n)}var a=[],o=(r.ignoreCase?"i":"")+(r.multiline?"m":"")+(r.extended?"x":"")+(r.sticky?"y":""),l=0,u,s,c,h;r=new RegExp(r.source,o+"g");i+="";if(!e){u=new RegExp("^"+r.source+"$(?!\\s)",o)}n=n===void 0?-1>>>0:O(n);while(s=r.exec(i)){c=s.index+s[0].length;if(c>l){a.push(i.slice(l,s.index));if(!e&&s.length>1){s[0].replace(u,function(){for(var t=1;t<arguments.length-2;t++){if(arguments[t]===void 0){s[t]=void 0}}})}if(s.length>1&&s.index<i.length){t.push.apply(a,s.slice(1))}h=s[0].length;l=c;if(a.length>=n){break}}if(r.lastIndex===s.index){r.lastIndex++}}if(l===i.length){if(h||!r.test("")){a.push("")}}else{a.push(i.slice(l))}return a.length>n?a.slice(0,n):a}})()}else if("0".split(void 0,0).length){n.split=function $e(t,e){if(t===void 0&&e===0){return[]}return ne.call(this,t,e)}}var ie=n.replace;var ae=function(){var t=[];"x".replace(/x(.)?/g,function(e,r){t.push(r)});return t.length===1&&typeof t[0]==="undefined"}();if(!ae){n.replace=function Ge(t,e){var r=c(e);var n=h(t)&&/\)[*?]/.test(t.source);if(!r||!n){return ie.call(this,t,e)}else{var i=function(r){var n=arguments.length;var i=t.lastIndex;t.lastIndex=0;var a=t.exec(r);t.lastIndex=i;a.push(arguments[n-2],arguments[n-1]);return e.apply(this,a)};return ie.call(this,t,i)}}}var oe=n.substr;var le="".substr&&"0b".substr(-1)!=="b";m(n,{substr:function Be(t,e){return oe.call(this,t<0?(t=this.length+t)<0?0:t:t,e)}},le);var ue="	\n\f\r \xa0\u1680\u180e\u2000\u2001\u2002\u2003"+"\u2004\u2005\u2006\u2007\u2008\u2009\u200a\u202f\u205f\u3000\u2028"+"\u2029\ufeff";var se="\u200b";var fe="["+ue+"]";var ce=new RegExp("^"+fe+fe+"*");var he=new RegExp(fe+fe+"*$");var pe=n.trim&&(ue.trim()||!se.trim());m(n,{trim:function He(){if(this===void 0||this===null){throw new TypeError("can't convert "+this+" to object")}return String(this).replace(ce,"").replace(he,"")}},pe);if(parseInt(ue+"08")!==8||parseInt(ue+"0x16")!==22){parseInt=function(t){var e=/^0[xX]/;return function r(n,i){n=String(n).trim();if(!Number(i)){i=e.test(n)?16:10}return t(n,i)}}(parseInt)}});
},{}],35:[function(require,module,exports){
/**
 * @license MIT
 * @fileOverview Favico animations
 * @author Miroslav Magda, http://blog.ejci.net
 * @version 0.3.5
 */
!function(){var e=function(e){"use strict";function t(e){if(e.paused||e.ended||w)return!1;try{l.clearRect(0,0,s,h),l.drawImage(e,0,0,s,h)}catch(o){}p=setTimeout(t,O.duration,e),L.setIcon(c)}function o(e){var t=/^#?([a-f\d])([a-f\d])([a-f\d])$/i;e=e.replace(t,function(e,t,o,n){return t+t+o+o+n+n});var o=/^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(e);return o?{r:parseInt(o[1],16),g:parseInt(o[2],16),b:parseInt(o[3],16)}:!1}function n(e,t){var o,n={};for(o in e)n[o]=e[o];for(o in t)n[o]=t[o];return n}function i(){return document.hidden||document.msHidden||document.webkitHidden||document.mozHidden}e=e?e:{};var r,a,h,s,c,l,f,d,u,y,g,w,m,x,p,b={bgColor:"#d00",textColor:"#fff",fontFamily:"sans-serif",fontStyle:"bold",type:"circle",position:"down",animation:"slide",elementId:!1};m={},m.ff="undefined"!=typeof InstallTrigger,m.chrome=!!window.chrome,m.opera=!!window.opera||navigator.userAgent.indexOf("Opera")>=0,m.ie=/*@cc_on!@*/!1,m.safari=Object.prototype.toString.call(window.HTMLElement).indexOf("Constructor")>0,m.supported=m.chrome||m.ff||m.opera;var v=[];g=function(){},d=w=!1;var C=function(){r=n(b,e),r.bgColor=o(r.bgColor),r.textColor=o(r.textColor),r.position=r.position.toLowerCase(),r.animation=O.types[""+r.animation]?r.animation:b.animation;var t=r.position.indexOf("up")>-1,i=r.position.indexOf("left")>-1;if(t||i)for(var d=0;d<O.types[""+r.animation].length;d++){var u=O.types[""+r.animation][d];t&&(u.y=u.y<.6?u.y-.4:u.y-2*u.y+(1-u.w)),i&&(u.x=u.x<.6?u.x-.4:u.x-2*u.x+(1-u.h)),O.types[""+r.animation][d]=u}r.type=I[""+r.type]?r.type:b.type;try{a=L.getIcon(),c=document.createElement("canvas"),f=document.createElement("img"),a.hasAttribute("href")?(f.setAttribute("src",a.getAttribute("href")),f.onload=function(){h=f.height>0?f.height:32,s=f.width>0?f.width:32,c.height=h,c.width=s,l=c.getContext("2d"),M.ready()}):(f.setAttribute("src",""),h=32,s=32,f.height=h,f.width=s,c.height=h,c.width=s,l=c.getContext("2d"),M.ready())}catch(y){throw"Error initializing favico. Message: "+y.message}},M={};M.ready=function(){d=!0,M.reset(),g()},M.reset=function(){d&&(v=[],u=!1,l.clearRect(0,0,s,h),l.drawImage(f,0,0,s,h),L.setIcon(c),window.clearTimeout(x),window.clearTimeout(p))},M.start=function(){if(d&&!y){var e=function(){u=v[0],y=!1,v.length>0&&(v.shift(),M.start())};if(v.length>0){y=!0;var t=function(){["type","animation","bgColor","textColor","fontFamily","fontStyle"].forEach(function(e){e in v[0].options&&(r[e]=v[0].options[e])}),O.run(v[0].options,function(){e()},!1)};u?O.run(u.options,function(){t()},!0):t()}}};var I={},E=function(e){return e.n="number"==typeof e.n?Math.abs(0|e.n):e.n,e.x=s*e.x,e.y=h*e.y,e.w=s*e.w,e.h=h*e.h,e.len=(""+e.n).length,e};I.circle=function(e){e=E(e);var t=!1;2===e.len?(e.x=e.x-.4*e.w,e.w=1.4*e.w,t=!0):e.len>=3&&(e.x=e.x-.65*e.w,e.w=1.65*e.w,t=!0),l.clearRect(0,0,s,h),l.drawImage(f,0,0,s,h),l.beginPath(),l.font=r.fontStyle+" "+Math.floor(e.h*(e.n>99?.85:1))+"px "+r.fontFamily,l.textAlign="center",t?(l.moveTo(e.x+e.w/2,e.y),l.lineTo(e.x+e.w-e.h/2,e.y),l.quadraticCurveTo(e.x+e.w,e.y,e.x+e.w,e.y+e.h/2),l.lineTo(e.x+e.w,e.y+e.h-e.h/2),l.quadraticCurveTo(e.x+e.w,e.y+e.h,e.x+e.w-e.h/2,e.y+e.h),l.lineTo(e.x+e.h/2,e.y+e.h),l.quadraticCurveTo(e.x,e.y+e.h,e.x,e.y+e.h-e.h/2),l.lineTo(e.x,e.y+e.h/2),l.quadraticCurveTo(e.x,e.y,e.x+e.h/2,e.y)):l.arc(e.x+e.w/2,e.y+e.h/2,e.h/2,0,2*Math.PI),l.fillStyle="rgba("+r.bgColor.r+","+r.bgColor.g+","+r.bgColor.b+","+e.o+")",l.fill(),l.closePath(),l.beginPath(),l.stroke(),l.fillStyle="rgba("+r.textColor.r+","+r.textColor.g+","+r.textColor.b+","+e.o+")","number"==typeof e.n&&e.n>999?l.fillText((e.n>9999?9:Math.floor(e.n/1e3))+"k+",Math.floor(e.x+e.w/2),Math.floor(e.y+e.h-.2*e.h)):l.fillText(e.n,Math.floor(e.x+e.w/2),Math.floor(e.y+e.h-.15*e.h)),l.closePath()},I.rectangle=function(e){e=E(e);var t=!1;2===e.len?(e.x=e.x-.4*e.w,e.w=1.4*e.w,t=!0):e.len>=3&&(e.x=e.x-.65*e.w,e.w=1.65*e.w,t=!0),l.clearRect(0,0,s,h),l.drawImage(f,0,0,s,h),l.beginPath(),l.font=r.fontStyle+" "+Math.floor(e.h*(e.n>99?.9:1))+"px "+r.fontFamily,l.textAlign="center",l.fillStyle="rgba("+r.bgColor.r+","+r.bgColor.g+","+r.bgColor.b+","+e.o+")",l.fillRect(e.x,e.y,e.w,e.h),l.fillStyle="rgba("+r.textColor.r+","+r.textColor.g+","+r.textColor.b+","+e.o+")","number"==typeof e.n&&e.n>999?l.fillText((e.n>9999?9:Math.floor(e.n/1e3))+"k+",Math.floor(e.x+e.w/2),Math.floor(e.y+e.h-.2*e.h)):l.fillText(e.n,Math.floor(e.x+e.w/2),Math.floor(e.y+e.h-.15*e.h)),l.closePath()};var T=function(e,t){t=("string"==typeof t?{animation:t}:t)||{},g=function(){try{if("number"==typeof e?e>0:""!==e){var n={type:"badge",options:{n:e}};if("animation"in t&&O.types[""+t.animation]&&(n.options.animation=""+t.animation),"type"in t&&I[""+t.type]&&(n.options.type=""+t.type),["bgColor","textColor"].forEach(function(e){e in t&&(n.options[e]=o(t[e]))}),["fontStyle","fontFamily"].forEach(function(e){e in t&&(n.options[e]=t[e])}),v.push(n),v.length>100)throw"Too many badges requests in queue.";M.start()}else M.reset()}catch(i){throw"Error setting badge. Message: "+i.message}},d&&g()},A=function(e){g=function(){try{var t=e.width,o=e.height,n=document.createElement("img"),i=o/h>t/s?t/s:o/h;n.setAttribute("src",e.getAttribute("src")),n.height=o/i,n.width=t/i,l.clearRect(0,0,s,h),l.drawImage(n,0,0,s,h),L.setIcon(c)}catch(r){throw"Error setting image. Message: "+r.message}},d&&g()},U=function(e){g=function(){try{if("stop"===e)return w=!0,M.reset(),w=!1,void 0;e.addEventListener("play",function(){t(this)},!1)}catch(o){throw"Error setting video. Message: "+o.message}},d&&g()},R=function(e){if(window.URL&&window.URL.createObjectURL||(window.URL=window.URL||{},window.URL.createObjectURL=function(e){return e}),m.supported){var o=!1;navigator.getUserMedia=navigator.getUserMedia||navigator.oGetUserMedia||navigator.msGetUserMedia||navigator.mozGetUserMedia||navigator.webkitGetUserMedia,g=function(){try{if("stop"===e)return w=!0,M.reset(),w=!1,void 0;o=document.createElement("video"),o.width=s,o.height=h,navigator.getUserMedia({video:!0,audio:!1},function(e){o.src=URL.createObjectURL(e),o.play(),t(o)},function(){})}catch(n){throw"Error setting webcam. Message: "+n.message}},d&&g()}},L={};L.getIcon=function(){var e=!1,t="",o=function(){for(var e=document.getElementsByTagName("head")[0].getElementsByTagName("link"),t=e.length,o=t-1;o>=0;o--)if(/(^|\s)icon(\s|$)/i.test(e[o].getAttribute("rel")))return e[o];return!1};if(r.elementId?(e=document.getElementById(r.elementId),e.setAttribute("href",e.getAttribute("src"))):(e=o(),e===!1&&(e=document.createElement("link"),e.setAttribute("rel","icon"),document.getElementsByTagName("head")[0].appendChild(e))),t=r.elementId?e.src:e.href,"data:"!==t.substr(0,5)&&-1===t.indexOf(document.location.hostname))throw new Error("Error setting favicon. Favicon image is on different domain (Icon: "+t+", Domain: "+document.location.hostname+")");return e.setAttribute("type","image/png"),e},L.setIcon=function(e){var t=e.toDataURL("image/png");if(r.elementId)document.getElementById(r.elementId).setAttribute("src",t);else if(m.ff||m.opera){var o=a;a=document.createElement("link"),m.opera&&a.setAttribute("rel","icon"),a.setAttribute("rel","icon"),a.setAttribute("type","image/png"),document.getElementsByTagName("head")[0].appendChild(a),a.setAttribute("href",t),o.parentNode&&o.parentNode.removeChild(o)}else a.setAttribute("href",t)};var O={};return O.duration=40,O.types={},O.types.fade=[{x:.4,y:.4,w:.6,h:.6,o:0},{x:.4,y:.4,w:.6,h:.6,o:.1},{x:.4,y:.4,w:.6,h:.6,o:.2},{x:.4,y:.4,w:.6,h:.6,o:.3},{x:.4,y:.4,w:.6,h:.6,o:.4},{x:.4,y:.4,w:.6,h:.6,o:.5},{x:.4,y:.4,w:.6,h:.6,o:.6},{x:.4,y:.4,w:.6,h:.6,o:.7},{x:.4,y:.4,w:.6,h:.6,o:.8},{x:.4,y:.4,w:.6,h:.6,o:.9},{x:.4,y:.4,w:.6,h:.6,o:1}],O.types.none=[{x:.4,y:.4,w:.6,h:.6,o:1}],O.types.pop=[{x:1,y:1,w:0,h:0,o:1},{x:.9,y:.9,w:.1,h:.1,o:1},{x:.8,y:.8,w:.2,h:.2,o:1},{x:.7,y:.7,w:.3,h:.3,o:1},{x:.6,y:.6,w:.4,h:.4,o:1},{x:.5,y:.5,w:.5,h:.5,o:1},{x:.4,y:.4,w:.6,h:.6,o:1}],O.types.popFade=[{x:.75,y:.75,w:0,h:0,o:0},{x:.65,y:.65,w:.1,h:.1,o:.2},{x:.6,y:.6,w:.2,h:.2,o:.4},{x:.55,y:.55,w:.3,h:.3,o:.6},{x:.5,y:.5,w:.4,h:.4,o:.8},{x:.45,y:.45,w:.5,h:.5,o:.9},{x:.4,y:.4,w:.6,h:.6,o:1}],O.types.slide=[{x:.4,y:1,w:.6,h:.6,o:1},{x:.4,y:.9,w:.6,h:.6,o:1},{x:.4,y:.9,w:.6,h:.6,o:1},{x:.4,y:.8,w:.6,h:.6,o:1},{x:.4,y:.7,w:.6,h:.6,o:1},{x:.4,y:.6,w:.6,h:.6,o:1},{x:.4,y:.5,w:.6,h:.6,o:1},{x:.4,y:.4,w:.6,h:.6,o:1}],O.run=function(e,t,o,a){var h=O.types[i()?"none":r.animation];return a=o===!0?"undefined"!=typeof a?a:h.length-1:"undefined"!=typeof a?a:0,t=t?t:function(){},a<h.length&&a>=0?(I[r.type](n(e,h[a])),x=setTimeout(function(){o?a-=1:a+=1,O.run(e,t,o,a)},O.duration),L.setIcon(c),void 0):(t(),void 0)},C(),{badge:T,video:U,image:A,webcam:R,reset:M.reset,browser:{supported:m.supported}}};"undefined"!=typeof define&&define.amd?define([],function(){return e}):"undefined"!=typeof module&&module.exports?module.exports=e:this.Favico=e}();
},{}],36:[function(require,module,exports){
/*! jQuery v2.0.3 | (c) 2005, 2013 jQuery Foundation, Inc. | jquery.org/license
*/
(function(e,undefined){var t,n,r=typeof undefined,i=e.location,o=e.document,s=o.documentElement,a=e.jQuery,u=e.$,l={},c=[],p="2.0.3",f=c.concat,h=c.push,d=c.slice,g=c.indexOf,m=l.toString,y=l.hasOwnProperty,v=p.trim,x=function(e,n){return new x.fn.init(e,n,t)},b=/[+-]?(?:\d*\.|)\d+(?:[eE][+-]?\d+|)/.source,w=/\S+/g,T=/^(?:\s*(<[\w\W]+>)[^>]*|#([\w-]*))$/,C=/^<(\w+)\s*\/?>(?:<\/\1>|)$/,k=/^-ms-/,N=/-([\da-z])/gi,E=function(e,t){return t.toUpperCase()},S=function(){o.removeEventListener("DOMContentLoaded",S,!1),e.removeEventListener("load",S,!1),x.ready()};x.fn=x.prototype={jquery:p,constructor:x,init:function(e,t,n){var r,i;if(!e)return this;if("string"==typeof e){if(r="<"===e.charAt(0)&&">"===e.charAt(e.length-1)&&e.length>=3?[null,e,null]:T.exec(e),!r||!r[1]&&t)return!t||t.jquery?(t||n).find(e):this.constructor(t).find(e);if(r[1]){if(t=t instanceof x?t[0]:t,x.merge(this,x.parseHTML(r[1],t&&t.nodeType?t.ownerDocument||t:o,!0)),C.test(r[1])&&x.isPlainObject(t))for(r in t)x.isFunction(this[r])?this[r](t[r]):this.attr(r,t[r]);return this}return i=o.getElementById(r[2]),i&&i.parentNode&&(this.length=1,this[0]=i),this.context=o,this.selector=e,this}return e.nodeType?(this.context=this[0]=e,this.length=1,this):x.isFunction(e)?n.ready(e):(e.selector!==undefined&&(this.selector=e.selector,this.context=e.context),x.makeArray(e,this))},selector:"",length:0,toArray:function(){return d.call(this)},get:function(e){return null==e?this.toArray():0>e?this[this.length+e]:this[e]},pushStack:function(e){var t=x.merge(this.constructor(),e);return t.prevObject=this,t.context=this.context,t},each:function(e,t){return x.each(this,e,t)},ready:function(e){return x.ready.promise().done(e),this},slice:function(){return this.pushStack(d.apply(this,arguments))},first:function(){return this.eq(0)},last:function(){return this.eq(-1)},eq:function(e){var t=this.length,n=+e+(0>e?t:0);return this.pushStack(n>=0&&t>n?[this[n]]:[])},map:function(e){return this.pushStack(x.map(this,function(t,n){return e.call(t,n,t)}))},end:function(){return this.prevObject||this.constructor(null)},push:h,sort:[].sort,splice:[].splice},x.fn.init.prototype=x.fn,x.extend=x.fn.extend=function(){var e,t,n,r,i,o,s=arguments[0]||{},a=1,u=arguments.length,l=!1;for("boolean"==typeof s&&(l=s,s=arguments[1]||{},a=2),"object"==typeof s||x.isFunction(s)||(s={}),u===a&&(s=this,--a);u>a;a++)if(null!=(e=arguments[a]))for(t in e)n=s[t],r=e[t],s!==r&&(l&&r&&(x.isPlainObject(r)||(i=x.isArray(r)))?(i?(i=!1,o=n&&x.isArray(n)?n:[]):o=n&&x.isPlainObject(n)?n:{},s[t]=x.extend(l,o,r)):r!==undefined&&(s[t]=r));return s},x.extend({expando:"jQuery"+(p+Math.random()).replace(/\D/g,""),noConflict:function(t){return e.$===x&&(e.$=u),t&&e.jQuery===x&&(e.jQuery=a),x},isReady:!1,readyWait:1,holdReady:function(e){e?x.readyWait++:x.ready(!0)},ready:function(e){(e===!0?--x.readyWait:x.isReady)||(x.isReady=!0,e!==!0&&--x.readyWait>0||(n.resolveWith(o,[x]),x.fn.trigger&&x(o).trigger("ready").off("ready")))},isFunction:function(e){return"function"===x.type(e)},isArray:Array.isArray,isWindow:function(e){return null!=e&&e===e.window},isNumeric:function(e){return!isNaN(parseFloat(e))&&isFinite(e)},type:function(e){return null==e?e+"":"object"==typeof e||"function"==typeof e?l[m.call(e)]||"object":typeof e},isPlainObject:function(e){if("object"!==x.type(e)||e.nodeType||x.isWindow(e))return!1;try{if(e.constructor&&!y.call(e.constructor.prototype,"isPrototypeOf"))return!1}catch(t){return!1}return!0},isEmptyObject:function(e){var t;for(t in e)return!1;return!0},error:function(e){throw Error(e)},parseHTML:function(e,t,n){if(!e||"string"!=typeof e)return null;"boolean"==typeof t&&(n=t,t=!1),t=t||o;var r=C.exec(e),i=!n&&[];return r?[t.createElement(r[1])]:(r=x.buildFragment([e],t,i),i&&x(i).remove(),x.merge([],r.childNodes))},parseJSON:JSON.parse,parseXML:function(e){var t,n;if(!e||"string"!=typeof e)return null;try{n=new DOMParser,t=n.parseFromString(e,"text/xml")}catch(r){t=undefined}return(!t||t.getElementsByTagName("parsererror").length)&&x.error("Invalid XML: "+e),t},noop:function(){},globalEval:function(e){var t,n=eval;e=x.trim(e),e&&(1===e.indexOf("use strict")?(t=o.createElement("script"),t.text=e,o.head.appendChild(t).parentNode.removeChild(t)):n(e))},camelCase:function(e){return e.replace(k,"ms-").replace(N,E)},nodeName:function(e,t){return e.nodeName&&e.nodeName.toLowerCase()===t.toLowerCase()},each:function(e,t,n){var r,i=0,o=e.length,s=j(e);if(n){if(s){for(;o>i;i++)if(r=t.apply(e[i],n),r===!1)break}else for(i in e)if(r=t.apply(e[i],n),r===!1)break}else if(s){for(;o>i;i++)if(r=t.call(e[i],i,e[i]),r===!1)break}else for(i in e)if(r=t.call(e[i],i,e[i]),r===!1)break;return e},trim:function(e){return null==e?"":v.call(e)},makeArray:function(e,t){var n=t||[];return null!=e&&(j(Object(e))?x.merge(n,"string"==typeof e?[e]:e):h.call(n,e)),n},inArray:function(e,t,n){return null==t?-1:g.call(t,e,n)},merge:function(e,t){var n=t.length,r=e.length,i=0;if("number"==typeof n)for(;n>i;i++)e[r++]=t[i];else while(t[i]!==undefined)e[r++]=t[i++];return e.length=r,e},grep:function(e,t,n){var r,i=[],o=0,s=e.length;for(n=!!n;s>o;o++)r=!!t(e[o],o),n!==r&&i.push(e[o]);return i},map:function(e,t,n){var r,i=0,o=e.length,s=j(e),a=[];if(s)for(;o>i;i++)r=t(e[i],i,n),null!=r&&(a[a.length]=r);else for(i in e)r=t(e[i],i,n),null!=r&&(a[a.length]=r);return f.apply([],a)},guid:1,proxy:function(e,t){var n,r,i;return"string"==typeof t&&(n=e[t],t=e,e=n),x.isFunction(e)?(r=d.call(arguments,2),i=function(){return e.apply(t||this,r.concat(d.call(arguments)))},i.guid=e.guid=e.guid||x.guid++,i):undefined},access:function(e,t,n,r,i,o,s){var a=0,u=e.length,l=null==n;if("object"===x.type(n)){i=!0;for(a in n)x.access(e,t,a,n[a],!0,o,s)}else if(r!==undefined&&(i=!0,x.isFunction(r)||(s=!0),l&&(s?(t.call(e,r),t=null):(l=t,t=function(e,t,n){return l.call(x(e),n)})),t))for(;u>a;a++)t(e[a],n,s?r:r.call(e[a],a,t(e[a],n)));return i?e:l?t.call(e):u?t(e[0],n):o},now:Date.now,swap:function(e,t,n,r){var i,o,s={};for(o in t)s[o]=e.style[o],e.style[o]=t[o];i=n.apply(e,r||[]);for(o in t)e.style[o]=s[o];return i}}),x.ready.promise=function(t){return n||(n=x.Deferred(),"complete"===o.readyState?setTimeout(x.ready):(o.addEventListener("DOMContentLoaded",S,!1),e.addEventListener("load",S,!1))),n.promise(t)},x.each("Boolean Number String Function Array Date RegExp Object Error".split(" "),function(e,t){l["[object "+t+"]"]=t.toLowerCase()});function j(e){var t=e.length,n=x.type(e);return x.isWindow(e)?!1:1===e.nodeType&&t?!0:"array"===n||"function"!==n&&(0===t||"number"==typeof t&&t>0&&t-1 in e)}t=x(o),function(e,undefined){var t,n,r,i,o,s,a,u,l,c,p,f,h,d,g,m,y,v="sizzle"+-new Date,b=e.document,w=0,T=0,C=st(),k=st(),N=st(),E=!1,S=function(e,t){return e===t?(E=!0,0):0},j=typeof undefined,D=1<<31,A={}.hasOwnProperty,L=[],q=L.pop,H=L.push,O=L.push,F=L.slice,P=L.indexOf||function(e){var t=0,n=this.length;for(;n>t;t++)if(this[t]===e)return t;return-1},R="checked|selected|async|autofocus|autoplay|controls|defer|disabled|hidden|ismap|loop|multiple|open|readonly|required|scoped",M="[\\x20\\t\\r\\n\\f]",W="(?:\\\\.|[\\w-]|[^\\x00-\\xa0])+",$=W.replace("w","w#"),B="\\["+M+"*("+W+")"+M+"*(?:([*^$|!~]?=)"+M+"*(?:(['\"])((?:\\\\.|[^\\\\])*?)\\3|("+$+")|)|)"+M+"*\\]",I=":("+W+")(?:\\(((['\"])((?:\\\\.|[^\\\\])*?)\\3|((?:\\\\.|[^\\\\()[\\]]|"+B.replace(3,8)+")*)|.*)\\)|)",z=RegExp("^"+M+"+|((?:^|[^\\\\])(?:\\\\.)*)"+M+"+$","g"),_=RegExp("^"+M+"*,"+M+"*"),X=RegExp("^"+M+"*([>+~]|"+M+")"+M+"*"),U=RegExp(M+"*[+~]"),Y=RegExp("="+M+"*([^\\]'\"]*)"+M+"*\\]","g"),V=RegExp(I),G=RegExp("^"+$+"$"),J={ID:RegExp("^#("+W+")"),CLASS:RegExp("^\\.("+W+")"),TAG:RegExp("^("+W.replace("w","w*")+")"),ATTR:RegExp("^"+B),PSEUDO:RegExp("^"+I),CHILD:RegExp("^:(only|first|last|nth|nth-last)-(child|of-type)(?:\\("+M+"*(even|odd|(([+-]|)(\\d*)n|)"+M+"*(?:([+-]|)"+M+"*(\\d+)|))"+M+"*\\)|)","i"),bool:RegExp("^(?:"+R+")$","i"),needsContext:RegExp("^"+M+"*[>+~]|:(even|odd|eq|gt|lt|nth|first|last)(?:\\("+M+"*((?:-\\d)?\\d*)"+M+"*\\)|)(?=[^-]|$)","i")},Q=/^[^{]+\{\s*\[native \w/,K=/^(?:#([\w-]+)|(\w+)|\.([\w-]+))$/,Z=/^(?:input|select|textarea|button)$/i,et=/^h\d$/i,tt=/'|\\/g,nt=RegExp("\\\\([\\da-f]{1,6}"+M+"?|("+M+")|.)","ig"),rt=function(e,t,n){var r="0x"+t-65536;return r!==r||n?t:0>r?String.fromCharCode(r+65536):String.fromCharCode(55296|r>>10,56320|1023&r)};try{O.apply(L=F.call(b.childNodes),b.childNodes),L[b.childNodes.length].nodeType}catch(it){O={apply:L.length?function(e,t){H.apply(e,F.call(t))}:function(e,t){var n=e.length,r=0;while(e[n++]=t[r++]);e.length=n-1}}}function ot(e,t,r,i){var o,s,a,u,l,f,g,m,x,w;if((t?t.ownerDocument||t:b)!==p&&c(t),t=t||p,r=r||[],!e||"string"!=typeof e)return r;if(1!==(u=t.nodeType)&&9!==u)return[];if(h&&!i){if(o=K.exec(e))if(a=o[1]){if(9===u){if(s=t.getElementById(a),!s||!s.parentNode)return r;if(s.id===a)return r.push(s),r}else if(t.ownerDocument&&(s=t.ownerDocument.getElementById(a))&&y(t,s)&&s.id===a)return r.push(s),r}else{if(o[2])return O.apply(r,t.getElementsByTagName(e)),r;if((a=o[3])&&n.getElementsByClassName&&t.getElementsByClassName)return O.apply(r,t.getElementsByClassName(a)),r}if(n.qsa&&(!d||!d.test(e))){if(m=g=v,x=t,w=9===u&&e,1===u&&"object"!==t.nodeName.toLowerCase()){f=gt(e),(g=t.getAttribute("id"))?m=g.replace(tt,"\\$&"):t.setAttribute("id",m),m="[id='"+m+"'] ",l=f.length;while(l--)f[l]=m+mt(f[l]);x=U.test(e)&&t.parentNode||t,w=f.join(",")}if(w)try{return O.apply(r,x.querySelectorAll(w)),r}catch(T){}finally{g||t.removeAttribute("id")}}}return kt(e.replace(z,"$1"),t,r,i)}function st(){var e=[];function t(n,r){return e.push(n+=" ")>i.cacheLength&&delete t[e.shift()],t[n]=r}return t}function at(e){return e[v]=!0,e}function ut(e){var t=p.createElement("div");try{return!!e(t)}catch(n){return!1}finally{t.parentNode&&t.parentNode.removeChild(t),t=null}}function lt(e,t){var n=e.split("|"),r=e.length;while(r--)i.attrHandle[n[r]]=t}function ct(e,t){var n=t&&e,r=n&&1===e.nodeType&&1===t.nodeType&&(~t.sourceIndex||D)-(~e.sourceIndex||D);if(r)return r;if(n)while(n=n.nextSibling)if(n===t)return-1;return e?1:-1}function pt(e){return function(t){var n=t.nodeName.toLowerCase();return"input"===n&&t.type===e}}function ft(e){return function(t){var n=t.nodeName.toLowerCase();return("input"===n||"button"===n)&&t.type===e}}function ht(e){return at(function(t){return t=+t,at(function(n,r){var i,o=e([],n.length,t),s=o.length;while(s--)n[i=o[s]]&&(n[i]=!(r[i]=n[i]))})})}s=ot.isXML=function(e){var t=e&&(e.ownerDocument||e).documentElement;return t?"HTML"!==t.nodeName:!1},n=ot.support={},c=ot.setDocument=function(e){var t=e?e.ownerDocument||e:b,r=t.defaultView;return t!==p&&9===t.nodeType&&t.documentElement?(p=t,f=t.documentElement,h=!s(t),r&&r.attachEvent&&r!==r.top&&r.attachEvent("onbeforeunload",function(){c()}),n.attributes=ut(function(e){return e.className="i",!e.getAttribute("className")}),n.getElementsByTagName=ut(function(e){return e.appendChild(t.createComment("")),!e.getElementsByTagName("*").length}),n.getElementsByClassName=ut(function(e){return e.innerHTML="<div class='a'></div><div class='a i'></div>",e.firstChild.className="i",2===e.getElementsByClassName("i").length}),n.getById=ut(function(e){return f.appendChild(e).id=v,!t.getElementsByName||!t.getElementsByName(v).length}),n.getById?(i.find.ID=function(e,t){if(typeof t.getElementById!==j&&h){var n=t.getElementById(e);return n&&n.parentNode?[n]:[]}},i.filter.ID=function(e){var t=e.replace(nt,rt);return function(e){return e.getAttribute("id")===t}}):(delete i.find.ID,i.filter.ID=function(e){var t=e.replace(nt,rt);return function(e){var n=typeof e.getAttributeNode!==j&&e.getAttributeNode("id");return n&&n.value===t}}),i.find.TAG=n.getElementsByTagName?function(e,t){return typeof t.getElementsByTagName!==j?t.getElementsByTagName(e):undefined}:function(e,t){var n,r=[],i=0,o=t.getElementsByTagName(e);if("*"===e){while(n=o[i++])1===n.nodeType&&r.push(n);return r}return o},i.find.CLASS=n.getElementsByClassName&&function(e,t){return typeof t.getElementsByClassName!==j&&h?t.getElementsByClassName(e):undefined},g=[],d=[],(n.qsa=Q.test(t.querySelectorAll))&&(ut(function(e){e.innerHTML="<select><option selected=''></option></select>",e.querySelectorAll("[selected]").length||d.push("\\["+M+"*(?:value|"+R+")"),e.querySelectorAll(":checked").length||d.push(":checked")}),ut(function(e){var n=t.createElement("input");n.setAttribute("type","hidden"),e.appendChild(n).setAttribute("t",""),e.querySelectorAll("[t^='']").length&&d.push("[*^$]="+M+"*(?:''|\"\")"),e.querySelectorAll(":enabled").length||d.push(":enabled",":disabled"),e.querySelectorAll("*,:x"),d.push(",.*:")})),(n.matchesSelector=Q.test(m=f.webkitMatchesSelector||f.mozMatchesSelector||f.oMatchesSelector||f.msMatchesSelector))&&ut(function(e){n.disconnectedMatch=m.call(e,"div"),m.call(e,"[s!='']:x"),g.push("!=",I)}),d=d.length&&RegExp(d.join("|")),g=g.length&&RegExp(g.join("|")),y=Q.test(f.contains)||f.compareDocumentPosition?function(e,t){var n=9===e.nodeType?e.documentElement:e,r=t&&t.parentNode;return e===r||!(!r||1!==r.nodeType||!(n.contains?n.contains(r):e.compareDocumentPosition&&16&e.compareDocumentPosition(r)))}:function(e,t){if(t)while(t=t.parentNode)if(t===e)return!0;return!1},S=f.compareDocumentPosition?function(e,r){if(e===r)return E=!0,0;var i=r.compareDocumentPosition&&e.compareDocumentPosition&&e.compareDocumentPosition(r);return i?1&i||!n.sortDetached&&r.compareDocumentPosition(e)===i?e===t||y(b,e)?-1:r===t||y(b,r)?1:l?P.call(l,e)-P.call(l,r):0:4&i?-1:1:e.compareDocumentPosition?-1:1}:function(e,n){var r,i=0,o=e.parentNode,s=n.parentNode,a=[e],u=[n];if(e===n)return E=!0,0;if(!o||!s)return e===t?-1:n===t?1:o?-1:s?1:l?P.call(l,e)-P.call(l,n):0;if(o===s)return ct(e,n);r=e;while(r=r.parentNode)a.unshift(r);r=n;while(r=r.parentNode)u.unshift(r);while(a[i]===u[i])i++;return i?ct(a[i],u[i]):a[i]===b?-1:u[i]===b?1:0},t):p},ot.matches=function(e,t){return ot(e,null,null,t)},ot.matchesSelector=function(e,t){if((e.ownerDocument||e)!==p&&c(e),t=t.replace(Y,"='$1']"),!(!n.matchesSelector||!h||g&&g.test(t)||d&&d.test(t)))try{var r=m.call(e,t);if(r||n.disconnectedMatch||e.document&&11!==e.document.nodeType)return r}catch(i){}return ot(t,p,null,[e]).length>0},ot.contains=function(e,t){return(e.ownerDocument||e)!==p&&c(e),y(e,t)},ot.attr=function(e,t){(e.ownerDocument||e)!==p&&c(e);var r=i.attrHandle[t.toLowerCase()],o=r&&A.call(i.attrHandle,t.toLowerCase())?r(e,t,!h):undefined;return o===undefined?n.attributes||!h?e.getAttribute(t):(o=e.getAttributeNode(t))&&o.specified?o.value:null:o},ot.error=function(e){throw Error("Syntax error, unrecognized expression: "+e)},ot.uniqueSort=function(e){var t,r=[],i=0,o=0;if(E=!n.detectDuplicates,l=!n.sortStable&&e.slice(0),e.sort(S),E){while(t=e[o++])t===e[o]&&(i=r.push(o));while(i--)e.splice(r[i],1)}return e},o=ot.getText=function(e){var t,n="",r=0,i=e.nodeType;if(i){if(1===i||9===i||11===i){if("string"==typeof e.textContent)return e.textContent;for(e=e.firstChild;e;e=e.nextSibling)n+=o(e)}else if(3===i||4===i)return e.nodeValue}else for(;t=e[r];r++)n+=o(t);return n},i=ot.selectors={cacheLength:50,createPseudo:at,match:J,attrHandle:{},find:{},relative:{">":{dir:"parentNode",first:!0}," ":{dir:"parentNode"},"+":{dir:"previousSibling",first:!0},"~":{dir:"previousSibling"}},preFilter:{ATTR:function(e){return e[1]=e[1].replace(nt,rt),e[3]=(e[4]||e[5]||"").replace(nt,rt),"~="===e[2]&&(e[3]=" "+e[3]+" "),e.slice(0,4)},CHILD:function(e){return e[1]=e[1].toLowerCase(),"nth"===e[1].slice(0,3)?(e[3]||ot.error(e[0]),e[4]=+(e[4]?e[5]+(e[6]||1):2*("even"===e[3]||"odd"===e[3])),e[5]=+(e[7]+e[8]||"odd"===e[3])):e[3]&&ot.error(e[0]),e},PSEUDO:function(e){var t,n=!e[5]&&e[2];return J.CHILD.test(e[0])?null:(e[3]&&e[4]!==undefined?e[2]=e[4]:n&&V.test(n)&&(t=gt(n,!0))&&(t=n.indexOf(")",n.length-t)-n.length)&&(e[0]=e[0].slice(0,t),e[2]=n.slice(0,t)),e.slice(0,3))}},filter:{TAG:function(e){var t=e.replace(nt,rt).toLowerCase();return"*"===e?function(){return!0}:function(e){return e.nodeName&&e.nodeName.toLowerCase()===t}},CLASS:function(e){var t=C[e+" "];return t||(t=RegExp("(^|"+M+")"+e+"("+M+"|$)"))&&C(e,function(e){return t.test("string"==typeof e.className&&e.className||typeof e.getAttribute!==j&&e.getAttribute("class")||"")})},ATTR:function(e,t,n){return function(r){var i=ot.attr(r,e);return null==i?"!="===t:t?(i+="","="===t?i===n:"!="===t?i!==n:"^="===t?n&&0===i.indexOf(n):"*="===t?n&&i.indexOf(n)>-1:"$="===t?n&&i.slice(-n.length)===n:"~="===t?(" "+i+" ").indexOf(n)>-1:"|="===t?i===n||i.slice(0,n.length+1)===n+"-":!1):!0}},CHILD:function(e,t,n,r,i){var o="nth"!==e.slice(0,3),s="last"!==e.slice(-4),a="of-type"===t;return 1===r&&0===i?function(e){return!!e.parentNode}:function(t,n,u){var l,c,p,f,h,d,g=o!==s?"nextSibling":"previousSibling",m=t.parentNode,y=a&&t.nodeName.toLowerCase(),x=!u&&!a;if(m){if(o){while(g){p=t;while(p=p[g])if(a?p.nodeName.toLowerCase()===y:1===p.nodeType)return!1;d=g="only"===e&&!d&&"nextSibling"}return!0}if(d=[s?m.firstChild:m.lastChild],s&&x){c=m[v]||(m[v]={}),l=c[e]||[],h=l[0]===w&&l[1],f=l[0]===w&&l[2],p=h&&m.childNodes[h];while(p=++h&&p&&p[g]||(f=h=0)||d.pop())if(1===p.nodeType&&++f&&p===t){c[e]=[w,h,f];break}}else if(x&&(l=(t[v]||(t[v]={}))[e])&&l[0]===w)f=l[1];else while(p=++h&&p&&p[g]||(f=h=0)||d.pop())if((a?p.nodeName.toLowerCase()===y:1===p.nodeType)&&++f&&(x&&((p[v]||(p[v]={}))[e]=[w,f]),p===t))break;return f-=i,f===r||0===f%r&&f/r>=0}}},PSEUDO:function(e,t){var n,r=i.pseudos[e]||i.setFilters[e.toLowerCase()]||ot.error("unsupported pseudo: "+e);return r[v]?r(t):r.length>1?(n=[e,e,"",t],i.setFilters.hasOwnProperty(e.toLowerCase())?at(function(e,n){var i,o=r(e,t),s=o.length;while(s--)i=P.call(e,o[s]),e[i]=!(n[i]=o[s])}):function(e){return r(e,0,n)}):r}},pseudos:{not:at(function(e){var t=[],n=[],r=a(e.replace(z,"$1"));return r[v]?at(function(e,t,n,i){var o,s=r(e,null,i,[]),a=e.length;while(a--)(o=s[a])&&(e[a]=!(t[a]=o))}):function(e,i,o){return t[0]=e,r(t,null,o,n),!n.pop()}}),has:at(function(e){return function(t){return ot(e,t).length>0}}),contains:at(function(e){return function(t){return(t.textContent||t.innerText||o(t)).indexOf(e)>-1}}),lang:at(function(e){return G.test(e||"")||ot.error("unsupported lang: "+e),e=e.replace(nt,rt).toLowerCase(),function(t){var n;do if(n=h?t.lang:t.getAttribute("xml:lang")||t.getAttribute("lang"))return n=n.toLowerCase(),n===e||0===n.indexOf(e+"-");while((t=t.parentNode)&&1===t.nodeType);return!1}}),target:function(t){var n=e.location&&e.location.hash;return n&&n.slice(1)===t.id},root:function(e){return e===f},focus:function(e){return e===p.activeElement&&(!p.hasFocus||p.hasFocus())&&!!(e.type||e.href||~e.tabIndex)},enabled:function(e){return e.disabled===!1},disabled:function(e){return e.disabled===!0},checked:function(e){var t=e.nodeName.toLowerCase();return"input"===t&&!!e.checked||"option"===t&&!!e.selected},selected:function(e){return e.parentNode&&e.parentNode.selectedIndex,e.selected===!0},empty:function(e){for(e=e.firstChild;e;e=e.nextSibling)if(e.nodeName>"@"||3===e.nodeType||4===e.nodeType)return!1;return!0},parent:function(e){return!i.pseudos.empty(e)},header:function(e){return et.test(e.nodeName)},input:function(e){return Z.test(e.nodeName)},button:function(e){var t=e.nodeName.toLowerCase();return"input"===t&&"button"===e.type||"button"===t},text:function(e){var t;return"input"===e.nodeName.toLowerCase()&&"text"===e.type&&(null==(t=e.getAttribute("type"))||t.toLowerCase()===e.type)},first:ht(function(){return[0]}),last:ht(function(e,t){return[t-1]}),eq:ht(function(e,t,n){return[0>n?n+t:n]}),even:ht(function(e,t){var n=0;for(;t>n;n+=2)e.push(n);return e}),odd:ht(function(e,t){var n=1;for(;t>n;n+=2)e.push(n);return e}),lt:ht(function(e,t,n){var r=0>n?n+t:n;for(;--r>=0;)e.push(r);return e}),gt:ht(function(e,t,n){var r=0>n?n+t:n;for(;t>++r;)e.push(r);return e})}},i.pseudos.nth=i.pseudos.eq;for(t in{radio:!0,checkbox:!0,file:!0,password:!0,image:!0})i.pseudos[t]=pt(t);for(t in{submit:!0,reset:!0})i.pseudos[t]=ft(t);function dt(){}dt.prototype=i.filters=i.pseudos,i.setFilters=new dt;function gt(e,t){var n,r,o,s,a,u,l,c=k[e+" "];if(c)return t?0:c.slice(0);a=e,u=[],l=i.preFilter;while(a){(!n||(r=_.exec(a)))&&(r&&(a=a.slice(r[0].length)||a),u.push(o=[])),n=!1,(r=X.exec(a))&&(n=r.shift(),o.push({value:n,type:r[0].replace(z," ")}),a=a.slice(n.length));for(s in i.filter)!(r=J[s].exec(a))||l[s]&&!(r=l[s](r))||(n=r.shift(),o.push({value:n,type:s,matches:r}),a=a.slice(n.length));if(!n)break}return t?a.length:a?ot.error(e):k(e,u).slice(0)}function mt(e){var t=0,n=e.length,r="";for(;n>t;t++)r+=e[t].value;return r}function yt(e,t,n){var i=t.dir,o=n&&"parentNode"===i,s=T++;return t.first?function(t,n,r){while(t=t[i])if(1===t.nodeType||o)return e(t,n,r)}:function(t,n,a){var u,l,c,p=w+" "+s;if(a){while(t=t[i])if((1===t.nodeType||o)&&e(t,n,a))return!0}else while(t=t[i])if(1===t.nodeType||o)if(c=t[v]||(t[v]={}),(l=c[i])&&l[0]===p){if((u=l[1])===!0||u===r)return u===!0}else if(l=c[i]=[p],l[1]=e(t,n,a)||r,l[1]===!0)return!0}}function vt(e){return e.length>1?function(t,n,r){var i=e.length;while(i--)if(!e[i](t,n,r))return!1;return!0}:e[0]}function xt(e,t,n,r,i){var o,s=[],a=0,u=e.length,l=null!=t;for(;u>a;a++)(o=e[a])&&(!n||n(o,r,i))&&(s.push(o),l&&t.push(a));return s}function bt(e,t,n,r,i,o){return r&&!r[v]&&(r=bt(r)),i&&!i[v]&&(i=bt(i,o)),at(function(o,s,a,u){var l,c,p,f=[],h=[],d=s.length,g=o||Ct(t||"*",a.nodeType?[a]:a,[]),m=!e||!o&&t?g:xt(g,f,e,a,u),y=n?i||(o?e:d||r)?[]:s:m;if(n&&n(m,y,a,u),r){l=xt(y,h),r(l,[],a,u),c=l.length;while(c--)(p=l[c])&&(y[h[c]]=!(m[h[c]]=p))}if(o){if(i||e){if(i){l=[],c=y.length;while(c--)(p=y[c])&&l.push(m[c]=p);i(null,y=[],l,u)}c=y.length;while(c--)(p=y[c])&&(l=i?P.call(o,p):f[c])>-1&&(o[l]=!(s[l]=p))}}else y=xt(y===s?y.splice(d,y.length):y),i?i(null,s,y,u):O.apply(s,y)})}function wt(e){var t,n,r,o=e.length,s=i.relative[e[0].type],a=s||i.relative[" "],l=s?1:0,c=yt(function(e){return e===t},a,!0),p=yt(function(e){return P.call(t,e)>-1},a,!0),f=[function(e,n,r){return!s&&(r||n!==u)||((t=n).nodeType?c(e,n,r):p(e,n,r))}];for(;o>l;l++)if(n=i.relative[e[l].type])f=[yt(vt(f),n)];else{if(n=i.filter[e[l].type].apply(null,e[l].matches),n[v]){for(r=++l;o>r;r++)if(i.relative[e[r].type])break;return bt(l>1&&vt(f),l>1&&mt(e.slice(0,l-1).concat({value:" "===e[l-2].type?"*":""})).replace(z,"$1"),n,r>l&&wt(e.slice(l,r)),o>r&&wt(e=e.slice(r)),o>r&&mt(e))}f.push(n)}return vt(f)}function Tt(e,t){var n=0,o=t.length>0,s=e.length>0,a=function(a,l,c,f,h){var d,g,m,y=[],v=0,x="0",b=a&&[],T=null!=h,C=u,k=a||s&&i.find.TAG("*",h&&l.parentNode||l),N=w+=null==C?1:Math.random()||.1;for(T&&(u=l!==p&&l,r=n);null!=(d=k[x]);x++){if(s&&d){g=0;while(m=e[g++])if(m(d,l,c)){f.push(d);break}T&&(w=N,r=++n)}o&&((d=!m&&d)&&v--,a&&b.push(d))}if(v+=x,o&&x!==v){g=0;while(m=t[g++])m(b,y,l,c);if(a){if(v>0)while(x--)b[x]||y[x]||(y[x]=q.call(f));y=xt(y)}O.apply(f,y),T&&!a&&y.length>0&&v+t.length>1&&ot.uniqueSort(f)}return T&&(w=N,u=C),b};return o?at(a):a}a=ot.compile=function(e,t){var n,r=[],i=[],o=N[e+" "];if(!o){t||(t=gt(e)),n=t.length;while(n--)o=wt(t[n]),o[v]?r.push(o):i.push(o);o=N(e,Tt(i,r))}return o};function Ct(e,t,n){var r=0,i=t.length;for(;i>r;r++)ot(e,t[r],n);return n}function kt(e,t,r,o){var s,u,l,c,p,f=gt(e);if(!o&&1===f.length){if(u=f[0]=f[0].slice(0),u.length>2&&"ID"===(l=u[0]).type&&n.getById&&9===t.nodeType&&h&&i.relative[u[1].type]){if(t=(i.find.ID(l.matches[0].replace(nt,rt),t)||[])[0],!t)return r;e=e.slice(u.shift().value.length)}s=J.needsContext.test(e)?0:u.length;while(s--){if(l=u[s],i.relative[c=l.type])break;if((p=i.find[c])&&(o=p(l.matches[0].replace(nt,rt),U.test(u[0].type)&&t.parentNode||t))){if(u.splice(s,1),e=o.length&&mt(u),!e)return O.apply(r,o),r;break}}}return a(e,f)(o,t,!h,r,U.test(e)),r}n.sortStable=v.split("").sort(S).join("")===v,n.detectDuplicates=E,c(),n.sortDetached=ut(function(e){return 1&e.compareDocumentPosition(p.createElement("div"))}),ut(function(e){return e.innerHTML="<a href='#'></a>","#"===e.firstChild.getAttribute("href")})||lt("type|href|height|width",function(e,t,n){return n?undefined:e.getAttribute(t,"type"===t.toLowerCase()?1:2)}),n.attributes&&ut(function(e){return e.innerHTML="<input/>",e.firstChild.setAttribute("value",""),""===e.firstChild.getAttribute("value")})||lt("value",function(e,t,n){return n||"input"!==e.nodeName.toLowerCase()?undefined:e.defaultValue}),ut(function(e){return null==e.getAttribute("disabled")})||lt(R,function(e,t,n){var r;return n?undefined:(r=e.getAttributeNode(t))&&r.specified?r.value:e[t]===!0?t.toLowerCase():null}),x.find=ot,x.expr=ot.selectors,x.expr[":"]=x.expr.pseudos,x.unique=ot.uniqueSort,x.text=ot.getText,x.isXMLDoc=ot.isXML,x.contains=ot.contains}(e);var D={};function A(e){var t=D[e]={};return x.each(e.match(w)||[],function(e,n){t[n]=!0}),t}x.Callbacks=function(e){e="string"==typeof e?D[e]||A(e):x.extend({},e);var t,n,r,i,o,s,a=[],u=!e.once&&[],l=function(p){for(t=e.memory&&p,n=!0,s=i||0,i=0,o=a.length,r=!0;a&&o>s;s++)if(a[s].apply(p[0],p[1])===!1&&e.stopOnFalse){t=!1;break}r=!1,a&&(u?u.length&&l(u.shift()):t?a=[]:c.disable())},c={add:function(){if(a){var n=a.length;(function s(t){x.each(t,function(t,n){var r=x.type(n);"function"===r?e.unique&&c.has(n)||a.push(n):n&&n.length&&"string"!==r&&s(n)})})(arguments),r?o=a.length:t&&(i=n,l(t))}return this},remove:function(){return a&&x.each(arguments,function(e,t){var n;while((n=x.inArray(t,a,n))>-1)a.splice(n,1),r&&(o>=n&&o--,s>=n&&s--)}),this},has:function(e){return e?x.inArray(e,a)>-1:!(!a||!a.length)},empty:function(){return a=[],o=0,this},disable:function(){return a=u=t=undefined,this},disabled:function(){return!a},lock:function(){return u=undefined,t||c.disable(),this},locked:function(){return!u},fireWith:function(e,t){return!a||n&&!u||(t=t||[],t=[e,t.slice?t.slice():t],r?u.push(t):l(t)),this},fire:function(){return c.fireWith(this,arguments),this},fired:function(){return!!n}};return c},x.extend({Deferred:function(e){var t=[["resolve","done",x.Callbacks("once memory"),"resolved"],["reject","fail",x.Callbacks("once memory"),"rejected"],["notify","progress",x.Callbacks("memory")]],n="pending",r={state:function(){return n},always:function(){return i.done(arguments).fail(arguments),this},then:function(){var e=arguments;return x.Deferred(function(n){x.each(t,function(t,o){var s=o[0],a=x.isFunction(e[t])&&e[t];i[o[1]](function(){var e=a&&a.apply(this,arguments);e&&x.isFunction(e.promise)?e.promise().done(n.resolve).fail(n.reject).progress(n.notify):n[s+"With"](this===r?n.promise():this,a?[e]:arguments)})}),e=null}).promise()},promise:function(e){return null!=e?x.extend(e,r):r}},i={};return r.pipe=r.then,x.each(t,function(e,o){var s=o[2],a=o[3];r[o[1]]=s.add,a&&s.add(function(){n=a},t[1^e][2].disable,t[2][2].lock),i[o[0]]=function(){return i[o[0]+"With"](this===i?r:this,arguments),this},i[o[0]+"With"]=s.fireWith}),r.promise(i),e&&e.call(i,i),i},when:function(e){var t=0,n=d.call(arguments),r=n.length,i=1!==r||e&&x.isFunction(e.promise)?r:0,o=1===i?e:x.Deferred(),s=function(e,t,n){return function(r){t[e]=this,n[e]=arguments.length>1?d.call(arguments):r,n===a?o.notifyWith(t,n):--i||o.resolveWith(t,n)}},a,u,l;if(r>1)for(a=Array(r),u=Array(r),l=Array(r);r>t;t++)n[t]&&x.isFunction(n[t].promise)?n[t].promise().done(s(t,l,n)).fail(o.reject).progress(s(t,u,a)):--i;return i||o.resolveWith(l,n),o.promise()}}),x.support=function(t){var n=o.createElement("input"),r=o.createDocumentFragment(),i=o.createElement("div"),s=o.createElement("select"),a=s.appendChild(o.createElement("option"));return n.type?(n.type="checkbox",t.checkOn=""!==n.value,t.optSelected=a.selected,t.reliableMarginRight=!0,t.boxSizingReliable=!0,t.pixelPosition=!1,n.checked=!0,t.noCloneChecked=n.cloneNode(!0).checked,s.disabled=!0,t.optDisabled=!a.disabled,n=o.createElement("input"),n.value="t",n.type="radio",t.radioValue="t"===n.value,n.setAttribute("checked","t"),n.setAttribute("name","t"),r.appendChild(n),t.checkClone=r.cloneNode(!0).cloneNode(!0).lastChild.checked,t.focusinBubbles="onfocusin"in e,i.style.backgroundClip="content-box",i.cloneNode(!0).style.backgroundClip="",t.clearCloneStyle="content-box"===i.style.backgroundClip,x(function(){var n,r,s="padding:0;margin:0;border:0;display:block;-webkit-box-sizing:content-box;-moz-box-sizing:content-box;box-sizing:content-box",a=o.getElementsByTagName("body")[0];a&&(n=o.createElement("div"),n.style.cssText="border:0;width:0;height:0;position:absolute;top:0;left:-9999px;margin-top:1px",a.appendChild(n).appendChild(i),i.innerHTML="",i.style.cssText="-webkit-box-sizing:border-box;-moz-box-sizing:border-box;box-sizing:border-box;padding:1px;border:1px;display:block;width:4px;margin-top:1%;position:absolute;top:1%",x.swap(a,null!=a.style.zoom?{zoom:1}:{},function(){t.boxSizing=4===i.offsetWidth}),e.getComputedStyle&&(t.pixelPosition="1%"!==(e.getComputedStyle(i,null)||{}).top,t.boxSizingReliable="4px"===(e.getComputedStyle(i,null)||{width:"4px"}).width,r=i.appendChild(o.createElement("div")),r.style.cssText=i.style.cssText=s,r.style.marginRight=r.style.width="0",i.style.width="1px",t.reliableMarginRight=!parseFloat((e.getComputedStyle(r,null)||{}).marginRight)),a.removeChild(n))}),t):t}({});var L,q,H=/(?:\{[\s\S]*\}|\[[\s\S]*\])$/,O=/([A-Z])/g;function F(){Object.defineProperty(this.cache={},0,{get:function(){return{}}}),this.expando=x.expando+Math.random()}F.uid=1,F.accepts=function(e){return e.nodeType?1===e.nodeType||9===e.nodeType:!0},F.prototype={key:function(e){if(!F.accepts(e))return 0;var t={},n=e[this.expando];if(!n){n=F.uid++;try{t[this.expando]={value:n},Object.defineProperties(e,t)}catch(r){t[this.expando]=n,x.extend(e,t)}}return this.cache[n]||(this.cache[n]={}),n},set:function(e,t,n){var r,i=this.key(e),o=this.cache[i];if("string"==typeof t)o[t]=n;else if(x.isEmptyObject(o))x.extend(this.cache[i],t);else for(r in t)o[r]=t[r];return o},get:function(e,t){var n=this.cache[this.key(e)];return t===undefined?n:n[t]},access:function(e,t,n){var r;return t===undefined||t&&"string"==typeof t&&n===undefined?(r=this.get(e,t),r!==undefined?r:this.get(e,x.camelCase(t))):(this.set(e,t,n),n!==undefined?n:t)},remove:function(e,t){var n,r,i,o=this.key(e),s=this.cache[o];if(t===undefined)this.cache[o]={};else{x.isArray(t)?r=t.concat(t.map(x.camelCase)):(i=x.camelCase(t),t in s?r=[t,i]:(r=i,r=r in s?[r]:r.match(w)||[])),n=r.length;while(n--)delete s[r[n]]}},hasData:function(e){return!x.isEmptyObject(this.cache[e[this.expando]]||{})},discard:function(e){e[this.expando]&&delete this.cache[e[this.expando]]}},L=new F,q=new F,x.extend({acceptData:F.accepts,hasData:function(e){return L.hasData(e)||q.hasData(e)},data:function(e,t,n){return L.access(e,t,n)},removeData:function(e,t){L.remove(e,t)},_data:function(e,t,n){return q.access(e,t,n)},_removeData:function(e,t){q.remove(e,t)}}),x.fn.extend({data:function(e,t){var n,r,i=this[0],o=0,s=null;if(e===undefined){if(this.length&&(s=L.get(i),1===i.nodeType&&!q.get(i,"hasDataAttrs"))){for(n=i.attributes;n.length>o;o++)r=n[o].name,0===r.indexOf("data-")&&(r=x.camelCase(r.slice(5)),P(i,r,s[r]));q.set(i,"hasDataAttrs",!0)}return s}return"object"==typeof e?this.each(function(){L.set(this,e)}):x.access(this,function(t){var n,r=x.camelCase(e);if(i&&t===undefined){if(n=L.get(i,e),n!==undefined)return n;if(n=L.get(i,r),n!==undefined)return n;if(n=P(i,r,undefined),n!==undefined)return n}else this.each(function(){var n=L.get(this,r);L.set(this,r,t),-1!==e.indexOf("-")&&n!==undefined&&L.set(this,e,t)})},null,t,arguments.length>1,null,!0)},removeData:function(e){return this.each(function(){L.remove(this,e)})}});function P(e,t,n){var r;if(n===undefined&&1===e.nodeType)if(r="data-"+t.replace(O,"-$1").toLowerCase(),n=e.getAttribute(r),"string"==typeof n){try{n="true"===n?!0:"false"===n?!1:"null"===n?null:+n+""===n?+n:H.test(n)?JSON.parse(n):n}catch(i){}L.set(e,t,n)}else n=undefined;return n}x.extend({queue:function(e,t,n){var r;return e?(t=(t||"fx")+"queue",r=q.get(e,t),n&&(!r||x.isArray(n)?r=q.access(e,t,x.makeArray(n)):r.push(n)),r||[]):undefined},dequeue:function(e,t){t=t||"fx";var n=x.queue(e,t),r=n.length,i=n.shift(),o=x._queueHooks(e,t),s=function(){x.dequeue(e,t)
};"inprogress"===i&&(i=n.shift(),r--),i&&("fx"===t&&n.unshift("inprogress"),delete o.stop,i.call(e,s,o)),!r&&o&&o.empty.fire()},_queueHooks:function(e,t){var n=t+"queueHooks";return q.get(e,n)||q.access(e,n,{empty:x.Callbacks("once memory").add(function(){q.remove(e,[t+"queue",n])})})}}),x.fn.extend({queue:function(e,t){var n=2;return"string"!=typeof e&&(t=e,e="fx",n--),n>arguments.length?x.queue(this[0],e):t===undefined?this:this.each(function(){var n=x.queue(this,e,t);x._queueHooks(this,e),"fx"===e&&"inprogress"!==n[0]&&x.dequeue(this,e)})},dequeue:function(e){return this.each(function(){x.dequeue(this,e)})},delay:function(e,t){return e=x.fx?x.fx.speeds[e]||e:e,t=t||"fx",this.queue(t,function(t,n){var r=setTimeout(t,e);n.stop=function(){clearTimeout(r)}})},clearQueue:function(e){return this.queue(e||"fx",[])},promise:function(e,t){var n,r=1,i=x.Deferred(),o=this,s=this.length,a=function(){--r||i.resolveWith(o,[o])};"string"!=typeof e&&(t=e,e=undefined),e=e||"fx";while(s--)n=q.get(o[s],e+"queueHooks"),n&&n.empty&&(r++,n.empty.add(a));return a(),i.promise(t)}});var R,M,W=/[\t\r\n\f]/g,$=/\r/g,B=/^(?:input|select|textarea|button)$/i;x.fn.extend({attr:function(e,t){return x.access(this,x.attr,e,t,arguments.length>1)},removeAttr:function(e){return this.each(function(){x.removeAttr(this,e)})},prop:function(e,t){return x.access(this,x.prop,e,t,arguments.length>1)},removeProp:function(e){return this.each(function(){delete this[x.propFix[e]||e]})},addClass:function(e){var t,n,r,i,o,s=0,a=this.length,u="string"==typeof e&&e;if(x.isFunction(e))return this.each(function(t){x(this).addClass(e.call(this,t,this.className))});if(u)for(t=(e||"").match(w)||[];a>s;s++)if(n=this[s],r=1===n.nodeType&&(n.className?(" "+n.className+" ").replace(W," "):" ")){o=0;while(i=t[o++])0>r.indexOf(" "+i+" ")&&(r+=i+" ");n.className=x.trim(r)}return this},removeClass:function(e){var t,n,r,i,o,s=0,a=this.length,u=0===arguments.length||"string"==typeof e&&e;if(x.isFunction(e))return this.each(function(t){x(this).removeClass(e.call(this,t,this.className))});if(u)for(t=(e||"").match(w)||[];a>s;s++)if(n=this[s],r=1===n.nodeType&&(n.className?(" "+n.className+" ").replace(W," "):"")){o=0;while(i=t[o++])while(r.indexOf(" "+i+" ")>=0)r=r.replace(" "+i+" "," ");n.className=e?x.trim(r):""}return this},toggleClass:function(e,t){var n=typeof e;return"boolean"==typeof t&&"string"===n?t?this.addClass(e):this.removeClass(e):x.isFunction(e)?this.each(function(n){x(this).toggleClass(e.call(this,n,this.className,t),t)}):this.each(function(){if("string"===n){var t,i=0,o=x(this),s=e.match(w)||[];while(t=s[i++])o.hasClass(t)?o.removeClass(t):o.addClass(t)}else(n===r||"boolean"===n)&&(this.className&&q.set(this,"__className__",this.className),this.className=this.className||e===!1?"":q.get(this,"__className__")||"")})},hasClass:function(e){var t=" "+e+" ",n=0,r=this.length;for(;r>n;n++)if(1===this[n].nodeType&&(" "+this[n].className+" ").replace(W," ").indexOf(t)>=0)return!0;return!1},val:function(e){var t,n,r,i=this[0];{if(arguments.length)return r=x.isFunction(e),this.each(function(n){var i;1===this.nodeType&&(i=r?e.call(this,n,x(this).val()):e,null==i?i="":"number"==typeof i?i+="":x.isArray(i)&&(i=x.map(i,function(e){return null==e?"":e+""})),t=x.valHooks[this.type]||x.valHooks[this.nodeName.toLowerCase()],t&&"set"in t&&t.set(this,i,"value")!==undefined||(this.value=i))});if(i)return t=x.valHooks[i.type]||x.valHooks[i.nodeName.toLowerCase()],t&&"get"in t&&(n=t.get(i,"value"))!==undefined?n:(n=i.value,"string"==typeof n?n.replace($,""):null==n?"":n)}}}),x.extend({valHooks:{option:{get:function(e){var t=e.attributes.value;return!t||t.specified?e.value:e.text}},select:{get:function(e){var t,n,r=e.options,i=e.selectedIndex,o="select-one"===e.type||0>i,s=o?null:[],a=o?i+1:r.length,u=0>i?a:o?i:0;for(;a>u;u++)if(n=r[u],!(!n.selected&&u!==i||(x.support.optDisabled?n.disabled:null!==n.getAttribute("disabled"))||n.parentNode.disabled&&x.nodeName(n.parentNode,"optgroup"))){if(t=x(n).val(),o)return t;s.push(t)}return s},set:function(e,t){var n,r,i=e.options,o=x.makeArray(t),s=i.length;while(s--)r=i[s],(r.selected=x.inArray(x(r).val(),o)>=0)&&(n=!0);return n||(e.selectedIndex=-1),o}}},attr:function(e,t,n){var i,o,s=e.nodeType;if(e&&3!==s&&8!==s&&2!==s)return typeof e.getAttribute===r?x.prop(e,t,n):(1===s&&x.isXMLDoc(e)||(t=t.toLowerCase(),i=x.attrHooks[t]||(x.expr.match.bool.test(t)?M:R)),n===undefined?i&&"get"in i&&null!==(o=i.get(e,t))?o:(o=x.find.attr(e,t),null==o?undefined:o):null!==n?i&&"set"in i&&(o=i.set(e,n,t))!==undefined?o:(e.setAttribute(t,n+""),n):(x.removeAttr(e,t),undefined))},removeAttr:function(e,t){var n,r,i=0,o=t&&t.match(w);if(o&&1===e.nodeType)while(n=o[i++])r=x.propFix[n]||n,x.expr.match.bool.test(n)&&(e[r]=!1),e.removeAttribute(n)},attrHooks:{type:{set:function(e,t){if(!x.support.radioValue&&"radio"===t&&x.nodeName(e,"input")){var n=e.value;return e.setAttribute("type",t),n&&(e.value=n),t}}}},propFix:{"for":"htmlFor","class":"className"},prop:function(e,t,n){var r,i,o,s=e.nodeType;if(e&&3!==s&&8!==s&&2!==s)return o=1!==s||!x.isXMLDoc(e),o&&(t=x.propFix[t]||t,i=x.propHooks[t]),n!==undefined?i&&"set"in i&&(r=i.set(e,n,t))!==undefined?r:e[t]=n:i&&"get"in i&&null!==(r=i.get(e,t))?r:e[t]},propHooks:{tabIndex:{get:function(e){return e.hasAttribute("tabindex")||B.test(e.nodeName)||e.href?e.tabIndex:-1}}}}),M={set:function(e,t,n){return t===!1?x.removeAttr(e,n):e.setAttribute(n,n),n}},x.each(x.expr.match.bool.source.match(/\w+/g),function(e,t){var n=x.expr.attrHandle[t]||x.find.attr;x.expr.attrHandle[t]=function(e,t,r){var i=x.expr.attrHandle[t],o=r?undefined:(x.expr.attrHandle[t]=undefined)!=n(e,t,r)?t.toLowerCase():null;return x.expr.attrHandle[t]=i,o}}),x.support.optSelected||(x.propHooks.selected={get:function(e){var t=e.parentNode;return t&&t.parentNode&&t.parentNode.selectedIndex,null}}),x.each(["tabIndex","readOnly","maxLength","cellSpacing","cellPadding","rowSpan","colSpan","useMap","frameBorder","contentEditable"],function(){x.propFix[this.toLowerCase()]=this}),x.each(["radio","checkbox"],function(){x.valHooks[this]={set:function(e,t){return x.isArray(t)?e.checked=x.inArray(x(e).val(),t)>=0:undefined}},x.support.checkOn||(x.valHooks[this].get=function(e){return null===e.getAttribute("value")?"on":e.value})});var I=/^key/,z=/^(?:mouse|contextmenu)|click/,_=/^(?:focusinfocus|focusoutblur)$/,X=/^([^.]*)(?:\.(.+)|)$/;function U(){return!0}function Y(){return!1}function V(){try{return o.activeElement}catch(e){}}x.event={global:{},add:function(e,t,n,i,o){var s,a,u,l,c,p,f,h,d,g,m,y=q.get(e);if(y){n.handler&&(s=n,n=s.handler,o=s.selector),n.guid||(n.guid=x.guid++),(l=y.events)||(l=y.events={}),(a=y.handle)||(a=y.handle=function(e){return typeof x===r||e&&x.event.triggered===e.type?undefined:x.event.dispatch.apply(a.elem,arguments)},a.elem=e),t=(t||"").match(w)||[""],c=t.length;while(c--)u=X.exec(t[c])||[],d=m=u[1],g=(u[2]||"").split(".").sort(),d&&(f=x.event.special[d]||{},d=(o?f.delegateType:f.bindType)||d,f=x.event.special[d]||{},p=x.extend({type:d,origType:m,data:i,handler:n,guid:n.guid,selector:o,needsContext:o&&x.expr.match.needsContext.test(o),namespace:g.join(".")},s),(h=l[d])||(h=l[d]=[],h.delegateCount=0,f.setup&&f.setup.call(e,i,g,a)!==!1||e.addEventListener&&e.addEventListener(d,a,!1)),f.add&&(f.add.call(e,p),p.handler.guid||(p.handler.guid=n.guid)),o?h.splice(h.delegateCount++,0,p):h.push(p),x.event.global[d]=!0);e=null}},remove:function(e,t,n,r,i){var o,s,a,u,l,c,p,f,h,d,g,m=q.hasData(e)&&q.get(e);if(m&&(u=m.events)){t=(t||"").match(w)||[""],l=t.length;while(l--)if(a=X.exec(t[l])||[],h=g=a[1],d=(a[2]||"").split(".").sort(),h){p=x.event.special[h]||{},h=(r?p.delegateType:p.bindType)||h,f=u[h]||[],a=a[2]&&RegExp("(^|\\.)"+d.join("\\.(?:.*\\.|)")+"(\\.|$)"),s=o=f.length;while(o--)c=f[o],!i&&g!==c.origType||n&&n.guid!==c.guid||a&&!a.test(c.namespace)||r&&r!==c.selector&&("**"!==r||!c.selector)||(f.splice(o,1),c.selector&&f.delegateCount--,p.remove&&p.remove.call(e,c));s&&!f.length&&(p.teardown&&p.teardown.call(e,d,m.handle)!==!1||x.removeEvent(e,h,m.handle),delete u[h])}else for(h in u)x.event.remove(e,h+t[l],n,r,!0);x.isEmptyObject(u)&&(delete m.handle,q.remove(e,"events"))}},trigger:function(t,n,r,i){var s,a,u,l,c,p,f,h=[r||o],d=y.call(t,"type")?t.type:t,g=y.call(t,"namespace")?t.namespace.split("."):[];if(a=u=r=r||o,3!==r.nodeType&&8!==r.nodeType&&!_.test(d+x.event.triggered)&&(d.indexOf(".")>=0&&(g=d.split("."),d=g.shift(),g.sort()),c=0>d.indexOf(":")&&"on"+d,t=t[x.expando]?t:new x.Event(d,"object"==typeof t&&t),t.isTrigger=i?2:3,t.namespace=g.join("."),t.namespace_re=t.namespace?RegExp("(^|\\.)"+g.join("\\.(?:.*\\.|)")+"(\\.|$)"):null,t.result=undefined,t.target||(t.target=r),n=null==n?[t]:x.makeArray(n,[t]),f=x.event.special[d]||{},i||!f.trigger||f.trigger.apply(r,n)!==!1)){if(!i&&!f.noBubble&&!x.isWindow(r)){for(l=f.delegateType||d,_.test(l+d)||(a=a.parentNode);a;a=a.parentNode)h.push(a),u=a;u===(r.ownerDocument||o)&&h.push(u.defaultView||u.parentWindow||e)}s=0;while((a=h[s++])&&!t.isPropagationStopped())t.type=s>1?l:f.bindType||d,p=(q.get(a,"events")||{})[t.type]&&q.get(a,"handle"),p&&p.apply(a,n),p=c&&a[c],p&&x.acceptData(a)&&p.apply&&p.apply(a,n)===!1&&t.preventDefault();return t.type=d,i||t.isDefaultPrevented()||f._default&&f._default.apply(h.pop(),n)!==!1||!x.acceptData(r)||c&&x.isFunction(r[d])&&!x.isWindow(r)&&(u=r[c],u&&(r[c]=null),x.event.triggered=d,r[d](),x.event.triggered=undefined,u&&(r[c]=u)),t.result}},dispatch:function(e){e=x.event.fix(e);var t,n,r,i,o,s=[],a=d.call(arguments),u=(q.get(this,"events")||{})[e.type]||[],l=x.event.special[e.type]||{};if(a[0]=e,e.delegateTarget=this,!l.preDispatch||l.preDispatch.call(this,e)!==!1){s=x.event.handlers.call(this,e,u),t=0;while((i=s[t++])&&!e.isPropagationStopped()){e.currentTarget=i.elem,n=0;while((o=i.handlers[n++])&&!e.isImmediatePropagationStopped())(!e.namespace_re||e.namespace_re.test(o.namespace))&&(e.handleObj=o,e.data=o.data,r=((x.event.special[o.origType]||{}).handle||o.handler).apply(i.elem,a),r!==undefined&&(e.result=r)===!1&&(e.preventDefault(),e.stopPropagation()))}return l.postDispatch&&l.postDispatch.call(this,e),e.result}},handlers:function(e,t){var n,r,i,o,s=[],a=t.delegateCount,u=e.target;if(a&&u.nodeType&&(!e.button||"click"!==e.type))for(;u!==this;u=u.parentNode||this)if(u.disabled!==!0||"click"!==e.type){for(r=[],n=0;a>n;n++)o=t[n],i=o.selector+" ",r[i]===undefined&&(r[i]=o.needsContext?x(i,this).index(u)>=0:x.find(i,this,null,[u]).length),r[i]&&r.push(o);r.length&&s.push({elem:u,handlers:r})}return t.length>a&&s.push({elem:this,handlers:t.slice(a)}),s},props:"altKey bubbles cancelable ctrlKey currentTarget eventPhase metaKey relatedTarget shiftKey target timeStamp view which".split(" "),fixHooks:{},keyHooks:{props:"char charCode key keyCode".split(" "),filter:function(e,t){return null==e.which&&(e.which=null!=t.charCode?t.charCode:t.keyCode),e}},mouseHooks:{props:"button buttons clientX clientY offsetX offsetY pageX pageY screenX screenY toElement".split(" "),filter:function(e,t){var n,r,i,s=t.button;return null==e.pageX&&null!=t.clientX&&(n=e.target.ownerDocument||o,r=n.documentElement,i=n.body,e.pageX=t.clientX+(r&&r.scrollLeft||i&&i.scrollLeft||0)-(r&&r.clientLeft||i&&i.clientLeft||0),e.pageY=t.clientY+(r&&r.scrollTop||i&&i.scrollTop||0)-(r&&r.clientTop||i&&i.clientTop||0)),e.which||s===undefined||(e.which=1&s?1:2&s?3:4&s?2:0),e}},fix:function(e){if(e[x.expando])return e;var t,n,r,i=e.type,s=e,a=this.fixHooks[i];a||(this.fixHooks[i]=a=z.test(i)?this.mouseHooks:I.test(i)?this.keyHooks:{}),r=a.props?this.props.concat(a.props):this.props,e=new x.Event(s),t=r.length;while(t--)n=r[t],e[n]=s[n];return e.target||(e.target=o),3===e.target.nodeType&&(e.target=e.target.parentNode),a.filter?a.filter(e,s):e},special:{load:{noBubble:!0},focus:{trigger:function(){return this!==V()&&this.focus?(this.focus(),!1):undefined},delegateType:"focusin"},blur:{trigger:function(){return this===V()&&this.blur?(this.blur(),!1):undefined},delegateType:"focusout"},click:{trigger:function(){return"checkbox"===this.type&&this.click&&x.nodeName(this,"input")?(this.click(),!1):undefined},_default:function(e){return x.nodeName(e.target,"a")}},beforeunload:{postDispatch:function(e){e.result!==undefined&&(e.originalEvent.returnValue=e.result)}}},simulate:function(e,t,n,r){var i=x.extend(new x.Event,n,{type:e,isSimulated:!0,originalEvent:{}});r?x.event.trigger(i,null,t):x.event.dispatch.call(t,i),i.isDefaultPrevented()&&n.preventDefault()}},x.removeEvent=function(e,t,n){e.removeEventListener&&e.removeEventListener(t,n,!1)},x.Event=function(e,t){return this instanceof x.Event?(e&&e.type?(this.originalEvent=e,this.type=e.type,this.isDefaultPrevented=e.defaultPrevented||e.getPreventDefault&&e.getPreventDefault()?U:Y):this.type=e,t&&x.extend(this,t),this.timeStamp=e&&e.timeStamp||x.now(),this[x.expando]=!0,undefined):new x.Event(e,t)},x.Event.prototype={isDefaultPrevented:Y,isPropagationStopped:Y,isImmediatePropagationStopped:Y,preventDefault:function(){var e=this.originalEvent;this.isDefaultPrevented=U,e&&e.preventDefault&&e.preventDefault()},stopPropagation:function(){var e=this.originalEvent;this.isPropagationStopped=U,e&&e.stopPropagation&&e.stopPropagation()},stopImmediatePropagation:function(){this.isImmediatePropagationStopped=U,this.stopPropagation()}},x.each({mouseenter:"mouseover",mouseleave:"mouseout"},function(e,t){x.event.special[e]={delegateType:t,bindType:t,handle:function(e){var n,r=this,i=e.relatedTarget,o=e.handleObj;return(!i||i!==r&&!x.contains(r,i))&&(e.type=o.origType,n=o.handler.apply(this,arguments),e.type=t),n}}}),x.support.focusinBubbles||x.each({focus:"focusin",blur:"focusout"},function(e,t){var n=0,r=function(e){x.event.simulate(t,e.target,x.event.fix(e),!0)};x.event.special[t]={setup:function(){0===n++&&o.addEventListener(e,r,!0)},teardown:function(){0===--n&&o.removeEventListener(e,r,!0)}}}),x.fn.extend({on:function(e,t,n,r,i){var o,s;if("object"==typeof e){"string"!=typeof t&&(n=n||t,t=undefined);for(s in e)this.on(s,t,n,e[s],i);return this}if(null==n&&null==r?(r=t,n=t=undefined):null==r&&("string"==typeof t?(r=n,n=undefined):(r=n,n=t,t=undefined)),r===!1)r=Y;else if(!r)return this;return 1===i&&(o=r,r=function(e){return x().off(e),o.apply(this,arguments)},r.guid=o.guid||(o.guid=x.guid++)),this.each(function(){x.event.add(this,e,r,n,t)})},one:function(e,t,n,r){return this.on(e,t,n,r,1)},off:function(e,t,n){var r,i;if(e&&e.preventDefault&&e.handleObj)return r=e.handleObj,x(e.delegateTarget).off(r.namespace?r.origType+"."+r.namespace:r.origType,r.selector,r.handler),this;if("object"==typeof e){for(i in e)this.off(i,t,e[i]);return this}return(t===!1||"function"==typeof t)&&(n=t,t=undefined),n===!1&&(n=Y),this.each(function(){x.event.remove(this,e,n,t)})},trigger:function(e,t){return this.each(function(){x.event.trigger(e,t,this)})},triggerHandler:function(e,t){var n=this[0];return n?x.event.trigger(e,t,n,!0):undefined}});var G=/^.[^:#\[\.,]*$/,J=/^(?:parents|prev(?:Until|All))/,Q=x.expr.match.needsContext,K={children:!0,contents:!0,next:!0,prev:!0};x.fn.extend({find:function(e){var t,n=[],r=this,i=r.length;if("string"!=typeof e)return this.pushStack(x(e).filter(function(){for(t=0;i>t;t++)if(x.contains(r[t],this))return!0}));for(t=0;i>t;t++)x.find(e,r[t],n);return n=this.pushStack(i>1?x.unique(n):n),n.selector=this.selector?this.selector+" "+e:e,n},has:function(e){var t=x(e,this),n=t.length;return this.filter(function(){var e=0;for(;n>e;e++)if(x.contains(this,t[e]))return!0})},not:function(e){return this.pushStack(et(this,e||[],!0))},filter:function(e){return this.pushStack(et(this,e||[],!1))},is:function(e){return!!et(this,"string"==typeof e&&Q.test(e)?x(e):e||[],!1).length},closest:function(e,t){var n,r=0,i=this.length,o=[],s=Q.test(e)||"string"!=typeof e?x(e,t||this.context):0;for(;i>r;r++)for(n=this[r];n&&n!==t;n=n.parentNode)if(11>n.nodeType&&(s?s.index(n)>-1:1===n.nodeType&&x.find.matchesSelector(n,e))){n=o.push(n);break}return this.pushStack(o.length>1?x.unique(o):o)},index:function(e){return e?"string"==typeof e?g.call(x(e),this[0]):g.call(this,e.jquery?e[0]:e):this[0]&&this[0].parentNode?this.first().prevAll().length:-1},add:function(e,t){var n="string"==typeof e?x(e,t):x.makeArray(e&&e.nodeType?[e]:e),r=x.merge(this.get(),n);return this.pushStack(x.unique(r))},addBack:function(e){return this.add(null==e?this.prevObject:this.prevObject.filter(e))}});function Z(e,t){while((e=e[t])&&1!==e.nodeType);return e}x.each({parent:function(e){var t=e.parentNode;return t&&11!==t.nodeType?t:null},parents:function(e){return x.dir(e,"parentNode")},parentsUntil:function(e,t,n){return x.dir(e,"parentNode",n)},next:function(e){return Z(e,"nextSibling")},prev:function(e){return Z(e,"previousSibling")},nextAll:function(e){return x.dir(e,"nextSibling")},prevAll:function(e){return x.dir(e,"previousSibling")},nextUntil:function(e,t,n){return x.dir(e,"nextSibling",n)},prevUntil:function(e,t,n){return x.dir(e,"previousSibling",n)},siblings:function(e){return x.sibling((e.parentNode||{}).firstChild,e)},children:function(e){return x.sibling(e.firstChild)},contents:function(e){return e.contentDocument||x.merge([],e.childNodes)}},function(e,t){x.fn[e]=function(n,r){var i=x.map(this,t,n);return"Until"!==e.slice(-5)&&(r=n),r&&"string"==typeof r&&(i=x.filter(r,i)),this.length>1&&(K[e]||x.unique(i),J.test(e)&&i.reverse()),this.pushStack(i)}}),x.extend({filter:function(e,t,n){var r=t[0];return n&&(e=":not("+e+")"),1===t.length&&1===r.nodeType?x.find.matchesSelector(r,e)?[r]:[]:x.find.matches(e,x.grep(t,function(e){return 1===e.nodeType}))},dir:function(e,t,n){var r=[],i=n!==undefined;while((e=e[t])&&9!==e.nodeType)if(1===e.nodeType){if(i&&x(e).is(n))break;r.push(e)}return r},sibling:function(e,t){var n=[];for(;e;e=e.nextSibling)1===e.nodeType&&e!==t&&n.push(e);return n}});function et(e,t,n){if(x.isFunction(t))return x.grep(e,function(e,r){return!!t.call(e,r,e)!==n});if(t.nodeType)return x.grep(e,function(e){return e===t!==n});if("string"==typeof t){if(G.test(t))return x.filter(t,e,n);t=x.filter(t,e)}return x.grep(e,function(e){return g.call(t,e)>=0!==n})}var tt=/<(?!area|br|col|embed|hr|img|input|link|meta|param)(([\w:]+)[^>]*)\/>/gi,nt=/<([\w:]+)/,rt=/<|&#?\w+;/,it=/<(?:script|style|link)/i,ot=/^(?:checkbox|radio)$/i,st=/checked\s*(?:[^=]|=\s*.checked.)/i,at=/^$|\/(?:java|ecma)script/i,ut=/^true\/(.*)/,lt=/^\s*<!(?:\[CDATA\[|--)|(?:\]\]|--)>\s*$/g,ct={option:[1,"<select multiple='multiple'>","</select>"],thead:[1,"<table>","</table>"],col:[2,"<table><colgroup>","</colgroup></table>"],tr:[2,"<table><tbody>","</tbody></table>"],td:[3,"<table><tbody><tr>","</tr></tbody></table>"],_default:[0,"",""]};ct.optgroup=ct.option,ct.tbody=ct.tfoot=ct.colgroup=ct.caption=ct.thead,ct.th=ct.td,x.fn.extend({text:function(e){return x.access(this,function(e){return e===undefined?x.text(this):this.empty().append((this[0]&&this[0].ownerDocument||o).createTextNode(e))},null,e,arguments.length)},append:function(){return this.domManip(arguments,function(e){if(1===this.nodeType||11===this.nodeType||9===this.nodeType){var t=pt(this,e);t.appendChild(e)}})},prepend:function(){return this.domManip(arguments,function(e){if(1===this.nodeType||11===this.nodeType||9===this.nodeType){var t=pt(this,e);t.insertBefore(e,t.firstChild)}})},before:function(){return this.domManip(arguments,function(e){this.parentNode&&this.parentNode.insertBefore(e,this)})},after:function(){return this.domManip(arguments,function(e){this.parentNode&&this.parentNode.insertBefore(e,this.nextSibling)})},remove:function(e,t){var n,r=e?x.filter(e,this):this,i=0;for(;null!=(n=r[i]);i++)t||1!==n.nodeType||x.cleanData(mt(n)),n.parentNode&&(t&&x.contains(n.ownerDocument,n)&&dt(mt(n,"script")),n.parentNode.removeChild(n));return this},empty:function(){var e,t=0;for(;null!=(e=this[t]);t++)1===e.nodeType&&(x.cleanData(mt(e,!1)),e.textContent="");return this},clone:function(e,t){return e=null==e?!1:e,t=null==t?e:t,this.map(function(){return x.clone(this,e,t)})},html:function(e){return x.access(this,function(e){var t=this[0]||{},n=0,r=this.length;if(e===undefined&&1===t.nodeType)return t.innerHTML;if("string"==typeof e&&!it.test(e)&&!ct[(nt.exec(e)||["",""])[1].toLowerCase()]){e=e.replace(tt,"<$1></$2>");try{for(;r>n;n++)t=this[n]||{},1===t.nodeType&&(x.cleanData(mt(t,!1)),t.innerHTML=e);t=0}catch(i){}}t&&this.empty().append(e)},null,e,arguments.length)},replaceWith:function(){var e=x.map(this,function(e){return[e.nextSibling,e.parentNode]}),t=0;return this.domManip(arguments,function(n){var r=e[t++],i=e[t++];i&&(r&&r.parentNode!==i&&(r=this.nextSibling),x(this).remove(),i.insertBefore(n,r))},!0),t?this:this.remove()},detach:function(e){return this.remove(e,!0)},domManip:function(e,t,n){e=f.apply([],e);var r,i,o,s,a,u,l=0,c=this.length,p=this,h=c-1,d=e[0],g=x.isFunction(d);if(g||!(1>=c||"string"!=typeof d||x.support.checkClone)&&st.test(d))return this.each(function(r){var i=p.eq(r);g&&(e[0]=d.call(this,r,i.html())),i.domManip(e,t,n)});if(c&&(r=x.buildFragment(e,this[0].ownerDocument,!1,!n&&this),i=r.firstChild,1===r.childNodes.length&&(r=i),i)){for(o=x.map(mt(r,"script"),ft),s=o.length;c>l;l++)a=r,l!==h&&(a=x.clone(a,!0,!0),s&&x.merge(o,mt(a,"script"))),t.call(this[l],a,l);if(s)for(u=o[o.length-1].ownerDocument,x.map(o,ht),l=0;s>l;l++)a=o[l],at.test(a.type||"")&&!q.access(a,"globalEval")&&x.contains(u,a)&&(a.src?x._evalUrl(a.src):x.globalEval(a.textContent.replace(lt,"")))}return this}}),x.each({appendTo:"append",prependTo:"prepend",insertBefore:"before",insertAfter:"after",replaceAll:"replaceWith"},function(e,t){x.fn[e]=function(e){var n,r=[],i=x(e),o=i.length-1,s=0;for(;o>=s;s++)n=s===o?this:this.clone(!0),x(i[s])[t](n),h.apply(r,n.get());return this.pushStack(r)}}),x.extend({clone:function(e,t,n){var r,i,o,s,a=e.cloneNode(!0),u=x.contains(e.ownerDocument,e);if(!(x.support.noCloneChecked||1!==e.nodeType&&11!==e.nodeType||x.isXMLDoc(e)))for(s=mt(a),o=mt(e),r=0,i=o.length;i>r;r++)yt(o[r],s[r]);if(t)if(n)for(o=o||mt(e),s=s||mt(a),r=0,i=o.length;i>r;r++)gt(o[r],s[r]);else gt(e,a);return s=mt(a,"script"),s.length>0&&dt(s,!u&&mt(e,"script")),a},buildFragment:function(e,t,n,r){var i,o,s,a,u,l,c=0,p=e.length,f=t.createDocumentFragment(),h=[];for(;p>c;c++)if(i=e[c],i||0===i)if("object"===x.type(i))x.merge(h,i.nodeType?[i]:i);else if(rt.test(i)){o=o||f.appendChild(t.createElement("div")),s=(nt.exec(i)||["",""])[1].toLowerCase(),a=ct[s]||ct._default,o.innerHTML=a[1]+i.replace(tt,"<$1></$2>")+a[2],l=a[0];while(l--)o=o.lastChild;x.merge(h,o.childNodes),o=f.firstChild,o.textContent=""}else h.push(t.createTextNode(i));f.textContent="",c=0;while(i=h[c++])if((!r||-1===x.inArray(i,r))&&(u=x.contains(i.ownerDocument,i),o=mt(f.appendChild(i),"script"),u&&dt(o),n)){l=0;while(i=o[l++])at.test(i.type||"")&&n.push(i)}return f},cleanData:function(e){var t,n,r,i,o,s,a=x.event.special,u=0;for(;(n=e[u])!==undefined;u++){if(F.accepts(n)&&(o=n[q.expando],o&&(t=q.cache[o]))){if(r=Object.keys(t.events||{}),r.length)for(s=0;(i=r[s])!==undefined;s++)a[i]?x.event.remove(n,i):x.removeEvent(n,i,t.handle);q.cache[o]&&delete q.cache[o]}delete L.cache[n[L.expando]]}},_evalUrl:function(e){return x.ajax({url:e,type:"GET",dataType:"script",async:!1,global:!1,"throws":!0})}});function pt(e,t){return x.nodeName(e,"table")&&x.nodeName(1===t.nodeType?t:t.firstChild,"tr")?e.getElementsByTagName("tbody")[0]||e.appendChild(e.ownerDocument.createElement("tbody")):e}function ft(e){return e.type=(null!==e.getAttribute("type"))+"/"+e.type,e}function ht(e){var t=ut.exec(e.type);return t?e.type=t[1]:e.removeAttribute("type"),e}function dt(e,t){var n=e.length,r=0;for(;n>r;r++)q.set(e[r],"globalEval",!t||q.get(t[r],"globalEval"))}function gt(e,t){var n,r,i,o,s,a,u,l;if(1===t.nodeType){if(q.hasData(e)&&(o=q.access(e),s=q.set(t,o),l=o.events)){delete s.handle,s.events={};for(i in l)for(n=0,r=l[i].length;r>n;n++)x.event.add(t,i,l[i][n])}L.hasData(e)&&(a=L.access(e),u=x.extend({},a),L.set(t,u))}}function mt(e,t){var n=e.getElementsByTagName?e.getElementsByTagName(t||"*"):e.querySelectorAll?e.querySelectorAll(t||"*"):[];return t===undefined||t&&x.nodeName(e,t)?x.merge([e],n):n}function yt(e,t){var n=t.nodeName.toLowerCase();"input"===n&&ot.test(e.type)?t.checked=e.checked:("input"===n||"textarea"===n)&&(t.defaultValue=e.defaultValue)}x.fn.extend({wrapAll:function(e){var t;return x.isFunction(e)?this.each(function(t){x(this).wrapAll(e.call(this,t))}):(this[0]&&(t=x(e,this[0].ownerDocument).eq(0).clone(!0),this[0].parentNode&&t.insertBefore(this[0]),t.map(function(){var e=this;while(e.firstElementChild)e=e.firstElementChild;return e}).append(this)),this)},wrapInner:function(e){return x.isFunction(e)?this.each(function(t){x(this).wrapInner(e.call(this,t))}):this.each(function(){var t=x(this),n=t.contents();n.length?n.wrapAll(e):t.append(e)})},wrap:function(e){var t=x.isFunction(e);return this.each(function(n){x(this).wrapAll(t?e.call(this,n):e)})},unwrap:function(){return this.parent().each(function(){x.nodeName(this,"body")||x(this).replaceWith(this.childNodes)}).end()}});var vt,xt,bt=/^(none|table(?!-c[ea]).+)/,wt=/^margin/,Tt=RegExp("^("+b+")(.*)$","i"),Ct=RegExp("^("+b+")(?!px)[a-z%]+$","i"),kt=RegExp("^([+-])=("+b+")","i"),Nt={BODY:"block"},Et={position:"absolute",visibility:"hidden",display:"block"},St={letterSpacing:0,fontWeight:400},jt=["Top","Right","Bottom","Left"],Dt=["Webkit","O","Moz","ms"];function At(e,t){if(t in e)return t;var n=t.charAt(0).toUpperCase()+t.slice(1),r=t,i=Dt.length;while(i--)if(t=Dt[i]+n,t in e)return t;return r}function Lt(e,t){return e=t||e,"none"===x.css(e,"display")||!x.contains(e.ownerDocument,e)}function qt(t){return e.getComputedStyle(t,null)}function Ht(e,t){var n,r,i,o=[],s=0,a=e.length;for(;a>s;s++)r=e[s],r.style&&(o[s]=q.get(r,"olddisplay"),n=r.style.display,t?(o[s]||"none"!==n||(r.style.display=""),""===r.style.display&&Lt(r)&&(o[s]=q.access(r,"olddisplay",Rt(r.nodeName)))):o[s]||(i=Lt(r),(n&&"none"!==n||!i)&&q.set(r,"olddisplay",i?n:x.css(r,"display"))));for(s=0;a>s;s++)r=e[s],r.style&&(t&&"none"!==r.style.display&&""!==r.style.display||(r.style.display=t?o[s]||"":"none"));return e}x.fn.extend({css:function(e,t){return x.access(this,function(e,t,n){var r,i,o={},s=0;if(x.isArray(t)){for(r=qt(e),i=t.length;i>s;s++)o[t[s]]=x.css(e,t[s],!1,r);return o}return n!==undefined?x.style(e,t,n):x.css(e,t)},e,t,arguments.length>1)},show:function(){return Ht(this,!0)},hide:function(){return Ht(this)},toggle:function(e){return"boolean"==typeof e?e?this.show():this.hide():this.each(function(){Lt(this)?x(this).show():x(this).hide()})}}),x.extend({cssHooks:{opacity:{get:function(e,t){if(t){var n=vt(e,"opacity");return""===n?"1":n}}}},cssNumber:{columnCount:!0,fillOpacity:!0,fontWeight:!0,lineHeight:!0,opacity:!0,order:!0,orphans:!0,widows:!0,zIndex:!0,zoom:!0},cssProps:{"float":"cssFloat"},style:function(e,t,n,r){if(e&&3!==e.nodeType&&8!==e.nodeType&&e.style){var i,o,s,a=x.camelCase(t),u=e.style;return t=x.cssProps[a]||(x.cssProps[a]=At(u,a)),s=x.cssHooks[t]||x.cssHooks[a],n===undefined?s&&"get"in s&&(i=s.get(e,!1,r))!==undefined?i:u[t]:(o=typeof n,"string"===o&&(i=kt.exec(n))&&(n=(i[1]+1)*i[2]+parseFloat(x.css(e,t)),o="number"),null==n||"number"===o&&isNaN(n)||("number"!==o||x.cssNumber[a]||(n+="px"),x.support.clearCloneStyle||""!==n||0!==t.indexOf("background")||(u[t]="inherit"),s&&"set"in s&&(n=s.set(e,n,r))===undefined||(u[t]=n)),undefined)}},css:function(e,t,n,r){var i,o,s,a=x.camelCase(t);return t=x.cssProps[a]||(x.cssProps[a]=At(e.style,a)),s=x.cssHooks[t]||x.cssHooks[a],s&&"get"in s&&(i=s.get(e,!0,n)),i===undefined&&(i=vt(e,t,r)),"normal"===i&&t in St&&(i=St[t]),""===n||n?(o=parseFloat(i),n===!0||x.isNumeric(o)?o||0:i):i}}),vt=function(e,t,n){var r,i,o,s=n||qt(e),a=s?s.getPropertyValue(t)||s[t]:undefined,u=e.style;return s&&(""!==a||x.contains(e.ownerDocument,e)||(a=x.style(e,t)),Ct.test(a)&&wt.test(t)&&(r=u.width,i=u.minWidth,o=u.maxWidth,u.minWidth=u.maxWidth=u.width=a,a=s.width,u.width=r,u.minWidth=i,u.maxWidth=o)),a};function Ot(e,t,n){var r=Tt.exec(t);return r?Math.max(0,r[1]-(n||0))+(r[2]||"px"):t}function Ft(e,t,n,r,i){var o=n===(r?"border":"content")?4:"width"===t?1:0,s=0;for(;4>o;o+=2)"margin"===n&&(s+=x.css(e,n+jt[o],!0,i)),r?("content"===n&&(s-=x.css(e,"padding"+jt[o],!0,i)),"margin"!==n&&(s-=x.css(e,"border"+jt[o]+"Width",!0,i))):(s+=x.css(e,"padding"+jt[o],!0,i),"padding"!==n&&(s+=x.css(e,"border"+jt[o]+"Width",!0,i)));return s}function Pt(e,t,n){var r=!0,i="width"===t?e.offsetWidth:e.offsetHeight,o=qt(e),s=x.support.boxSizing&&"border-box"===x.css(e,"boxSizing",!1,o);if(0>=i||null==i){if(i=vt(e,t,o),(0>i||null==i)&&(i=e.style[t]),Ct.test(i))return i;r=s&&(x.support.boxSizingReliable||i===e.style[t]),i=parseFloat(i)||0}return i+Ft(e,t,n||(s?"border":"content"),r,o)+"px"}function Rt(e){var t=o,n=Nt[e];return n||(n=Mt(e,t),"none"!==n&&n||(xt=(xt||x("<iframe frameborder='0' width='0' height='0'/>").css("cssText","display:block !important")).appendTo(t.documentElement),t=(xt[0].contentWindow||xt[0].contentDocument).document,t.write("<!doctype html><html><body>"),t.close(),n=Mt(e,t),xt.detach()),Nt[e]=n),n}function Mt(e,t){var n=x(t.createElement(e)).appendTo(t.body),r=x.css(n[0],"display");return n.remove(),r}x.each(["height","width"],function(e,t){x.cssHooks[t]={get:function(e,n,r){return n?0===e.offsetWidth&&bt.test(x.css(e,"display"))?x.swap(e,Et,function(){return Pt(e,t,r)}):Pt(e,t,r):undefined},set:function(e,n,r){var i=r&&qt(e);return Ot(e,n,r?Ft(e,t,r,x.support.boxSizing&&"border-box"===x.css(e,"boxSizing",!1,i),i):0)}}}),x(function(){x.support.reliableMarginRight||(x.cssHooks.marginRight={get:function(e,t){return t?x.swap(e,{display:"inline-block"},vt,[e,"marginRight"]):undefined}}),!x.support.pixelPosition&&x.fn.position&&x.each(["top","left"],function(e,t){x.cssHooks[t]={get:function(e,n){return n?(n=vt(e,t),Ct.test(n)?x(e).position()[t]+"px":n):undefined}}})}),x.expr&&x.expr.filters&&(x.expr.filters.hidden=function(e){return 0>=e.offsetWidth&&0>=e.offsetHeight},x.expr.filters.visible=function(e){return!x.expr.filters.hidden(e)}),x.each({margin:"",padding:"",border:"Width"},function(e,t){x.cssHooks[e+t]={expand:function(n){var r=0,i={},o="string"==typeof n?n.split(" "):[n];for(;4>r;r++)i[e+jt[r]+t]=o[r]||o[r-2]||o[0];return i}},wt.test(e)||(x.cssHooks[e+t].set=Ot)});var Wt=/%20/g,$t=/\[\]$/,Bt=/\r?\n/g,It=/^(?:submit|button|image|reset|file)$/i,zt=/^(?:input|select|textarea|keygen)/i;x.fn.extend({serialize:function(){return x.param(this.serializeArray())},serializeArray:function(){return this.map(function(){var e=x.prop(this,"elements");return e?x.makeArray(e):this}).filter(function(){var e=this.type;return this.name&&!x(this).is(":disabled")&&zt.test(this.nodeName)&&!It.test(e)&&(this.checked||!ot.test(e))}).map(function(e,t){var n=x(this).val();return null==n?null:x.isArray(n)?x.map(n,function(e){return{name:t.name,value:e.replace(Bt,"\r\n")}}):{name:t.name,value:n.replace(Bt,"\r\n")}}).get()}}),x.param=function(e,t){var n,r=[],i=function(e,t){t=x.isFunction(t)?t():null==t?"":t,r[r.length]=encodeURIComponent(e)+"="+encodeURIComponent(t)};if(t===undefined&&(t=x.ajaxSettings&&x.ajaxSettings.traditional),x.isArray(e)||e.jquery&&!x.isPlainObject(e))x.each(e,function(){i(this.name,this.value)});else for(n in e)_t(n,e[n],t,i);return r.join("&").replace(Wt,"+")};function _t(e,t,n,r){var i;if(x.isArray(t))x.each(t,function(t,i){n||$t.test(e)?r(e,i):_t(e+"["+("object"==typeof i?t:"")+"]",i,n,r)});else if(n||"object"!==x.type(t))r(e,t);else for(i in t)_t(e+"["+i+"]",t[i],n,r)}x.each("blur focus focusin focusout load resize scroll unload click dblclick mousedown mouseup mousemove mouseover mouseout mouseenter mouseleave change select submit keydown keypress keyup error contextmenu".split(" "),function(e,t){x.fn[t]=function(e,n){return arguments.length>0?this.on(t,null,e,n):this.trigger(t)}}),x.fn.extend({hover:function(e,t){return this.mouseenter(e).mouseleave(t||e)},bind:function(e,t,n){return this.on(e,null,t,n)},unbind:function(e,t){return this.off(e,null,t)
},delegate:function(e,t,n,r){return this.on(t,e,n,r)},undelegate:function(e,t,n){return 1===arguments.length?this.off(e,"**"):this.off(t,e||"**",n)}});var Xt,Ut,Yt=x.now(),Vt=/\?/,Gt=/#.*$/,Jt=/([?&])_=[^&]*/,Qt=/^(.*?):[ \t]*([^\r\n]*)$/gm,Kt=/^(?:about|app|app-storage|.+-extension|file|res|widget):$/,Zt=/^(?:GET|HEAD)$/,en=/^\/\//,tn=/^([\w.+-]+:)(?:\/\/([^\/?#:]*)(?::(\d+)|)|)/,nn=x.fn.load,rn={},on={},sn="*/".concat("*");try{Ut=i.href}catch(an){Ut=o.createElement("a"),Ut.href="",Ut=Ut.href}Xt=tn.exec(Ut.toLowerCase())||[];function un(e){return function(t,n){"string"!=typeof t&&(n=t,t="*");var r,i=0,o=t.toLowerCase().match(w)||[];if(x.isFunction(n))while(r=o[i++])"+"===r[0]?(r=r.slice(1)||"*",(e[r]=e[r]||[]).unshift(n)):(e[r]=e[r]||[]).push(n)}}function ln(e,t,n,r){var i={},o=e===on;function s(a){var u;return i[a]=!0,x.each(e[a]||[],function(e,a){var l=a(t,n,r);return"string"!=typeof l||o||i[l]?o?!(u=l):undefined:(t.dataTypes.unshift(l),s(l),!1)}),u}return s(t.dataTypes[0])||!i["*"]&&s("*")}function cn(e,t){var n,r,i=x.ajaxSettings.flatOptions||{};for(n in t)t[n]!==undefined&&((i[n]?e:r||(r={}))[n]=t[n]);return r&&x.extend(!0,e,r),e}x.fn.load=function(e,t,n){if("string"!=typeof e&&nn)return nn.apply(this,arguments);var r,i,o,s=this,a=e.indexOf(" ");return a>=0&&(r=e.slice(a),e=e.slice(0,a)),x.isFunction(t)?(n=t,t=undefined):t&&"object"==typeof t&&(i="POST"),s.length>0&&x.ajax({url:e,type:i,dataType:"html",data:t}).done(function(e){o=arguments,s.html(r?x("<div>").append(x.parseHTML(e)).find(r):e)}).complete(n&&function(e,t){s.each(n,o||[e.responseText,t,e])}),this},x.each(["ajaxStart","ajaxStop","ajaxComplete","ajaxError","ajaxSuccess","ajaxSend"],function(e,t){x.fn[t]=function(e){return this.on(t,e)}}),x.extend({active:0,lastModified:{},etag:{},ajaxSettings:{url:Ut,type:"GET",isLocal:Kt.test(Xt[1]),global:!0,processData:!0,async:!0,contentType:"application/x-www-form-urlencoded; charset=UTF-8",accepts:{"*":sn,text:"text/plain",html:"text/html",xml:"application/xml, text/xml",json:"application/json, text/javascript"},contents:{xml:/xml/,html:/html/,json:/json/},responseFields:{xml:"responseXML",text:"responseText",json:"responseJSON"},converters:{"* text":String,"text html":!0,"text json":x.parseJSON,"text xml":x.parseXML},flatOptions:{url:!0,context:!0}},ajaxSetup:function(e,t){return t?cn(cn(e,x.ajaxSettings),t):cn(x.ajaxSettings,e)},ajaxPrefilter:un(rn),ajaxTransport:un(on),ajax:function(e,t){"object"==typeof e&&(t=e,e=undefined),t=t||{};var n,r,i,o,s,a,u,l,c=x.ajaxSetup({},t),p=c.context||c,f=c.context&&(p.nodeType||p.jquery)?x(p):x.event,h=x.Deferred(),d=x.Callbacks("once memory"),g=c.statusCode||{},m={},y={},v=0,b="canceled",T={readyState:0,getResponseHeader:function(e){var t;if(2===v){if(!o){o={};while(t=Qt.exec(i))o[t[1].toLowerCase()]=t[2]}t=o[e.toLowerCase()]}return null==t?null:t},getAllResponseHeaders:function(){return 2===v?i:null},setRequestHeader:function(e,t){var n=e.toLowerCase();return v||(e=y[n]=y[n]||e,m[e]=t),this},overrideMimeType:function(e){return v||(c.mimeType=e),this},statusCode:function(e){var t;if(e)if(2>v)for(t in e)g[t]=[g[t],e[t]];else T.always(e[T.status]);return this},abort:function(e){var t=e||b;return n&&n.abort(t),k(0,t),this}};if(h.promise(T).complete=d.add,T.success=T.done,T.error=T.fail,c.url=((e||c.url||Ut)+"").replace(Gt,"").replace(en,Xt[1]+"//"),c.type=t.method||t.type||c.method||c.type,c.dataTypes=x.trim(c.dataType||"*").toLowerCase().match(w)||[""],null==c.crossDomain&&(a=tn.exec(c.url.toLowerCase()),c.crossDomain=!(!a||a[1]===Xt[1]&&a[2]===Xt[2]&&(a[3]||("http:"===a[1]?"80":"443"))===(Xt[3]||("http:"===Xt[1]?"80":"443")))),c.data&&c.processData&&"string"!=typeof c.data&&(c.data=x.param(c.data,c.traditional)),ln(rn,c,t,T),2===v)return T;u=c.global,u&&0===x.active++&&x.event.trigger("ajaxStart"),c.type=c.type.toUpperCase(),c.hasContent=!Zt.test(c.type),r=c.url,c.hasContent||(c.data&&(r=c.url+=(Vt.test(r)?"&":"?")+c.data,delete c.data),c.cache===!1&&(c.url=Jt.test(r)?r.replace(Jt,"$1_="+Yt++):r+(Vt.test(r)?"&":"?")+"_="+Yt++)),c.ifModified&&(x.lastModified[r]&&T.setRequestHeader("If-Modified-Since",x.lastModified[r]),x.etag[r]&&T.setRequestHeader("If-None-Match",x.etag[r])),(c.data&&c.hasContent&&c.contentType!==!1||t.contentType)&&T.setRequestHeader("Content-Type",c.contentType),T.setRequestHeader("Accept",c.dataTypes[0]&&c.accepts[c.dataTypes[0]]?c.accepts[c.dataTypes[0]]+("*"!==c.dataTypes[0]?", "+sn+"; q=0.01":""):c.accepts["*"]);for(l in c.headers)T.setRequestHeader(l,c.headers[l]);if(c.beforeSend&&(c.beforeSend.call(p,T,c)===!1||2===v))return T.abort();b="abort";for(l in{success:1,error:1,complete:1})T[l](c[l]);if(n=ln(on,c,t,T)){T.readyState=1,u&&f.trigger("ajaxSend",[T,c]),c.async&&c.timeout>0&&(s=setTimeout(function(){T.abort("timeout")},c.timeout));try{v=1,n.send(m,k)}catch(C){if(!(2>v))throw C;k(-1,C)}}else k(-1,"No Transport");function k(e,t,o,a){var l,m,y,b,w,C=t;2!==v&&(v=2,s&&clearTimeout(s),n=undefined,i=a||"",T.readyState=e>0?4:0,l=e>=200&&300>e||304===e,o&&(b=pn(c,T,o)),b=fn(c,b,T,l),l?(c.ifModified&&(w=T.getResponseHeader("Last-Modified"),w&&(x.lastModified[r]=w),w=T.getResponseHeader("etag"),w&&(x.etag[r]=w)),204===e||"HEAD"===c.type?C="nocontent":304===e?C="notmodified":(C=b.state,m=b.data,y=b.error,l=!y)):(y=C,(e||!C)&&(C="error",0>e&&(e=0))),T.status=e,T.statusText=(t||C)+"",l?h.resolveWith(p,[m,C,T]):h.rejectWith(p,[T,C,y]),T.statusCode(g),g=undefined,u&&f.trigger(l?"ajaxSuccess":"ajaxError",[T,c,l?m:y]),d.fireWith(p,[T,C]),u&&(f.trigger("ajaxComplete",[T,c]),--x.active||x.event.trigger("ajaxStop")))}return T},getJSON:function(e,t,n){return x.get(e,t,n,"json")},getScript:function(e,t){return x.get(e,undefined,t,"script")}}),x.each(["get","post"],function(e,t){x[t]=function(e,n,r,i){return x.isFunction(n)&&(i=i||r,r=n,n=undefined),x.ajax({url:e,type:t,dataType:i,data:n,success:r})}});function pn(e,t,n){var r,i,o,s,a=e.contents,u=e.dataTypes;while("*"===u[0])u.shift(),r===undefined&&(r=e.mimeType||t.getResponseHeader("Content-Type"));if(r)for(i in a)if(a[i]&&a[i].test(r)){u.unshift(i);break}if(u[0]in n)o=u[0];else{for(i in n){if(!u[0]||e.converters[i+" "+u[0]]){o=i;break}s||(s=i)}o=o||s}return o?(o!==u[0]&&u.unshift(o),n[o]):undefined}function fn(e,t,n,r){var i,o,s,a,u,l={},c=e.dataTypes.slice();if(c[1])for(s in e.converters)l[s.toLowerCase()]=e.converters[s];o=c.shift();while(o)if(e.responseFields[o]&&(n[e.responseFields[o]]=t),!u&&r&&e.dataFilter&&(t=e.dataFilter(t,e.dataType)),u=o,o=c.shift())if("*"===o)o=u;else if("*"!==u&&u!==o){if(s=l[u+" "+o]||l["* "+o],!s)for(i in l)if(a=i.split(" "),a[1]===o&&(s=l[u+" "+a[0]]||l["* "+a[0]])){s===!0?s=l[i]:l[i]!==!0&&(o=a[0],c.unshift(a[1]));break}if(s!==!0)if(s&&e["throws"])t=s(t);else try{t=s(t)}catch(p){return{state:"parsererror",error:s?p:"No conversion from "+u+" to "+o}}}return{state:"success",data:t}}x.ajaxSetup({accepts:{script:"text/javascript, application/javascript, application/ecmascript, application/x-ecmascript"},contents:{script:/(?:java|ecma)script/},converters:{"text script":function(e){return x.globalEval(e),e}}}),x.ajaxPrefilter("script",function(e){e.cache===undefined&&(e.cache=!1),e.crossDomain&&(e.type="GET")}),x.ajaxTransport("script",function(e){if(e.crossDomain){var t,n;return{send:function(r,i){t=x("<script>").prop({async:!0,charset:e.scriptCharset,src:e.url}).on("load error",n=function(e){t.remove(),n=null,e&&i("error"===e.type?404:200,e.type)}),o.head.appendChild(t[0])},abort:function(){n&&n()}}}});var hn=[],dn=/(=)\?(?=&|$)|\?\?/;x.ajaxSetup({jsonp:"callback",jsonpCallback:function(){var e=hn.pop()||x.expando+"_"+Yt++;return this[e]=!0,e}}),x.ajaxPrefilter("json jsonp",function(t,n,r){var i,o,s,a=t.jsonp!==!1&&(dn.test(t.url)?"url":"string"==typeof t.data&&!(t.contentType||"").indexOf("application/x-www-form-urlencoded")&&dn.test(t.data)&&"data");return a||"jsonp"===t.dataTypes[0]?(i=t.jsonpCallback=x.isFunction(t.jsonpCallback)?t.jsonpCallback():t.jsonpCallback,a?t[a]=t[a].replace(dn,"$1"+i):t.jsonp!==!1&&(t.url+=(Vt.test(t.url)?"&":"?")+t.jsonp+"="+i),t.converters["script json"]=function(){return s||x.error(i+" was not called"),s[0]},t.dataTypes[0]="json",o=e[i],e[i]=function(){s=arguments},r.always(function(){e[i]=o,t[i]&&(t.jsonpCallback=n.jsonpCallback,hn.push(i)),s&&x.isFunction(o)&&o(s[0]),s=o=undefined}),"script"):undefined}),x.ajaxSettings.xhr=function(){try{return new XMLHttpRequest}catch(e){}};var gn=x.ajaxSettings.xhr(),mn={0:200,1223:204},yn=0,vn={};e.ActiveXObject&&x(e).on("unload",function(){for(var e in vn)vn[e]();vn=undefined}),x.support.cors=!!gn&&"withCredentials"in gn,x.support.ajax=gn=!!gn,x.ajaxTransport(function(e){var t;return x.support.cors||gn&&!e.crossDomain?{send:function(n,r){var i,o,s=e.xhr();if(s.open(e.type,e.url,e.async,e.username,e.password),e.xhrFields)for(i in e.xhrFields)s[i]=e.xhrFields[i];e.mimeType&&s.overrideMimeType&&s.overrideMimeType(e.mimeType),e.crossDomain||n["X-Requested-With"]||(n["X-Requested-With"]="XMLHttpRequest");for(i in n)s.setRequestHeader(i,n[i]);t=function(e){return function(){t&&(delete vn[o],t=s.onload=s.onerror=null,"abort"===e?s.abort():"error"===e?r(s.status||404,s.statusText):r(mn[s.status]||s.status,s.statusText,"string"==typeof s.responseText?{text:s.responseText}:undefined,s.getAllResponseHeaders()))}},s.onload=t(),s.onerror=t("error"),t=vn[o=yn++]=t("abort"),s.send(e.hasContent&&e.data||null)},abort:function(){t&&t()}}:undefined});var xn,bn,wn=/^(?:toggle|show|hide)$/,Tn=RegExp("^(?:([+-])=|)("+b+")([a-z%]*)$","i"),Cn=/queueHooks$/,kn=[An],Nn={"*":[function(e,t){var n=this.createTween(e,t),r=n.cur(),i=Tn.exec(t),o=i&&i[3]||(x.cssNumber[e]?"":"px"),s=(x.cssNumber[e]||"px"!==o&&+r)&&Tn.exec(x.css(n.elem,e)),a=1,u=20;if(s&&s[3]!==o){o=o||s[3],i=i||[],s=+r||1;do a=a||".5",s/=a,x.style(n.elem,e,s+o);while(a!==(a=n.cur()/r)&&1!==a&&--u)}return i&&(s=n.start=+s||+r||0,n.unit=o,n.end=i[1]?s+(i[1]+1)*i[2]:+i[2]),n}]};function En(){return setTimeout(function(){xn=undefined}),xn=x.now()}function Sn(e,t,n){var r,i=(Nn[t]||[]).concat(Nn["*"]),o=0,s=i.length;for(;s>o;o++)if(r=i[o].call(n,t,e))return r}function jn(e,t,n){var r,i,o=0,s=kn.length,a=x.Deferred().always(function(){delete u.elem}),u=function(){if(i)return!1;var t=xn||En(),n=Math.max(0,l.startTime+l.duration-t),r=n/l.duration||0,o=1-r,s=0,u=l.tweens.length;for(;u>s;s++)l.tweens[s].run(o);return a.notifyWith(e,[l,o,n]),1>o&&u?n:(a.resolveWith(e,[l]),!1)},l=a.promise({elem:e,props:x.extend({},t),opts:x.extend(!0,{specialEasing:{}},n),originalProperties:t,originalOptions:n,startTime:xn||En(),duration:n.duration,tweens:[],createTween:function(t,n){var r=x.Tween(e,l.opts,t,n,l.opts.specialEasing[t]||l.opts.easing);return l.tweens.push(r),r},stop:function(t){var n=0,r=t?l.tweens.length:0;if(i)return this;for(i=!0;r>n;n++)l.tweens[n].run(1);return t?a.resolveWith(e,[l,t]):a.rejectWith(e,[l,t]),this}}),c=l.props;for(Dn(c,l.opts.specialEasing);s>o;o++)if(r=kn[o].call(l,e,c,l.opts))return r;return x.map(c,Sn,l),x.isFunction(l.opts.start)&&l.opts.start.call(e,l),x.fx.timer(x.extend(u,{elem:e,anim:l,queue:l.opts.queue})),l.progress(l.opts.progress).done(l.opts.done,l.opts.complete).fail(l.opts.fail).always(l.opts.always)}function Dn(e,t){var n,r,i,o,s;for(n in e)if(r=x.camelCase(n),i=t[r],o=e[n],x.isArray(o)&&(i=o[1],o=e[n]=o[0]),n!==r&&(e[r]=o,delete e[n]),s=x.cssHooks[r],s&&"expand"in s){o=s.expand(o),delete e[r];for(n in o)n in e||(e[n]=o[n],t[n]=i)}else t[r]=i}x.Animation=x.extend(jn,{tweener:function(e,t){x.isFunction(e)?(t=e,e=["*"]):e=e.split(" ");var n,r=0,i=e.length;for(;i>r;r++)n=e[r],Nn[n]=Nn[n]||[],Nn[n].unshift(t)},prefilter:function(e,t){t?kn.unshift(e):kn.push(e)}});function An(e,t,n){var r,i,o,s,a,u,l=this,c={},p=e.style,f=e.nodeType&&Lt(e),h=q.get(e,"fxshow");n.queue||(a=x._queueHooks(e,"fx"),null==a.unqueued&&(a.unqueued=0,u=a.empty.fire,a.empty.fire=function(){a.unqueued||u()}),a.unqueued++,l.always(function(){l.always(function(){a.unqueued--,x.queue(e,"fx").length||a.empty.fire()})})),1===e.nodeType&&("height"in t||"width"in t)&&(n.overflow=[p.overflow,p.overflowX,p.overflowY],"inline"===x.css(e,"display")&&"none"===x.css(e,"float")&&(p.display="inline-block")),n.overflow&&(p.overflow="hidden",l.always(function(){p.overflow=n.overflow[0],p.overflowX=n.overflow[1],p.overflowY=n.overflow[2]}));for(r in t)if(i=t[r],wn.exec(i)){if(delete t[r],o=o||"toggle"===i,i===(f?"hide":"show")){if("show"!==i||!h||h[r]===undefined)continue;f=!0}c[r]=h&&h[r]||x.style(e,r)}if(!x.isEmptyObject(c)){h?"hidden"in h&&(f=h.hidden):h=q.access(e,"fxshow",{}),o&&(h.hidden=!f),f?x(e).show():l.done(function(){x(e).hide()}),l.done(function(){var t;q.remove(e,"fxshow");for(t in c)x.style(e,t,c[t])});for(r in c)s=Sn(f?h[r]:0,r,l),r in h||(h[r]=s.start,f&&(s.end=s.start,s.start="width"===r||"height"===r?1:0))}}function Ln(e,t,n,r,i){return new Ln.prototype.init(e,t,n,r,i)}x.Tween=Ln,Ln.prototype={constructor:Ln,init:function(e,t,n,r,i,o){this.elem=e,this.prop=n,this.easing=i||"swing",this.options=t,this.start=this.now=this.cur(),this.end=r,this.unit=o||(x.cssNumber[n]?"":"px")},cur:function(){var e=Ln.propHooks[this.prop];return e&&e.get?e.get(this):Ln.propHooks._default.get(this)},run:function(e){var t,n=Ln.propHooks[this.prop];return this.pos=t=this.options.duration?x.easing[this.easing](e,this.options.duration*e,0,1,this.options.duration):e,this.now=(this.end-this.start)*t+this.start,this.options.step&&this.options.step.call(this.elem,this.now,this),n&&n.set?n.set(this):Ln.propHooks._default.set(this),this}},Ln.prototype.init.prototype=Ln.prototype,Ln.propHooks={_default:{get:function(e){var t;return null==e.elem[e.prop]||e.elem.style&&null!=e.elem.style[e.prop]?(t=x.css(e.elem,e.prop,""),t&&"auto"!==t?t:0):e.elem[e.prop]},set:function(e){x.fx.step[e.prop]?x.fx.step[e.prop](e):e.elem.style&&(null!=e.elem.style[x.cssProps[e.prop]]||x.cssHooks[e.prop])?x.style(e.elem,e.prop,e.now+e.unit):e.elem[e.prop]=e.now}}},Ln.propHooks.scrollTop=Ln.propHooks.scrollLeft={set:function(e){e.elem.nodeType&&e.elem.parentNode&&(e.elem[e.prop]=e.now)}},x.each(["toggle","show","hide"],function(e,t){var n=x.fn[t];x.fn[t]=function(e,r,i){return null==e||"boolean"==typeof e?n.apply(this,arguments):this.animate(qn(t,!0),e,r,i)}}),x.fn.extend({fadeTo:function(e,t,n,r){return this.filter(Lt).css("opacity",0).show().end().animate({opacity:t},e,n,r)},animate:function(e,t,n,r){var i=x.isEmptyObject(e),o=x.speed(t,n,r),s=function(){var t=jn(this,x.extend({},e),o);(i||q.get(this,"finish"))&&t.stop(!0)};return s.finish=s,i||o.queue===!1?this.each(s):this.queue(o.queue,s)},stop:function(e,t,n){var r=function(e){var t=e.stop;delete e.stop,t(n)};return"string"!=typeof e&&(n=t,t=e,e=undefined),t&&e!==!1&&this.queue(e||"fx",[]),this.each(function(){var t=!0,i=null!=e&&e+"queueHooks",o=x.timers,s=q.get(this);if(i)s[i]&&s[i].stop&&r(s[i]);else for(i in s)s[i]&&s[i].stop&&Cn.test(i)&&r(s[i]);for(i=o.length;i--;)o[i].elem!==this||null!=e&&o[i].queue!==e||(o[i].anim.stop(n),t=!1,o.splice(i,1));(t||!n)&&x.dequeue(this,e)})},finish:function(e){return e!==!1&&(e=e||"fx"),this.each(function(){var t,n=q.get(this),r=n[e+"queue"],i=n[e+"queueHooks"],o=x.timers,s=r?r.length:0;for(n.finish=!0,x.queue(this,e,[]),i&&i.stop&&i.stop.call(this,!0),t=o.length;t--;)o[t].elem===this&&o[t].queue===e&&(o[t].anim.stop(!0),o.splice(t,1));for(t=0;s>t;t++)r[t]&&r[t].finish&&r[t].finish.call(this);delete n.finish})}});function qn(e,t){var n,r={height:e},i=0;for(t=t?1:0;4>i;i+=2-t)n=jt[i],r["margin"+n]=r["padding"+n]=e;return t&&(r.opacity=r.width=e),r}x.each({slideDown:qn("show"),slideUp:qn("hide"),slideToggle:qn("toggle"),fadeIn:{opacity:"show"},fadeOut:{opacity:"hide"},fadeToggle:{opacity:"toggle"}},function(e,t){x.fn[e]=function(e,n,r){return this.animate(t,e,n,r)}}),x.speed=function(e,t,n){var r=e&&"object"==typeof e?x.extend({},e):{complete:n||!n&&t||x.isFunction(e)&&e,duration:e,easing:n&&t||t&&!x.isFunction(t)&&t};return r.duration=x.fx.off?0:"number"==typeof r.duration?r.duration:r.duration in x.fx.speeds?x.fx.speeds[r.duration]:x.fx.speeds._default,(null==r.queue||r.queue===!0)&&(r.queue="fx"),r.old=r.complete,r.complete=function(){x.isFunction(r.old)&&r.old.call(this),r.queue&&x.dequeue(this,r.queue)},r},x.easing={linear:function(e){return e},swing:function(e){return.5-Math.cos(e*Math.PI)/2}},x.timers=[],x.fx=Ln.prototype.init,x.fx.tick=function(){var e,t=x.timers,n=0;for(xn=x.now();t.length>n;n++)e=t[n],e()||t[n]!==e||t.splice(n--,1);t.length||x.fx.stop(),xn=undefined},x.fx.timer=function(e){e()&&x.timers.push(e)&&x.fx.start()},x.fx.interval=13,x.fx.start=function(){bn||(bn=setInterval(x.fx.tick,x.fx.interval))},x.fx.stop=function(){clearInterval(bn),bn=null},x.fx.speeds={slow:600,fast:200,_default:400},x.fx.step={},x.expr&&x.expr.filters&&(x.expr.filters.animated=function(e){return x.grep(x.timers,function(t){return e===t.elem}).length}),x.fn.offset=function(e){if(arguments.length)return e===undefined?this:this.each(function(t){x.offset.setOffset(this,e,t)});var t,n,i=this[0],o={top:0,left:0},s=i&&i.ownerDocument;if(s)return t=s.documentElement,x.contains(t,i)?(typeof i.getBoundingClientRect!==r&&(o=i.getBoundingClientRect()),n=Hn(s),{top:o.top+n.pageYOffset-t.clientTop,left:o.left+n.pageXOffset-t.clientLeft}):o},x.offset={setOffset:function(e,t,n){var r,i,o,s,a,u,l,c=x.css(e,"position"),p=x(e),f={};"static"===c&&(e.style.position="relative"),a=p.offset(),o=x.css(e,"top"),u=x.css(e,"left"),l=("absolute"===c||"fixed"===c)&&(o+u).indexOf("auto")>-1,l?(r=p.position(),s=r.top,i=r.left):(s=parseFloat(o)||0,i=parseFloat(u)||0),x.isFunction(t)&&(t=t.call(e,n,a)),null!=t.top&&(f.top=t.top-a.top+s),null!=t.left&&(f.left=t.left-a.left+i),"using"in t?t.using.call(e,f):p.css(f)}},x.fn.extend({position:function(){if(this[0]){var e,t,n=this[0],r={top:0,left:0};return"fixed"===x.css(n,"position")?t=n.getBoundingClientRect():(e=this.offsetParent(),t=this.offset(),x.nodeName(e[0],"html")||(r=e.offset()),r.top+=x.css(e[0],"borderTopWidth",!0),r.left+=x.css(e[0],"borderLeftWidth",!0)),{top:t.top-r.top-x.css(n,"marginTop",!0),left:t.left-r.left-x.css(n,"marginLeft",!0)}}},offsetParent:function(){return this.map(function(){var e=this.offsetParent||s;while(e&&!x.nodeName(e,"html")&&"static"===x.css(e,"position"))e=e.offsetParent;return e||s})}}),x.each({scrollLeft:"pageXOffset",scrollTop:"pageYOffset"},function(t,n){var r="pageYOffset"===n;x.fn[t]=function(i){return x.access(this,function(t,i,o){var s=Hn(t);return o===undefined?s?s[n]:t[i]:(s?s.scrollTo(r?e.pageXOffset:o,r?o:e.pageYOffset):t[i]=o,undefined)},t,i,arguments.length,null)}});function Hn(e){return x.isWindow(e)?e:9===e.nodeType&&e.defaultView}x.each({Height:"height",Width:"width"},function(e,t){x.each({padding:"inner"+e,content:t,"":"outer"+e},function(n,r){x.fn[r]=function(r,i){var o=arguments.length&&(n||"boolean"!=typeof r),s=n||(r===!0||i===!0?"margin":"border");return x.access(this,function(t,n,r){var i;return x.isWindow(t)?t.document.documentElement["client"+e]:9===t.nodeType?(i=t.documentElement,Math.max(t.body["scroll"+e],i["scroll"+e],t.body["offset"+e],i["offset"+e],i["client"+e])):r===undefined?x.css(t,n,s):x.style(t,n,r,s)},t,o?r:undefined,o,null)}})}),x.fn.size=function(){return this.length},x.fn.andSelf=x.fn.addBack,"object"==typeof module&&module&&"object"==typeof module.exports?module.exports=x:"function"==typeof define&&define.amd&&define("jquery",[],function(){return x}),"object"==typeof e&&"object"==typeof e.document&&(e.jQuery=e.$=x)})(window);

},{}],37:[function(require,module,exports){
/*! jquery-overlay - v0.0.4 - 2014-06-11 */!function(a){"use strict";var b=function(){var b;return b=a("<div></div>").css(["color"]).color,"undefined"!=typeof b?function(a,b){return a.css(b)}:function(b,c){var d;return d={},a.each(c,function(a,c){d[c]=b.css(c)}),d}}(),c={"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#x27;","/":"&#x2F;"},d=/[&<>"'\/]/g,e=function(a){return a.replace(d,function(a){return c[a]})},f=function(){function c(c){var e,i;i=c.css("position"),"static"===i&&(i="relative"),e=a(d.wrapper).css(a.extend({},f.wrapper,b(c,g),{position:i})),this.textareaTop=parseInt(c.css("border-top-width")),this.$el=a(d.overlay).css(a.extend({},f.overlay,b(c,h),{top:this.textareaTop,right:parseInt(c.css("border-right-width")),bottom:parseInt(c.css("border-bottom-width")),left:parseInt(c.css("border-left-width"))})),this.$textarea=c.css(f.textarea),this.$textarea.wrap(e).before(this.$el),this.$textarea.origVal=c.val,this.$textarea.val=a.proxy(this.val,this),this.$textarea.on({"input.overlay":a.proxy(this.onInput,this),"change.overlay":a.proxy(this.onInput,this),"scroll.overlay":a.proxy(this.resizeOverlay,this),"resize.overlay":a.proxy(this.resizeOverlay,this)}),this.strategies=[]}var d,f,g,h;return d={wrapper:'<div class="textoverlay-wrapper"></div>',overlay:'<div class="textoverlay"></div>'},f={wrapper:{margin:0,padding:0,overflow:"hidden"},overlay:{position:"absolute",color:"transparent","white-space":"pre-wrap","word-wrap":"break-word",overflow:"hidden"},textarea:{background:"transparent",position:"relative",outline:0}},g=["display"],h=["margin-top","margin-right","margin-bottom","margin-left","padding-top","padding-right","padding-bottom","padding-left","font-family","font-weight","font-size","background-color"],a.extend(c.prototype,{val:function(a){return null==a?this.$textarea.origVal():this.setVal(a)},setVal:function(a){return this.$textarea.origVal(a),this.renderTextOnOverlay(),this.$textarea},onInput:function(){this.renderTextOnOverlay()},renderTextOnOverlay:function(){var b,c,d,f,g,h;for(b=a("<div></div>").text(this.$textarea.val()),c=0,d=this.strategies.length;d>c;c++)f=this.strategies[c],g=f.match,a.isArray(g)&&(g=a.map(g,function(a){return a.replace(/(\(|\)|\|)/g,"$1")}),g=new RegExp("("+g.join("|")+")","g")),h="background-color:"+f.css["background-color"],b.contents().each(function(){var b,c,d,f;if(this.nodeType==Node.TEXT_NODE){for(b=this.textContent,c="",f=g.lastIndex=0;;f=g.lastIndex){if(d=g.exec(b),!d){f&&(c+=e(b.substr(f)));break}d=d[0],c+=e(b.substr(f,g.lastIndex-f-d.length)),c+='<span style="'+h+'">'+e(d)+"</span>"}f&&a(this).replaceWith(c)}});return this.$el.html(b.contents()),this},resizeOverlay:function(){this.$el.css({top:this.textareaTop-this.$textarea.scrollTop()})},register:function(b){return b=a.isArray(b)?b:[b],this.strategies=this.strategies.concat(b),this.renderTextOnOverlay()},destroy:function(){var a;this.$textarea.off(".overlay"),a=this.$textarea.parent(),a.after(this.$textarea).remove(),this.$textarea.removeData("overlay"),this.$textarea=null}}),c}();a.fn.overlay=function(b){var c;return c="overlay","destroy"===b?this.each(function(){var b=a(this).data(c);b&&b.destroy()}):this.each(function(){var d,e;d=a(this),e=d.data(c),e||(e=new f(d),d.data(c,e)),e.register(b)})}}(window.jQuery);
},{}],38:[function(require,module,exports){
/*! jquery-textcomplete - v0.3.3 - 2014-09-25 */if("undefined"==typeof jQuery)throw new Error("jQuery.textcomplete requires jQuery");+function(a){"use strict";var b=function(a){console.warn&&console.warn(a)};a.fn.textcomplete=function(c,d){var e=Array.prototype.slice.call(arguments);return this.each(function(){var f=a(this),g=f.data("textComplete");if(g||(g=new a.fn.textcomplete.Completer(this,d||{}),f.data("textComplete",g)),"string"==typeof c){if(!g)return;e.shift(),g[c].apply(g,e)}else a.each(c,function(c){a.each(["header","footer","placement","maxCount"],function(a){c[a]&&(g.option[a]=c[a],b(a+"as a strategy param is deplicated. Use option."),delete c[a])})}),g.register(a.fn.textcomplete.Strategy.parse(c))})}}(jQuery),+function(a){"use strict";function b(c,d){if(this.$el=a(c),this.id="textcomplete"+e++,this.strategies=[],this.views=[],this.option=a.extend({},b.DEFAULTS,d),!this.$el.is("textarea")&&!c.isContentEditable)throw new Error("textcomplete must be called to a Textarea or a ContentEditable.");if(c===document.activeElement)this.initialize();else{var f=this;this.$el.one("focus."+this.id,function(){f.initialize()})}}var c=function(a){var b,c;return function(){var d=Array.prototype.slice.call(arguments);if(b)return c=d,void 0;b=!0;var e=this;d.unshift(function f(){if(c){var d=c;c=void 0,d.unshift(f),a.apply(e,d)}else b=!1}),a.apply(this,d)}},d=function(a){return"[object String]"===Object.prototype.toString.call(a)},e=0;b.DEFAULTS={appendTo:a("body"),zIndex:"100"},a.extend(b.prototype,{id:null,option:null,strategies:null,adapter:null,dropdown:null,$el:null,initialize:function(){var b=this.$el.get(0);this.dropdown=new a.fn.textcomplete.Dropdown(b,this,this.option);var c,d;this.option.adapter?c=this.option.adapter:(d=this.$el.is("textarea")?"number"==typeof b.selectionEnd?"Textarea":"IETextarea":"ContentEditable",c=a.fn.textcomplete[d]),this.adapter=new c(b,this,this.option)},destroy:function(){this.$el.off("."+this.id),this.adapter.destroy(),this.dropdown.destroy(),this.$el=this.adapter=this.dropdown=null},trigger:function(a,b){this.dropdown||this.initialize(),null!=a||(a=this.adapter.getTextFromHeadToCaret());var c=this._extractSearchQuery(a);if(c.length){var d=c[1];if(b&&this._term===d)return;this._term=d,this._search.apply(this,c)}else this._term=null,this.dropdown.deactivate()},fire:function(a){return this.$el.trigger(a),this},register:function(a){Array.prototype.push.apply(this.strategies,a)},select:function(a,b){this.adapter.select(a,b),this.fire("change").fire("textComplete:select",a,b),this.adapter.focus()},_clearAtNext:!0,_term:null,_extractSearchQuery:function(a){for(var b=0;b<this.strategies.length;b++){var c=this.strategies[b],e=c.context(a);if(e||""===e){d(e)&&(a=e);var f=a.match(c.match);if(f)return[c,f[c.index],f]}}return[]},_search:c(function(a,b,c,d){var e=this;b.search(c,function(c,d){e.dropdown.shown||(e.dropdown.activate(),e.dropdown.setPosition(e.adapter.getCaretPosition())),e._clearAtNext&&(e.dropdown.clear(),e._clearAtNext=!1),e.dropdown.render(e._zip(c,b)),d||(a(),e._clearAtNext=!0)},d)}),_zip:function(b,c){return a.map(b,function(a){return{value:a,strategy:c}})}}),a.fn.textcomplete.Completer=b}(jQuery),+function(a){"use strict";function b(c,e,f){this.$el=b.findOrCreateElement(f),this.completer=e,this.id=e.id+"dropdown",this._data=[],this.$inputEl=a(c),f.listPosition&&(this.setPosition=f.listPosition),f.height&&this.$el.height(f.height);var g=this;a.each(["maxCount","placement","footer","header","className"],function(a,b){null!=f[b]&&(g[b]=f[b])}),this._bindEvents(c),d[this.id]=this}var c=function(a,b){var c,d,e=b.strategy.idProperty;for(c=0;c<a.length;c++)if(d=a[c],d.strategy===b.strategy)if(e){if(d.value[e]===b.value[e])return!0}else if(d.value===b.value)return!0;return!1},d={};a(document).on("click",function(b){var c=b.originalEvent&&b.originalEvent.keepTextCompleteDropdown;a.each(d,function(a,b){a!==c&&b.deactivate()})}),a.extend(b,{findOrCreateElement:function(b){var c=b.appendTo;c instanceof a||(c=a(c));var d=c.children(".dropdown-menu");return d.length||(d=a('<ul class="dropdown-menu"></ul>').css({display:"none",left:0,position:"absolute",zIndex:b.zIndex}).appendTo(c)),d}}),a.extend(b.prototype,{$el:null,$inputEl:null,completer:null,footer:null,header:null,id:null,maxCount:10,placement:"",shown:!1,data:[],className:"",destroy:function(){this.deactivate(),this.$el.off("."+this.id),this.$inputEl.off("."+this.id),this.clear(),this.$el=this.$inputEl=this.completer=null,delete d[this.id]},render:function(b){var c=this._buildContents(b),d=a.map(this.data,function(a){return a.value});this.data.length?(this._renderHeader(d),this._renderFooter(d),c&&(this._renderContents(c),this._activateIndexedItem()),this._setScroll()):this.shown&&this.deactivate()},setPosition:function(a){return this.$el.css(this._applyPlacement(a)),this},clear:function(){this.$el.html(""),this.data=[],this._index=0,this._$header=this._$footer=null},activate:function(){return this.shown||(this.clear(),this.$el.show(),this.className&&this.$el.addClass(this.className),this.completer.fire("textComplete:show"),this.shown=!0),this},deactivate:function(){return this.shown&&(this.$el.hide(),this.className&&this.$el.removeClass(this.className),this.completer.fire("textComplete:hide"),this.shown=!1),this},isUp:function(a){return 38===a.keyCode||a.ctrlKey&&80===a.keyCode},isDown:function(a){return 40===a.keyCode||a.ctrlKey&&78===a.keyCode},isEnter:function(a){var b=a.ctrlKey||a.altKey||a.metaKey||a.shiftKey;return!b&&(13===a.keyCode||9===a.keyCode)},isPageup:function(a){return 33===a.keyCode},isPagedown:function(a){return 34===a.keyCode},_data:null,_index:null,_$header:null,_$footer:null,_bindEvents:function(){this.$el.on("mousedown."+this.id,".textcomplete-item",a.proxy(this._onClick,this)),this.$el.on("mouseover."+this.id,".textcomplete-item",a.proxy(this._onMouseover,this)),this.$inputEl.on("keydown."+this.id,a.proxy(this._onKeydown,this))},_onClick:function(b){var c=a(b.target);b.preventDefault(),b.originalEvent.keepTextCompleteDropdown=this.id,c.hasClass("textcomplete-item")||(c=c.closest(".textcomplete-item"));var d=this.data[parseInt(c.data("index"),10)];this.completer.select(d.value,d.strategy);var e=this;setTimeout(function(){e.deactivate()},0)},_onMouseover:function(b){var c=a(b.target);b.preventDefault(),c.hasClass("textcomplete-item")||(c=c.closest(".textcomplete-item")),this._index=parseInt(c.data("index"),10),this._activateIndexedItem()},_onKeydown:function(a){this.shown&&(this.isUp(a)?(a.preventDefault(),this._up()):this.isDown(a)?(a.preventDefault(),this._down()):this.isEnter(a)?(a.preventDefault(),this._enter()):this.isPageup(a)?(a.preventDefault(),this._pageup()):this.isPagedown(a)&&(a.preventDefault(),this._pagedown()))},_up:function(){0===this._index?this._index=this.data.length-1:this._index-=1,this._activateIndexedItem(),this._setScroll()},_down:function(){this._index===this.data.length-1?this._index=0:this._index+=1,this._activateIndexedItem(),this._setScroll()},_enter:function(){var a=this.data[parseInt(this._getActiveElement().data("index"),10)];this.completer.select(a.value,a.strategy),this._setScroll()},_pageup:function(){var b=0,c=this._getActiveElement().position().top-this.$el.innerHeight();this.$el.children().each(function(d){return a(this).position().top+a(this).outerHeight()>c?(b=d,!1):void 0}),this._index=b,this._activateIndexedItem(),this._setScroll()},_pagedown:function(){var b=this.data.length-1,c=this._getActiveElement().position().top+this.$el.innerHeight();this.$el.children().each(function(d){return a(this).position().top>c?(b=d,!1):void 0}),this._index=b,this._activateIndexedItem(),this._setScroll()},_activateIndexedItem:function(){this.$el.find(".textcomplete-item.active").removeClass("active"),this._getActiveElement().addClass("active")},_getActiveElement:function(){return this.$el.children(".textcomplete-item:nth("+this._index+")")},_setScroll:function(){var a=this._getActiveElement(),b=a.position().top,c=a.outerHeight(),d=this.$el.innerHeight(),e=this.$el.scrollTop();0===this._index||this._index==this.data.length-1||0>b?this.$el.scrollTop(b+e):b+c>d&&this.$el.scrollTop(b+c+e-d)},_buildContents:function(a){var b,d,e,f="";for(d=0;d<a.length&&this.data.length!==this.maxCount;d++)b=a[d],c(this.data,b)||(e=this.data.length,this.data.push(b),f+='<li class="textcomplete-item" data-index="'+e+'"><a>',f+=b.strategy.template(b.value),f+="</a></li>");return f},_renderHeader:function(b){if(this.header){this._$header||(this._$header=a('<li class="textcomplete-header"></li>').prependTo(this.$el));var c=a.isFunction(this.header)?this.header(b):this.header;this._$header.html(c)}},_renderFooter:function(b){if(this.footer){this._$footer||(this._$footer=a('<li class="textcomplete-footer"></li>').appendTo(this.$el));var c=a.isFunction(this.footer)?this.footer(b):this.footer;this._$footer.html(c)}},_renderContents:function(a){this._$footer?this._$footer.before(a):this.$el.append(a)},_applyPlacement:function(a){return-1!==this.placement.indexOf("top")?a={top:"auto",bottom:this.$el.parent().height()-a.top+a.lineHeight,left:a.left}:(a.bottom="auto",delete a.lineHeight),-1!==this.placement.indexOf("absleft")?a.left=0:-1!==this.placement.indexOf("absright")&&(a.right=0,a.left="auto"),a}}),a.fn.textcomplete.Dropdown=b}(jQuery),+function(a){"use strict";function b(b){a.extend(this,b),this.cache&&(this.search=c(this.search))}var c=function(a){var b={};return function(c,d){b[c]?d(b[c]):a.call(this,c,function(a){b[c]=(b[c]||[]).concat(a),d.apply(null,arguments)})}};b.parse=function(c){return a.map(c,function(a){return new b(a)})},a.extend(b.prototype,{match:null,replace:null,search:null,cache:!1,context:function(){return!0},index:2,template:function(a){return a},idProperty:null}),a.fn.textcomplete.Strategy=b}(jQuery),+function(a){"use strict";function b(){}var c=Date.now||function(){return(new Date).getTime()},d=function(a,b){var d,e,f,g,h,i=function(){var j=c()-g;b>j?d=setTimeout(i,b-j):(d=null,h=a.apply(f,e),f=e=null)};return function(){return f=this,e=arguments,g=c(),d||(d=setTimeout(i,b)),h}};a.extend(b.prototype,{id:null,completer:null,el:null,$el:null,option:null,initialize:function(b,c,e){this.el=b,this.$el=a(b),this.id=c.id+this.constructor.name,this.completer=c,this.option=e,this.option.debounce&&(this._onKeyup=d(this._onKeyup,this.option.debounce)),this._bindEvents()},destroy:function(){this.$el.off("."+this.id),this.$el=this.el=this.completer=null},select:function(){throw new Error("Not implemented")},getCaretPosition:function(){var a=this._getCaretRelativePosition(),b=this.$el.offset();return a.top+=b.top,a.left+=b.left,a},focus:function(){this.$el.focus()},_bindEvents:function(){this.$el.on("keyup."+this.id,a.proxy(this._onKeyup,this))},_onKeyup:function(a){this._skipSearch(a)||this.completer.trigger(this.getTextFromHeadToCaret(),!0)},_skipSearch:function(a){switch(a.keyCode){case 40:case 38:return!0}if(a.ctrlKey)switch(a.keyCode){case 78:case 80:return!0}}}),a.fn.textcomplete.Adapter=b}(jQuery),+function(a){"use strict";function b(a,b,c){this.initialize(a,b,c)}b.DIV_PROPERTIES={left:-9999,position:"absolute",top:0,whiteSpace:"pre-wrap"},b.COPY_PROPERTIES=["border-width","font-family","font-size","font-style","font-variant","font-weight","height","letter-spacing","word-spacing","line-height","text-decoration","text-align","width","padding-top","padding-right","padding-bottom","padding-left","margin-top","margin-right","margin-bottom","margin-left","border-style","box-sizing","tab-size"],a.extend(b.prototype,a.fn.textcomplete.Adapter.prototype,{select:function(b,c){var d=this.getTextFromHeadToCaret(),e=this.el.value.substring(this.el.selectionEnd),f=c.replace(b);a.isArray(f)&&(e=f[1]+e,f=f[0]),d=d.replace(c.match,f),this.$el.val(d+e),this.el.selectionStart=this.el.selectionEnd=d.length},_getCaretRelativePosition:function(){var b=a("<div></div>").css(this._copyCss()).text(this.getTextFromHeadToCaret()),c=a("<span></span>").text(".").appendTo(b);this.$el.before(b);var d=c.position();return d.top+=c.height()-this.$el.scrollTop(),d.lineHeight=c.height(),b.remove(),d},_copyCss:function(){return a.extend({overflow:this.el.scrollHeight>this.el.offsetHeight?"scroll":"auto"},b.DIV_PROPERTIES,this._getStyles())},_getStyles:function(a){var c=a("<div></div>").css(["color"]).color;return"undefined"!=typeof c?function(){return this.$el.css(b.COPY_PROPERTIES)}:function(){var c=this.$el,d={};return a.each(b.COPY_PROPERTIES,function(a,b){d[b]=c.css(b)}),d}}(a),getTextFromHeadToCaret:function(){return this.el.value.substring(0,this.el.selectionEnd)}}),a.fn.textcomplete.Textarea=b}(jQuery),+function(a){"use strict";function b(b,d,e){this.initialize(b,d,e),a("<span>"+c+"</span>").css({position:"absolute",top:-9999,left:-9999}).insertBefore(b)}var c="吶";a.extend(b.prototype,a.fn.textcomplete.Textarea.prototype,{select:function(b,c){var d=this._getTextFromHeadToCaret(),e=this.el.value.substring(d.length),f=c.replace(b);a.isArray(f)&&(e=f[1]+e,f=f[0]),d=d.replace(c.match,f),this.$el.val(d+e),this.el.focus();var g=this.el.createTextRange();g.collapse(!0),g.moveEnd("character",d.length),g.moveStart("character",d.length),g.select()},_getTextFromHeadToCaret:function(){this.el.focus();var a=document.selection.createRange();a.moveStart("character",-this.el.value.length);var b=a.text.split(c);return 1===b.length?b[0]:b[1]}}),a.fn.textcomplete.IETextarea=b}(jQuery),+function(a){"use strict";function b(a,b,c){this.initialize(a,b,c)}a.extend(b.prototype,a.fn.textcomplete.Adapter.prototype,{select:function(b,c){var d=this.getTextFromHeadToCaret(),e=window.getSelection(),f=e.getRangeAt(0),g=f.cloneRange();g.selectNodeContents(f.startContainer);var h=g.toString(),i=h.substring(f.startOffset),j=c.replace(b);a.isArray(j)&&(i=j[1]+i,j=j[0]),d=d.replace(c.match,j),f.selectNodeContents(f.startContainer),f.deleteContents();var k=document.createTextNode(d+i);f.insertNode(k),f.setStart(k,d.length),f.collapse(!0),e.removeAllRanges(),e.addRange(f)},_getCaretRelativePosition:function(){var b=window.getSelection().getRangeAt(0).cloneRange(),c=document.createElement("span");b.insertNode(c),b.selectNodeContents(c),b.deleteContents();var d=a(c),e=d.offset();e.left-=this.$el.offset().left,e.top+=d.height()-this.$el.offset().top,e.lineHeight=d.height();var f=this.$el.attr("dir")||this.$el.css("direction");return"rtl"===f&&(e.left-=this.listView.$el.width()),e},getTextFromHeadToCaret:function(){var a=window.getSelection().getRangeAt(0),b=a.cloneRange();return b.selectNodeContents(a.startContainer),b.toString().substring(0,a.startOffset)}}),a.fn.textcomplete.ContentEditable=b}(jQuery);
},{}],39:[function(require,module,exports){
(function (global){
/**
 * @license
 * Lo-Dash 2.4.1 (Custom Build) lodash.com/license | Underscore.js 1.5.2 underscorejs.org/LICENSE
 * Build: `lodash underscore exports="amd,commonjs,global,node" -o ./dist/lodash.underscore.js`
 */
;(function(){function n(n,r,t){t=(t||0)-1;for(var e=n?n.length:0;++t<e;)if(n[t]===r)return t;return-1}function r(n,r){for(var t=n.m,e=r.m,u=-1,o=t.length;++u<o;){var i=t[u],f=e[u];if(i!==f){if(i>f||typeof i=="undefined")return 1;if(i<f||typeof f=="undefined")return-1}}return n.n-r.n}function t(n){return"\\"+yr[n]}function e(n,r,t){r||(r=0),typeof t=="undefined"&&(t=n?n.length:0);var e=-1;t=t-r||0;for(var u=Array(0>t?0:t);++e<t;)u[e]=n[r+e];return u}function u(n){return n instanceof u?n:new o(n)}function o(n,r){this.__chain__=!!r,this.__wrapped__=n
}function i(n){function r(){if(u){var n=e(u);Rr.apply(n,arguments)}if(this instanceof r){var i=f(t.prototype),n=t.apply(i,n||arguments);return O(n)?n:i}return t.apply(o,n||arguments)}var t=n[0],u=n[2],o=n[4];return r}function f(n){return O(n)?Br(n):{}}function a(n,r,t){if(typeof n!="function")return Y;if(typeof r=="undefined"||!("prototype"in n))return n;switch(t){case 1:return function(t){return n.call(r,t)};case 2:return function(t,e){return n.call(r,t,e)};case 3:return function(t,e,u){return n.call(r,t,e,u)
};case 4:return function(t,e,u,o){return n.call(r,t,e,u,o)}}return L(n,r)}function l(n){function r(){var n=p?a:this;if(o){var y=e(o);Rr.apply(y,arguments)}return(i||g)&&(y||(y=e(arguments)),i&&Rr.apply(y,i),g&&y.length<c)?(u|=16,l([t,h?u:-4&u,y,null,a,c])):(y||(y=arguments),s&&(t=n[v]),this instanceof r?(n=f(t.prototype),y=t.apply(n,y),O(y)?y:n):t.apply(n,y))}var t=n[0],u=n[1],o=n[2],i=n[3],a=n[4],c=n[5],p=1&u,s=2&u,g=4&u,h=8&u,v=t;return r}function c(n,r){for(var t=-1,e=m(),u=n?n.length:0,o=[];++t<u;){var i=n[t];
0>e(r,i)&&o.push(i)}return o}function p(n,r,t,e){e=(e||0)-1;for(var u=n?n.length:0,o=[];++e<u;){var i=n[e];if(i&&typeof i=="object"&&typeof i.length=="number"&&(Cr(i)||b(i))){r||(i=p(i,r,t));var f=-1,a=i.length,l=o.length;for(o.length+=a;++f<a;)o[l++]=i[f]}else t||o.push(i)}return o}function s(n,r,t,e){if(n===r)return 0!==n||1/n==1/r;if(n===n&&!(n&&vr[typeof n]||r&&vr[typeof r]))return false;if(null==n||null==r)return n===r;var o=Er.call(n),i=Er.call(r);if(o!=i)return false;switch(o){case lr:case cr:return+n==+r;
case pr:return n!=+n?r!=+r:0==n?1/n==1/r:n==+r;case gr:case hr:return n==r+""}if(i=o==ar,!i){var f=n instanceof u,a=r instanceof u;if(f||a)return s(f?n.__wrapped__:n,a?r.__wrapped__:r,t,e);if(o!=sr)return false;if(o=n.constructor,f=r.constructor,o!=f&&!(A(o)&&o instanceof o&&A(f)&&f instanceof f)&&"constructor"in n&&"constructor"in r)return false}for(t||(t=[]),e||(e=[]),o=t.length;o--;)if(t[o]==n)return e[o]==r;var l=true,c=0;if(t.push(n),e.push(r),i){if(c=r.length,l=c==n.length)for(;c--&&(l=s(n[c],r[c],t,e)););}else Kr(r,function(r,u,o){return Nr.call(o,u)?(c++,!(l=Nr.call(n,u)&&s(n[u],r,t,e))&&er):void 0
}),l&&Kr(n,function(n,r,t){return Nr.call(t,r)?!(l=-1<--c)&&er:void 0});return t.pop(),e.pop(),l}function g(n,r,t){for(var e=-1,u=m(),o=n?n.length:0,i=[],f=t?[]:i;++e<o;){var a=n[e],l=t?t(a,e,n):a;(r?!e||f[f.length-1]!==l:0>u(f,l))&&(t&&f.push(l),i.push(a))}return i}function h(n){return function(r,t,e){var u={};t=X(t,e,3),e=-1;var o=r?r.length:0;if(typeof o=="number")for(;++e<o;){var i=r[e];n(u,i,t(i,e,r),r)}else Lr(r,function(r,e,o){n(u,r,t(r,e,o),o)});return u}}function v(n,r,t,e,u,o){var f=16&r,a=32&r;
if(!(2&r||A(n)))throw new TypeError;return f&&!t.length&&(r&=-17,t=false),a&&!e.length&&(r&=-33,e=false),(1==r||17===r?i:l)([n,r,t,e,u,o])}function y(n){return Vr[n]}function m(){var r=(r=u.indexOf)===G?n:r;return r}function _(n){return typeof n=="function"&&Ar.test(n)}function d(n){return Gr[n]}function b(n){return n&&typeof n=="object"&&typeof n.length=="number"&&Er.call(n)==fr||false}function w(n){if(!n)return n;for(var r=1,t=arguments.length;r<t;r++){var e=arguments[r];if(e)for(var u in e)n[u]=e[u]}return n
}function j(n){if(!n)return n;for(var r=1,t=arguments.length;r<t;r++){var e=arguments[r];if(e)for(var u in e)"undefined"==typeof n[u]&&(n[u]=e[u])}return n}function x(n){var r=[];return Kr(n,function(n,t){A(n)&&r.push(t)}),r.sort()}function T(n){for(var r=-1,t=Ur(n),e=t.length,u={};++r<e;){var o=t[r];u[n[o]]=o}return u}function E(n){if(!n)return true;if(Cr(n)||N(n))return!n.length;for(var r in n)if(Nr.call(n,r))return false;return true}function A(n){return typeof n=="function"}function O(n){return!(!n||!vr[typeof n])
}function S(n){return typeof n=="number"||n&&typeof n=="object"&&Er.call(n)==pr||false}function N(n){return typeof n=="string"||n&&typeof n=="object"&&Er.call(n)==hr||false}function R(n){for(var r=-1,t=Ur(n),e=t.length,u=Array(e);++r<e;)u[r]=n[t[r]];return u}function k(n,r){var t=m(),e=n?n.length:0,u=false;return e&&typeof e=="number"?u=-1<t(n,r):Lr(n,function(n){return(u=n===r)&&er}),u}function B(n,r,t){var e=true;r=X(r,t,3),t=-1;var u=n?n.length:0;if(typeof u=="number")for(;++t<u&&(e=!!r(n[t],t,n)););else Lr(n,function(n,t,u){return!(e=!!r(n,t,u))&&er
});return e}function F(n,r,t){var e=[];r=X(r,t,3),t=-1;var u=n?n.length:0;if(typeof u=="number")for(;++t<u;){var o=n[t];r(o,t,n)&&e.push(o)}else Lr(n,function(n,t,u){r(n,t,u)&&e.push(n)});return e}function q(n,r,t){r=X(r,t,3),t=-1;var e=n?n.length:0;if(typeof e!="number"){var u;return Lr(n,function(n,t,e){return r(n,t,e)?(u=n,er):void 0}),u}for(;++t<e;){var o=n[t];if(r(o,t,n))return o}}function D(n,r,t){var e=-1,u=n?n.length:0;if(r=r&&typeof t=="undefined"?r:a(r,t,3),typeof u=="number")for(;++e<u&&r(n[e],e,n)!==er;);else Lr(n,r)
}function I(n,r){var t=n?n.length:0;if(typeof t=="number")for(;t--&&false!==r(n[t],t,n););else{var e=Ur(n),t=e.length;Lr(n,function(n,u,o){return u=e?e[--t]:--t,false===r(o[u],u,o)&&er})}}function M(n,r,t){var e=-1,u=n?n.length:0;if(r=X(r,t,3),typeof u=="number")for(var o=Array(u);++e<u;)o[e]=r(n[e],e,n);else o=[],Lr(n,function(n,t,u){o[++e]=r(n,t,u)});return o}function $(n,r,t){var e=-1/0,u=e;typeof r!="function"&&t&&t[r]===n&&(r=null);var o=-1,i=n?n.length:0;if(null==r&&typeof i=="number")for(;++o<i;)t=n[o],t>u&&(u=t);
else r=X(r,t,3),D(n,function(n,t,o){t=r(n,t,o),t>e&&(e=t,u=n)});return u}function W(n,r,t,e){if(!n)return t;var u=3>arguments.length;r=X(r,e,4);var o=-1,i=n.length;if(typeof i=="number")for(u&&(t=n[++o]);++o<i;)t=r(t,n[o],o,n);else Lr(n,function(n,e,o){t=u?(u=false,n):r(t,n,e,o)});return t}function z(n,r,t,e){var u=3>arguments.length;return r=X(r,e,4),I(n,function(n,e,o){t=u?(u=false,n):r(t,n,e,o)}),t}function C(n){var r=-1,t=n?n.length:0,e=Array(typeof t=="number"?t:0);return D(n,function(n){var t;t=++r,t=0+Sr(Wr()*(t-0+1)),e[r]=e[t],e[t]=n
}),e}function P(n,r,t){var e;r=X(r,t,3),t=-1;var u=n?n.length:0;if(typeof u=="number")for(;++t<u&&!(e=r(n[t],t,n)););else Lr(n,function(n,t,u){return(e=r(n,t,u))&&er});return!!e}function U(n,r,t){return t&&E(r)?rr:(t?q:F)(n,r)}function V(n,r,t){var u=0,o=n?n.length:0;if(typeof r!="number"&&null!=r){var i=-1;for(r=X(r,t,3);++i<o&&r(n[i],i,n);)u++}else if(u=r,null==u||t)return n?n[0]:rr;return e(n,0,$r(Mr(0,u),o))}function G(r,t,e){if(typeof e=="number"){var u=r?r.length:0;e=0>e?Mr(0,u+e):e||0}else if(e)return e=J(r,t),r[e]===t?e:-1;
return n(r,t,e)}function H(n,r,t){if(typeof r!="number"&&null!=r){var u=0,o=-1,i=n?n.length:0;for(r=X(r,t,3);++o<i&&r(n[o],o,n);)u++}else u=null==r||t?1:Mr(0,r);return e(n,u)}function J(n,r,t,e){var u=0,o=n?n.length:u;for(t=t?X(t,e,1):Y,r=t(r);u<o;)e=u+o>>>1,t(n[e])<r?u=e+1:o=e;return u}function K(n,r,t,e){return typeof r!="boolean"&&null!=r&&(e=t,t=typeof r!="function"&&e&&e[r]===n?null:r,r=false),null!=t&&(t=X(t,e,3)),g(n,r,t)}function L(n,r){return 2<arguments.length?v(n,17,e(arguments,2),null,r):v(n,1,null,null,r)
}function Q(n,r,t){var e,u,o,i,f,a,l,c=0,p=false,s=true;if(!A(n))throw new TypeError;if(r=Mr(0,r)||0,true===t)var g=true,s=false;else O(t)&&(g=t.leading,p="maxWait"in t&&(Mr(r,t.maxWait)||0),s="trailing"in t?t.trailing:s);var h=function(){var t=r-(nt()-i);0<t?a=setTimeout(h,t):(u&&clearTimeout(u),t=l,u=a=l=rr,t&&(c=nt(),o=n.apply(f,e),a||u||(e=f=null)))},v=function(){a&&clearTimeout(a),u=a=l=rr,(s||p!==r)&&(c=nt(),o=n.apply(f,e),a||u||(e=f=null))};return function(){if(e=arguments,i=nt(),f=this,l=s&&(a||!g),false===p)var t=g&&!a;
else{u||g||(c=i);var y=p-(i-c),m=0>=y;m?(u&&(u=clearTimeout(u)),c=i,o=n.apply(f,e)):u||(u=setTimeout(v,y))}return m&&a?a=clearTimeout(a):a||r===p||(a=setTimeout(h,r)),t&&(m=true,o=n.apply(f,e)),!m||a||u||(e=f=null),o}}function X(n,r,t){var e=typeof n;if(null==n||"function"==e)return a(n,r,t);if("object"!=e)return nr(n);var u=Ur(n);return function(r){for(var t=u.length,e=false;t--&&(e=r[u[t]]===n[u[t]]););return e}}function Y(n){return n}function Z(n){D(x(n),function(r){var t=u[r]=n[r];u.prototype[r]=function(){var n=[this.__wrapped__];
return Rr.apply(n,arguments),n=t.apply(u,n),this.__chain__?new o(n,true):n}})}function nr(n){return function(r){return r[n]}}var rr,tr=0,er={},ur=+new Date+"",or=/($^)/,ir=/['\n\r\t\u2028\u2029\\]/g,fr="[object Arguments]",ar="[object Array]",lr="[object Boolean]",cr="[object Date]",pr="[object Number]",sr="[object Object]",gr="[object RegExp]",hr="[object String]",vr={"boolean":false,"function":true,object:true,number:false,string:false,undefined:false},yr={"\\":"\\","'":"'","\n":"n","\r":"r","\t":"t","\u2028":"u2028","\u2029":"u2029"},mr=vr[typeof window]&&window||this,_r=vr[typeof exports]&&exports&&!exports.nodeType&&exports,dr=vr[typeof module]&&module&&!module.nodeType&&module,br=dr&&dr.exports===_r&&_r,wr=vr[typeof global]&&global;
!wr||wr.global!==wr&&wr.window!==wr||(mr=wr);var jr=[],xr=Object.prototype,Tr=mr._,Er=xr.toString,Ar=RegExp("^"+(Er+"").replace(/[.*+?^${}()|[\]\\]/g,"\\$&").replace(/toString| for [^\]]+/g,".*?")+"$"),Or=Math.ceil,Sr=Math.floor,Nr=xr.hasOwnProperty,Rr=jr.push,kr=xr.propertyIsEnumerable,Br=_(Br=Object.create)&&Br,Fr=_(Fr=Array.isArray)&&Fr,qr=mr.isFinite,Dr=mr.isNaN,Ir=_(Ir=Object.keys)&&Ir,Mr=Math.max,$r=Math.min,Wr=Math.random;o.prototype=u.prototype;var zr={};!function(){var n={0:1,length:1};zr.spliceObjects=(jr.splice.call(n,0,1),!n[0])
}(1),u.templateSettings={escape:/<%-([\s\S]+?)%>/g,evaluate:/<%([\s\S]+?)%>/g,interpolate:/<%=([\s\S]+?)%>/g,variable:""},Br||(f=function(){function n(){}return function(r){if(O(r)){n.prototype=r;var t=new n;n.prototype=null}return t||mr.Object()}}()),b(arguments)||(b=function(n){return n&&typeof n=="object"&&typeof n.length=="number"&&Nr.call(n,"callee")&&!kr.call(n,"callee")||false});var Cr=Fr||function(n){return n&&typeof n=="object"&&typeof n.length=="number"&&Er.call(n)==ar||false},Pr=function(n){var r,t=[];
if(!n||!vr[typeof n])return t;for(r in n)Nr.call(n,r)&&t.push(r);return t},Ur=Ir?function(n){return O(n)?Ir(n):[]}:Pr,Vr={"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#x27;"},Gr=T(Vr),Hr=RegExp("("+Ur(Gr).join("|")+")","g"),Jr=RegExp("["+Ur(Vr).join("")+"]","g"),Kr=function(n,r){var t;if(!n||!vr[typeof n])return n;for(t in n)if(r(n[t],t,n)===er)break;return n},Lr=function(n,r){var t;if(!n||!vr[typeof n])return n;for(t in n)if(Nr.call(n,t)&&r(n[t],t,n)===er)break;return n};A(/x/)&&(A=function(n){return typeof n=="function"&&"[object Function]"==Er.call(n)
});var Qr=h(function(n,r,t){Nr.call(n,t)?n[t]++:n[t]=1}),Xr=h(function(n,r,t){(Nr.call(n,t)?n[t]:n[t]=[]).push(r)}),Yr=h(function(n,r,t){n[t]=r}),Zr=M,nt=_(nt=Date.now)&&nt||function(){return(new Date).getTime()};u.after=function(n,r){if(!A(r))throw new TypeError;return function(){return 1>--n?r.apply(this,arguments):void 0}},u.bind=L,u.bindAll=function(n){for(var r=1<arguments.length?p(arguments,true,false,1):x(n),t=-1,e=r.length;++t<e;){var u=r[t];n[u]=v(n[u],1,null,null,n)}return n},u.chain=function(n){return n=new o(n),n.__chain__=true,n
},u.compact=function(n){for(var r=-1,t=n?n.length:0,e=[];++r<t;){var u=n[r];u&&e.push(u)}return e},u.compose=function(){for(var n=arguments,r=n.length;r--;)if(!A(n[r]))throw new TypeError;return function(){for(var r=arguments,t=n.length;t--;)r=[n[t].apply(this,r)];return r[0]}},u.countBy=Qr,u.debounce=Q,u.defaults=j,u.defer=function(n){if(!A(n))throw new TypeError;var r=e(arguments,1);return setTimeout(function(){n.apply(rr,r)},1)},u.delay=function(n,r){if(!A(n))throw new TypeError;var t=e(arguments,2);
return setTimeout(function(){n.apply(rr,t)},r)},u.difference=function(n){return c(n,p(arguments,true,true,1))},u.filter=F,u.flatten=function(n,r){return p(n,r)},u.forEach=D,u.functions=x,u.groupBy=Xr,u.indexBy=Yr,u.initial=function(n,r,t){var u=0,o=n?n.length:0;if(typeof r!="number"&&null!=r){var i=o;for(r=X(r,t,3);i--&&r(n[i],i,n);)u++}else u=null==r||t?1:r||u;return e(n,0,$r(Mr(0,o-u),o))},u.intersection=function(){for(var n=[],r=-1,t=arguments.length;++r<t;){var e=arguments[r];(Cr(e)||b(e))&&n.push(e)
}var u=n[0],o=-1,i=m(),f=u?u.length:0,a=[];n:for(;++o<f;)if(e=u[o],0>i(a,e)){for(r=t;--r;)if(0>i(n[r],e))continue n;a.push(e)}return a},u.invert=T,u.invoke=function(n,r){var t=e(arguments,2),u=-1,o=typeof r=="function",i=n?n.length:0,f=Array(typeof i=="number"?i:0);return D(n,function(n){f[++u]=(o?r:n[r]).apply(n,t)}),f},u.keys=Ur,u.map=M,u.max=$,u.memoize=function(n,r){var t={};return function(){var e=r?r.apply(this,arguments):ur+arguments[0];return Nr.call(t,e)?t[e]:t[e]=n.apply(this,arguments)
}},u.min=function(n,r,t){var e=1/0,u=e;typeof r!="function"&&t&&t[r]===n&&(r=null);var o=-1,i=n?n.length:0;if(null==r&&typeof i=="number")for(;++o<i;)t=n[o],t<u&&(u=t);else r=X(r,t,3),D(n,function(n,t,o){t=r(n,t,o),t<e&&(e=t,u=n)});return u},u.omit=function(n){var r=[];Kr(n,function(n,t){r.push(t)});for(var r=c(r,p(arguments,true,false,1)),t=-1,e=r.length,u={};++t<e;){var o=r[t];u[o]=n[o]}return u},u.once=function(n){var r,t;if(!A(n))throw new TypeError;return function(){return r?t:(r=true,t=n.apply(this,arguments),n=null,t)
}},u.pairs=function(n){for(var r=-1,t=Ur(n),e=t.length,u=Array(e);++r<e;){var o=t[r];u[r]=[o,n[o]]}return u},u.partial=function(n){return v(n,16,e(arguments,1))},u.pick=function(n){for(var r=-1,t=p(arguments,true,false,1),e=t.length,u={};++r<e;){var o=t[r];o in n&&(u[o]=n[o])}return u},u.pluck=Zr,u.range=function(n,r,t){n=+n||0,t=+t||1,null==r&&(r=n,n=0);var e=-1;r=Mr(0,Or((r-n)/t));for(var u=Array(r);++e<r;)u[e]=n,n+=t;return u},u.reject=function(n,r,t){return r=X(r,t,3),F(n,function(n,t,e){return!r(n,t,e)
})},u.rest=H,u.shuffle=C,u.sortBy=function(n,t,e){var u=-1,o=n?n.length:0,i=Array(typeof o=="number"?o:0);for(t=X(t,e,3),D(n,function(n,r,e){i[++u]={m:[t(n,r,e)],n:u,o:n}}),o=i.length,i.sort(r);o--;)i[o]=i[o].o;return i},u.tap=function(n,r){return r(n),n},u.throttle=function(n,r,t){var e=true,u=true;if(!A(n))throw new TypeError;return false===t?e=false:O(t)&&(e="leading"in t?t.leading:e,u="trailing"in t?t.trailing:u),t={},t.leading=e,t.maxWait=r,t.trailing=u,Q(n,r,t)},u.times=function(n,r,t){n=-1<(n=+n)?n:0;
var e=-1,u=Array(n);for(r=a(r,t,1);++e<n;)u[e]=r(e);return u},u.toArray=function(n){return Cr(n)?e(n):n&&typeof n.length=="number"?M(n):R(n)},u.union=function(){return g(p(arguments,true,true))},u.uniq=K,u.values=R,u.where=U,u.without=function(n){return c(n,e(arguments,1))},u.wrap=function(n,r){return v(r,16,[n])},u.zip=function(){for(var n=-1,r=$(Zr(arguments,"length")),t=Array(0>r?0:r);++n<r;)t[n]=Zr(arguments,n);return t},u.collect=M,u.drop=H,u.each=D,u.extend=w,u.methods=x,u.object=function(n,r){var t=-1,e=n?n.length:0,u={};
for(r||!e||Cr(n[0])||(r=[]);++t<e;){var o=n[t];r?u[o]=r[t]:o&&(u[o[0]]=o[1])}return u},u.select=F,u.tail=H,u.unique=K,u.clone=function(n){return O(n)?Cr(n)?e(n):w({},n):n},u.contains=k,u.escape=function(n){return null==n?"":(n+"").replace(Jr,y)},u.every=B,u.find=q,u.has=function(n,r){return n?Nr.call(n,r):false},u.identity=Y,u.indexOf=G,u.isArguments=b,u.isArray=Cr,u.isBoolean=function(n){return true===n||false===n||n&&typeof n=="object"&&Er.call(n)==lr||false},u.isDate=function(n){return n&&typeof n=="object"&&Er.call(n)==cr||false
},u.isElement=function(n){return n&&1===n.nodeType||false},u.isEmpty=E,u.isEqual=function(n,r){return s(n,r)},u.isFinite=function(n){return qr(n)&&!Dr(parseFloat(n))},u.isFunction=A,u.isNaN=function(n){return S(n)&&n!=+n},u.isNull=function(n){return null===n},u.isNumber=S,u.isObject=O,u.isRegExp=function(n){return n&&vr[typeof n]&&Er.call(n)==gr||false},u.isString=N,u.isUndefined=function(n){return typeof n=="undefined"},u.lastIndexOf=function(n,r,t){var e=n?n.length:0;for(typeof t=="number"&&(e=(0>t?Mr(0,e+t):$r(t,e-1))+1);e--;)if(n[e]===r)return e;
return-1},u.mixin=Z,u.noConflict=function(){return mr._=Tr,this},u.random=function(n,r){return null==n&&null==r&&(r=1),n=+n||0,null==r?(r=n,n=0):r=+r||0,n+Sr(Wr()*(r-n+1))},u.reduce=W,u.reduceRight=z,u.result=function(n,r){if(n){var t=n[r];return A(t)?n[r]():t}},u.size=function(n){var r=n?n.length:0;return typeof r=="number"?r:Ur(n).length},u.some=P,u.sortedIndex=J,u.template=function(n,r,e){var o=u,i=o.templateSettings;n=(n||"")+"",e=j({},e,i);var f=0,a="__p+='",i=e.variable;n.replace(RegExp((e.escape||or).source+"|"+(e.interpolate||or).source+"|"+(e.evaluate||or).source+"|$","g"),function(r,e,u,o,i){return a+=n.slice(f,i).replace(ir,t),e&&(a+="'+_.escape("+e+")+'"),o&&(a+="';"+o+";\n__p+='"),u&&(a+="'+((__t=("+u+"))==null?'':__t)+'"),f=i+r.length,r
}),a+="';",i||(i="obj",a="with("+i+"||{}){"+a+"}"),a="function("+i+"){var __t,__p='',__j=Array.prototype.join;function print(){__p+=__j.call(arguments,'')}"+a+"return __p}";try{var l=Function("_","return "+a)(o)}catch(c){throw c.source=a,c}return r?l(r):(l.source=a,l)},u.unescape=function(n){return null==n?"":(n+"").replace(Hr,d)},u.uniqueId=function(n){var r=++tr+"";return n?n+r:r},u.all=B,u.any=P,u.detect=q,u.findWhere=function(n,r){return U(n,r,true)},u.foldl=W,u.foldr=z,u.include=k,u.inject=W,u.first=V,u.last=function(n,r,t){var u=0,o=n?n.length:0;
if(typeof r!="number"&&null!=r){var i=o;for(r=X(r,t,3);i--&&r(n[i],i,n);)u++}else if(u=r,null==u||t)return n?n[o-1]:rr;return e(n,Mr(0,o-u))},u.sample=function(n,r,t){return n&&typeof n.length!="number"&&(n=R(n)),null==r||t?n?n[0+Sr(Wr()*(n.length-1-0+1))]:rr:(n=C(n),n.length=$r(Mr(0,r),n.length),n)},u.take=V,u.head=V,Z(u),u.VERSION="2.4.1",u.prototype.chain=function(){return this.__chain__=true,this},u.prototype.value=function(){return this.__wrapped__},D("pop push reverse shift sort splice unshift".split(" "),function(n){var r=jr[n];
u.prototype[n]=function(){var n=this.__wrapped__;return r.apply(n,arguments),zr.spliceObjects||0!==n.length||delete n[0],this}}),D(["concat","join","slice"],function(n){var r=jr[n];u.prototype[n]=function(){var n=r.apply(this.__wrapped__,arguments);return this.__chain__&&(n=new o(n),n.__chain__=true),n}}),typeof define=="function"&&typeof define.amd=="object"&&define.amd?(mr._=u, define(function(){return u})):_r&&dr?br?(dr.exports=u)._=u:_r._=u:mr._=u}).call(this);
}).call(this,typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})
},{}],40:[function(require,module,exports){
(function (global){
/**
 * marked - a markdown parser
 * Copyright (c) 2011-2014, Christopher Jeffrey. (MIT Licensed)
 * https://github.com/chjj/marked
 */
(function(){var block={newline:/^\n+/,code:/^( {4}[^\n]+\n*)+/,fences:noop,hr:/^( *[-*_]){3,} *(?:\n+|$)/,heading:/^ *(#{1,6}) *([^\n]+?) *#* *(?:\n+|$)/,nptable:noop,lheading:/^([^\n]+)\n *(=|-){2,} *(?:\n+|$)/,blockquote:/^( *>[^\n]+(\n(?!def)[^\n]+)*\n*)+/,list:/^( *)(bull) [\s\S]+?(?:hr|def|\n{2,}(?! )(?!\1bull )\n*|\s*$)/,html:/^ *(?:comment|closed|closing) *(?:\n{2,}|\s*$)/,def:/^ *\[([^\]]+)\]: *<?([^\s>]+)>?(?: +["(]([^\n]+)[")])? *(?:\n+|$)/,table:noop,paragraph:/^((?:[^\n]+\n?(?!hr|heading|lheading|blockquote|tag|def))+)\n*/,text:/^[^\n]+/};block.bullet=/(?:[*+-]|\d+\.)/;block.item=/^( *)(bull) [^\n]*(?:\n(?!\1bull )[^\n]*)*/;block.item=replace(block.item,"gm")(/bull/g,block.bullet)();block.list=replace(block.list)(/bull/g,block.bullet)("hr","\\n+(?=\\1?(?:[-*_] *){3,}(?:\\n+|$))")("def","\\n+(?="+block.def.source+")")();block.blockquote=replace(block.blockquote)("def",block.def)();block._tag="(?!(?:"+"a|em|strong|small|s|cite|q|dfn|abbr|data|time|code"+"|var|samp|kbd|sub|sup|i|b|u|mark|ruby|rt|rp|bdi|bdo"+"|span|br|wbr|ins|del|img)\\b)\\w+(?!:/|[^\\w\\s@]*@)\\b";block.html=replace(block.html)("comment",/<!--[\s\S]*?-->/)("closed",/<(tag)[\s\S]+?<\/\1>/)("closing",/<tag(?:"[^"]*"|'[^']*'|[^'">])*?>/)(/tag/g,block._tag)();block.paragraph=replace(block.paragraph)("hr",block.hr)("heading",block.heading)("lheading",block.lheading)("blockquote",block.blockquote)("tag","<"+block._tag)("def",block.def)();block.normal=merge({},block);block.gfm=merge({},block.normal,{fences:/^ *(`{3,}|~{3,}) *(\S+)? *\n([\s\S]+?)\s*\1 *(?:\n+|$)/,paragraph:/^/});block.gfm.paragraph=replace(block.paragraph)("(?!","(?!"+block.gfm.fences.source.replace("\\1","\\2")+"|"+block.list.source.replace("\\1","\\3")+"|")();block.tables=merge({},block.gfm,{nptable:/^ *(\S.*\|.*)\n *([-:]+ *\|[-| :]*)\n((?:.*\|.*(?:\n|$))*)\n*/,table:/^ *\|(.+)\n *\|( *[-:]+[-| :]*)\n((?: *\|.*(?:\n|$))*)\n*/});function Lexer(options){this.tokens=[];this.tokens.links={};this.options=options||marked.defaults;this.rules=block.normal;if(this.options.gfm){if(this.options.tables){this.rules=block.tables}else{this.rules=block.gfm}}}Lexer.rules=block;Lexer.lex=function(src,options){var lexer=new Lexer(options);return lexer.lex(src)};Lexer.prototype.lex=function(src){src=src.replace(/\r\n|\r/g,"\n").replace(/\t/g,"    ").replace(/\u00a0/g," ").replace(/\u2424/g,"\n");return this.token(src,true)};Lexer.prototype.token=function(src,top,bq){var src=src.replace(/^ +$/gm,""),next,loose,cap,bull,b,item,space,i,l;while(src){if(cap=this.rules.newline.exec(src)){src=src.substring(cap[0].length);if(cap[0].length>1){this.tokens.push({type:"space"})}}if(cap=this.rules.code.exec(src)){src=src.substring(cap[0].length);cap=cap[0].replace(/^ {4}/gm,"");this.tokens.push({type:"code",text:!this.options.pedantic?cap.replace(/\n+$/,""):cap});continue}if(cap=this.rules.fences.exec(src)){src=src.substring(cap[0].length);this.tokens.push({type:"code",lang:cap[2],text:cap[3]});continue}if(cap=this.rules.heading.exec(src)){src=src.substring(cap[0].length);this.tokens.push({type:"heading",depth:cap[1].length,text:cap[2]});continue}if(top&&(cap=this.rules.nptable.exec(src))){src=src.substring(cap[0].length);item={type:"table",header:cap[1].replace(/^ *| *\| *$/g,"").split(/ *\| */),align:cap[2].replace(/^ *|\| *$/g,"").split(/ *\| */),cells:cap[3].replace(/\n$/,"").split("\n")};for(i=0;i<item.align.length;i++){if(/^ *-+: *$/.test(item.align[i])){item.align[i]="right"}else if(/^ *:-+: *$/.test(item.align[i])){item.align[i]="center"}else if(/^ *:-+ *$/.test(item.align[i])){item.align[i]="left"}else{item.align[i]=null}}for(i=0;i<item.cells.length;i++){item.cells[i]=item.cells[i].split(/ *\| */)}this.tokens.push(item);continue}if(cap=this.rules.lheading.exec(src)){src=src.substring(cap[0].length);this.tokens.push({type:"heading",depth:cap[2]==="="?1:2,text:cap[1]});continue}if(cap=this.rules.hr.exec(src)){src=src.substring(cap[0].length);this.tokens.push({type:"hr"});continue}if(cap=this.rules.blockquote.exec(src)){src=src.substring(cap[0].length);this.tokens.push({type:"blockquote_start"});cap=cap[0].replace(/^ *> ?/gm,"");this.token(cap,top,true);this.tokens.push({type:"blockquote_end"});continue}if(cap=this.rules.list.exec(src)){src=src.substring(cap[0].length);bull=cap[2];this.tokens.push({type:"list_start",ordered:bull.length>1});cap=cap[0].match(this.rules.item);next=false;l=cap.length;i=0;for(;i<l;i++){item=cap[i];space=item.length;item=item.replace(/^ *([*+-]|\d+\.) +/,"");if(~item.indexOf("\n ")){space-=item.length;item=!this.options.pedantic?item.replace(new RegExp("^ {1,"+space+"}","gm"),""):item.replace(/^ {1,4}/gm,"")}if(this.options.smartLists&&i!==l-1){b=block.bullet.exec(cap[i+1])[0];if(bull!==b&&!(bull.length>1&&b.length>1)){src=cap.slice(i+1).join("\n")+src;i=l-1}}loose=next||/\n\n(?!\s*$)/.test(item);if(i!==l-1){next=item.charAt(item.length-1)==="\n";if(!loose)loose=next}this.tokens.push({type:loose?"loose_item_start":"list_item_start"});this.token(item,false,bq);this.tokens.push({type:"list_item_end"})}this.tokens.push({type:"list_end"});continue}if(cap=this.rules.html.exec(src)){src=src.substring(cap[0].length);this.tokens.push({type:this.options.sanitize?"paragraph":"html",pre:cap[1]==="pre"||cap[1]==="script"||cap[1]==="style",text:cap[0]});continue}if(!bq&&top&&(cap=this.rules.def.exec(src))){src=src.substring(cap[0].length);this.tokens.links[cap[1].toLowerCase()]={href:cap[2],title:cap[3]};continue}if(top&&(cap=this.rules.table.exec(src))){src=src.substring(cap[0].length);item={type:"table",header:cap[1].replace(/^ *| *\| *$/g,"").split(/ *\| */),align:cap[2].replace(/^ *|\| *$/g,"").split(/ *\| */),cells:cap[3].replace(/(?: *\| *)?\n$/,"").split("\n")};for(i=0;i<item.align.length;i++){if(/^ *-+: *$/.test(item.align[i])){item.align[i]="right"}else if(/^ *:-+: *$/.test(item.align[i])){item.align[i]="center"}else if(/^ *:-+ *$/.test(item.align[i])){item.align[i]="left"}else{item.align[i]=null}}for(i=0;i<item.cells.length;i++){item.cells[i]=item.cells[i].replace(/^ *\| *| *\| *$/g,"").split(/ *\| */)}this.tokens.push(item);continue}if(top&&(cap=this.rules.paragraph.exec(src))){src=src.substring(cap[0].length);this.tokens.push({type:"paragraph",text:cap[1].charAt(cap[1].length-1)==="\n"?cap[1].slice(0,-1):cap[1]});continue}if(cap=this.rules.text.exec(src)){src=src.substring(cap[0].length);this.tokens.push({type:"text",text:cap[0]});continue}if(src){throw new Error("Infinite loop on byte: "+src.charCodeAt(0))}}return this.tokens};var inline={escape:/^\\([\\`*{}\[\]()#+\-.!_>])/,autolink:/^<([^ >]+(@|:\/)[^ >]+)>/,url:noop,tag:/^<!--[\s\S]*?-->|^<\/?\w+(?:"[^"]*"|'[^']*'|[^'">])*?>/,link:/^!?\[(inside)\]\(href\)/,reflink:/^!?\[(inside)\]\s*\[([^\]]*)\]/,nolink:/^!?\[((?:\[[^\]]*\]|[^\[\]])*)\]/,strong:/^__([\s\S]+?)__(?!_)|^\*\*([\s\S]+?)\*\*(?!\*)/,em:/^\b_((?:__|[\s\S])+?)_\b|^\*((?:\*\*|[\s\S])+?)\*(?!\*)/,code:/^(`+)\s*([\s\S]*?[^`])\s*\1(?!`)/,br:/^ {2,}\n(?!\s*$)/,del:noop,text:/^[\s\S]+?(?=[\\<!\[_*`]| {2,}\n|$)/};inline._inside=/(?:\[[^\]]*\]|[^\[\]]|\](?=[^\[]*\]))*/;inline._href=/\s*<?([\s\S]*?)>?(?:\s+['"]([\s\S]*?)['"])?\s*/;inline.link=replace(inline.link)("inside",inline._inside)("href",inline._href)();inline.reflink=replace(inline.reflink)("inside",inline._inside)();inline.normal=merge({},inline);inline.pedantic=merge({},inline.normal,{strong:/^__(?=\S)([\s\S]*?\S)__(?!_)|^\*\*(?=\S)([\s\S]*?\S)\*\*(?!\*)/,em:/^_(?=\S)([\s\S]*?\S)_(?!_)|^\*(?=\S)([\s\S]*?\S)\*(?!\*)/});inline.gfm=merge({},inline.normal,{escape:replace(inline.escape)("])","~|])")(),url:/^(https?:\/\/[^\s<]+[^<.,:;"')\]\s])/,del:/^~~(?=\S)([\s\S]*?\S)~~/,text:replace(inline.text)("]|","~]|")("|","|https?://|")()});inline.breaks=merge({},inline.gfm,{br:replace(inline.br)("{2,}","*")(),text:replace(inline.gfm.text)("{2,}","*")()});function InlineLexer(links,options){this.options=options||marked.defaults;this.links=links;this.rules=inline.normal;this.renderer=this.options.renderer||new Renderer;this.renderer.options=this.options;if(!this.links){throw new Error("Tokens array requires a `links` property.")}if(this.options.gfm){if(this.options.breaks){this.rules=inline.breaks}else{this.rules=inline.gfm}}else if(this.options.pedantic){this.rules=inline.pedantic}}InlineLexer.rules=inline;InlineLexer.output=function(src,links,options){var inline=new InlineLexer(links,options);return inline.output(src)};InlineLexer.prototype.output=function(src){var out="",link,text,href,cap;while(src){if(cap=this.rules.escape.exec(src)){src=src.substring(cap[0].length);out+=cap[1];continue}if(cap=this.rules.autolink.exec(src)){src=src.substring(cap[0].length);if(cap[2]==="@"){text=cap[1].charAt(6)===":"?this.mangle(cap[1].substring(7)):this.mangle(cap[1]);href=this.mangle("mailto:")+text}else{text=escape(cap[1]);href=text}out+=this.renderer.link(href,null,text);continue}if(!this.inLink&&(cap=this.rules.url.exec(src))){src=src.substring(cap[0].length);text=escape(cap[1]);href=text;out+=this.renderer.link(href,null,text);continue}if(cap=this.rules.tag.exec(src)){if(!this.inLink&&/^<a /i.test(cap[0])){this.inLink=true}else if(this.inLink&&/^<\/a>/i.test(cap[0])){this.inLink=false}src=src.substring(cap[0].length);out+=this.options.sanitize?escape(cap[0]):cap[0];continue}if(cap=this.rules.link.exec(src)){src=src.substring(cap[0].length);this.inLink=true;out+=this.outputLink(cap,{href:cap[2],title:cap[3]});this.inLink=false;continue}if((cap=this.rules.reflink.exec(src))||(cap=this.rules.nolink.exec(src))){src=src.substring(cap[0].length);link=(cap[2]||cap[1]).replace(/\s+/g," ");link=this.links[link.toLowerCase()];if(!link||!link.href){out+=cap[0].charAt(0);src=cap[0].substring(1)+src;continue}this.inLink=true;out+=this.outputLink(cap,link);this.inLink=false;continue}if(cap=this.rules.strong.exec(src)){src=src.substring(cap[0].length);out+=this.renderer.strong(this.output(cap[2]||cap[1]));continue}if(cap=this.rules.em.exec(src)){src=src.substring(cap[0].length);out+=this.renderer.em(this.output(cap[2]||cap[1]));continue}if(cap=this.rules.code.exec(src)){src=src.substring(cap[0].length);out+=this.renderer.codespan(escape(cap[2],true));continue}if(cap=this.rules.br.exec(src)){src=src.substring(cap[0].length);out+=this.renderer.br();continue}if(cap=this.rules.del.exec(src)){src=src.substring(cap[0].length);out+=this.renderer.del(this.output(cap[1]));continue}if(cap=this.rules.text.exec(src)){src=src.substring(cap[0].length);out+=escape(this.smartypants(cap[0]));continue}if(src){throw new Error("Infinite loop on byte: "+src.charCodeAt(0))}}return out};InlineLexer.prototype.outputLink=function(cap,link){var href=escape(link.href),title=link.title?escape(link.title):null;return cap[0].charAt(0)!=="!"?this.renderer.link(href,title,this.output(cap[1])):this.renderer.image(href,title,escape(cap[1]))};InlineLexer.prototype.smartypants=function(text){if(!this.options.smartypants)return text;return text.replace(/--/g,"—").replace(/(^|[-\u2014/(\[{"\s])'/g,"$1‘").replace(/'/g,"’").replace(/(^|[-\u2014/(\[{\u2018\s])"/g,"$1“").replace(/"/g,"”").replace(/\.{3}/g,"…")};InlineLexer.prototype.mangle=function(text){var out="",l=text.length,i=0,ch;for(;i<l;i++){ch=text.charCodeAt(i);if(Math.random()>.5){ch="x"+ch.toString(16)}out+="&#"+ch+";"}return out};function Renderer(options){this.options=options||{}}Renderer.prototype.code=function(code,lang,escaped){if(this.options.highlight){var out=this.options.highlight(code,lang);if(out!=null&&out!==code){escaped=true;code=out}}if(!lang){return"<pre><code>"+(escaped?code:escape(code,true))+"\n</code></pre>"}return'<pre><code class="'+this.options.langPrefix+escape(lang,true)+'">'+(escaped?code:escape(code,true))+"\n</code></pre>\n"};Renderer.prototype.blockquote=function(quote){return"<blockquote>\n"+quote+"</blockquote>\n"};Renderer.prototype.html=function(html){return html};Renderer.prototype.heading=function(text,level,raw){return"<h"+level+' id="'+this.options.headerPrefix+raw.toLowerCase().replace(/[^\w]+/g,"-")+'">'+text+"</h"+level+">\n"};Renderer.prototype.hr=function(){return this.options.xhtml?"<hr/>\n":"<hr>\n"};Renderer.prototype.list=function(body,ordered){var type=ordered?"ol":"ul";return"<"+type+">\n"+body+"</"+type+">\n"};Renderer.prototype.listitem=function(text){return"<li>"+text+"</li>\n"};Renderer.prototype.paragraph=function(text){return"<p>"+text+"</p>\n"};Renderer.prototype.table=function(header,body){return"<table>\n"+"<thead>\n"+header+"</thead>\n"+"<tbody>\n"+body+"</tbody>\n"+"</table>\n"};Renderer.prototype.tablerow=function(content){return"<tr>\n"+content+"</tr>\n"};Renderer.prototype.tablecell=function(content,flags){var type=flags.header?"th":"td";var tag=flags.align?"<"+type+' style="text-align:'+flags.align+'">':"<"+type+">";return tag+content+"</"+type+">\n"};Renderer.prototype.strong=function(text){return"<strong>"+text+"</strong>"};Renderer.prototype.em=function(text){return"<em>"+text+"</em>"};Renderer.prototype.codespan=function(text){return"<code>"+text+"</code>"};Renderer.prototype.br=function(){return this.options.xhtml?"<br/>":"<br>"};Renderer.prototype.del=function(text){return"<del>"+text+"</del>"};Renderer.prototype.link=function(href,title,text){if(this.options.sanitize){try{var prot=decodeURIComponent(unescape(href)).replace(/[^\w:]/g,"").toLowerCase()}catch(e){return""}if(prot.indexOf("javascript:")===0){return""}}var out='<a href="'+href+'"';if(title){out+=' title="'+title+'"'}out+=">"+text+"</a>";return out};Renderer.prototype.image=function(href,title,text){var out='<img src="'+href+'" alt="'+text+'"';if(title){out+=' title="'+title+'"'}out+=this.options.xhtml?"/>":">";return out};function Parser(options){this.tokens=[];this.token=null;this.options=options||marked.defaults;this.options.renderer=this.options.renderer||new Renderer;this.renderer=this.options.renderer;this.renderer.options=this.options}Parser.parse=function(src,options,renderer){var parser=new Parser(options,renderer);return parser.parse(src)};Parser.prototype.parse=function(src){this.inline=new InlineLexer(src.links,this.options,this.renderer);this.tokens=src.reverse();var out="";while(this.next()){out+=this.tok()}return out};Parser.prototype.next=function(){return this.token=this.tokens.pop()};Parser.prototype.peek=function(){return this.tokens[this.tokens.length-1]||0};Parser.prototype.parseText=function(){var body=this.token.text;while(this.peek().type==="text"){body+="\n"+this.next().text}return this.inline.output(body)};Parser.prototype.tok=function(){switch(this.token.type){case"space":{return""}case"hr":{return this.renderer.hr()}case"heading":{return this.renderer.heading(this.inline.output(this.token.text),this.token.depth,this.token.text)}case"code":{return this.renderer.code(this.token.text,this.token.lang,this.token.escaped)}case"table":{var header="",body="",i,row,cell,flags,j;cell="";for(i=0;i<this.token.header.length;i++){flags={header:true,align:this.token.align[i]};cell+=this.renderer.tablecell(this.inline.output(this.token.header[i]),{header:true,align:this.token.align[i]})}header+=this.renderer.tablerow(cell);for(i=0;i<this.token.cells.length;i++){row=this.token.cells[i];cell="";for(j=0;j<row.length;j++){cell+=this.renderer.tablecell(this.inline.output(row[j]),{header:false,align:this.token.align[j]})}body+=this.renderer.tablerow(cell)}return this.renderer.table(header,body)}case"blockquote_start":{var body="";while(this.next().type!=="blockquote_end"){body+=this.tok()}return this.renderer.blockquote(body)}case"list_start":{var body="",ordered=this.token.ordered;while(this.next().type!=="list_end"){body+=this.tok()}return this.renderer.list(body,ordered)}case"list_item_start":{var body="";while(this.next().type!=="list_item_end"){body+=this.token.type==="text"?this.parseText():this.tok()}return this.renderer.listitem(body)}case"loose_item_start":{var body="";while(this.next().type!=="list_item_end"){body+=this.tok()}return this.renderer.listitem(body)}case"html":{var html=!this.token.pre&&!this.options.pedantic?this.inline.output(this.token.text):this.token.text;return this.renderer.html(html)}case"paragraph":{return this.renderer.paragraph(this.inline.output(this.token.text))}case"text":{return this.renderer.paragraph(this.parseText())}}};function escape(html,encode){return html.replace(!encode?/&(?!#?\w+;)/g:/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;").replace(/'/g,"&#39;")}function unescape(html){return html.replace(/&([#\w]+);/g,function(_,n){n=n.toLowerCase();if(n==="colon")return":";if(n.charAt(0)==="#"){return n.charAt(1)==="x"?String.fromCharCode(parseInt(n.substring(2),16)):String.fromCharCode(+n.substring(1))}return""})}function replace(regex,opt){regex=regex.source;opt=opt||"";return function self(name,val){if(!name)return new RegExp(regex,opt);val=val.source||val;val=val.replace(/(^|[^\[])\^/g,"$1");regex=regex.replace(name,val);return self}}function noop(){}noop.exec=noop;function merge(obj){var i=1,target,key;for(;i<arguments.length;i++){target=arguments[i];for(key in target){if(Object.prototype.hasOwnProperty.call(target,key)){obj[key]=target[key]}}}return obj}function marked(src,opt,callback){if(callback||typeof opt==="function"){if(!callback){callback=opt;opt=null}opt=merge({},marked.defaults,opt||{});var highlight=opt.highlight,tokens,pending,i=0;try{tokens=Lexer.lex(src,opt)}catch(e){return callback(e)}pending=tokens.length;var done=function(err){if(err){opt.highlight=highlight;return callback(err)}var out;try{out=Parser.parse(tokens,opt)}catch(e){err=e}opt.highlight=highlight;return err?callback(err):callback(null,out)};if(!highlight||highlight.length<3){return done()}delete opt.highlight;if(!pending)return done();for(;i<tokens.length;i++){(function(token){if(token.type!=="code"){return--pending||done()}return highlight(token.text,token.lang,function(err,code){if(err)return done(err);if(code==null||code===token.text){return--pending||done()}token.text=code;token.escaped=true;--pending||done()})})(tokens[i])}return}try{if(opt)opt=merge({},marked.defaults,opt);return Parser.parse(Lexer.lex(src,opt),opt)}catch(e){e.message+="\nPlease report this to https://github.com/chjj/marked.";if((opt||marked.defaults).silent){return"<p>An error occured:</p><pre>"+escape(e.message+"",true)+"</pre>"}throw e}}marked.options=marked.setOptions=function(opt){merge(marked.defaults,opt);return marked};marked.defaults={gfm:true,tables:true,breaks:false,pedantic:false,sanitize:false,smartLists:false,silent:false,highlight:null,langPrefix:"lang-",smartypants:false,headerPrefix:"",renderer:new Renderer,xhtml:false};marked.Parser=Parser;marked.parser=Parser.parse;marked.Renderer=Renderer;marked.Lexer=Lexer;marked.lexer=Lexer.lex;marked.InlineLexer=InlineLexer;marked.inlineLexer=InlineLexer.output;marked.parse=marked;if(typeof module!=="undefined"&&typeof exports==="object"){module.exports=marked}else if(typeof define==="function"&&define.amd){define(function(){return marked})}else{this.marked=marked}}).call(function(){return this||(typeof window!=="undefined"?window:global)}());
}).call(this,typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})
},{}],41:[function(require,module,exports){
/*! microplugin.js | https://github.com/brianreavis/microplugin.js | Apache License (v2) */
(function(e,n){if(typeof define==="function"&&define.amd){define(n)}else if(typeof exports==="object"){module.exports=n()}else{e.MicroPlugin=n()}})(this,function(){var e={};e.mixin=function(e){e.plugins={};e.prototype.initializePlugins=function(e){var i,r,t;var s=this;var o=[];s.plugins={names:[],settings:{},requested:{},loaded:{}};if(n.isArray(e)){for(i=0,r=e.length;i<r;i++){if(typeof e[i]==="string"){o.push(e[i])}else{s.plugins.settings[e[i].name]=e[i].options;o.push(e[i].name)}}}else if(e){for(t in e){if(e.hasOwnProperty(t)){s.plugins.settings[t]=e[t];o.push(t)}}}while(o.length){s.require(o.shift())}};e.prototype.loadPlugin=function(n){var i=this;var r=i.plugins;var t=e.plugins[n];if(!e.plugins.hasOwnProperty(n)){throw new Error('Unable to find "'+n+'" plugin')}r.requested[n]=true;r.loaded[n]=t.fn.apply(i,[i.plugins.settings[n]||{}]);r.names.push(n)};e.prototype.require=function(e){var n=this;var i=n.plugins;if(!n.plugins.loaded.hasOwnProperty(e)){if(i.requested[e]){throw new Error('Plugin has circular dependency ("'+e+'")')}n.loadPlugin(e)}return i.loaded[e]};e.define=function(n,i){e.plugins[n]={name:n,fn:i}}};var n={isArray:Array.isArray||function(e){return Object.prototype.toString.call(e)==="[object Array]"}};return e});
},{}],42:[function(require,module,exports){
/*! Modernizr 3.0.0-beta (Custom Build) | MIT
 *  Build: http://modernizr.com/download/#-applicationcache-audio-backgroundsize-borderimage-borderradius-boxshadow-canvas-canvastext-cssanimations-csscolumns-cssgradients-cssreflections-csstransforms-csstransforms3d-csstransitions-draganddrop-flexbox-flexboxlegacy-fontface-generatedcontent-geolocation-hashchange-history-hsla-indexeddb-inlinesvg-input-inputtypes-localstorage-multiplebgs-opacity-postmessage-rgba-sessionstorage-smil-svg-svgclippaths-textshadow-video-webgl-websockets-websqldatabase-webworkers-addtest-cssclasses-domprefixes-hasevent-prefixed-prefixes-shiv-testallprops-testprop-teststyles
 */
(function(e,t,n){var r,a,o,Modernizr,i,s,c,l,d,u,f,p,m,g,h,v,y,b,T,x,w,C,S,k,E,P,_,$;function A(e,t){return typeof e===t}function z(){var e,t,n,o,i,s,c,l;for(l in a){if(e=[],t=a[l],t.name&&(e.push(t.name.toLowerCase()),t.options&&t.options.aliases&&t.options.aliases.length))for(n=0;t.options.aliases.length>n;n++)e.push(t.options.aliases[n].toLowerCase());for(o=A(t.fn,"function")?t.fn():t.fn,i=0;e.length>i;i++)s=e[i],c=s.split("."),1===c.length?Modernizr[c[0]]=o:2===c.length&&(!Modernizr[c[0]]||Modernizr[c[0]]instanceof Boolean||(Modernizr[c[0]]=new Boolean(Modernizr[c[0]])),Modernizr[c[0]][c[1]]=o),r.push((o?"":"no-")+c.join("-"))}}function N(e){var t,n,r;t=s.className,n=Modernizr._config.classPrefix||"",r=RegExp("(^|\\s)"+n+"no-js(\\s|$)"),t=t.replace(r,"$1"+n+"js$2"),Modernizr._config.enableClasses&&(t+=" "+n+e.join(" "+n),s.className=t)}function R(e,t){var r,a,o;if("object"==typeof e)for(r in e)c(e,r)&&R(r,e[r]);else{if(e=e.toLowerCase(),a=e.split("."),o=Modernizr[a[0]],2==a.length&&(o=o[a[1]]),o!==n)return Modernizr;t="function"==typeof t?t():t,1==a.length?Modernizr[a[0]]=t:2==a.length&&(!Modernizr[a[0]]||Modernizr[a[0]]instanceof Boolean||(Modernizr[a[0]]=new Boolean(Modernizr[a[0]])),Modernizr[a[0]][a[1]]=t),N([(t?"":"no-")+a.join("-")]),Modernizr._trigger(e,t)}return Modernizr}function B(e){return e.replace(/([a-z])-([a-z])/g,function(e,t,n){return t+n.toUpperCase()}).replace(/^-/,"")}function L(e,t){return!!~(""+e).indexOf(t)}function M(){var e=t.body;return e||(e=u("body"),e.fake=!0),e}function j(e,t,n,r){var a,o,i,c,l,d,f;if(a="modernizr",d=u("div"),f=M(),parseInt(n,10))for(;n--;)c=u("div"),c.id=r?r[n]:a+(n+1),d.appendChild(c);return o=["­",'<style id="s',a,'">',e,"</style>"].join(""),d.id=a,(f.fake?f:d).innerHTML+=o,f.appendChild(d),f.fake&&(f.style.background="",f.style.overflow="hidden",l=s.style.overflow,s.style.overflow="hidden",s.appendChild(f)),i=t(d,e),f.fake?(f.parentNode.removeChild(f),s.style.overflow=l,s.offsetHeight):d.parentNode.removeChild(d),!!i}function F(e,t){return function(){return e.apply(t,arguments)}}function O(e,t,n){var r,a;for(a in e)if(e[a]in t)return n===!1?e[a]:(r=t[e[a]],A(r,"function")?F(r,n||t):r);return!1}function D(e){return e.replace(/([A-Z])/g,function(e,t){return"-"+t.toLowerCase()}).replace(/^ms-/,"-ms-")}function I(t,r){var a,o;if(a=t.length,"CSS"in e&&"supports"in e.CSS){for(;a--;)if(e.CSS.supports(D(t[a]),r))return!0;return!1}if("CSSSupportsRule"in e){for(o=[];a--;)o.push("("+D(t[a])+":"+r+")");return o=o.join(" or "),j("@supports ("+o+") { #modernizr { position: absolute; } }",function(t){return"absolute"==(e.getComputedStyle?getComputedStyle(t,null):t.currentStyle).position})}return n}function H(e,t,r,a){var o,i,s,c,l;function d(){i&&(delete k.style,delete k.modElem)}if(a=A(a,"undefined")?!1:a,!A(r,"undefined")&&(o=I(e,r),!A(o,"undefined")))return o;k.style||(i=!0,k.modElem=u("modernizr"),k.style=k.modElem.style);for(s in e)if(c=e[s],l=k.style[c],!L(c,"-")&&k.style[c]!==n){if(a||A(r,"undefined"))return d(),"pfx"==t?c:!0;try{k.style[c]=r}catch(f){}if(k.style[c]!=l)return d(),"pfx"==t?c:!0}return d(),!1}function q(e,t,n,r,a){var o=e.charAt(0).toUpperCase()+e.slice(1),i=(e+" "+x.join(o+" ")+o).split(" ");return A(t,"string")||A(t,"undefined")?H(i,t,r,a):(i=(e+" "+d.join(o+" ")+o).split(" "),O(i,t,n))}function W(e,t,r){return q(e,n,n,t,r)}r=[],function(e,t){var r,a,o,i,s,c,l,d,u,f;function p(e,t){var n=e.createElement("p"),r=e.getElementsByTagName("head")[0]||e.documentElement;return n.innerHTML="x<style>"+t+"</style>",r.insertBefore(n.lastChild,r.firstChild)}function m(){var e=f.elements;return"string"==typeof e?e.split(" "):e}function g(e){var t=d[e[c]];return t||(t={},l++,e[c]=l,d[l]=t),t}function h(e,n,r){if(n||(n=t),u)return n.createElement(e);r||(r=g(n));var a;return a=r.cache[e]?r.cache[e].cloneNode():i.test(e)?(r.cache[e]=r.createElem(e)).cloneNode():r.createElem(e),!a.canHaveChildren||o.test(e)||a.tagUrn?a:r.frag.appendChild(a)}function v(e,n){if(e||(e=t),u)return e.createDocumentFragment();n=n||g(e);for(var r=n.frag.cloneNode(),a=0,o=m(),i=o.length;i>a;a++)r.createElement(o[a]);return r}function y(e,t){t.cache||(t.cache={},t.createElem=e.createElement,t.createFrag=e.createDocumentFragment,t.frag=t.createFrag()),e.createElement=function(n){return f.shivMethods?h(n,e,t):t.createElem(n)},e.createDocumentFragment=Function("h,f","return function(){var n=f.cloneNode(),c=n.createElement;h.shivMethods&&("+m().join().replace(/[\w\-:]+/g,function(e){return t.createElem(e),t.frag.createElement(e),'c("'+e+'")'})+");return n}")(f,t.frag)}function b(e){e||(e=t);var n=g(e);return!f.shivCSS||s||n.hasCSS||(n.hasCSS=!!p(e,"article,aside,dialog,figcaption,figure,footer,header,hgroup,main,nav,section{display:block}mark{background:#FF0;color:#000}template{display:none}")),u||y(e,n),e}r="3.7.0",a=e.html5||{},o=/^<|^(?:button|map|select|textarea|object|iframe|option|optgroup)$/i,i=/^(?:a|b|code|div|fieldset|h1|h2|h3|h4|h5|h6|i|label|li|ol|p|q|span|strong|style|table|tbody|td|th|tr|ul)$/i,c="_html5shiv",l=0,d={},function(){try{var e=t.createElement("a");e.innerHTML="<xyz></xyz>",s="hidden"in e,u=1==e.childNodes.length||function(){t.createElement("a");var e=t.createDocumentFragment();return e.cloneNode===n||e.createDocumentFragment===n||e.createElement===n}()}catch(r){s=!0,u=!0}}(),f={elements:a.elements||"abbr article aside audio bdi canvas data datalist details dialog figcaption figure footer header hgroup main mark meter nav output picture progress section summary template time video",version:r,shivCSS:a.shivCSS!==!1,supportsUnknownElements:u,shivMethods:a.shivMethods!==!1,type:"default",shivDocument:b,createElement:h,createDocumentFragment:v},e.html5=f,b(t)}(this,t),a=[],o={_version:"v3.0.0pre",_config:{classPrefix:"",enableClasses:!0,usePrefixes:!0},_q:[],on:function(e,t){setTimeout(function(){t(this[e])},0)},addTest:function(e,t,n){a.push({name:e,fn:t,options:n})},addAsyncTest:function(e){a.push({name:null,fn:e})}},Modernizr=function(){},Modernizr.prototype=o,Modernizr=new Modernizr,Modernizr.addTest("applicationcache","applicationCache"in e),Modernizr.addTest("geolocation","geolocation"in navigator),Modernizr.addTest("history",function(){var t=navigator.userAgent;return-1===t.indexOf("Android 2.")&&-1===t.indexOf("Android 4.0")||-1===t.indexOf("Mobile Safari")||-1!==t.indexOf("Chrome")?e.history&&"pushState"in e.history:!1}),Modernizr.addTest("localstorage",function(){var e="modernizr";try{return localStorage.setItem(e,e),localStorage.removeItem(e),!0}catch(t){return!1}}),Modernizr.addTest("postmessage","postMessage"in e),Modernizr.addTest("sessionstorage",function(){var e="modernizr";try{return sessionStorage.setItem(e,e),sessionStorage.removeItem(e),!0}catch(t){return!1}}),Modernizr.addTest("svg",!!t.createElementNS&&!!t.createElementNS("http://www.w3.org/2000/svg","svg").createSVGRect),Modernizr.addTest("websqldatabase","openDatabase"in e),Modernizr.addTest("webworkers","Worker"in e),Modernizr.addTest("websockets","WebSocket"in e&&2===e.WebSocket.CLOSING),i=o._config.usePrefixes?" -webkit- -moz- -o- -ms- ".split(" "):[],o._prefixes=i,s=t.documentElement,function(){var e={}.hasOwnProperty;c=A(e,"undefined")||A(e.call,"undefined")?function(e,t){return t in e&&A(e.constructor.prototype[t],"undefined")}:function(t,n){return e.call(t,n)}}(),o._l={},o.on=function(e,t){this._l[e]||(this._l[e]=[]),this._l[e].push(t),Modernizr.hasOwnProperty(e)&&setTimeout(function(){Modernizr._trigger(e,Modernizr[e])},0)},o._trigger=function(e,t){if(this._l[e]){var n=this._l[e];setTimeout(function(){var e,r;for(e=0;n.length>e;e++)r=n[e],r(t)},0),delete this._l[e]}},Modernizr._q.push(function(){o.addTest=R}),l="Webkit Moz O ms",d=o._config.usePrefixes?l.toLowerCase().split(" "):[],o._domPrefixes=d,u=function(){return t.createElement.apply(t,arguments)},Modernizr.addTest("canvas",function(){var e=u("canvas");return!(!e.getContext||!e.getContext("2d"))}),Modernizr.addTest("canvastext",function(){return Modernizr.canvas===!1?!1:"function"==typeof u("canvas").getContext("2d").fillText}),Modernizr.addTest("cssgradients",function(){var e,t,n,r,a,o;return e="background-image:",t="gradient(linear,left top,right bottom,from(#9f9),to(white));",n="linear-gradient(left top,#9f9, white);",r=e+i.join(n+e).slice(0,-e.length),Modernizr._config.usePrefixes&&(r+=e+"-webkit-"+t),a=u("div"),o=a.style,o.cssText=r,(""+o.backgroundImage).indexOf("gradient")>-1}),Modernizr.addTest("multiplebgs",function(){var e,t;return e=u("div"),t=e.style,t.cssText="background:url(https://),url(https://),red url(https://)",/(url\s*\(.*?){3}/.test(t.background)}),Modernizr.addTest("opacity",function(){var e,t;return e=u("div"),t=e.style,t.cssText=i.join("opacity:.55;"),/^0.55$/.test(t.opacity)}),Modernizr.addTest("rgba",function(){var e,t;return e=u("div"),t=e.style,t.cssText="background-color:rgba(150,255,150,.5)",(""+t.backgroundColor).indexOf("rgba")>-1}),Modernizr.addTest("draganddrop",function(){var e=u("div");return"draggable"in e||"ondragstart"in e&&"ondrop"in e}),Modernizr.addTest("audio",function(){var e,t;e=u("audio"),t=!1;try{(t=!!e.canPlayType)&&(t=new Boolean(t),t.ogg=e.canPlayType('audio/ogg; codecs="vorbis"').replace(/^no$/,""),t.mp3=e.canPlayType("audio/mpeg;").replace(/^no$/,""),t.opus=e.canPlayType('audio/ogg; codecs="opus"').replace(/^no$/,""),t.wav=e.canPlayType('audio/wav; codecs="1"').replace(/^no$/,""),t.m4a=(e.canPlayType("audio/x-m4a;")||e.canPlayType("audio/aac;")).replace(/^no$/,""))}catch(n){}return t}),Modernizr.addTest("video",function(){var e,t;e=u("video"),t=!1;try{(t=!!e.canPlayType)&&(t=new Boolean(t),t.ogg=e.canPlayType('video/ogg; codecs="theora"').replace(/^no$/,""),t.h264=e.canPlayType('video/mp4; codecs="avc1.42E01E"').replace(/^no$/,""),t.webm=e.canPlayType('video/webm; codecs="vp8, vorbis"').replace(/^no$/,""),t.vp9=e.canPlayType('video/webm; codecs="vp9"').replace(/^no$/,""),t.hls=e.canPlayType('application/x-mpegURL; codecs="avc1.42E01E"').replace(/^no$/,""))}catch(n){}return t}),Modernizr.addTest("inlinesvg",function(){var e=u("div");return e.innerHTML="<svg/>","http://www.w3.org/2000/svg"==(e.firstChild&&e.firstChild.namespaceURI)}),Modernizr.addTest("webgl",function(){var t=u("canvas");return"supportsContext"in t?t.supportsContext("webgl")||t.supportsContext("experimental-webgl"):!!e.WebGLRenderingContext}),f=function(e){function n(t,n){var a;return t?(n&&"string"!=typeof n||(n=u(n||"div")),t="on"+t,a=t in n,!a&&r&&(n.setAttribute||(n=u("div")),n.setAttribute&&n.removeAttribute&&(n.setAttribute(t,""),a="function"==typeof n[t],n[t]!==e&&(n[t]=e),n.removeAttribute(t))),a):!1}var r=!("onblur"in t.documentElement);return n}(),p=o.hasEvent=f,Modernizr.addTest("hashchange",function(){return p("hashchange",e)===!1?!1:t.documentMode===n||t.documentMode>7}),Modernizr.addTest("hsla",function(){var e,t;return e=u("div"),t=e.style,t.cssText="background-color:hsla(120,40%,100%,.5)",L(t.backgroundColor,"rgba")||L(t.backgroundColor,"hsla")}),m=u("input"),g="search tel url email datetime date month week time datetime-local number range color".split(" "),h={},v=":)",Modernizr.inputtypes=function(e){var r,a,o,i,c;for(i=e.length,c=0;i>c;c++)m.setAttribute("type",a=e[c]),r="text"!==m.type,r&&(m.value=v,m.style.cssText="position:absolute;visibility:hidden;",/^range$/.test(a)&&m.style.WebkitAppearance!==n?(s.appendChild(m),o=t.defaultView,r=o.getComputedStyle&&"textfield"!==o.getComputedStyle(m,null).WebkitAppearance&&0!==m.offsetHeight,s.removeChild(m)):/^(search|tel)$/.test(a)||(r=/^(url|email)$/.test(a)?m.checkValidity&&m.checkValidity()===!1:m.value!=v)),h[e[c]]=!!r;return h}(g),y={},b="autocomplete autofocus list placeholder max min multiple pattern required step".split(" "),Modernizr.input=function(t){for(var n=0,r=t.length;r>n;n++)y[t[n]]=!!(t[n]in m);return y.list&&(y.list=!(!u("datalist")||!e.HTMLDataListElement)),y}(b),T={}.toString,Modernizr.addTest("svgclippaths",function(){return!!t.createElementNS&&/SVGClipPath/.test(T.call(t.createElementNS("http://www.w3.org/2000/svg","clipPath")))}),Modernizr.addTest("smil",function(){return!!t.createElementNS&&/SVGAnimate/.test(T.call(t.createElementNS("http://www.w3.org/2000/svg","animate")))}),x=o._config.usePrefixes?l.split(" "):[],o._cssomPrefixes=x,w=o.testStyles=j,C=function(){var e,t,n,r,a;return e=navigator.userAgent,t=e.match(/applewebkit\/([0-9]+)/gi)&&parseFloat(RegExp.$1),n=e.match(/w(eb)?osbrowser/gi),r=e.match(/windows phone/gi)&&e.match(/iemobile\/([0-9])+/gi)&&parseFloat(RegExp.$1)>=9,a=533>t&&e.match(/android/gi),n||a||r}(),C?Modernizr.addTest("fontface",!1):w('@font-face {font-family:"font";src:url("https://")}',function(e,n){var r,a,o,i;r=t.getElementById("smodernizr"),a=r.sheet||r.styleSheet,o=a?a.cssRules&&a.cssRules[0]?a.cssRules[0].cssText:a.cssText||"":"",i=/src/i.test(o)&&0===o.indexOf(n.split(" ")[0]),Modernizr.addTest("fontface",i)}),w('#modernizr{font:0/0 a}#modernizr:after{content:":)";visibility:hidden;font:7px/1 a}',function(e){Modernizr.addTest("generatedcontent",e.offsetHeight>=7)}),S={elem:u("modernizr")},Modernizr._q.push(function(){delete S.elem}),k={style:S.elem.style},Modernizr._q.unshift(function(){delete k.style}),E=o.testProp=function(e,t,r){return H([e],n,t,r)},Modernizr.addTest("textshadow",E("textShadow","1px 1px")),o.testAllProps=q,P=o.prefixed=function(e,t,n){return-1!=e.indexOf("-")&&(e=B(e)),t?q(e,t,n):q(e,"pfx")},_=P("indexedDB",e),Modernizr.addTest("indexeddb",!!_),_&&Modernizr.addTest("indexeddb.deletedatabase","deleteDatabase"in _),o.testAllProps=W,Modernizr.addTest("backgroundsize",W("backgroundSize","100%",!0)),Modernizr.addTest("borderimage",W("borderImage","url() 1",!0)),Modernizr.addTest("borderradius",W("borderRadius","0px",!0)),Modernizr.addTest("boxshadow",W("boxShadow","1px 1px",!0)),Modernizr.addTest("cssanimations",W("animationName","a",!0)),function(){var e,t,n,r;for(Modernizr.addTest("csscolumns",function(){var e,t;e=!1,t=W("columnCount");try{(e=!!t)&&(e=new Boolean(e))}catch(n){}return e}),e=["Width","Span","Fill","Gap","Rule","RuleColor","RuleStyle","RuleWidth","BreakBefore","BreakAfter","BreakInside"],r=0;e.length>r;r++)t=e[r].toLowerCase(),n=W("column"+e[r]),("breakbefore"===t||"breakafter"===t||"breakinside"==t)&&(n=n||W(e[r])),Modernizr.addTest("csscolumns."+t,n)}(),Modernizr.addTest("cssreflections",W("boxReflect","above",!0)),Modernizr.addTest("csstransforms",W("transform","scale(1)",!0)),Modernizr.addTest("csstransforms3d",function(){var e,t,n;return e=!!W("perspective","1px",!0),t=Modernizr._config.usePrefixes,e&&(!t||"webkitPerspective"in s.style)&&(n="@media (transform-3d)",t&&(n+=",(-webkit-transform-3d)"),n+="{#modernizr{left:9px;position:absolute;height:5px;margin:0;padding:0;border:0}}",w(n,function(t){e=9===t.offsetLeft&&5===t.offsetHeight})),e}),Modernizr.addTest("csstransitions",W("transition","all",!0)),Modernizr.addTest("flexbox",W("flexBasis","1px",!0)),Modernizr.addTest("flexboxlegacy",W("boxDirection","reverse",!0)),z(),N(r),delete o.addTest,delete o.addAsyncTest;for($=0;Modernizr._q.length>$;$++)Modernizr._q[$]();e.Modernizr=Modernizr})(this,document);
},{}],43:[function(require,module,exports){
/* NProgress, (c) 2013, 2014 Rico Sta. Cruz - http://ricostacruz.com/nprogress
 * @license MIT */

;(function(root, factory) {

  if (typeof define === 'function' && define.amd) {
    define(factory);
  } else if (typeof exports === 'object') {
    module.exports = factory();
  } else {
    root.NProgress = factory();
  }

})(this, function() {
  var NProgress = {};

  NProgress.version = '0.1.6';

  var Settings = NProgress.settings = {
    minimum: 0.08,
    easing: 'ease',
    positionUsing: '',
    speed: 200,
    trickle: true,
    trickleRate: 0.02,
    trickleSpeed: 800,
    showSpinner: true,
    barSelector: '[role="bar"]',
    spinnerSelector: '[role="spinner"]',
    parent: 'body',
    template: '<div class="bar" role="bar"><div class="peg"></div></div><div class="spinner" role="spinner"><div class="spinner-icon"></div></div>'
  };

  /**
   * Updates configuration.
   *
   *     NProgress.configure({
   *       minimum: 0.1
   *     });
   */
  NProgress.configure = function(options) {
    var key, value;
    for (key in options) {
      value = options[key];
      if (value !== undefined && options.hasOwnProperty(key)) Settings[key] = value;
    }

    return this;
  };

  /**
   * Last number.
   */

  NProgress.status = null;

  /**
   * Sets the progress bar status, where `n` is a number from `0.0` to `1.0`.
   *
   *     NProgress.set(0.4);
   *     NProgress.set(1.0);
   */

  NProgress.set = function(n) {
    var started = NProgress.isStarted();

    n = clamp(n, Settings.minimum, 1);
    NProgress.status = (n === 1 ? null : n);

    var progress = NProgress.render(!started),
        bar      = progress.querySelector(Settings.barSelector),
        speed    = Settings.speed,
        ease     = Settings.easing;

    progress.offsetWidth; /* Repaint */

    queue(function(next) {
      // Set positionUsing if it hasn't already been set
      if (Settings.positionUsing === '') Settings.positionUsing = NProgress.getPositioningCSS();

      // Add transition
      css(bar, barPositionCSS(n, speed, ease));

      if (n === 1) {
        // Fade out
        css(progress, {
          transition: 'none',
          opacity: 1
        });
        progress.offsetWidth; /* Repaint */

        setTimeout(function() {
          css(progress, {
            transition: 'all ' + speed + 'ms linear',
            opacity: 0
          });
          setTimeout(function() {
            NProgress.remove();
            next();
          }, speed);
        }, speed);
      } else {
        setTimeout(next, speed);
      }
    });

    return this;
  };

  NProgress.isStarted = function() {
    return typeof NProgress.status === 'number';
  };

  /**
   * Shows the progress bar.
   * This is the same as setting the status to 0%, except that it doesn't go backwards.
   *
   *     NProgress.start();
   *
   */
  NProgress.start = function() {
    if (!NProgress.status) NProgress.set(0);

    var work = function() {
      setTimeout(function() {
        if (!NProgress.status) return;
        NProgress.trickle();
        work();
      }, Settings.trickleSpeed);
    };

    if (Settings.trickle) work();

    return this;
  };

  /**
   * Hides the progress bar.
   * This is the *sort of* the same as setting the status to 100%, with the
   * difference being `done()` makes some placebo effect of some realistic motion.
   *
   *     NProgress.done();
   *
   * If `true` is passed, it will show the progress bar even if its hidden.
   *
   *     NProgress.done(true);
   */

  NProgress.done = function(force) {
    if (!force && !NProgress.status) return this;

    return NProgress.inc(0.3 + 0.5 * Math.random()).set(1);
  };

  /**
   * Increments by a random amount.
   */

  NProgress.inc = function(amount) {
    var n = NProgress.status;

    if (!n) {
      return NProgress.start();
    } else {
      if (typeof amount !== 'number') {
        amount = (1 - n) * clamp(Math.random() * n, 0.1, 0.95);
      }

      n = clamp(n + amount, 0, 0.994);
      return NProgress.set(n);
    }
  };

  NProgress.trickle = function() {
    return NProgress.inc(Math.random() * Settings.trickleRate);
  };

  /**
   * Waits for all supplied jQuery promises and
   * increases the progress as the promises resolve.
   *
   * @param $promise jQUery Promise
   */
  (function() {
    var initial = 0, current = 0;

    NProgress.promise = function($promise) {
      if (!$promise || $promise.state() == "resolved") {
        return this;
      }

      if (current == 0) {
        NProgress.start();
      }

      initial++;
      current++;

      $promise.always(function() {
        current--;
        if (current == 0) {
            initial = 0;
            NProgress.done();
        } else {
            NProgress.set((initial - current) / initial);
        }
      });

      return this;
    };

  })();

  /**
   * (Internal) renders the progress bar markup based on the `template`
   * setting.
   */

  NProgress.render = function(fromStart) {
    if (NProgress.isRendered()) return document.getElementById('nprogress');

    addClass(document.documentElement, 'nprogress-busy');

    var progress = document.createElement('div');
    progress.id = 'nprogress';
    progress.innerHTML = Settings.template;

    var bar      = progress.querySelector(Settings.barSelector),
        perc     = fromStart ? '-100' : toBarPerc(NProgress.status || 0),
        parent   = document.querySelector(Settings.parent),
        spinner;

    css(bar, {
      transition: 'all 0 linear',
      transform: 'translate3d(' + perc + '%,0,0)'
    });

    if (!Settings.showSpinner) {
      spinner = progress.querySelector(Settings.spinnerSelector);
      spinner && removeElement(spinner);
    }

    if (parent != document.body) {
      addClass(parent, 'nprogress-custom-parent');
    }

    parent.appendChild(progress);
    return progress;
  };

  /**
   * Removes the element. Opposite of render().
   */

  NProgress.remove = function() {
    removeClass(document.documentElement, 'nprogress-busy');
    removeClass(document.querySelector(Settings.parent), 'nprogress-custom-parent')
    var progress = document.getElementById('nprogress');
    progress && removeElement(progress);
  };

  /**
   * Checks if the progress bar is rendered.
   */

  NProgress.isRendered = function() {
    return !!document.getElementById('nprogress');
  };

  /**
   * Determine which positioning CSS rule to use.
   */

  NProgress.getPositioningCSS = function() {
    // Sniff on document.body.style
    var bodyStyle = document.body.style;

    // Sniff prefixes
    var vendorPrefix = ('WebkitTransform' in bodyStyle) ? 'Webkit' :
                       ('MozTransform' in bodyStyle) ? 'Moz' :
                       ('msTransform' in bodyStyle) ? 'ms' :
                       ('OTransform' in bodyStyle) ? 'O' : '';

    if (vendorPrefix + 'Perspective' in bodyStyle) {
      // Modern browsers with 3D support, e.g. Webkit, IE10
      return 'translate3d';
    } else if (vendorPrefix + 'Transform' in bodyStyle) {
      // Browsers without 3D support, e.g. IE9
      return 'translate';
    } else {
      // Browsers without translate() support, e.g. IE7-8
      return 'margin';
    }
  };

  /**
   * Helpers
   */

  function clamp(n, min, max) {
    if (n < min) return min;
    if (n > max) return max;
    return n;
  }

  /**
   * (Internal) converts a percentage (`0..1`) to a bar translateX
   * percentage (`-100%..0%`).
   */

  function toBarPerc(n) {
    return (-1 + n) * 100;
  }


  /**
   * (Internal) returns the correct CSS for changing the bar's
   * position given an n percentage, and speed and ease from Settings
   */

  function barPositionCSS(n, speed, ease) {
    var barCSS;

    if (Settings.positionUsing === 'translate3d') {
      barCSS = { transform: 'translate3d('+toBarPerc(n)+'%,0,0)' };
    } else if (Settings.positionUsing === 'translate') {
      barCSS = { transform: 'translate('+toBarPerc(n)+'%,0)' };
    } else {
      barCSS = { 'margin-left': toBarPerc(n)+'%' };
    }

    barCSS.transition = 'all '+speed+'ms '+ease;

    return barCSS;
  }

  /**
   * (Internal) Queues a function to be executed.
   */

  var queue = (function() {
    var pending = [];

    function next() {
      var fn = pending.shift();
      if (fn) {
        fn(next);
      }
    }

    return function(fn) {
      pending.push(fn);
      if (pending.length == 1) next();
    };
  })();

  /**
   * (Internal) Applies css properties to an element, similar to the jQuery
   * css method.
   *
   * While this helper does assist with vendor prefixed property names, it
   * does not perform any manipulation of values prior to setting styles.
   */

  var css = (function() {
    var cssPrefixes = [ 'Webkit', 'O', 'Moz', 'ms' ],
        cssProps    = {};

    function camelCase(string) {
      return string.replace(/^-ms-/, 'ms-').replace(/-([\da-z])/gi, function(match, letter) {
        return letter.toUpperCase();
      });
    }

    function getVendorProp(name) {
      var style = document.body.style;
      if (name in style) return name;

      var i = cssPrefixes.length,
          capName = name.charAt(0).toUpperCase() + name.slice(1),
          vendorName;
      while (i--) {
        vendorName = cssPrefixes[i] + capName;
        if (vendorName in style) return vendorName;
      }

      return name;
    }

    function getStyleProp(name) {
      name = camelCase(name);
      return cssProps[name] || (cssProps[name] = getVendorProp(name));
    }

    function applyCss(element, prop, value) {
      prop = getStyleProp(prop);
      element.style[prop] = value;
    }

    return function(element, properties) {
      var args = arguments,
          prop,
          value;

      if (args.length == 2) {
        for (prop in properties) {
          value = properties[prop];
          if (value !== undefined && properties.hasOwnProperty(prop)) applyCss(element, prop, value);
        }
      } else {
        applyCss(element, args[1], args[2]);
      }
    }
  })();

  /**
   * (Internal) Determines if an element or space separated list of class names contains a class name.
   */

  function hasClass(element, name) {
    var list = typeof element == 'string' ? element : classList(element);
    return list.indexOf(' ' + name + ' ') >= 0;
  }

  /**
   * (Internal) Adds a class to an element.
   */

  function addClass(element, name) {
    var oldList = classList(element),
        newList = oldList + name;

    if (hasClass(oldList, name)) return;

    // Trim the opening space.
    element.className = newList.substring(1);
  }

  /**
   * (Internal) Removes a class from an element.
   */

  function removeClass(element, name) {
    var oldList = classList(element),
        newList;

    if (!hasClass(element, name)) return;

    // Replace the class name.
    newList = oldList.replace(' ' + name + ' ', ' ');

    // Trim the opening and closing spaces.
    element.className = newList.substring(1, newList.length - 1);
  }

  /**
   * (Internal) Gets a space separated list of the class names on the element.
   * The list is wrapped with a single space on each end to facilitate finding
   * matches within the list.
   */

  function classList(element) {
    return (' ' + (element.className || '') + ' ').replace(/\s+/gi, ' ');
  }

  /**
   * (Internal) Removes an element from the DOM.
   */

  function removeElement(element) {
    element && element.parentNode && element.parentNode.removeChild(element);
  }

  return NProgress;
});

},{}],44:[function(require,module,exports){

// modified for QI Labs

function identity(x) { return x; }
function returnFalse(x) { return false; }

function HookCollection() { }

HookCollection.prototype = {

    chain: function (hookname, func) {
        var original = this[hookname];
        if (!original)
            throw new Error("unknown hook " + hookname);

        if (original === identity)
            this[hookname] = func;
        else
            this[hookname] = function (text) {
                var args = Array.prototype.slice.call(arguments, 0);
                args[0] = original.apply(null, args);
                return func.apply(null, args);
            };
    },
    set: function (hookname, func) {
        if (!this[hookname])
            throw new Error("unknown hook " + hookname);
        this[hookname] = func;
    },
    addNoop: function (hookname) {
        this[hookname] = identity;
    },
    addFalse: function (hookname) {
        this[hookname] = returnFalse;
    }
};

Markdown = {}

Markdown.HookCollection = HookCollection;

(function () {

    var util = {},
        position = {},
        ui = {},
        doc = window.document,
        re = window.RegExp,
        nav = window.navigator,
        SETTINGS = { lineLength: 72 },

    // Used to work around some browser bugs where we can't use feature testing.
        uaSniffed = {
            isIE: /msie/.test(nav.userAgent.toLowerCase()),
            isIE_5or6: /msie 6/.test(nav.userAgent.toLowerCase()) || /msie 5/.test(nav.userAgent.toLowerCase()),
            isOpera: /opera/.test(nav.userAgent.toLowerCase())
        };

    // var defaultsStrings = {
    //     bold: "Negrito <strong> Ctrl+B",
    //     boldexample: "strong text",

    //     italic: "Emphasis <em> Ctrl+I",
    //     italicexample: "emphasized text",

    //     link: "Hyperlink <a> Ctrl+L",
    //     linkdescription: "enter link description here",
    //     linkdialog: "<p><b>Insert Hyperlink</b></p><p>http://example.com/ \"optional title\"</p>",

    //     quote: "Blockquote <blockquote> Ctrl+Q",
    //     quoteexample: "Blockquote",

    //     code: "Code Sample <pre><code> Ctrl+K",
    //     codeexample: "enter code here",

    //     image: "Image <img> Ctrl+G",
    //     imagedescription: "enter image description here",
    //     imagedialog: "<p><b>Insert Image</b></p><p>http://example.com/images/diagram.jpg \"optional title\"<br><br>Need <a href='http://www.google.com/search?q=free+image+hosting' target='_blank'>free image hosting?</a></p>",

    //     olist: "Numbered List <ol> Ctrl+O",
    //     ulist: "Bulleted List <ul> Ctrl+U",
    //     litem: "List item",

    //     heading: "Heading <h1>/<h2> Ctrl+H",
    //     headingexample: "Heading",

    //     hr: "Horizontal Rule <hr> Ctrl+R",

    //     undo: "Undo - Ctrl+Z",
    //     redo: "Redo - Ctrl+Y",
    //     redomac: "Redo - Ctrl+Shift+Z",

    //     help: "Markdown Editing Help"
    // };

    var defaultsStrings = {
        bold: "Negrito <strong>",
        boldexample: "texto em negrito",

        italic: "Itálico <em>",
        italicexample: "texto em itálico",

        link: "Hyperlink <a>",
        linkdescription: "descreva o link aqui",
        linkdialog: "<p><b>Insira o Hyperlink</b></p><p>http://example.com/ \"optional title\"</p>",

        quote: "Citação <blockquote>",
        quoteexample: "Blockquote",

        code: "Código <pre><code>",
        codeexample: "escreva o código aqui",

        image: "Image <img>",
        imagedescription: "enter image description here",
        imagedialog: "<p><b>Insert Image</b></p><p>http://example.com/images/diagram.jpg \"optional title\"<br><br>Need <a href='http://www.google.com/search?q=free+image+hosting' target='_blank'>free image hosting?</a></p>",

        olist: "Numbered List <ol>",
        ulist: "Bulleted List <ul>",
        litem: "List item",

        heading: "Heading <h1>/<h2>",
        headingexample: "Heading",

        hr: "Horizontal Rule <hr>",

        undo: "Undo -",
        redo: "Redo -",
        redomac: "Redo -",

        help: "Markdown Editing Help"
    };

    // -------------------------------------------------------------------
    //  YOUR CHANGES GO HERE
    //
    // I've tried to localize the things you are likely to change to
    // this area.
    // -------------------------------------------------------------------

    // The default text that appears in the dialog input box when entering
    // links.
    var imageDefaultText = "http://";
    var linkDefaultText = "http://";

    // -------------------------------------------------------------------
    //  END OF YOUR CHANGES
    // -------------------------------------------------------------------

    // options, if given, can have the following properties:
    //   options.helpButton = { handler: yourEventHandler }
    //   options.strings = { italicexample: "slanted text" }
    // `yourEventHandler` is the click handler for the help button.
    // If `options.helpButton` isn't given, not help button is created.
    // `options.strings` can have any or all of the same properties as
    // `defaultStrings` above, so you can just override some string displayed
    // to the user on a case-by-case basis, or translate all strings to
    // a different language.
    //
    // For backwards compatibility reasons, the `options` argument can also
    // be just the `helpButton` object, and `strings.help` can also be set via
    // `helpButton.title`. This should be considered legacy.
    //
    // The constructed editor object has the methods:
    // - getConverter() returns the markdown converter object that was passed to the constructor
    // - run() actually starts the editor; should be called after all necessary plugins are registered. Calling this more than once is a no-op.
    // - refreshPreview() forces the preview to be updated. This method is only available after run() was called.
    Markdown.Editor = function (markdownConverter, idPostfix, options) {

        options = options || {};

        if (typeof options.handler === "function") { //backwards compatible behavior
            options = { helpButton: options };
        }
        options.strings = options.strings || {};
        if (options.helpButton) {
            options.strings.help = options.strings.help || options.helpButton.title;
        }
        var getString = function (identifier) { return options.strings[identifier] || defaultsStrings[identifier]; }

        idPostfix = idPostfix || "";

        var hooks = this.hooks = new Markdown.HookCollection();
        hooks.addNoop("onPreviewRefresh");       // called with no arguments after the preview has been refreshed
        hooks.addNoop("postBlockquoteCreation"); // called with the user's selection *after* the blockquote was created; should return the actual to-be-inserted text
        hooks.addFalse("insertImageDialog");     /* called with one parameter: a callback to be called with the URL of the image. If the application creates
                                                  * its own image insertion dialog, this hook should return true, and the callback should be called with the chosen
                                                  * image url (or null if the user cancelled). If this hook returns false, the default dialog will be used.
                                                  */

        this.getConverter = function () { return markdownConverter; }

        var that = this,
            panels;

        this.run = function () {
            if (panels)
                return; // already initialized

            panels = new PanelCollection(idPostfix);
            var commandManager = new CommandManager(hooks, getString);
            // var previewManager = new PreviewManager(markdownConverter, panels, function () { hooks.onPreviewRefresh(); });
            var undoManager, uiManager;

            if (!/\?noundo/.test(doc.location.href)) {
                undoManager = new UndoManager(function () {
                    // previewManager.refresh();
                    if (uiManager) // not available on the first call
                        uiManager.setUndoRedoButtonStates();
                }, panels);
                this.textOperation = function (f) {
                    undoManager.setCommandMode();
                    f();
                    that.refreshPreview();
                }
            }

            // modified for qi labs → remove previews!!!
            // uiManager = new UIManager(idPostfix, panels, undoManager, previewManager, commandManager, options.helpButton, getString);
            uiManager = new UIManager(idPostfix, panels, undoManager, null, commandManager, options.helpButton, getString);
            uiManager.setUndoRedoButtonStates();

            var forceRefresh = that.refreshPreview = function () {
                //previewManager.refresh(true);
            };

            forceRefresh();
        };

    }

    // before: contains all the text in the input box BEFORE the selection.
    // after: contains all the text in the input box AFTER the selection.
    function Chunks() { }

    // startRegex: a regular expression to find the start tag
    // endRegex: a regular expresssion to find the end tag
    Chunks.prototype.findTags = function (startRegex, endRegex) {

        var chunkObj = this;
        var regex;

        if (startRegex) {

            regex = util.extendRegExp(startRegex, "", "$");

            this.before = this.before.replace(regex,
                function (match) {
                    chunkObj.startTag = chunkObj.startTag + match;
                    return "";
                });

            regex = util.extendRegExp(startRegex, "^", "");

            this.selection = this.selection.replace(regex,
                function (match) {
                    chunkObj.startTag = chunkObj.startTag + match;
                    return "";
                });
        }

        if (endRegex) {

            regex = util.extendRegExp(endRegex, "", "$");

            this.selection = this.selection.replace(regex,
                function (match) {
                    chunkObj.endTag = match + chunkObj.endTag;
                    return "";
                });

            regex = util.extendRegExp(endRegex, "^", "");

            this.after = this.after.replace(regex,
                function (match) {
                    chunkObj.endTag = match + chunkObj.endTag;
                    return "";
                });
        }
    };

    // If remove is false, the whitespace is transferred
    // to the before/after regions.
    //
    // If remove is true, the whitespace disappears.
    Chunks.prototype.trimWhitespace = function (remove) {
        var beforeReplacer, afterReplacer, that = this;
        if (remove) {
            beforeReplacer = afterReplacer = "";
        } else {
            beforeReplacer = function (s) { that.before += s; return ""; }
            afterReplacer = function (s) { that.after = s + that.after; return ""; }
        }

        this.selection = this.selection.replace(/^(\s*)/, beforeReplacer).replace(/(\s*)$/, afterReplacer);
    };


    Chunks.prototype.skipLines = function (nLinesBefore, nLinesAfter, findExtraNewlines) {

        if (nLinesBefore === undefined) {
            nLinesBefore = 1;
        }

        if (nLinesAfter === undefined) {
            nLinesAfter = 1;
        }

        nLinesBefore++;
        nLinesAfter++;

        var regexText;
        var replacementText;

        // chrome bug ... documented at: http://meta.stackexchange.com/questions/63307/blockquote-glitch-in-editor-in-chrome-6-and-7/65985#65985
        if (navigator.userAgent.match(/Chrome/)) {
            "X".match(/()./);
        }

        this.selection = this.selection.replace(/(^\n*)/, "");

        this.startTag = this.startTag + re.$1;

        this.selection = this.selection.replace(/(\n*$)/, "");
        this.endTag = this.endTag + re.$1;
        this.startTag = this.startTag.replace(/(^\n*)/, "");
        this.before = this.before + re.$1;
        this.endTag = this.endTag.replace(/(\n*$)/, "");
        this.after = this.after + re.$1;

        if (this.before) {

            regexText = replacementText = "";

            while (nLinesBefore--) {
                regexText += "\\n?";
                replacementText += "\n";
            }

            if (findExtraNewlines) {
                regexText = "\\n*";
            }
            this.before = this.before.replace(new re(regexText + "$", ""), replacementText);
        }

        if (this.after) {

            regexText = replacementText = "";

            while (nLinesAfter--) {
                regexText += "\\n?";
                replacementText += "\n";
            }
            if (findExtraNewlines) {
                regexText = "\\n*";
            }

            this.after = this.after.replace(new re(regexText, ""), replacementText);
        }
    };

    // end of Chunks

    // A collection of the important regions on the page.
    // Cached so we don't have to keep traversing the DOM.
    // Also holds ieCachedRange and ieCachedScrollTop, where necessary; working around
    // this issue:
    // Internet explorer has problems with CSS sprite buttons that use HTML
    // lists.  When you click on the background image "button", IE will
    // select the non-existent link text and discard the selection in the
    // textarea.  The solution to this is to cache the textarea selection
    // on the button's mousedown event and set a flag.  In the part of the
    // code where we need to grab the selection, we check for the flag
    // and, if it's set, use the cached area instead of querying the
    // textarea.
    //
    // This ONLY affects Internet Explorer (tested on versions 6, 7
    // and 8) and ONLY on button clicks.  Keyboard shortcuts work
    // normally since the focus never leaves the textarea.
    function PanelCollection(postfix) {
        this.buttonBar = doc.getElementById("wmd-button-bar" + postfix);
        this.preview = doc.getElementById("wmd-preview" + postfix);
        this.input = doc.getElementById("wmd-input" + postfix);
    };

    // Returns true if the DOM element is visible, false if it's hidden.
    // Checks if display is anything other than none.
    util.isVisible = function (elem) {

        if (window.getComputedStyle) {
            // Most browsers
            return window.getComputedStyle(elem, null).getPropertyValue("display") !== "none";
        }
        else if (elem.currentStyle) {
            // IE
            return elem.currentStyle["display"] !== "none";
        }
    };


    // Adds a listener callback to a DOM element which is fired on a specified
    // event.
    util.addEvent = function (elem, event, listener) {
        if (elem.attachEvent) {
            // IE only.  The "on" is mandatory.
            elem.attachEvent("on" + event, listener);
        }
        else {
            // Other browsers.
            elem.addEventListener(event, listener, false);
        }
    };


    // Removes a listener callback from a DOM element which is fired on a specified
    // event.
    util.removeEvent = function (elem, event, listener) {
        if (elem.detachEvent) {
            // IE only.  The "on" is mandatory.
            elem.detachEvent("on" + event, listener);
        }
        else {
            // Other browsers.
            elem.removeEventListener(event, listener, false);
        }
    };

    // Converts \r\n and \r to \n.
    util.fixEolChars = function (text) {
        text = text.replace(/\r\n/g, "\n");
        text = text.replace(/\r/g, "\n");
        return text;
    };

    // Extends a regular expression.  Returns a new RegExp
    // using pre + regex + post as the expression.
    // Used in a few functions where we have a base
    // expression and we want to pre- or append some
    // conditions to it (e.g. adding "$" to the end).
    // The flags are unchanged.
    //
    // regex is a RegExp, pre and post are strings.
    util.extendRegExp = function (regex, pre, post) {

        if (pre === null || pre === undefined) {
            pre = "";
        }
        if (post === null || post === undefined) {
            post = "";
        }

        var pattern = regex.toString();
        var flags;

        // Replace the flags with empty space and store them.
        pattern = pattern.replace(/\/([gim]*)$/, function (wholeMatch, flagsPart) {
            flags = flagsPart;
            return "";
        });

        // Remove the slash delimiters on the regular expression.
        pattern = pattern.replace(/(^\/|\/$)/g, "");
        pattern = pre + pattern + post;

        return new re(pattern, flags);
    }

    // UNFINISHED
    // The assignment in the while loop makes jslint cranky.
    // I'll change it to a better loop later.
    position.getTop = function (elem, isInner) {
        var result = elem.offsetTop;
        if (!isInner) {
            while (elem = elem.offsetParent) {
                result += elem.offsetTop;
            }
        }
        return result;
    };

    position.getHeight = function (elem) {
        return elem.offsetHeight || elem.scrollHeight;
    };

    position.getWidth = function (elem) {
        return elem.offsetWidth || elem.scrollWidth;
    };

    position.getPageSize = function () {

        var scrollWidth, scrollHeight;
        var innerWidth, innerHeight;

        // It's not very clear which blocks work with which browsers.
        if (self.innerHeight && self.scrollMaxY) {
            scrollWidth = doc.body.scrollWidth;
            scrollHeight = self.innerHeight + self.scrollMaxY;
        }
        else if (doc.body.scrollHeight > doc.body.offsetHeight) {
            scrollWidth = doc.body.scrollWidth;
            scrollHeight = doc.body.scrollHeight;
        }
        else {
            scrollWidth = doc.body.offsetWidth;
            scrollHeight = doc.body.offsetHeight;
        }

        if (self.innerHeight) {
            // Non-IE browser
            innerWidth = self.innerWidth;
            innerHeight = self.innerHeight;
        }
        else if (doc.documentElement && doc.documentElement.clientHeight) {
            // Some versions of IE (IE 6 w/ a DOCTYPE declaration)
            innerWidth = doc.documentElement.clientWidth;
            innerHeight = doc.documentElement.clientHeight;
        }
        else if (doc.body) {
            // Other versions of IE
            innerWidth = doc.body.clientWidth;
            innerHeight = doc.body.clientHeight;
        }

        var maxWidth = Math.max(scrollWidth, innerWidth);
        var maxHeight = Math.max(scrollHeight, innerHeight);
        return [maxWidth, maxHeight, innerWidth, innerHeight];
    };

    // Handles pushing and popping TextareaStates for undo/redo commands.
    // I should rename the stack variables to list.
    function UndoManager(callback, panels) {

        var undoObj = this;
        var undoStack = []; // A stack of undo states
        var stackPtr = 0; // The index of the current state
        var mode = "none";
        var lastState; // The last state
        var timer; // The setTimeout handle for cancelling the timer
        var inputStateObj;

        // Set the mode for later logic steps.
        var setMode = function (newMode, noSave) {
            if (mode != newMode) {
                mode = newMode;
                if (!noSave) {
                    saveState();
                }
            }

            if (!uaSniffed.isIE || mode != "moving") {
                timer = setTimeout(refreshState, 1);
            }
            else {
                inputStateObj = null;
            }
        };

        var refreshState = function (isInitialState) {
            inputStateObj = new TextareaState(panels, isInitialState);
            timer = undefined;
        };

        this.setCommandMode = function () {
            mode = "command";
            saveState();
            timer = setTimeout(refreshState, 0);
        };

        this.canUndo = function () {
            return stackPtr > 1;
        };

        this.canRedo = function () {
            if (undoStack[stackPtr + 1]) {
                return true;
            }
            return false;
        };

        // Removes the last state and restores it.
        this.undo = function () {

            if (undoObj.canUndo()) {
                if (lastState) {
                    // What about setting state -1 to null or checking for undefined?
                    lastState.restore();
                    lastState = null;
                }
                else {
                    undoStack[stackPtr] = new TextareaState(panels);
                    undoStack[--stackPtr].restore();

                    if (callback) {
                        callback();
                    }
                }
            }

            mode = "none";
            panels.input.focus();
            refreshState();
        };

        // Redo an action.
        this.redo = function () {

            if (undoObj.canRedo()) {

                undoStack[++stackPtr].restore();

                if (callback) {
                    callback();
                }
            }

            mode = "none";
            panels.input.focus();
            refreshState();
        };

        // Push the input area state to the stack.
        var saveState = function () {
            var currState = inputStateObj || new TextareaState(panels);

            if (!currState) {
                return false;
            }
            if (mode == "moving") {
                if (!lastState) {
                    lastState = currState;
                }
                return;
            }
            if (lastState) {
                if (undoStack[stackPtr - 1].text != lastState.text) {
                    undoStack[stackPtr++] = lastState;
                }
                lastState = null;
            }
            undoStack[stackPtr++] = currState;
            undoStack[stackPtr + 1] = null;
            if (callback) {
                callback();
            }
        };

        var handleCtrlYZ = function (event) {

            var handled = false;

            if ((event.ctrlKey || event.metaKey) && !event.altKey) {

                // IE and Opera do not support charCode.
                var keyCode = event.charCode || event.keyCode;
                var keyCodeChar = String.fromCharCode(keyCode);

                switch (keyCodeChar.toLowerCase()) {

                    case "y":
                        undoObj.redo();
                        handled = true;
                        break;

                    case "z":
                        if (!event.shiftKey) {
                            undoObj.undo();
                        }
                        else {
                            undoObj.redo();
                        }
                        handled = true;
                        break;
                }
            }

            if (handled) {
                if (event.preventDefault) {
                    event.preventDefault();
                }
                if (window.event) {
                    window.event.returnValue = false;
                }
                return;
            }
        };

        // Set the mode depending on what is going on in the input area.
        var handleModeChange = function (event) {

            if (!event.ctrlKey && !event.metaKey) {

                var keyCode = event.keyCode;

                if ((keyCode >= 33 && keyCode <= 40) || (keyCode >= 63232 && keyCode <= 63235)) {
                    // 33 - 40: page up/dn and arrow keys
                    // 63232 - 63235: page up/dn and arrow keys on safari
                    setMode("moving");
                }
                else if (keyCode == 8 || keyCode == 46 || keyCode == 127) {
                    // 8: backspace
                    // 46: delete
                    // 127: delete
                    setMode("deleting");
                }
                else if (keyCode == 13) {
                    // 13: Enter
                    setMode("newlines");
                }
                else if (keyCode == 27) {
                    // 27: escape
                    setMode("escape");
                }
                else if ((keyCode < 16 || keyCode > 20) && keyCode != 91) {
                    // 16-20 are shift, etc.
                    // 91: left window key
                    // I think this might be a little messed up since there are
                    // a lot of nonprinting keys above 20.
                    setMode("typing");
                }
            }
        };

        var setEventHandlers = function () {
            util.addEvent(panels.input, "keypress", function (event) {
                // keyCode 89: y
                // keyCode 90: z
                if ((event.ctrlKey || event.metaKey) && !event.altKey && (event.keyCode == 89 || event.keyCode == 90)) {
                    event.preventDefault();
                }
            });

            var handlePaste = function () {
                if (uaSniffed.isIE || (inputStateObj && inputStateObj.text != panels.input.value)) {
                    if (timer == undefined) {
                        mode = "paste";
                        saveState();
                        refreshState();
                    }
                }
            };

            util.addEvent(panels.input, "keydown", handleCtrlYZ);
            util.addEvent(panels.input, "keydown", handleModeChange);
            util.addEvent(panels.input, "mousedown", function () {
                setMode("moving");
            });

            panels.input.onpaste = handlePaste;
            panels.input.ondrop = handlePaste;
        };

        var init = function () {
            setEventHandlers();
            refreshState(true);
            saveState();
        };

        init();
    }

    // end of UndoManager

    // The input textarea state/contents.
    // This is used to implement undo/redo by the undo manager.
    function TextareaState(panels, isInitialState) {

        // Aliases
        var stateObj = this;
        var inputArea = panels.input;
        this.init = function () {
            if (!util.isVisible(inputArea)) {
                return;
            }
            if (!isInitialState && doc.activeElement && doc.activeElement !== inputArea) { // this happens when tabbing out of the input box
                return;
            }

            this.setInputAreaSelectionStartEnd();
            this.scrollTop = inputArea.scrollTop;
            if (!this.text && inputArea.selectionStart || inputArea.selectionStart === 0) {
                this.text = inputArea.value;
            }

        }

        // Sets the selected text in the input box after we've performed an
        // operation.
        this.setInputAreaSelection = function () {

            if (!util.isVisible(inputArea)) {
                return;
            }

            if (inputArea.selectionStart !== undefined && !uaSniffed.isOpera) {

                inputArea.focus();
                inputArea.selectionStart = stateObj.start;
                inputArea.selectionEnd = stateObj.end;
                inputArea.scrollTop = stateObj.scrollTop;
            }
            else if (doc.selection) {

                if (doc.activeElement && doc.activeElement !== inputArea) {
                    return;
                }

                inputArea.focus();
                var range = inputArea.createTextRange();
                range.moveStart("character", -inputArea.value.length);
                range.moveEnd("character", -inputArea.value.length);
                range.moveEnd("character", stateObj.end);
                range.moveStart("character", stateObj.start);
                range.select();
            }
        };

        this.setInputAreaSelectionStartEnd = function () {

            if (!panels.ieCachedRange && (inputArea.selectionStart || inputArea.selectionStart === 0)) {

                stateObj.start = inputArea.selectionStart;
                stateObj.end = inputArea.selectionEnd;
            }
            else if (doc.selection) {

                stateObj.text = util.fixEolChars(inputArea.value);

                // IE loses the selection in the textarea when buttons are
                // clicked.  On IE we cache the selection. Here, if something is cached,
                // we take it.
                var range = panels.ieCachedRange || doc.selection.createRange();

                var fixedRange = util.fixEolChars(range.text);
                var marker = "\x07";
                var markedRange = marker + fixedRange + marker;
                range.text = markedRange;
                var inputText = util.fixEolChars(inputArea.value);

                range.moveStart("character", -markedRange.length);
                range.text = fixedRange;

                stateObj.start = inputText.indexOf(marker);
                stateObj.end = inputText.lastIndexOf(marker) - marker.length;

                var len = stateObj.text.length - util.fixEolChars(inputArea.value).length;

                if (len) {
                    range.moveStart("character", -fixedRange.length);
                    while (len--) {
                        fixedRange += "\n";
                        stateObj.end += 1;
                    }
                    range.text = fixedRange;
                }

                if (panels.ieCachedRange)
                    stateObj.scrollTop = panels.ieCachedScrollTop; // this is set alongside with ieCachedRange

                panels.ieCachedRange = null;

                this.setInputAreaSelection();
            }
        };

        // Restore this state into the input area.
        this.restore = function () {

            if (stateObj.text != undefined && stateObj.text != inputArea.value) {
                inputArea.value = stateObj.text;
            }
            this.setInputAreaSelection();
            inputArea.scrollTop = stateObj.scrollTop;
        };

        // Gets a collection of HTML chunks from the inptut textarea.
        this.getChunks = function () {

            var chunk = new Chunks();
            chunk.before = util.fixEolChars(stateObj.text.substring(0, stateObj.start));
            chunk.startTag = "";
            chunk.selection = util.fixEolChars(stateObj.text.substring(stateObj.start, stateObj.end));
            chunk.endTag = "";
            chunk.after = util.fixEolChars(stateObj.text.substring(stateObj.end));
            chunk.scrollTop = stateObj.scrollTop;

            return chunk;
        };

        // Sets the TextareaState properties given a chunk of markdown.
        this.setChunks = function (chunk) {

            chunk.before = chunk.before + chunk.startTag;
            chunk.after = chunk.endTag + chunk.after;

            this.start = chunk.before.length;
            this.end = chunk.before.length + chunk.selection.length;
            this.text = chunk.before + chunk.selection + chunk.after;
            this.scrollTop = chunk.scrollTop;
        };
        this.init();
    };

    function PreviewManager(converter, panels, previewRefreshCallback) {

        var managerObj = this;
        var timeout;
        var elapsedTime;
        var oldInputText;
        var maxDelay = 3000;
        var startType = "delayed"; // The other legal value is "manual"

        // Adds event listeners to elements
        var setupEvents = function (inputElem, listener) {

            util.addEvent(inputElem, "input", listener);
            inputElem.onpaste = listener;
            inputElem.ondrop = listener;

            util.addEvent(inputElem, "keypress", listener);
            util.addEvent(inputElem, "keydown", listener);
        };

        var getDocScrollTop = function () {

            var result = 0;

            if (window.innerHeight) {
                result = window.pageYOffset;
            }
            else
                if (doc.documentElement && doc.documentElement.scrollTop) {
                    result = doc.documentElement.scrollTop;
                }
                else
                    if (doc.body) {
                        result = doc.body.scrollTop;
                    }

            return result;
        };

        var makePreviewHtml = function () {

            // If there is no registered preview panel
            // there is nothing to do.
            if (!panels.preview)
                return;


            var text = panels.input.value;
            if (text && text == oldInputText) {
                return; // Input text hasn't changed.
            }
            else {
                oldInputText = text;
            }

            var prevTime = new Date().getTime();

            text = converter.makeHtml(text);

            // Calculate the processing time of the HTML creation.
            // It's used as the delay time in the event listener.
            var currTime = new Date().getTime();
            elapsedTime = currTime - prevTime;

            pushPreviewHtml(text);
        };

        // setTimeout is already used.  Used as an event listener.
        var applyTimeout = function () {

            if (timeout) {
                clearTimeout(timeout);
                timeout = undefined;
            }

            if (startType !== "manual") {

                var delay = 0;

                if (startType === "delayed") {
                    delay = elapsedTime;
                }

                if (delay > maxDelay) {
                    delay = maxDelay;
                }
                timeout = setTimeout(makePreviewHtml, delay);
            }
        };

        var getScaleFactor = function (panel) {
            if (panel.scrollHeight <= panel.clientHeight) {
                return 1;
            }
            return panel.scrollTop / (panel.scrollHeight - panel.clientHeight);
        };

        var setPanelScrollTops = function () {
            if (panels.preview) {
                panels.preview.scrollTop = (panels.preview.scrollHeight - panels.preview.clientHeight) * getScaleFactor(panels.preview);
            }
        };

        this.refresh = function (requiresRefresh) {

            if (requiresRefresh) {
                oldInputText = "";
                makePreviewHtml();
            }
            else {
                applyTimeout();
            }
        };

        this.processingTime = function () {
            return elapsedTime;
        };

        var isFirstTimeFilled = true;

        // IE doesn't let you use innerHTML if the element is contained somewhere in a table
        // (which is the case for inline editing) -- in that case, detach the element, set the
        // value, and reattach. Yes, that *is* ridiculous.
        var ieSafePreviewSet = function (text) {
            var preview = panels.preview;
            var parent = preview.parentNode;
            var sibling = preview.nextSibling;
            parent.removeChild(preview);
            preview.innerHTML = text;
            if (!sibling)
                parent.appendChild(preview);
            else
                parent.insertBefore(preview, sibling);
        }

        var nonSuckyBrowserPreviewSet = function (text) {
            panels.preview.innerHTML = text;
        }

        var previewSetter;

        var previewSet = function (text) {
            if (previewSetter)
                return previewSetter(text);

            try {
                nonSuckyBrowserPreviewSet(text);
                previewSetter = nonSuckyBrowserPreviewSet;
            } catch (e) {
                previewSetter = ieSafePreviewSet;
                previewSetter(text);
            }
        };

        var pushPreviewHtml = function (text) {

            var emptyTop = position.getTop(panels.input) - getDocScrollTop();

            if (panels.preview) {
                previewSet(text);
                previewRefreshCallback();
            }

            setPanelScrollTops();

            if (isFirstTimeFilled) {
                isFirstTimeFilled = false;
                return;
            }

            var fullTop = position.getTop(panels.input) - getDocScrollTop();

            if (uaSniffed.isIE) {
                setTimeout(function () {
                    window.scrollBy(0, fullTop - emptyTop);
                }, 0);
            }
            else {
                window.scrollBy(0, fullTop - emptyTop);
            }
        };

        var init = function () {

            setupEvents(panels.input, applyTimeout);
            makePreviewHtml();

            if (panels.preview) {
                panels.preview.scrollTop = 0;
            }
        };

        init();
    };

    // Creates the background behind the hyperlink text entry box.
    // And download dialog
    // Most of this has been moved to CSS but the div creation and
    // browser-specific hacks remain here.
    ui.createBackground = function () {

        var background = doc.createElement("div"),
            style = background.style;

        background.className = "wmd-prompt-background";

        style.position = "absolute";
        style.top = "0";

        style.zIndex = "1000";

        if (uaSniffed.isIE) {
            style.filter = "alpha(opacity=50)";
        }
        else {
            style.opacity = "0.5";
        }

        var pageSize = position.getPageSize();
        style.height = pageSize[1] + "px";

        if (uaSniffed.isIE) {
            style.left = doc.documentElement.scrollLeft;
            style.width = doc.documentElement.clientWidth;
        }
        else {
            style.left = "0";
            style.width = "100%";
        }

        doc.body.appendChild(background);
        return background;
    };

    // This simulates a modal dialog box and asks for the URL when you
    // click the hyperlink or image buttons.
    //
    // text: The html for the input box.
    // defaultInputText: The default value that appears in the input box.
    // callback: The function which is executed when the prompt is dismissed, either via OK or Cancel.
    //      It receives a single argument; either the entered text (if OK was chosen) or null (if Cancel
    //      was chosen).
    ui.prompt = function (text, defaultInputText, callback) {

        // These variables need to be declared at this level since they are used
        // in multiple functions.
        var dialog;         // The dialog box.
        var input;         // The text box where you enter the hyperlink.


        if (defaultInputText === undefined) {
            defaultInputText = "";
        }

        // Used as a keydown event handler. Esc dismisses the prompt.
        // Key code 27 is ESC.
        var checkEscape = function (key) {
            var code = (key.charCode || key.keyCode);
            if (code === 27) {
                if (key.stopPropagation) key.stopPropagation();
                close(true);
                return false;
            }
        };

        // Dismisses the hyperlink input box.
        // isCancel is true if we don't care about the input text.
        // isCancel is false if we are going to keep the text.
        var close = function (isCancel) {
            util.removeEvent(doc.body, "keyup", checkEscape);
            var text = input.value;

            if (isCancel) {
                text = null;
            }
            else {
                // Fixes common pasting errors.
                text = text.replace(/^http:\/\/(https?|ftp):\/\//, '$1://');
                if (!/^(?:https?|ftp):\/\//.test(text))
                    text = 'http://' + text;
            }

            dialog.parentNode.removeChild(dialog);

            callback(text);
            return false;
        };



        // Create the text input box form/window.
        var createDialog = function () {

            // The main dialog box.
            dialog = doc.createElement("div");
            dialog.className = "wmd-prompt-dialog";
            dialog.style.padding = "10px;";
            dialog.style.position = "fixed";
            dialog.style.width = "400px";
            dialog.style.zIndex = "1001";

            // The dialog text.
            var question = doc.createElement("div");
            question.innerHTML = text;
            question.style.padding = "5px";
            dialog.appendChild(question);

            // The web form container for the text box and buttons.
            var form = doc.createElement("form"),
                style = form.style;
            form.onsubmit = function () { return close(false); };
            style.padding = "0";
            style.margin = "0";
            style.cssFloat = "left";
            style.width = "100%";
            style.textAlign = "center";
            style.position = "relative";
            dialog.appendChild(form);

            // The input text box
            input = doc.createElement("input");
            input.type = "text";
            input.value = defaultInputText;
            style = input.style;
            style.display = "block";
            style.width = "80%";
            style.marginLeft = style.marginRight = "auto";
            form.appendChild(input);

            // The ok button
            var okButton = doc.createElement("input");
            okButton.type = "button";
            okButton.onclick = function () { return close(false); };
            okButton.value = "OK";
            style = okButton.style;
            style.margin = "10px";
            style.display = "inline";
            style.width = "7em";


            // The cancel button
            var cancelButton = doc.createElement("input");
            cancelButton.type = "button";
            cancelButton.onclick = function () { return close(true); };
            cancelButton.value = "Cancel";
            style = cancelButton.style;
            style.margin = "10px";
            style.display = "inline";
            style.width = "7em";

            form.appendChild(okButton);
            form.appendChild(cancelButton);

            util.addEvent(doc.body, "keyup", checkEscape);
            dialog.style.top = "50%";
            dialog.style.left = "50%";
            dialog.style.display = "block";
            if (uaSniffed.isIE_5or6) {
                dialog.style.position = "absolute";
                dialog.style.top = doc.documentElement.scrollTop + 200 + "px";
                dialog.style.left = "50%";
            }
            doc.body.appendChild(dialog);

            // This has to be done AFTER adding the dialog to the form if you
            // want it to be centered.
            dialog.style.marginTop = -(position.getHeight(dialog) / 2) + "px";
            dialog.style.marginLeft = -(position.getWidth(dialog) / 2) + "px";

        };

        // Why is this in a zero-length timeout?
        // Is it working around a browser bug?
        setTimeout(function () {

            createDialog();

            var defTextLen = defaultInputText.length;
            if (input.selectionStart !== undefined) {
                input.selectionStart = 0;
                input.selectionEnd = defTextLen;
            }
            else if (input.createTextRange) {
                var range = input.createTextRange();
                range.collapse(false);
                range.moveStart("character", -defTextLen);
                range.moveEnd("character", defTextLen);
                range.select();
            }

            input.focus();
        }, 0);
    };

    function UIManager(postfix, panels, undoManager, previewManager, commandManager, helpOptions, getString) {

        var inputBox = panels.input,
            buttons = {}; // buttons.undo, buttons.link, etc. The actual DOM elements.

        makeSpritedButtonRow();

        var keyEvent = "keydown";
        if (uaSniffed.isOpera) {
            keyEvent = "keypress";
        }

        util.addEvent(inputBox, keyEvent, function (key) {

            // Check to see if we have a button key and, if so execute the callback.
            if ((key.ctrlKey || key.metaKey) && !key.altKey && !key.shiftKey) {

                var keyCode = key.charCode || key.keyCode;
                var keyCodeStr = String.fromCharCode(keyCode).toLowerCase();

                switch (keyCodeStr) {
                    // modified for qilabs
                    // case "b":
                    //     doClick(buttons.bold);
                    //     break;
                    // case "i":
                    //     doClick(buttons.italic);
                    //     break;
                    // case "l":
                    //     doClick(buttons.link);
                    //     break;
                    // case "q":
                    //     doClick(buttons.quote);
                    //     break;
                    // case "k":
                    //     doClick(buttons.code);
                    //     break;
                    // case "g":
                    //     doClick(buttons.image);
                    //     break;
                    // case "o":
                    //     doClick(buttons.olist);
                    //     break;
                    // case "u":
                    //     doClick(buttons.ulist);
                    //     break;
                    // case "h":
                    //     doClick(buttons.heading);
                    //     break;
                    // case "r":
                    //     doClick(buttons.hr);
                    //     break;
                    // case "y":
                    //     doClick(buttons.redo);
                    //     break;
                    // case "z":
                    //     if (key.shiftKey) {
                    //         doClick(buttons.redo);
                    //     }
                    //     else {
                    //         doClick(buttons.undo);
                    //     }
                    //     break;
                    default:
                        return;
                }


                if (key.preventDefault) {
                    key.preventDefault();
                }

                if (window.event) {
                    window.event.returnValue = false;
                }
            }
        });

        // Auto-indent on shift-enter
        util.addEvent(inputBox, "keyup", function (key) {
            if (key.shiftKey && !key.ctrlKey && !key.metaKey) {
                var keyCode = key.charCode || key.keyCode;
                // Character 13 is Enter
                if (keyCode === 13) {
                    var fakeButton = {};
                    fakeButton.textOp = bindCommand("doAutoindent");
                    doClick(fakeButton);
                }
            }
        });

        // special handler because IE clears the context of the textbox on ESC
        if (uaSniffed.isIE) {
            util.addEvent(inputBox, "keydown", function (key) {
                var code = key.keyCode;
                if (code === 27) {
                    return false;
                }
            });
        }


        // Perform the button's action.
        function doClick(button) {

            inputBox.focus();

            if (button.textOp) {

                if (undoManager) {
                    undoManager.setCommandMode();
                }

                var state = new TextareaState(panels);

                if (!state) {
                    return;
                }

                var chunks = state.getChunks();

                // Some commands launch a "modal" prompt dialog.  Javascript
                // can't really make a modal dialog box and the WMD code
                // will continue to execute while the dialog is displayed.
                // This prevents the dialog pattern I'm used to and means
                // I can't do something like this:
                //
                // var link = CreateLinkDialog();
                // makeMarkdownLink(link);
                //
                // Instead of this straightforward method of handling a
                // dialog I have to pass any code which would execute
                // after the dialog is dismissed (e.g. link creation)
                // in a function parameter.
                //
                // Yes this is awkward and I think it sucks, but there's
                // no real workaround.  Only the image and link code
                // create dialogs and require the function pointers.
                var fixupInputArea = function () {

                    inputBox.focus();

                    if (chunks) {
                        state.setChunks(chunks);
                    }

                    state.restore();
                    // previewManager.refresh();
                };

                var noCleanup = button.textOp(chunks, fixupInputArea);

                if (!noCleanup) {
                    fixupInputArea();
                }

            }

            if (button.execute) {
                button.execute(undoManager);
            }
        };

        function setupButton(button, isEnabled) {

            var normalYShift = "0px";
            var disabledYShift = "-20px";
            var highlightYShift = "-40px";
            console.log(button)
            var image = button.getElementsByTagName("span")[0];
            if (isEnabled) {
                image.style.backgroundPosition = button.XShift + " " + normalYShift;
                button.onmouseover = function () {
                    image.style.backgroundPosition = this.XShift + " " + highlightYShift;
                };

                button.onmouseout = function () {
                    image.style.backgroundPosition = this.XShift + " " + normalYShift;
                };

                // IE tries to select the background image "button" text (it's
                // implemented in a list item) so we have to cache the selection
                // on mousedown.
                if (uaSniffed.isIE) {
                    button.onmousedown = function () {
                        if (doc.activeElement && doc.activeElement !== panels.input) { // we're not even in the input box, so there's no selection
                            return;
                        }
                        panels.ieCachedRange = document.selection.createRange();
                        panels.ieCachedScrollTop = panels.input.scrollTop;
                    };
                }

                if (!button.isHelp) {
                    button.onclick = function () {
                        if (this.onmouseout) {
                            this.onmouseout();
                        }
                        doClick(this);
                        return false;
                    }
                }
            }
            else {
                image.style.backgroundPosition = button.XShift + " " + disabledYShift;
                button.onmouseover = button.onmouseout = button.onclick = function () { };
            }
        }

        function bindCommand(method) {
            if (typeof method === "string")
                method = commandManager[method];
            return function () { method.apply(commandManager, arguments); }
        }

        function makeSpritedButtonRow() {

            var buttonBar = panels.buttonBar;

            var normalYShift = "0px";
            var disabledYShift = "-20px";
            var highlightYShift = "-40px";

            var buttonRow = document.createElement("ul");
            buttonRow.id = "wmd-button-row" + postfix;
            buttonRow.className = 'wmd-button-row';
            buttonRow = buttonBar.appendChild(buttonRow);
            var xPosition = 0;
            var makeButton = function (id, title, XShift, textOp) {
                var button = document.createElement("li");
                button.className = "wmd-button";
                button.style.left = xPosition + "px";
                xPosition += 25;
                var buttonImage = document.createElement("span");
                button.id = id + postfix;
                button.appendChild(buttonImage);
                button.title = title;
                button.XShift = XShift;
                if (textOp)
                    button.textOp = textOp;
                setupButton(button, true);
                buttonRow.appendChild(button);
                return button;
            };
            var makeSpacer = function (num) {
                var spacer = document.createElement("li");
                spacer.className = "wmd-spacer wmd-spacer" + num;
                spacer.id = "wmd-spacer" + num + postfix;
                buttonRow.appendChild(spacer);
                xPosition += 25;
            }

		        function QI_setupButton(button, isEnabled) {

		            var normalYShift = "0px";
		            var disabledYShift = "-20px";
		            var highlightYShift = "-40px";
		            var image = button.getElementsByTagName("span")[0];
		            if (isEnabled) {
		            		button.disabled = false;
		                // image.style.backgroundPosition = button.XShift + " " + normalYShift;
		                button.onmouseover = function () {
		                		// $(button).addClass('hover')
		                    // image.style.backgroundPosition = this.XShift + " " + highlightYShift;
		                };

		                button.onmouseout = function () {
		                    // image.style.backgroundPosition = this.XShift + " " + normalYShift;
		                };

		                // IE tries to select the background image "button" text (it's
		                // implemented in a list item) so we have to cache the selection
		                // on mousedown.
		                if (uaSniffed.isIE) {
		                    button.onmousedown = function () {
		                        if (doc.activeElement && doc.activeElement !== panels.input) { // we're not even in the input box, so there's no selection
		                            return;
		                        }
		                        panels.ieCachedRange = document.selection.createRange();
		                        panels.ieCachedScrollTop = panels.input.scrollTop;
		                    };
		                }

		                if (!button.isHelp) {
		                    button.onclick = function () {
		                        if (this.onmouseout) {
		                            this.onmouseout();
		                        }
		                        doClick(this);
		                        return false;
		                    }
		                }
		            }
		            else {
		            		button.disabled = true;
		                // image.style.backgroundPosition = button.XShift + " " + disabledYShift;
		                button.onmouseover = button.onmouseout = button.onclick = function () { };
		            }
		        }



            // modified for qilabs
            var QI_makeButton = function (id, title, insideIcon, textOp) {
                var button = document.createElement("li");
                button.className = "wmd-button";
                // button.style.left = xPosition + "px";
                // xPosition += 25;
                var buttonIcon = document.createElement("i");
                buttonIcon.className = insideIcon;
                button.id = id + postfix;
                button.appendChild(buttonIcon);
                button.title = title;
                // button.XShift = XShift;
                if (textOp)
                    button.textOp = textOp;
                QI_setupButton(button, true);
                buttonRow.appendChild(button);
                return button;
            };

            buttons.bold = QI_makeButton("wmd-bold-button", getString("bold"), "icon-format-bold", bindCommand("doBold"));
            buttons.italic = QI_makeButton("wmd-italic-button", getString("italic"), "icon-format-ital", bindCommand("doItalic"));
            // makeSpacer(1);
            buttons.link = QI_makeButton("wmd-link-button", getString("link"), "icon-link", bindCommand(function (chunk, postProcessing) {
                return this.doLinkOrImage(chunk, postProcessing, false);
            }));
            // buttons.quote = QI_makeButton("wmd-quote-button", getString("quote"), "icon-format-quote", bindCommand("doBlockquote"));
            // buttons.image = makeButton("wmd-image-button", getString("image"), "-100px", bindCommand(function (chunk, postProcessing) {
            //     return this.doLinkOrImage(chunk, postProcessing, true);
            // }));
            // makeSpacer(2);
            buttons.olist = QI_makeButton("wmd-olist-button", getString("olist"), "icon-list", bindCommand(function (chunk, postProcessing) {
                this.doList(chunk, postProcessing, true);
            }));
            // buttons.code = QI_makeButton("wmd-code-button", getString("code"), "icon-settings-ethernet", bindCommand("doCode"));
            // buttons.ulist = makeButton("wmd-ulist-button", getString("ulist"), "-140px", bindCommand(function (chunk, postProcessing) {
            //     this.doList(chunk, postProcessing, false);
            // }));
            // buttons.heading = QI_makeButton("wmd-heading-button", getString("heading"), "icon-header", bindCommand("doHeading"));
            // buttons.hr = makeButton("wmd-hr-button", getString("hr"), "-180px", bindCommand("doHorizontalRule"));
            // makeSpacer(3);
            // buttons.undo = QI_makeButton("wmd-undo-button", getString("undo"), "icon-undo", null);
            // buttons.undo.execute = function (manager) { if (manager) manager.undo(); };

            // var redoTitle = /win/.test(nav.platform.toLowerCase()) ?
            //     getString("redo") :
            //     getString("redomac"); // mac and other non-Windows platforms

            // buttons.redo = makeButton("wmd-redo-button", redoTitle, "-220px", null);
            // buttons.redo.execute = function (manager) { if (manager) manager.redo(); };

            var helpButton = document.createElement("li");
            // var helpButtonInner = document.createElement("span");
            // helpButton.appendChild(helpButtonInner);
            helpButton.innerHTML = "Ajuda";
            helpButton.className = "wmd-button wmd-help-button";
            helpButton.id = "wmd-help-button" + postfix;
            helpButton.isHelp = true;
            helpButton.style.right = "0px";
            helpButton.title = "Ajuda";
            // helpButton.onclick = helpOptions.handler;

            buttonRow.appendChild(helpButton);
            buttons.help = helpButton;

            // if (helpOptions) {
            //     var helpButton = document.createElement("li");
            //     var helpButtonImage = document.createElement("span");
            //     helpButton.appendChild(helpButtonImage);
            //     helpButton.className = "wmd-button wmd-help-button";
            //     helpButton.id = "wmd-help-button" + postfix;
            //     helpButton.XShift = "-240px";
            //     helpButton.isHelp = true;
            //     helpButton.style.right = "0px";
            //     helpButton.title = getString("help");
            //     helpButton.onclick = helpOptions.handler;

            //     setupButton(helpButton, true);
            //     buttonRow.appendChild(helpButton);
            //     buttons.help = helpButton;
            // }

            // setUndoRedoButtonStates();
        }

        function setUndoRedoButtonStates() {
            // if (undoManager) {
            //     setupButton(buttons.undo, undoManager.canUndo());
            //     setupButton(buttons.redo, undoManager.canRedo());
            // }
        };

        this.setUndoRedoButtonStates = setUndoRedoButtonStates;

    }

    function CommandManager(pluginHooks, getString) {
        this.hooks = pluginHooks;
        this.getString = getString;
    }

    var commandProto = CommandManager.prototype;

    // The markdown symbols - 4 spaces = code, > = blockquote, etc.
    commandProto.prefixes = "(?:\\s{4,}|\\s*>|\\s*-\\s+|\\s*\\d+\\.|=|\\+|-|_|\\*|#|\\s*\\[[^\n]]+\\]:)";

    // Remove markdown symbols from the chunk selection.
    commandProto.unwrap = function (chunk) {
        var txt = new re("([^\\n])\\n(?!(\\n|" + this.prefixes + "))", "g");
        chunk.selection = chunk.selection.replace(txt, "$1 $2");
    };

    commandProto.wrap = function (chunk, len) {
        this.unwrap(chunk);
        var regex = new re("(.{1," + len + "})( +|$\\n?)", "gm"),
            that = this;

        chunk.selection = chunk.selection.replace(regex, function (line, marked) {
            if (new re("^" + that.prefixes, "").test(line)) {
                return line;
            }
            return marked + "\n";
        });

        chunk.selection = chunk.selection.replace(/\s+$/, "");
    };

    commandProto.doBold = function (chunk, postProcessing) {
        return this.doBorI(chunk, postProcessing, 2, this.getString("boldexample"));
    };

    commandProto.doItalic = function (chunk, postProcessing) {
        return this.doBorI(chunk, postProcessing, 1, this.getString("italicexample"));
    };

    // chunk: The selected region that will be enclosed with */**
    // nStars: 1 for italics, 2 for bold
    // insertText: If you just click the button without highlighting text, this gets inserted
    commandProto.doBorI = function (chunk, postProcessing, nStars, insertText) {

        // Get rid of whitespace and fixup newlines.
        chunk.trimWhitespace();
        chunk.selection = chunk.selection.replace(/\n{2,}/g, "\n");

        // Look for stars before and after.  Is the chunk already marked up?
        // note that these regex matches cannot fail
        var starsBefore = /(\**$)/.exec(chunk.before)[0];
        var starsAfter = /(^\**)/.exec(chunk.after)[0];

        var prevStars = Math.min(starsBefore.length, starsAfter.length);

        // Remove stars if we have to since the button acts as a toggle.
        if ((prevStars >= nStars) && (prevStars != 2 || nStars != 1)) {
            chunk.before = chunk.before.replace(re("[*]{" + nStars + "}$", ""), "");
            chunk.after = chunk.after.replace(re("^[*]{" + nStars + "}", ""), "");
        }
        else if (!chunk.selection && starsAfter) {
            // It's not really clear why this code is necessary.  It just moves
            // some arbitrary stuff around.
            chunk.after = chunk.after.replace(/^([*_]*)/, "");
            chunk.before = chunk.before.replace(/(\s?)$/, "");
            var whitespace = re.$1;
            chunk.before = chunk.before + starsAfter + whitespace;
        }
        else {

            // In most cases, if you don't have any selected text and click the button
            // you'll get a selected, marked up region with the default text inserted.
            if (!chunk.selection && !starsAfter) {
                chunk.selection = insertText;
            }

            // Add the true markup.
            var markup = nStars <= 1 ? "*" : "**"; // shouldn't the test be = ?
            chunk.before = chunk.before + markup;
            chunk.after = markup + chunk.after;
        }

        return;
    };

    commandProto.stripLinkDefs = function (text, defsToAdd) {

        text = text.replace(/^[ ]{0,3}\[(\d+)\]:[ \t]*\n?[ \t]*<?(\S+?)>?[ \t]*\n?[ \t]*(?:(\n*)["(](.+?)[")][ \t]*)?(?:\n+|$)/gm,
            function (totalMatch, id, link, newlines, title) {
                defsToAdd[id] = totalMatch.replace(/\s*$/, "");
                if (newlines) {
                    // Strip the title and return that separately.
                    defsToAdd[id] = totalMatch.replace(/["(](.+?)[")]$/, "");
                    return newlines + title;
                }
                return "";
            });

        return text;
    };

    commandProto.addLinkDef = function (chunk, linkDef) {

        var refNumber = 0; // The current reference number
        var defsToAdd = {}; //
        // Start with a clean slate by removing all previous link definitions.
        chunk.before = this.stripLinkDefs(chunk.before, defsToAdd);
        chunk.selection = this.stripLinkDefs(chunk.selection, defsToAdd);
        chunk.after = this.stripLinkDefs(chunk.after, defsToAdd);

        var defs = "";
        var regex = /(\[)((?:\[[^\]]*\]|[^\[\]])*)(\][ ]?(?:\n[ ]*)?\[)(\d+)(\])/g;

        var addDefNumber = function (def) {
            refNumber++;
            def = def.replace(/^[ ]{0,3}\[(\d+)\]:/, "  [" + refNumber + "]:");
            defs += "\n" + def;
        };

        // note that
        // a) the recursive call to getLink cannot go infinite, because by definition
        //    of regex, inner is always a proper substring of wholeMatch, and
        // b) more than one level of nesting is neither supported by the regex
        //    nor making a lot of sense (the only use case for nesting is a linked image)
        var getLink = function (wholeMatch, before, inner, afterInner, id, end) {
            inner = inner.replace(regex, getLink);
            if (defsToAdd[id]) {
                addDefNumber(defsToAdd[id]);
                return before + inner + afterInner + refNumber + end;
            }
            return wholeMatch;
        };

        chunk.before = chunk.before.replace(regex, getLink);

        if (linkDef) {
            addDefNumber(linkDef);
        }
        else {
            chunk.selection = chunk.selection.replace(regex, getLink);
        }

        var refOut = refNumber;

        chunk.after = chunk.after.replace(regex, getLink);

        if (chunk.after) {
            chunk.after = chunk.after.replace(/\n*$/, "");
        }
        if (!chunk.after) {
            chunk.selection = chunk.selection.replace(/\n*$/, "");
        }

        chunk.after += "\n\n" + defs;

        return refOut;
    };

    // takes the line as entered into the add link/as image dialog and makes
    // sure the URL and the optinal title are "nice".
    function properlyEncoded(linkdef) {
        return linkdef.replace(/^\s*(.*?)(?:\s+"(.+)")?\s*$/, function (wholematch, link, title) {

            var inQueryString = false;

            // Having `[^\w\d-./]` in there is just a shortcut that lets us skip
            // the most common characters in URLs. Replacing that it with `.` would not change
            // the result, because encodeURI returns those characters unchanged, but it
            // would mean lots of unnecessary replacement calls. Having `[` and `]` in that
            // section as well means we do *not* enocde square brackets. These characters are
            // a strange beast in URLs, but if anything, this causes URLs to be more readable,
            // and we leave it to the browser to make sure that these links are handled without
            // problems.
            link = link.replace(/%(?:[\da-fA-F]{2})|\?|\+|[^\w\d-./[\]]/g, function (match) {
                // Valid percent encoding. Could just return it as is, but we follow RFC3986
                // Section 2.1 which says "For consistency, URI producers and normalizers
                // should use uppercase hexadecimal digits for all percent-encodings."
                // Note that we also handle (illegal) stand-alone percent characters by
                // replacing them with "%25"
                if (match.length === 3 && match.charAt(0) == "%") {
                    return match.toUpperCase();
                }
                switch (match) {
                    case "?":
                        inQueryString = true;
                        return "?";
                        break;

                    // In the query string, a plus and a space are identical -- normalize.
                    // Not strictly necessary, but identical behavior to the previous version
                    // of this function.
                    case "+":
                        if (inQueryString)
                            return "%20";
                        break;
                }
                return encodeURI(match);
            })

            if (title) {
                title = title.trim ? title.trim() : title.replace(/^\s*/, "").replace(/\s*$/, "");
                title = title.replace(/"/g, "quot;").replace(/\(/g, "&#40;").replace(/\)/g, "&#41;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
            }
            return title ? link + ' "' + title + '"' : link;
        });
    }

    commandProto.doLinkOrImage = function (chunk, postProcessing, isImage) {

        chunk.trimWhitespace();
        chunk.findTags(/\s*!?\[/, /\][ ]?(?:\n[ ]*)?(\[.*?\])?/);
        var background;

        if (chunk.endTag.length > 1 && chunk.startTag.length > 0) {

            chunk.startTag = chunk.startTag.replace(/!?\[/, "");
            chunk.endTag = "";
            this.addLinkDef(chunk, null);

        }
        else {

            // We're moving start and end tag back into the selection, since (as we're in the else block) we're not
            // *removing* a link, but *adding* one, so whatever findTags() found is now back to being part of the
            // link text. linkEnteredCallback takes care of escaping any brackets.
            chunk.selection = chunk.startTag + chunk.selection + chunk.endTag;
            chunk.startTag = chunk.endTag = "";

            if (/\n\n/.test(chunk.selection)) {
                this.addLinkDef(chunk, null);
                return;
            }
            var that = this;
            // The function to be executed when you enter a link and press OK or Cancel.
            // Marks up the link and adds the ref.
            var linkEnteredCallback = function (link) {
            		console.log(link)

                background.parentNode.removeChild(background);

                if (link !== null) {
                    // (                          $1
                    //     [^\\]                  anything that's not a backslash
                    //     (?:\\\\)*              an even number (this includes zero) of backslashes
                    // )
                    // (?=                        followed by
                    //     [[\]]                  an opening or closing bracket
                    // )
                    //
                    // In other words, a non-escaped bracket. These have to be escaped now to make sure they
                    // don't count as the end of the link or similar.
                    // Note that the actual bracket has to be a lookahead, because (in case of to subsequent brackets),
                    // the bracket in one match may be the "not a backslash" character in the next match, so it
                    // should not be consumed by the first match.
                    // The "prepend a space and finally remove it" steps makes sure there is a "not a backslash" at the
                    // start of the string, so this also works if the selection begins with a bracket. We cannot solve
                    // this by anchoring with ^, because in the case that the selection starts with two brackets, this
                    // would mean a zero-width match at the start. Since zero-width matches advance the string position,
                    // the first bracket could then not act as the "not a backslash" for the second.
                    chunk.selection = (" " + chunk.selection).replace(/([^\\](?:\\\\)*)(?=[[\]])/g, "$1\\").substr(1);

                    var linkDef = " [999]: " + properlyEncoded(link);

                    var num = that.addLinkDef(chunk, linkDef);
                    chunk.startTag = isImage ? "![" : "[";
                    chunk.endTag = "][" + num + "]";

                    if (!chunk.selection) {
                        if (isImage) {
                            chunk.selection = that.getString("imagedescription");
                        }
                        else {
                            chunk.selection = that.getString("linkdescription");
                        }
                    }
                }
            		// modified for qilabs
                // postProcessing();
            };

            background = ui.createBackground();

            if (isImage) {
                if (!this.hooks.insertImageDialog(linkEnteredCallback))
                    ui.prompt(this.getString("imagedialog"), imageDefaultText, linkEnteredCallback);
            }
            else {
            		// // modified for qilabs: melhor ter o markup de links em markdown colocado
            		// // na textarea diretamente (eg [DESCRIÇÃO DO LINK](SEU LINK AQUI)) do que
            		// // ter esse dialog aparecendo
            		linkEnteredCallback(prompt("Entre a url para adicionar:", "http://"))
                // ui.prompt(this.getString("linkdialog"), linkDefaultText, linkEnteredCallback);
            }
            return true;
        }
    };

    // When making a list, hitting shift-enter will put your cursor on the next line
    // at the current indent level.
    commandProto.doAutoindent = function (chunk, postProcessing) {

        var commandMgr = this,
            fakeSelection = false;

        chunk.before = chunk.before.replace(/(\n|^)[ ]{0,3}([*+-]|\d+[.])[ \t]*\n$/, "\n\n");
        chunk.before = chunk.before.replace(/(\n|^)[ ]{0,3}>[ \t]*\n$/, "\n\n");
        chunk.before = chunk.before.replace(/(\n|^)[ \t]+\n$/, "\n\n");

        // There's no selection, end the cursor wasn't at the end of the line:
        // The user wants to split the current list item / code line / blockquote line
        // (for the latter it doesn't really matter) in two. Temporarily select the
        // (rest of the) line to achieve this.
        if (!chunk.selection && !/^[ \t]*(?:\n|$)/.test(chunk.after)) {
            chunk.after = chunk.after.replace(/^[^\n]*/, function (wholeMatch) {
                chunk.selection = wholeMatch;
                return "";
            });
            fakeSelection = true;
        }

        if (/(\n|^)[ ]{0,3}([*+-]|\d+[.])[ \t]+.*\n$/.test(chunk.before)) {
            if (commandMgr.doList) {
                commandMgr.doList(chunk);
            }
        }
        if (/(\n|^)[ ]{0,3}>[ \t]+.*\n$/.test(chunk.before)) {
            if (commandMgr.doBlockquote) {
                commandMgr.doBlockquote(chunk);
            }
        }
        if (/(\n|^)(\t|[ ]{4,}).*\n$/.test(chunk.before)) {
            if (commandMgr.doCode) {
                commandMgr.doCode(chunk);
            }
        }

        if (fakeSelection) {
            chunk.after = chunk.selection + chunk.after;
            chunk.selection = "";
        }
    };

    commandProto.doBlockquote = function (chunk, postProcessing) {

        chunk.selection = chunk.selection.replace(/^(\n*)([^\r]+?)(\n*)$/,
            function (totalMatch, newlinesBefore, text, newlinesAfter) {
                chunk.before += newlinesBefore;
                chunk.after = newlinesAfter + chunk.after;
                return text;
            });

        chunk.before = chunk.before.replace(/(>[ \t]*)$/,
            function (totalMatch, blankLine) {
                chunk.selection = blankLine + chunk.selection;
                return "";
            });

        chunk.selection = chunk.selection.replace(/^(\s|>)+$/, "");
        chunk.selection = chunk.selection || this.getString("quoteexample");

        // The original code uses a regular expression to find out how much of the
        // text *directly before* the selection already was a blockquote:

        /*
        if (chunk.before) {
        chunk.before = chunk.before.replace(/\n?$/, "\n");
        }
        chunk.before = chunk.before.replace(/(((\n|^)(\n[ \t]*)*>(.+\n)*.*)+(\n[ \t]*)*$)/,
        function (totalMatch) {
        chunk.startTag = totalMatch;
        return "";
        });
        */

        // This comes down to:
        // Go backwards as many lines a possible, such that each line
        //  a) starts with ">", or
        //  b) is almost empty, except for whitespace, or
        //  c) is preceeded by an unbroken chain of non-empty lines
        //     leading up to a line that starts with ">" and at least one more character
        // and in addition
        //  d) at least one line fulfills a)
        //
        // Since this is essentially a backwards-moving regex, it's susceptible to
        // catstrophic backtracking and can cause the browser to hang;
        // see e.g. http://meta.stackexchange.com/questions/9807.
        //
        // Hence we replaced this by a simple state machine that just goes through the
        // lines and checks for a), b), and c).

        var match = "",
            leftOver = "",
            line;
        if (chunk.before) {
            var lines = chunk.before.replace(/\n$/, "").split("\n");
            var inChain = false;
            for (var i = 0; i < lines.length; i++) {
                var good = false;
                line = lines[i];
                inChain = inChain && line.length > 0; // c) any non-empty line continues the chain
                if (/^>/.test(line)) {                // a)
                    good = true;
                    if (!inChain && line.length > 1)  // c) any line that starts with ">" and has at least one more character starts the chain
                        inChain = true;
                } else if (/^[ \t]*$/.test(line)) {   // b)
                    good = true;
                } else {
                    good = inChain;                   // c) the line is not empty and does not start with ">", so it matches if and only if we're in the chain
                }
                if (good) {
                    match += line + "\n";
                } else {
                    leftOver += match + line;
                    match = "\n";
                }
            }
            if (!/(^|\n)>/.test(match)) {             // d)
                leftOver += match;
                match = "";
            }
        }

        chunk.startTag = match;
        chunk.before = leftOver;

        // end of change

        if (chunk.after) {
            chunk.after = chunk.after.replace(/^\n?/, "\n");
        }

        chunk.after = chunk.after.replace(/^(((\n|^)(\n[ \t]*)*>(.+\n)*.*)+(\n[ \t]*)*)/,
            function (totalMatch) {
                chunk.endTag = totalMatch;
                return "";
            }
        );

        var replaceBlanksInTags = function (useBracket) {

            var replacement = useBracket ? "> " : "";

            if (chunk.startTag) {
                chunk.startTag = chunk.startTag.replace(/\n((>|\s)*)\n$/,
                    function (totalMatch, markdown) {
                        return "\n" + markdown.replace(/^[ ]{0,3}>?[ \t]*$/gm, replacement) + "\n";
                    });
            }
            if (chunk.endTag) {
                chunk.endTag = chunk.endTag.replace(/^\n((>|\s)*)\n/,
                    function (totalMatch, markdown) {
                        return "\n" + markdown.replace(/^[ ]{0,3}>?[ \t]*$/gm, replacement) + "\n";
                    });
            }
        };

        if (/^(?![ ]{0,3}>)/m.test(chunk.selection)) {
            this.wrap(chunk, SETTINGS.lineLength - 2);
            chunk.selection = chunk.selection.replace(/^/gm, "> ");
            replaceBlanksInTags(true);
            chunk.skipLines();
        } else {
            chunk.selection = chunk.selection.replace(/^[ ]{0,3}> ?/gm, "");
            this.unwrap(chunk);
            replaceBlanksInTags(false);

            if (!/^(\n|^)[ ]{0,3}>/.test(chunk.selection) && chunk.startTag) {
                chunk.startTag = chunk.startTag.replace(/\n{0,2}$/, "\n\n");
            }

            if (!/(\n|^)[ ]{0,3}>.*$/.test(chunk.selection) && chunk.endTag) {
                chunk.endTag = chunk.endTag.replace(/^\n{0,2}/, "\n\n");
            }
        }

        chunk.selection = this.hooks.postBlockquoteCreation(chunk.selection);

        if (!/\n/.test(chunk.selection)) {
            chunk.selection = chunk.selection.replace(/^(> *)/,
            function (wholeMatch, blanks) {
                chunk.startTag += blanks;
                return "";
            });
        }
    };

    commandProto.doCode = function (chunk, postProcessing) {

        var hasTextBefore = /\S[ ]*$/.test(chunk.before);
        var hasTextAfter = /^[ ]*\S/.test(chunk.after);

        // Use 'four space' markdown if the selection is on its own
        // line or is multiline.
        if ((!hasTextAfter && !hasTextBefore) || /\n/.test(chunk.selection)) {

            chunk.before = chunk.before.replace(/[ ]{4}$/,
                function (totalMatch) {
                    chunk.selection = totalMatch + chunk.selection;
                    return "";
                });

            var nLinesBack = 1;
            var nLinesForward = 1;

            if (/(\n|^)(\t|[ ]{4,}).*\n$/.test(chunk.before)) {
                nLinesBack = 0;
            }
            if (/^\n(\t|[ ]{4,})/.test(chunk.after)) {
                nLinesForward = 0;
            }

            chunk.skipLines(nLinesBack, nLinesForward);

            if (!chunk.selection) {
                chunk.startTag = "    ";
                chunk.selection = this.getString("codeexample");
            }
            else {
                if (/^[ ]{0,3}\S/m.test(chunk.selection)) {
                    if (/\n/.test(chunk.selection))
                        chunk.selection = chunk.selection.replace(/^/gm, "    ");
                    else // if it's not multiline, do not select the four added spaces; this is more consistent with the doList behavior
                        chunk.before += "    ";
                }
                else {
                    chunk.selection = chunk.selection.replace(/^(?:[ ]{4}|[ ]{0,3}\t)/gm, "");
                }
            }
        }
        else {
            // Use backticks (`) to delimit the code block.

            chunk.trimWhitespace();
            chunk.findTags(/`/, /`/);

            if (!chunk.startTag && !chunk.endTag) {
                chunk.startTag = chunk.endTag = "`";
                if (!chunk.selection) {
                    chunk.selection = this.getString("codeexample");
                }
            }
            else if (chunk.endTag && !chunk.startTag) {
                chunk.before += chunk.endTag;
                chunk.endTag = "";
            }
            else {
                chunk.startTag = chunk.endTag = "";
            }
        }
    };

    commandProto.doList = function (chunk, postProcessing, isNumberedList) {

        // These are identical except at the very beginning and end.
        // Should probably use the regex extension function to make this clearer.
        var previousItemsRegex = /(\n|^)(([ ]{0,3}([*+-]|\d+[.])[ \t]+.*)(\n.+|\n{2,}([*+-].*|\d+[.])[ \t]+.*|\n{2,}[ \t]+\S.*)*)\n*$/;
        var nextItemsRegex = /^\n*(([ ]{0,3}([*+-]|\d+[.])[ \t]+.*)(\n.+|\n{2,}([*+-].*|\d+[.])[ \t]+.*|\n{2,}[ \t]+\S.*)*)\n*/;

        // The default bullet is a dash but others are possible.
        // This has nothing to do with the particular HTML bullet,
        // it's just a markdown bullet.
        var bullet = "-";

        // The number in a numbered list.
        var num = 1;

        // Get the item prefix - e.g. " 1. " for a numbered list, " - " for a bulleted list.
        var getItemPrefix = function () {
            var prefix;
            if (isNumberedList) {
                prefix = " " + num + ". ";
                num++;
            }
            else {
                prefix = " " + bullet + " ";
            }
            return prefix;
        };

        // Fixes the prefixes of the other list items.
        var getPrefixedItem = function (itemText) {

            // The numbering flag is unset when called by autoindent.
            if (isNumberedList === undefined) {
                isNumberedList = /^\s*\d/.test(itemText);
            }

            // Renumber/bullet the list element.
            itemText = itemText.replace(/^[ ]{0,3}([*+-]|\d+[.])\s/gm,
                function (_) {
                    return getItemPrefix();
                });

            return itemText;
        };

        chunk.findTags(/(\n|^)*[ ]{0,3}([*+-]|\d+[.])\s+/, null);

        if (chunk.before && !/\n$/.test(chunk.before) && !/^\n/.test(chunk.startTag)) {
            chunk.before += chunk.startTag;
            chunk.startTag = "";
        }

        if (chunk.startTag) {

            var hasDigits = /\d+[.]/.test(chunk.startTag);
            chunk.startTag = "";
            chunk.selection = chunk.selection.replace(/\n[ ]{4}/g, "\n");
            this.unwrap(chunk);
            chunk.skipLines();

            if (hasDigits) {
                // Have to renumber the bullet points if this is a numbered list.
                chunk.after = chunk.after.replace(nextItemsRegex, getPrefixedItem);
            }
            if (isNumberedList == hasDigits) {
                return;
            }
        }

        var nLinesUp = 1;

        chunk.before = chunk.before.replace(previousItemsRegex,
            function (itemText) {
                if (/^\s*([*+-])/.test(itemText)) {
                    bullet = re.$1;
                }
                nLinesUp = /[^\n]\n\n[^\n]/.test(itemText) ? 1 : 0;
                return getPrefixedItem(itemText);
            });

        if (!chunk.selection) {
            chunk.selection = this.getString("litem");
        }

        var prefix = getItemPrefix();

        var nLinesDown = 1;

        chunk.after = chunk.after.replace(nextItemsRegex,
            function (itemText) {
                nLinesDown = /[^\n]\n\n[^\n]/.test(itemText) ? 1 : 0;
                return getPrefixedItem(itemText);
            });

        chunk.trimWhitespace(true);
        chunk.skipLines(nLinesUp, nLinesDown, true);
        chunk.startTag = prefix;
        var spaces = prefix.replace(/./g, " ");
        this.wrap(chunk, SETTINGS.lineLength - spaces.length);
        chunk.selection = chunk.selection.replace(/\n/g, "\n" + spaces);

    };

    commandProto.doHeading = function (chunk, postProcessing) {

        // Remove leading/trailing whitespace and reduce internal spaces to single spaces.
        chunk.selection = chunk.selection.replace(/\s+/g, " ");
        chunk.selection = chunk.selection.replace(/(^\s+|\s+$)/g, "");

        // If we clicked the button with no selected text, we just
        // make a level 2 hash header around some default text.
        if (!chunk.selection) {
            chunk.startTag = "## ";
            chunk.selection = this.getString("headingexample");
            chunk.endTag = " ##";
            return;
        }

        var headerLevel = 0;     // The existing header level of the selected text.

        // Remove any existing hash heading markdown and save the header level.
        chunk.findTags(/#+[ ]*/, /[ ]*#+/);
        if (/#+/.test(chunk.startTag)) {
            headerLevel = re.lastMatch.length;
        }
        chunk.startTag = chunk.endTag = "";

        // Try to get the current header level by looking for - and = in the line
        // below the selection.
        chunk.findTags(null, /\s?(-+|=+)/);
        if (/=+/.test(chunk.endTag)) {
            headerLevel = 1;
        }
        if (/-+/.test(chunk.endTag)) {
            headerLevel = 2;
        }

        // Skip to the next line so we can create the header markdown.
        chunk.startTag = chunk.endTag = "";
        chunk.skipLines(1, 1);

        // We make a level 2 header if there is no current header.
        // If there is a header level, we substract one from the header level.
        // If it's already a level 1 header, it's removed.
        var headerLevelToCreate = headerLevel == 0 ? 2 : headerLevel - 1;

        if (headerLevelToCreate > 0) {

            // The button only creates level 1 and 2 underline headers.
            // Why not have it iterate over hash header levels?  Wouldn't that be easier and cleaner?
            var headerChar = headerLevelToCreate >= 2 ? "-" : "=";
            var len = chunk.selection.length;
            if (len > SETTINGS.lineLength) {
                len = SETTINGS.lineLength;
            }
            chunk.endTag = "\n";
            while (len--) {
                chunk.endTag += headerChar;
            }
        }
    };

    commandProto.doHorizontalRule = function (chunk, postProcessing) {
        chunk.startTag = "----------\n";
        chunk.selection = "";
        chunk.skipLines(2, 1, true);
    }


})();
},{}],45:[function(require,module,exports){
(function (global){
/**
 * React v0.12.1
 *
 * Copyright 2013-2014, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 *
 */
!function(e){if("object"==typeof exports&&"undefined"!=typeof module)module.exports=e();else if("function"==typeof define&&define.amd)define([],e);else{var t;"undefined"!=typeof window?t=window:"undefined"!=typeof global?t=global:"undefined"!=typeof self&&(t=self),t.React=e()}}(function(){return function e(t,n,r){function o(i,s){if(!n[i]){if(!t[i]){var u="function"==typeof require&&require;if(!s&&u)return u(i,!0);if(a)return a(i,!0);var c=new Error("Cannot find module '"+i+"'");throw c.code="MODULE_NOT_FOUND",c}var l=n[i]={exports:{}};t[i][0].call(l.exports,function(e){var n=t[i][1][e];return o(n?n:e)},l,l.exports,e,t,n,r)}return n[i].exports}for(var a="function"==typeof require&&require,i=0;i<r.length;i++)o(r[i]);return o}({1:[function(e,t){"use strict";var n=e("./DOMPropertyOperations"),r=e("./EventPluginUtils"),o=e("./ReactChildren"),a=e("./ReactComponent"),i=e("./ReactCompositeComponent"),s=e("./ReactContext"),u=e("./ReactCurrentOwner"),c=e("./ReactElement"),l=(e("./ReactElementValidator"),e("./ReactDOM")),p=e("./ReactDOMComponent"),d=e("./ReactDefaultInjection"),f=e("./ReactInstanceHandles"),h=e("./ReactLegacyElement"),m=e("./ReactMount"),v=e("./ReactMultiChild"),g=e("./ReactPerf"),y=e("./ReactPropTypes"),E=e("./ReactServerRendering"),C=e("./ReactTextComponent"),R=e("./Object.assign"),M=e("./deprecated"),b=e("./onlyChild");d.inject();var O=c.createElement,D=c.createFactory;O=h.wrapCreateElement(O),D=h.wrapCreateFactory(D);var x=g.measure("React","render",m.render),P={Children:{map:o.map,forEach:o.forEach,count:o.count,only:b},DOM:l,PropTypes:y,initializeTouchEvents:function(e){r.useTouchEvents=e},createClass:i.createClass,createElement:O,createFactory:D,constructAndRenderComponent:m.constructAndRenderComponent,constructAndRenderComponentByID:m.constructAndRenderComponentByID,render:x,renderToString:E.renderToString,renderToStaticMarkup:E.renderToStaticMarkup,unmountComponentAtNode:m.unmountComponentAtNode,isValidClass:h.isValidClass,isValidElement:c.isValidElement,withContext:s.withContext,__spread:R,renderComponent:M("React","renderComponent","render",this,x),renderComponentToString:M("React","renderComponentToString","renderToString",this,E.renderToString),renderComponentToStaticMarkup:M("React","renderComponentToStaticMarkup","renderToStaticMarkup",this,E.renderToStaticMarkup),isValidComponent:M("React","isValidComponent","isValidElement",this,c.isValidElement)};"undefined"!=typeof __REACT_DEVTOOLS_GLOBAL_HOOK__&&"function"==typeof __REACT_DEVTOOLS_GLOBAL_HOOK__.inject&&__REACT_DEVTOOLS_GLOBAL_HOOK__.inject({Component:a,CurrentOwner:u,DOMComponent:p,DOMPropertyOperations:n,InstanceHandles:f,Mount:m,MultiChild:v,TextComponent:C});P.version="0.12.1",t.exports=P},{"./DOMPropertyOperations":12,"./EventPluginUtils":20,"./Object.assign":27,"./ReactChildren":31,"./ReactComponent":32,"./ReactCompositeComponent":34,"./ReactContext":35,"./ReactCurrentOwner":36,"./ReactDOM":37,"./ReactDOMComponent":39,"./ReactDefaultInjection":49,"./ReactElement":50,"./ReactElementValidator":51,"./ReactInstanceHandles":58,"./ReactLegacyElement":59,"./ReactMount":61,"./ReactMultiChild":62,"./ReactPerf":66,"./ReactPropTypes":70,"./ReactServerRendering":74,"./ReactTextComponent":76,"./deprecated":104,"./onlyChild":135}],2:[function(e,t){"use strict";var n=e("./focusNode"),r={componentDidMount:function(){this.props.autoFocus&&n(this.getDOMNode())}};t.exports=r},{"./focusNode":109}],3:[function(e,t){"use strict";function n(){var e=window.opera;return"object"==typeof e&&"function"==typeof e.version&&parseInt(e.version(),10)<=12}function r(e){return(e.ctrlKey||e.altKey||e.metaKey)&&!(e.ctrlKey&&e.altKey)}var o=e("./EventConstants"),a=e("./EventPropagators"),i=e("./ExecutionEnvironment"),s=e("./SyntheticInputEvent"),u=e("./keyOf"),c=i.canUseDOM&&"TextEvent"in window&&!("documentMode"in document||n()),l=32,p=String.fromCharCode(l),d=o.topLevelTypes,f={beforeInput:{phasedRegistrationNames:{bubbled:u({onBeforeInput:null}),captured:u({onBeforeInputCapture:null})},dependencies:[d.topCompositionEnd,d.topKeyPress,d.topTextInput,d.topPaste]}},h=null,m=!1,v={eventTypes:f,extractEvents:function(e,t,n,o){var i;if(c)switch(e){case d.topKeyPress:var u=o.which;if(u!==l)return;m=!0,i=p;break;case d.topTextInput:if(i=o.data,i===p&&m)return;break;default:return}else{switch(e){case d.topPaste:h=null;break;case d.topKeyPress:o.which&&!r(o)&&(h=String.fromCharCode(o.which));break;case d.topCompositionEnd:h=o.data}if(null===h)return;i=h}if(i){var v=s.getPooled(f.beforeInput,n,o);return v.data=i,h=null,a.accumulateTwoPhaseDispatches(v),v}}};t.exports=v},{"./EventConstants":16,"./EventPropagators":21,"./ExecutionEnvironment":22,"./SyntheticInputEvent":87,"./keyOf":131}],4:[function(e,t){"use strict";function n(e,t){return e+t.charAt(0).toUpperCase()+t.substring(1)}var r={columnCount:!0,fillOpacity:!0,flex:!0,flexGrow:!0,flexShrink:!0,fontWeight:!0,lineClamp:!0,lineHeight:!0,opacity:!0,order:!0,orphans:!0,widows:!0,zIndex:!0,zoom:!0},o=["Webkit","ms","Moz","O"];Object.keys(r).forEach(function(e){o.forEach(function(t){r[n(t,e)]=r[e]})});var a={background:{backgroundImage:!0,backgroundPosition:!0,backgroundRepeat:!0,backgroundColor:!0},border:{borderWidth:!0,borderStyle:!0,borderColor:!0},borderBottom:{borderBottomWidth:!0,borderBottomStyle:!0,borderBottomColor:!0},borderLeft:{borderLeftWidth:!0,borderLeftStyle:!0,borderLeftColor:!0},borderRight:{borderRightWidth:!0,borderRightStyle:!0,borderRightColor:!0},borderTop:{borderTopWidth:!0,borderTopStyle:!0,borderTopColor:!0},font:{fontStyle:!0,fontVariant:!0,fontWeight:!0,fontSize:!0,lineHeight:!0,fontFamily:!0}},i={isUnitlessNumber:r,shorthandPropertyExpansions:a};t.exports=i},{}],5:[function(e,t){"use strict";var n=e("./CSSProperty"),r=e("./ExecutionEnvironment"),o=(e("./camelizeStyleName"),e("./dangerousStyleValue")),a=e("./hyphenateStyleName"),i=e("./memoizeStringOnly"),s=(e("./warning"),i(function(e){return a(e)})),u="cssFloat";r.canUseDOM&&void 0===document.documentElement.style.cssFloat&&(u="styleFloat");var c={createMarkupForStyles:function(e){var t="";for(var n in e)if(e.hasOwnProperty(n)){var r=e[n];null!=r&&(t+=s(n)+":",t+=o(n,r)+";")}return t||null},setValueForStyles:function(e,t){var r=e.style;for(var a in t)if(t.hasOwnProperty(a)){var i=o(a,t[a]);if("float"===a&&(a=u),i)r[a]=i;else{var s=n.shorthandPropertyExpansions[a];if(s)for(var c in s)r[c]="";else r[a]=""}}}};t.exports=c},{"./CSSProperty":4,"./ExecutionEnvironment":22,"./camelizeStyleName":98,"./dangerousStyleValue":103,"./hyphenateStyleName":122,"./memoizeStringOnly":133,"./warning":141}],6:[function(e,t){"use strict";function n(){this._callbacks=null,this._contexts=null}var r=e("./PooledClass"),o=e("./Object.assign"),a=e("./invariant");o(n.prototype,{enqueue:function(e,t){this._callbacks=this._callbacks||[],this._contexts=this._contexts||[],this._callbacks.push(e),this._contexts.push(t)},notifyAll:function(){var e=this._callbacks,t=this._contexts;if(e){a(e.length===t.length),this._callbacks=null,this._contexts=null;for(var n=0,r=e.length;r>n;n++)e[n].call(t[n]);e.length=0,t.length=0}},reset:function(){this._callbacks=null,this._contexts=null},destructor:function(){this.reset()}}),r.addPoolingTo(n),t.exports=n},{"./Object.assign":27,"./PooledClass":28,"./invariant":124}],7:[function(e,t){"use strict";function n(e){return"SELECT"===e.nodeName||"INPUT"===e.nodeName&&"file"===e.type}function r(e){var t=M.getPooled(P.change,w,e);E.accumulateTwoPhaseDispatches(t),R.batchedUpdates(o,t)}function o(e){y.enqueueEvents(e),y.processEventQueue()}function a(e,t){_=e,w=t,_.attachEvent("onchange",r)}function i(){_&&(_.detachEvent("onchange",r),_=null,w=null)}function s(e,t,n){return e===x.topChange?n:void 0}function u(e,t,n){e===x.topFocus?(i(),a(t,n)):e===x.topBlur&&i()}function c(e,t){_=e,w=t,T=e.value,N=Object.getOwnPropertyDescriptor(e.constructor.prototype,"value"),Object.defineProperty(_,"value",k),_.attachEvent("onpropertychange",p)}function l(){_&&(delete _.value,_.detachEvent("onpropertychange",p),_=null,w=null,T=null,N=null)}function p(e){if("value"===e.propertyName){var t=e.srcElement.value;t!==T&&(T=t,r(e))}}function d(e,t,n){return e===x.topInput?n:void 0}function f(e,t,n){e===x.topFocus?(l(),c(t,n)):e===x.topBlur&&l()}function h(e){return e!==x.topSelectionChange&&e!==x.topKeyUp&&e!==x.topKeyDown||!_||_.value===T?void 0:(T=_.value,w)}function m(e){return"INPUT"===e.nodeName&&("checkbox"===e.type||"radio"===e.type)}function v(e,t,n){return e===x.topClick?n:void 0}var g=e("./EventConstants"),y=e("./EventPluginHub"),E=e("./EventPropagators"),C=e("./ExecutionEnvironment"),R=e("./ReactUpdates"),M=e("./SyntheticEvent"),b=e("./isEventSupported"),O=e("./isTextInputElement"),D=e("./keyOf"),x=g.topLevelTypes,P={change:{phasedRegistrationNames:{bubbled:D({onChange:null}),captured:D({onChangeCapture:null})},dependencies:[x.topBlur,x.topChange,x.topClick,x.topFocus,x.topInput,x.topKeyDown,x.topKeyUp,x.topSelectionChange]}},_=null,w=null,T=null,N=null,I=!1;C.canUseDOM&&(I=b("change")&&(!("documentMode"in document)||document.documentMode>8));var S=!1;C.canUseDOM&&(S=b("input")&&(!("documentMode"in document)||document.documentMode>9));var k={get:function(){return N.get.call(this)},set:function(e){T=""+e,N.set.call(this,e)}},A={eventTypes:P,extractEvents:function(e,t,r,o){var a,i;if(n(t)?I?a=s:i=u:O(t)?S?a=d:(a=h,i=f):m(t)&&(a=v),a){var c=a(e,t,r);if(c){var l=M.getPooled(P.change,c,o);return E.accumulateTwoPhaseDispatches(l),l}}i&&i(e,t,r)}};t.exports=A},{"./EventConstants":16,"./EventPluginHub":18,"./EventPropagators":21,"./ExecutionEnvironment":22,"./ReactUpdates":77,"./SyntheticEvent":85,"./isEventSupported":125,"./isTextInputElement":127,"./keyOf":131}],8:[function(e,t){"use strict";var n=0,r={createReactRootIndex:function(){return n++}};t.exports=r},{}],9:[function(e,t){"use strict";function n(e){switch(e){case g.topCompositionStart:return E.compositionStart;case g.topCompositionEnd:return E.compositionEnd;case g.topCompositionUpdate:return E.compositionUpdate}}function r(e,t){return e===g.topKeyDown&&t.keyCode===h}function o(e,t){switch(e){case g.topKeyUp:return-1!==f.indexOf(t.keyCode);case g.topKeyDown:return t.keyCode!==h;case g.topKeyPress:case g.topMouseDown:case g.topBlur:return!0;default:return!1}}function a(e){this.root=e,this.startSelection=c.getSelection(e),this.startValue=this.getText()}var i=e("./EventConstants"),s=e("./EventPropagators"),u=e("./ExecutionEnvironment"),c=e("./ReactInputSelection"),l=e("./SyntheticCompositionEvent"),p=e("./getTextContentAccessor"),d=e("./keyOf"),f=[9,13,27,32],h=229,m=u.canUseDOM&&"CompositionEvent"in window,v=!m||"documentMode"in document&&document.documentMode>8&&document.documentMode<=11,g=i.topLevelTypes,y=null,E={compositionEnd:{phasedRegistrationNames:{bubbled:d({onCompositionEnd:null}),captured:d({onCompositionEndCapture:null})},dependencies:[g.topBlur,g.topCompositionEnd,g.topKeyDown,g.topKeyPress,g.topKeyUp,g.topMouseDown]},compositionStart:{phasedRegistrationNames:{bubbled:d({onCompositionStart:null}),captured:d({onCompositionStartCapture:null})},dependencies:[g.topBlur,g.topCompositionStart,g.topKeyDown,g.topKeyPress,g.topKeyUp,g.topMouseDown]},compositionUpdate:{phasedRegistrationNames:{bubbled:d({onCompositionUpdate:null}),captured:d({onCompositionUpdateCapture:null})},dependencies:[g.topBlur,g.topCompositionUpdate,g.topKeyDown,g.topKeyPress,g.topKeyUp,g.topMouseDown]}};a.prototype.getText=function(){return this.root.value||this.root[p()]},a.prototype.getData=function(){var e=this.getText(),t=this.startSelection.start,n=this.startValue.length-this.startSelection.end;return e.substr(t,e.length-n-t)};var C={eventTypes:E,extractEvents:function(e,t,i,u){var c,p;if(m?c=n(e):y?o(e,u)&&(c=E.compositionEnd):r(e,u)&&(c=E.compositionStart),v&&(y||c!==E.compositionStart?c===E.compositionEnd&&y&&(p=y.getData(),y=null):y=new a(t)),c){var d=l.getPooled(c,i,u);return p&&(d.data=p),s.accumulateTwoPhaseDispatches(d),d}}};t.exports=C},{"./EventConstants":16,"./EventPropagators":21,"./ExecutionEnvironment":22,"./ReactInputSelection":57,"./SyntheticCompositionEvent":83,"./getTextContentAccessor":119,"./keyOf":131}],10:[function(e,t){"use strict";function n(e,t,n){e.insertBefore(t,e.childNodes[n]||null)}var r,o=e("./Danger"),a=e("./ReactMultiChildUpdateTypes"),i=e("./getTextContentAccessor"),s=e("./invariant"),u=i();r="textContent"===u?function(e,t){e.textContent=t}:function(e,t){for(;e.firstChild;)e.removeChild(e.firstChild);if(t){var n=e.ownerDocument||document;e.appendChild(n.createTextNode(t))}};var c={dangerouslyReplaceNodeWithMarkup:o.dangerouslyReplaceNodeWithMarkup,updateTextContent:r,processUpdates:function(e,t){for(var i,u=null,c=null,l=0;i=e[l];l++)if(i.type===a.MOVE_EXISTING||i.type===a.REMOVE_NODE){var p=i.fromIndex,d=i.parentNode.childNodes[p],f=i.parentID;s(d),u=u||{},u[f]=u[f]||[],u[f][p]=d,c=c||[],c.push(d)}var h=o.dangerouslyRenderMarkup(t);if(c)for(var m=0;m<c.length;m++)c[m].parentNode.removeChild(c[m]);for(var v=0;i=e[v];v++)switch(i.type){case a.INSERT_MARKUP:n(i.parentNode,h[i.markupIndex],i.toIndex);break;case a.MOVE_EXISTING:n(i.parentNode,u[i.parentID][i.fromIndex],i.toIndex);break;case a.TEXT_CONTENT:r(i.parentNode,i.textContent);break;case a.REMOVE_NODE:}}};t.exports=c},{"./Danger":13,"./ReactMultiChildUpdateTypes":63,"./getTextContentAccessor":119,"./invariant":124}],11:[function(e,t){"use strict";function n(e,t){return(e&t)===t}var r=e("./invariant"),o={MUST_USE_ATTRIBUTE:1,MUST_USE_PROPERTY:2,HAS_SIDE_EFFECTS:4,HAS_BOOLEAN_VALUE:8,HAS_NUMERIC_VALUE:16,HAS_POSITIVE_NUMERIC_VALUE:48,HAS_OVERLOADED_BOOLEAN_VALUE:64,injectDOMPropertyConfig:function(e){var t=e.Properties||{},a=e.DOMAttributeNames||{},s=e.DOMPropertyNames||{},u=e.DOMMutationMethods||{};e.isCustomAttribute&&i._isCustomAttributeFunctions.push(e.isCustomAttribute);for(var c in t){r(!i.isStandardName.hasOwnProperty(c)),i.isStandardName[c]=!0;var l=c.toLowerCase();if(i.getPossibleStandardName[l]=c,a.hasOwnProperty(c)){var p=a[c];i.getPossibleStandardName[p]=c,i.getAttributeName[c]=p}else i.getAttributeName[c]=l;i.getPropertyName[c]=s.hasOwnProperty(c)?s[c]:c,i.getMutationMethod[c]=u.hasOwnProperty(c)?u[c]:null;var d=t[c];i.mustUseAttribute[c]=n(d,o.MUST_USE_ATTRIBUTE),i.mustUseProperty[c]=n(d,o.MUST_USE_PROPERTY),i.hasSideEffects[c]=n(d,o.HAS_SIDE_EFFECTS),i.hasBooleanValue[c]=n(d,o.HAS_BOOLEAN_VALUE),i.hasNumericValue[c]=n(d,o.HAS_NUMERIC_VALUE),i.hasPositiveNumericValue[c]=n(d,o.HAS_POSITIVE_NUMERIC_VALUE),i.hasOverloadedBooleanValue[c]=n(d,o.HAS_OVERLOADED_BOOLEAN_VALUE),r(!i.mustUseAttribute[c]||!i.mustUseProperty[c]),r(i.mustUseProperty[c]||!i.hasSideEffects[c]),r(!!i.hasBooleanValue[c]+!!i.hasNumericValue[c]+!!i.hasOverloadedBooleanValue[c]<=1)}}},a={},i={ID_ATTRIBUTE_NAME:"data-reactid",isStandardName:{},getPossibleStandardName:{},getAttributeName:{},getPropertyName:{},getMutationMethod:{},mustUseAttribute:{},mustUseProperty:{},hasSideEffects:{},hasBooleanValue:{},hasNumericValue:{},hasPositiveNumericValue:{},hasOverloadedBooleanValue:{},_isCustomAttributeFunctions:[],isCustomAttribute:function(e){for(var t=0;t<i._isCustomAttributeFunctions.length;t++){var n=i._isCustomAttributeFunctions[t];if(n(e))return!0}return!1},getDefaultValueForProperty:function(e,t){var n,r=a[e];return r||(a[e]=r={}),t in r||(n=document.createElement(e),r[t]=n[t]),r[t]},injection:o};t.exports=i},{"./invariant":124}],12:[function(e,t){"use strict";function n(e,t){return null==t||r.hasBooleanValue[e]&&!t||r.hasNumericValue[e]&&isNaN(t)||r.hasPositiveNumericValue[e]&&1>t||r.hasOverloadedBooleanValue[e]&&t===!1}var r=e("./DOMProperty"),o=e("./escapeTextForBrowser"),a=e("./memoizeStringOnly"),i=(e("./warning"),a(function(e){return o(e)+'="'})),s={createMarkupForID:function(e){return i(r.ID_ATTRIBUTE_NAME)+o(e)+'"'},createMarkupForProperty:function(e,t){if(r.isStandardName.hasOwnProperty(e)&&r.isStandardName[e]){if(n(e,t))return"";var a=r.getAttributeName[e];return r.hasBooleanValue[e]||r.hasOverloadedBooleanValue[e]&&t===!0?o(a):i(a)+o(t)+'"'}return r.isCustomAttribute(e)?null==t?"":i(e)+o(t)+'"':null},setValueForProperty:function(e,t,o){if(r.isStandardName.hasOwnProperty(t)&&r.isStandardName[t]){var a=r.getMutationMethod[t];if(a)a(e,o);else if(n(t,o))this.deleteValueForProperty(e,t);else if(r.mustUseAttribute[t])e.setAttribute(r.getAttributeName[t],""+o);else{var i=r.getPropertyName[t];r.hasSideEffects[t]&&""+e[i]==""+o||(e[i]=o)}}else r.isCustomAttribute(t)&&(null==o?e.removeAttribute(t):e.setAttribute(t,""+o))},deleteValueForProperty:function(e,t){if(r.isStandardName.hasOwnProperty(t)&&r.isStandardName[t]){var n=r.getMutationMethod[t];if(n)n(e,void 0);else if(r.mustUseAttribute[t])e.removeAttribute(r.getAttributeName[t]);else{var o=r.getPropertyName[t],a=r.getDefaultValueForProperty(e.nodeName,o);r.hasSideEffects[t]&&""+e[o]===a||(e[o]=a)}}else r.isCustomAttribute(t)&&e.removeAttribute(t)}};t.exports=s},{"./DOMProperty":11,"./escapeTextForBrowser":107,"./memoizeStringOnly":133,"./warning":141}],13:[function(e,t){"use strict";function n(e){return e.substring(1,e.indexOf(" "))}var r=e("./ExecutionEnvironment"),o=e("./createNodesFromMarkup"),a=e("./emptyFunction"),i=e("./getMarkupWrap"),s=e("./invariant"),u=/^(<[^ \/>]+)/,c="data-danger-index",l={dangerouslyRenderMarkup:function(e){s(r.canUseDOM);for(var t,l={},p=0;p<e.length;p++)s(e[p]),t=n(e[p]),t=i(t)?t:"*",l[t]=l[t]||[],l[t][p]=e[p];var d=[],f=0;for(t in l)if(l.hasOwnProperty(t)){var h=l[t];for(var m in h)if(h.hasOwnProperty(m)){var v=h[m];h[m]=v.replace(u,"$1 "+c+'="'+m+'" ')}var g=o(h.join(""),a);for(p=0;p<g.length;++p){var y=g[p];y.hasAttribute&&y.hasAttribute(c)&&(m=+y.getAttribute(c),y.removeAttribute(c),s(!d.hasOwnProperty(m)),d[m]=y,f+=1)}}return s(f===d.length),s(d.length===e.length),d},dangerouslyReplaceNodeWithMarkup:function(e,t){s(r.canUseDOM),s(t),s("html"!==e.tagName.toLowerCase());var n=o(t,a)[0];e.parentNode.replaceChild(n,e)}};t.exports=l},{"./ExecutionEnvironment":22,"./createNodesFromMarkup":102,"./emptyFunction":105,"./getMarkupWrap":116,"./invariant":124}],14:[function(e,t){"use strict";var n=e("./keyOf"),r=[n({ResponderEventPlugin:null}),n({SimpleEventPlugin:null}),n({TapEventPlugin:null}),n({EnterLeaveEventPlugin:null}),n({ChangeEventPlugin:null}),n({SelectEventPlugin:null}),n({CompositionEventPlugin:null}),n({BeforeInputEventPlugin:null}),n({AnalyticsEventPlugin:null}),n({MobileSafariClickEventPlugin:null})];t.exports=r},{"./keyOf":131}],15:[function(e,t){"use strict";var n=e("./EventConstants"),r=e("./EventPropagators"),o=e("./SyntheticMouseEvent"),a=e("./ReactMount"),i=e("./keyOf"),s=n.topLevelTypes,u=a.getFirstReactDOM,c={mouseEnter:{registrationName:i({onMouseEnter:null}),dependencies:[s.topMouseOut,s.topMouseOver]},mouseLeave:{registrationName:i({onMouseLeave:null}),dependencies:[s.topMouseOut,s.topMouseOver]}},l=[null,null],p={eventTypes:c,extractEvents:function(e,t,n,i){if(e===s.topMouseOver&&(i.relatedTarget||i.fromElement))return null;if(e!==s.topMouseOut&&e!==s.topMouseOver)return null;var p;if(t.window===t)p=t;else{var d=t.ownerDocument;p=d?d.defaultView||d.parentWindow:window}var f,h;if(e===s.topMouseOut?(f=t,h=u(i.relatedTarget||i.toElement)||p):(f=p,h=t),f===h)return null;var m=f?a.getID(f):"",v=h?a.getID(h):"",g=o.getPooled(c.mouseLeave,m,i);g.type="mouseleave",g.target=f,g.relatedTarget=h;var y=o.getPooled(c.mouseEnter,v,i);return y.type="mouseenter",y.target=h,y.relatedTarget=f,r.accumulateEnterLeaveDispatches(g,y,m,v),l[0]=g,l[1]=y,l}};t.exports=p},{"./EventConstants":16,"./EventPropagators":21,"./ReactMount":61,"./SyntheticMouseEvent":89,"./keyOf":131}],16:[function(e,t){"use strict";var n=e("./keyMirror"),r=n({bubbled:null,captured:null}),o=n({topBlur:null,topChange:null,topClick:null,topCompositionEnd:null,topCompositionStart:null,topCompositionUpdate:null,topContextMenu:null,topCopy:null,topCut:null,topDoubleClick:null,topDrag:null,topDragEnd:null,topDragEnter:null,topDragExit:null,topDragLeave:null,topDragOver:null,topDragStart:null,topDrop:null,topError:null,topFocus:null,topInput:null,topKeyDown:null,topKeyPress:null,topKeyUp:null,topLoad:null,topMouseDown:null,topMouseMove:null,topMouseOut:null,topMouseOver:null,topMouseUp:null,topPaste:null,topReset:null,topScroll:null,topSelectionChange:null,topSubmit:null,topTextInput:null,topTouchCancel:null,topTouchEnd:null,topTouchMove:null,topTouchStart:null,topWheel:null}),a={topLevelTypes:o,PropagationPhases:r};t.exports=a},{"./keyMirror":130}],17:[function(e,t){var n=e("./emptyFunction"),r={listen:function(e,t,n){return e.addEventListener?(e.addEventListener(t,n,!1),{remove:function(){e.removeEventListener(t,n,!1)}}):e.attachEvent?(e.attachEvent("on"+t,n),{remove:function(){e.detachEvent("on"+t,n)}}):void 0},capture:function(e,t,r){return e.addEventListener?(e.addEventListener(t,r,!0),{remove:function(){e.removeEventListener(t,r,!0)}}):{remove:n}},registerDefault:function(){}};t.exports=r},{"./emptyFunction":105}],18:[function(e,t){"use strict";var n=e("./EventPluginRegistry"),r=e("./EventPluginUtils"),o=e("./accumulateInto"),a=e("./forEachAccumulated"),i=e("./invariant"),s={},u=null,c=function(e){if(e){var t=r.executeDispatch,o=n.getPluginModuleForEvent(e);o&&o.executeDispatch&&(t=o.executeDispatch),r.executeDispatchesInOrder(e,t),e.isPersistent()||e.constructor.release(e)}},l=null,p={injection:{injectMount:r.injection.injectMount,injectInstanceHandle:function(e){l=e},getInstanceHandle:function(){return l},injectEventPluginOrder:n.injectEventPluginOrder,injectEventPluginsByName:n.injectEventPluginsByName},eventNameDispatchConfigs:n.eventNameDispatchConfigs,registrationNameModules:n.registrationNameModules,putListener:function(e,t,n){i(!n||"function"==typeof n);var r=s[t]||(s[t]={});r[e]=n},getListener:function(e,t){var n=s[t];return n&&n[e]},deleteListener:function(e,t){var n=s[t];n&&delete n[e]},deleteAllListeners:function(e){for(var t in s)delete s[t][e]},extractEvents:function(e,t,r,a){for(var i,s=n.plugins,u=0,c=s.length;c>u;u++){var l=s[u];if(l){var p=l.extractEvents(e,t,r,a);p&&(i=o(i,p))}}return i},enqueueEvents:function(e){e&&(u=o(u,e))},processEventQueue:function(){var e=u;u=null,a(e,c),i(!u)},__purge:function(){s={}},__getListenerBank:function(){return s}};t.exports=p},{"./EventPluginRegistry":19,"./EventPluginUtils":20,"./accumulateInto":95,"./forEachAccumulated":110,"./invariant":124}],19:[function(e,t){"use strict";function n(){if(i)for(var e in s){var t=s[e],n=i.indexOf(e);if(a(n>-1),!u.plugins[n]){a(t.extractEvents),u.plugins[n]=t;var o=t.eventTypes;for(var c in o)a(r(o[c],t,c))}}}function r(e,t,n){a(!u.eventNameDispatchConfigs.hasOwnProperty(n)),u.eventNameDispatchConfigs[n]=e;var r=e.phasedRegistrationNames;if(r){for(var i in r)if(r.hasOwnProperty(i)){var s=r[i];o(s,t,n)}return!0}return e.registrationName?(o(e.registrationName,t,n),!0):!1}function o(e,t,n){a(!u.registrationNameModules[e]),u.registrationNameModules[e]=t,u.registrationNameDependencies[e]=t.eventTypes[n].dependencies}var a=e("./invariant"),i=null,s={},u={plugins:[],eventNameDispatchConfigs:{},registrationNameModules:{},registrationNameDependencies:{},injectEventPluginOrder:function(e){a(!i),i=Array.prototype.slice.call(e),n()},injectEventPluginsByName:function(e){var t=!1;for(var r in e)if(e.hasOwnProperty(r)){var o=e[r];s.hasOwnProperty(r)&&s[r]===o||(a(!s[r]),s[r]=o,t=!0)}t&&n()},getPluginModuleForEvent:function(e){var t=e.dispatchConfig;if(t.registrationName)return u.registrationNameModules[t.registrationName]||null;for(var n in t.phasedRegistrationNames)if(t.phasedRegistrationNames.hasOwnProperty(n)){var r=u.registrationNameModules[t.phasedRegistrationNames[n]];if(r)return r}return null},_resetEventPlugins:function(){i=null;for(var e in s)s.hasOwnProperty(e)&&delete s[e];u.plugins.length=0;var t=u.eventNameDispatchConfigs;for(var n in t)t.hasOwnProperty(n)&&delete t[n];var r=u.registrationNameModules;for(var o in r)r.hasOwnProperty(o)&&delete r[o]}};t.exports=u},{"./invariant":124}],20:[function(e,t){"use strict";function n(e){return e===m.topMouseUp||e===m.topTouchEnd||e===m.topTouchCancel}function r(e){return e===m.topMouseMove||e===m.topTouchMove}function o(e){return e===m.topMouseDown||e===m.topTouchStart}function a(e,t){var n=e._dispatchListeners,r=e._dispatchIDs;if(Array.isArray(n))for(var o=0;o<n.length&&!e.isPropagationStopped();o++)t(e,n[o],r[o]);else n&&t(e,n,r)}function i(e,t,n){e.currentTarget=h.Mount.getNode(n);var r=t(e,n);return e.currentTarget=null,r}function s(e,t){a(e,t),e._dispatchListeners=null,e._dispatchIDs=null}function u(e){var t=e._dispatchListeners,n=e._dispatchIDs;if(Array.isArray(t)){for(var r=0;r<t.length&&!e.isPropagationStopped();r++)if(t[r](e,n[r]))return n[r]}else if(t&&t(e,n))return n;return null}function c(e){var t=u(e);return e._dispatchIDs=null,e._dispatchListeners=null,t}function l(e){var t=e._dispatchListeners,n=e._dispatchIDs;f(!Array.isArray(t));var r=t?t(e,n):null;return e._dispatchListeners=null,e._dispatchIDs=null,r}function p(e){return!!e._dispatchListeners}var d=e("./EventConstants"),f=e("./invariant"),h={Mount:null,injectMount:function(e){h.Mount=e}},m=d.topLevelTypes,v={isEndish:n,isMoveish:r,isStartish:o,executeDirectDispatch:l,executeDispatch:i,executeDispatchesInOrder:s,executeDispatchesInOrderStopAtTrue:c,hasDispatches:p,injection:h,useTouchEvents:!1};t.exports=v},{"./EventConstants":16,"./invariant":124}],21:[function(e,t){"use strict";function n(e,t,n){var r=t.dispatchConfig.phasedRegistrationNames[n];return m(e,r)}function r(e,t,r){var o=t?h.bubbled:h.captured,a=n(e,r,o);a&&(r._dispatchListeners=d(r._dispatchListeners,a),r._dispatchIDs=d(r._dispatchIDs,e))}function o(e){e&&e.dispatchConfig.phasedRegistrationNames&&p.injection.getInstanceHandle().traverseTwoPhase(e.dispatchMarker,r,e)}function a(e,t,n){if(n&&n.dispatchConfig.registrationName){var r=n.dispatchConfig.registrationName,o=m(e,r);o&&(n._dispatchListeners=d(n._dispatchListeners,o),n._dispatchIDs=d(n._dispatchIDs,e))}}function i(e){e&&e.dispatchConfig.registrationName&&a(e.dispatchMarker,null,e)}function s(e){f(e,o)}function u(e,t,n,r){p.injection.getInstanceHandle().traverseEnterLeave(n,r,a,e,t)}function c(e){f(e,i)}var l=e("./EventConstants"),p=e("./EventPluginHub"),d=e("./accumulateInto"),f=e("./forEachAccumulated"),h=l.PropagationPhases,m=p.getListener,v={accumulateTwoPhaseDispatches:s,accumulateDirectDispatches:c,accumulateEnterLeaveDispatches:u};t.exports=v},{"./EventConstants":16,"./EventPluginHub":18,"./accumulateInto":95,"./forEachAccumulated":110}],22:[function(e,t){"use strict";var n=!("undefined"==typeof window||!window.document||!window.document.createElement),r={canUseDOM:n,canUseWorkers:"undefined"!=typeof Worker,canUseEventListeners:n&&!(!window.addEventListener&&!window.attachEvent),canUseViewport:n&&!!window.screen,isInWorker:!n};t.exports=r},{}],23:[function(e,t){"use strict";var n,r=e("./DOMProperty"),o=e("./ExecutionEnvironment"),a=r.injection.MUST_USE_ATTRIBUTE,i=r.injection.MUST_USE_PROPERTY,s=r.injection.HAS_BOOLEAN_VALUE,u=r.injection.HAS_SIDE_EFFECTS,c=r.injection.HAS_NUMERIC_VALUE,l=r.injection.HAS_POSITIVE_NUMERIC_VALUE,p=r.injection.HAS_OVERLOADED_BOOLEAN_VALUE;if(o.canUseDOM){var d=document.implementation;n=d&&d.hasFeature&&d.hasFeature("http://www.w3.org/TR/SVG11/feature#BasicStructure","1.1")}var f={isCustomAttribute:RegExp.prototype.test.bind(/^(data|aria)-[a-z_][a-z\d_.\-]*$/),Properties:{accept:null,acceptCharset:null,accessKey:null,action:null,allowFullScreen:a|s,allowTransparency:a,alt:null,async:s,autoComplete:null,autoPlay:s,cellPadding:null,cellSpacing:null,charSet:a,checked:i|s,classID:a,className:n?a:i,cols:a|l,colSpan:null,content:null,contentEditable:null,contextMenu:a,controls:i|s,coords:null,crossOrigin:null,data:null,dateTime:a,defer:s,dir:null,disabled:a|s,download:p,draggable:null,encType:null,form:a,formNoValidate:s,frameBorder:a,height:a,hidden:a|s,href:null,hrefLang:null,htmlFor:null,httpEquiv:null,icon:null,id:i,label:null,lang:null,list:a,loop:i|s,manifest:a,max:null,maxLength:a,media:a,mediaGroup:null,method:null,min:null,multiple:i|s,muted:i|s,name:null,noValidate:s,open:null,pattern:null,placeholder:null,poster:null,preload:null,radioGroup:null,readOnly:i|s,rel:null,required:s,role:a,rows:a|l,rowSpan:null,sandbox:null,scope:null,scrolling:null,seamless:a|s,selected:i|s,shape:null,size:a|l,sizes:a,span:l,spellCheck:null,src:null,srcDoc:i,srcSet:a,start:c,step:null,style:null,tabIndex:null,target:null,title:null,type:null,useMap:null,value:i|u,width:a,wmode:a,autoCapitalize:null,autoCorrect:null,itemProp:a,itemScope:a|s,itemType:a,property:null},DOMAttributeNames:{acceptCharset:"accept-charset",className:"class",htmlFor:"for",httpEquiv:"http-equiv"},DOMPropertyNames:{autoCapitalize:"autocapitalize",autoComplete:"autocomplete",autoCorrect:"autocorrect",autoFocus:"autofocus",autoPlay:"autoplay",encType:"enctype",hrefLang:"hreflang",radioGroup:"radiogroup",spellCheck:"spellcheck",srcDoc:"srcdoc",srcSet:"srcset"}};t.exports=f},{"./DOMProperty":11,"./ExecutionEnvironment":22}],24:[function(e,t){"use strict";function n(e){u(null==e.props.checkedLink||null==e.props.valueLink)}function r(e){n(e),u(null==e.props.value&&null==e.props.onChange)}function o(e){n(e),u(null==e.props.checked&&null==e.props.onChange)}function a(e){this.props.valueLink.requestChange(e.target.value)}function i(e){this.props.checkedLink.requestChange(e.target.checked)}var s=e("./ReactPropTypes"),u=e("./invariant"),c={button:!0,checkbox:!0,image:!0,hidden:!0,radio:!0,reset:!0,submit:!0},l={Mixin:{propTypes:{value:function(e,t){return!e[t]||c[e.type]||e.onChange||e.readOnly||e.disabled?void 0:new Error("You provided a `value` prop to a form field without an `onChange` handler. This will render a read-only field. If the field should be mutable use `defaultValue`. Otherwise, set either `onChange` or `readOnly`.")},checked:function(e,t){return!e[t]||e.onChange||e.readOnly||e.disabled?void 0:new Error("You provided a `checked` prop to a form field without an `onChange` handler. This will render a read-only field. If the field should be mutable use `defaultChecked`. Otherwise, set either `onChange` or `readOnly`.")},onChange:s.func}},getValue:function(e){return e.props.valueLink?(r(e),e.props.valueLink.value):e.props.value},getChecked:function(e){return e.props.checkedLink?(o(e),e.props.checkedLink.value):e.props.checked},getOnChange:function(e){return e.props.valueLink?(r(e),a):e.props.checkedLink?(o(e),i):e.props.onChange}};t.exports=l},{"./ReactPropTypes":70,"./invariant":124}],25:[function(e,t){"use strict";function n(e){e.remove()}var r=e("./ReactBrowserEventEmitter"),o=e("./accumulateInto"),a=e("./forEachAccumulated"),i=e("./invariant"),s={trapBubbledEvent:function(e,t){i(this.isMounted());var n=r.trapBubbledEvent(e,t,this.getDOMNode());this._localEventListeners=o(this._localEventListeners,n)},componentWillUnmount:function(){this._localEventListeners&&a(this._localEventListeners,n)}};t.exports=s},{"./ReactBrowserEventEmitter":30,"./accumulateInto":95,"./forEachAccumulated":110,"./invariant":124}],26:[function(e,t){"use strict";var n=e("./EventConstants"),r=e("./emptyFunction"),o=n.topLevelTypes,a={eventTypes:null,extractEvents:function(e,t,n,a){if(e===o.topTouchStart){var i=a.target;i&&!i.onclick&&(i.onclick=r)}}};t.exports=a},{"./EventConstants":16,"./emptyFunction":105}],27:[function(e,t){function n(e){if(null==e)throw new TypeError("Object.assign target cannot be null or undefined");for(var t=Object(e),n=Object.prototype.hasOwnProperty,r=1;r<arguments.length;r++){var o=arguments[r];if(null!=o){var a=Object(o);for(var i in a)n.call(a,i)&&(t[i]=a[i])}}return t}t.exports=n},{}],28:[function(e,t){"use strict";var n=e("./invariant"),r=function(e){var t=this;if(t.instancePool.length){var n=t.instancePool.pop();return t.call(n,e),n}return new t(e)},o=function(e,t){var n=this;if(n.instancePool.length){var r=n.instancePool.pop();return n.call(r,e,t),r}return new n(e,t)},a=function(e,t,n){var r=this;if(r.instancePool.length){var o=r.instancePool.pop();return r.call(o,e,t,n),o}return new r(e,t,n)
},i=function(e,t,n,r,o){var a=this;if(a.instancePool.length){var i=a.instancePool.pop();return a.call(i,e,t,n,r,o),i}return new a(e,t,n,r,o)},s=function(e){var t=this;n(e instanceof t),e.destructor&&e.destructor(),t.instancePool.length<t.poolSize&&t.instancePool.push(e)},u=10,c=r,l=function(e,t){var n=e;return n.instancePool=[],n.getPooled=t||c,n.poolSize||(n.poolSize=u),n.release=s,n},p={addPoolingTo:l,oneArgumentPooler:r,twoArgumentPooler:o,threeArgumentPooler:a,fiveArgumentPooler:i};t.exports=p},{"./invariant":124}],29:[function(e,t){"use strict";var n=e("./ReactEmptyComponent"),r=e("./ReactMount"),o=e("./invariant"),a={getDOMNode:function(){return o(this.isMounted()),n.isNullComponentID(this._rootNodeID)?null:r.getNode(this._rootNodeID)}};t.exports=a},{"./ReactEmptyComponent":52,"./ReactMount":61,"./invariant":124}],30:[function(e,t){"use strict";function n(e){return Object.prototype.hasOwnProperty.call(e,h)||(e[h]=d++,l[e[h]]={}),l[e[h]]}var r=e("./EventConstants"),o=e("./EventPluginHub"),a=e("./EventPluginRegistry"),i=e("./ReactEventEmitterMixin"),s=e("./ViewportMetrics"),u=e("./Object.assign"),c=e("./isEventSupported"),l={},p=!1,d=0,f={topBlur:"blur",topChange:"change",topClick:"click",topCompositionEnd:"compositionend",topCompositionStart:"compositionstart",topCompositionUpdate:"compositionupdate",topContextMenu:"contextmenu",topCopy:"copy",topCut:"cut",topDoubleClick:"dblclick",topDrag:"drag",topDragEnd:"dragend",topDragEnter:"dragenter",topDragExit:"dragexit",topDragLeave:"dragleave",topDragOver:"dragover",topDragStart:"dragstart",topDrop:"drop",topFocus:"focus",topInput:"input",topKeyDown:"keydown",topKeyPress:"keypress",topKeyUp:"keyup",topMouseDown:"mousedown",topMouseMove:"mousemove",topMouseOut:"mouseout",topMouseOver:"mouseover",topMouseUp:"mouseup",topPaste:"paste",topScroll:"scroll",topSelectionChange:"selectionchange",topTextInput:"textInput",topTouchCancel:"touchcancel",topTouchEnd:"touchend",topTouchMove:"touchmove",topTouchStart:"touchstart",topWheel:"wheel"},h="_reactListenersID"+String(Math.random()).slice(2),m=u({},i,{ReactEventListener:null,injection:{injectReactEventListener:function(e){e.setHandleTopLevel(m.handleTopLevel),m.ReactEventListener=e}},setEnabled:function(e){m.ReactEventListener&&m.ReactEventListener.setEnabled(e)},isEnabled:function(){return!(!m.ReactEventListener||!m.ReactEventListener.isEnabled())},listenTo:function(e,t){for(var o=t,i=n(o),s=a.registrationNameDependencies[e],u=r.topLevelTypes,l=0,p=s.length;p>l;l++){var d=s[l];i.hasOwnProperty(d)&&i[d]||(d===u.topWheel?c("wheel")?m.ReactEventListener.trapBubbledEvent(u.topWheel,"wheel",o):c("mousewheel")?m.ReactEventListener.trapBubbledEvent(u.topWheel,"mousewheel",o):m.ReactEventListener.trapBubbledEvent(u.topWheel,"DOMMouseScroll",o):d===u.topScroll?c("scroll",!0)?m.ReactEventListener.trapCapturedEvent(u.topScroll,"scroll",o):m.ReactEventListener.trapBubbledEvent(u.topScroll,"scroll",m.ReactEventListener.WINDOW_HANDLE):d===u.topFocus||d===u.topBlur?(c("focus",!0)?(m.ReactEventListener.trapCapturedEvent(u.topFocus,"focus",o),m.ReactEventListener.trapCapturedEvent(u.topBlur,"blur",o)):c("focusin")&&(m.ReactEventListener.trapBubbledEvent(u.topFocus,"focusin",o),m.ReactEventListener.trapBubbledEvent(u.topBlur,"focusout",o)),i[u.topBlur]=!0,i[u.topFocus]=!0):f.hasOwnProperty(d)&&m.ReactEventListener.trapBubbledEvent(d,f[d],o),i[d]=!0)}},trapBubbledEvent:function(e,t,n){return m.ReactEventListener.trapBubbledEvent(e,t,n)},trapCapturedEvent:function(e,t,n){return m.ReactEventListener.trapCapturedEvent(e,t,n)},ensureScrollValueMonitoring:function(){if(!p){var e=s.refreshScrollValues;m.ReactEventListener.monitorScrollValue(e),p=!0}},eventNameDispatchConfigs:o.eventNameDispatchConfigs,registrationNameModules:o.registrationNameModules,putListener:o.putListener,getListener:o.getListener,deleteListener:o.deleteListener,deleteAllListeners:o.deleteAllListeners});t.exports=m},{"./EventConstants":16,"./EventPluginHub":18,"./EventPluginRegistry":19,"./Object.assign":27,"./ReactEventEmitterMixin":54,"./ViewportMetrics":94,"./isEventSupported":125}],31:[function(e,t){"use strict";function n(e,t){this.forEachFunction=e,this.forEachContext=t}function r(e,t,n,r){var o=e;o.forEachFunction.call(o.forEachContext,t,r)}function o(e,t,o){if(null==e)return e;var a=n.getPooled(t,o);p(e,r,a),n.release(a)}function a(e,t,n){this.mapResult=e,this.mapFunction=t,this.mapContext=n}function i(e,t,n,r){var o=e,a=o.mapResult,i=!a.hasOwnProperty(n);if(i){var s=o.mapFunction.call(o.mapContext,t,r);a[n]=s}}function s(e,t,n){if(null==e)return e;var r={},o=a.getPooled(r,t,n);return p(e,i,o),a.release(o),r}function u(){return null}function c(e){return p(e,u,null)}var l=e("./PooledClass"),p=e("./traverseAllChildren"),d=(e("./warning"),l.twoArgumentPooler),f=l.threeArgumentPooler;l.addPoolingTo(n,d),l.addPoolingTo(a,f);var h={forEach:o,map:s,count:c};t.exports=h},{"./PooledClass":28,"./traverseAllChildren":140,"./warning":141}],32:[function(e,t){"use strict";var n=e("./ReactElement"),r=e("./ReactOwner"),o=e("./ReactUpdates"),a=e("./Object.assign"),i=e("./invariant"),s=e("./keyMirror"),u=s({MOUNTED:null,UNMOUNTED:null}),c=!1,l=null,p=null,d={injection:{injectEnvironment:function(e){i(!c),p=e.mountImageIntoNode,l=e.unmountIDFromEnvironment,d.BackendIDOperations=e.BackendIDOperations,c=!0}},LifeCycle:u,BackendIDOperations:null,Mixin:{isMounted:function(){return this._lifeCycleState===u.MOUNTED},setProps:function(e,t){var n=this._pendingElement||this._currentElement;this.replaceProps(a({},n.props,e),t)},replaceProps:function(e,t){i(this.isMounted()),i(0===this._mountDepth),this._pendingElement=n.cloneAndReplaceProps(this._pendingElement||this._currentElement,e),o.enqueueUpdate(this,t)},_setPropsInternal:function(e,t){var r=this._pendingElement||this._currentElement;this._pendingElement=n.cloneAndReplaceProps(r,a({},r.props,e)),o.enqueueUpdate(this,t)},construct:function(e){this.props=e.props,this._owner=e._owner,this._lifeCycleState=u.UNMOUNTED,this._pendingCallbacks=null,this._currentElement=e,this._pendingElement=null},mountComponent:function(e,t,n){i(!this.isMounted());var o=this._currentElement.ref;if(null!=o){var a=this._currentElement._owner;r.addComponentAsRefTo(this,o,a)}this._rootNodeID=e,this._lifeCycleState=u.MOUNTED,this._mountDepth=n},unmountComponent:function(){i(this.isMounted());var e=this._currentElement.ref;null!=e&&r.removeComponentAsRefFrom(this,e,this._owner),l(this._rootNodeID),this._rootNodeID=null,this._lifeCycleState=u.UNMOUNTED},receiveComponent:function(e,t){i(this.isMounted()),this._pendingElement=e,this.performUpdateIfNecessary(t)},performUpdateIfNecessary:function(e){if(null!=this._pendingElement){var t=this._currentElement,n=this._pendingElement;this._currentElement=n,this.props=n.props,this._owner=n._owner,this._pendingElement=null,this.updateComponent(e,t)}},updateComponent:function(e,t){var n=this._currentElement;(n._owner!==t._owner||n.ref!==t.ref)&&(null!=t.ref&&r.removeComponentAsRefFrom(this,t.ref,t._owner),null!=n.ref&&r.addComponentAsRefTo(this,n.ref,n._owner))},mountComponentIntoNode:function(e,t,n){var r=o.ReactReconcileTransaction.getPooled();r.perform(this._mountComponentIntoNode,this,e,t,r,n),o.ReactReconcileTransaction.release(r)},_mountComponentIntoNode:function(e,t,n,r){var o=this.mountComponent(e,n,0);p(o,t,r)},isOwnedBy:function(e){return this._owner===e},getSiblingByRef:function(e){var t=this._owner;return t&&t.refs?t.refs[e]:null}}};t.exports=d},{"./Object.assign":27,"./ReactElement":50,"./ReactOwner":65,"./ReactUpdates":77,"./invariant":124,"./keyMirror":130}],33:[function(e,t){"use strict";var n=e("./ReactDOMIDOperations"),r=e("./ReactMarkupChecksum"),o=e("./ReactMount"),a=e("./ReactPerf"),i=e("./ReactReconcileTransaction"),s=e("./getReactRootElementInContainer"),u=e("./invariant"),c=e("./setInnerHTML"),l=1,p=9,d={ReactReconcileTransaction:i,BackendIDOperations:n,unmountIDFromEnvironment:function(e){o.purgeID(e)},mountImageIntoNode:a.measure("ReactComponentBrowserEnvironment","mountImageIntoNode",function(e,t,n){if(u(t&&(t.nodeType===l||t.nodeType===p)),n){if(r.canReuseMarkup(e,s(t)))return;u(t.nodeType!==p)}u(t.nodeType!==p),c(t,e)})};t.exports=d},{"./ReactDOMIDOperations":41,"./ReactMarkupChecksum":60,"./ReactMount":61,"./ReactPerf":66,"./ReactReconcileTransaction":72,"./getReactRootElementInContainer":118,"./invariant":124,"./setInnerHTML":136}],34:[function(e,t){"use strict";function n(e){var t=e._owner||null;return t&&t.constructor&&t.constructor.displayName?" Check the render method of `"+t.constructor.displayName+"`.":""}function r(e,t){for(var n in t)t.hasOwnProperty(n)&&D("function"==typeof t[n])}function o(e,t){var n=S.hasOwnProperty(t)?S[t]:null;L.hasOwnProperty(t)&&D(n===N.OVERRIDE_BASE),e.hasOwnProperty(t)&&D(n===N.DEFINE_MANY||n===N.DEFINE_MANY_MERGED)}function a(e){var t=e._compositeLifeCycleState;D(e.isMounted()||t===A.MOUNTING),D(null==f.current),D(t!==A.UNMOUNTING)}function i(e,t){if(t){D(!g.isValidFactory(t)),D(!h.isValidElement(t));var n=e.prototype;t.hasOwnProperty(T)&&k.mixins(e,t.mixins);for(var r in t)if(t.hasOwnProperty(r)&&r!==T){var a=t[r];if(o(n,r),k.hasOwnProperty(r))k[r](e,a);else{var i=S.hasOwnProperty(r),s=n.hasOwnProperty(r),u=a&&a.__reactDontBind,p="function"==typeof a,d=p&&!i&&!s&&!u;if(d)n.__reactAutoBindMap||(n.__reactAutoBindMap={}),n.__reactAutoBindMap[r]=a,n[r]=a;else if(s){var f=S[r];D(i&&(f===N.DEFINE_MANY_MERGED||f===N.DEFINE_MANY)),f===N.DEFINE_MANY_MERGED?n[r]=c(n[r],a):f===N.DEFINE_MANY&&(n[r]=l(n[r],a))}else n[r]=a}}}}function s(e,t){if(t)for(var n in t){var r=t[n];if(t.hasOwnProperty(n)){var o=n in k;D(!o);var a=n in e;D(!a),e[n]=r}}}function u(e,t){return D(e&&t&&"object"==typeof e&&"object"==typeof t),_(t,function(t,n){D(void 0===e[n]),e[n]=t}),e}function c(e,t){return function(){var n=e.apply(this,arguments),r=t.apply(this,arguments);return null==n?r:null==r?n:u(n,r)}}function l(e,t){return function(){e.apply(this,arguments),t.apply(this,arguments)}}var p=e("./ReactComponent"),d=e("./ReactContext"),f=e("./ReactCurrentOwner"),h=e("./ReactElement"),m=(e("./ReactElementValidator"),e("./ReactEmptyComponent")),v=e("./ReactErrorUtils"),g=e("./ReactLegacyElement"),y=e("./ReactOwner"),E=e("./ReactPerf"),C=e("./ReactPropTransferer"),R=e("./ReactPropTypeLocations"),M=(e("./ReactPropTypeLocationNames"),e("./ReactUpdates")),b=e("./Object.assign"),O=e("./instantiateReactComponent"),D=e("./invariant"),x=e("./keyMirror"),P=e("./keyOf"),_=(e("./monitorCodeUse"),e("./mapObject")),w=e("./shouldUpdateReactComponent"),T=(e("./warning"),P({mixins:null})),N=x({DEFINE_ONCE:null,DEFINE_MANY:null,OVERRIDE_BASE:null,DEFINE_MANY_MERGED:null}),I=[],S={mixins:N.DEFINE_MANY,statics:N.DEFINE_MANY,propTypes:N.DEFINE_MANY,contextTypes:N.DEFINE_MANY,childContextTypes:N.DEFINE_MANY,getDefaultProps:N.DEFINE_MANY_MERGED,getInitialState:N.DEFINE_MANY_MERGED,getChildContext:N.DEFINE_MANY_MERGED,render:N.DEFINE_ONCE,componentWillMount:N.DEFINE_MANY,componentDidMount:N.DEFINE_MANY,componentWillReceiveProps:N.DEFINE_MANY,shouldComponentUpdate:N.DEFINE_ONCE,componentWillUpdate:N.DEFINE_MANY,componentDidUpdate:N.DEFINE_MANY,componentWillUnmount:N.DEFINE_MANY,updateComponent:N.OVERRIDE_BASE},k={displayName:function(e,t){e.displayName=t},mixins:function(e,t){if(t)for(var n=0;n<t.length;n++)i(e,t[n])},childContextTypes:function(e,t){r(e,t,R.childContext),e.childContextTypes=b({},e.childContextTypes,t)},contextTypes:function(e,t){r(e,t,R.context),e.contextTypes=b({},e.contextTypes,t)},getDefaultProps:function(e,t){e.getDefaultProps=e.getDefaultProps?c(e.getDefaultProps,t):t},propTypes:function(e,t){r(e,t,R.prop),e.propTypes=b({},e.propTypes,t)},statics:function(e,t){s(e,t)}},A=x({MOUNTING:null,UNMOUNTING:null,RECEIVING_PROPS:null}),L={construct:function(){p.Mixin.construct.apply(this,arguments),y.Mixin.construct.apply(this,arguments),this.state=null,this._pendingState=null,this.context=null,this._compositeLifeCycleState=null},isMounted:function(){return p.Mixin.isMounted.call(this)&&this._compositeLifeCycleState!==A.MOUNTING},mountComponent:E.measure("ReactCompositeComponent","mountComponent",function(e,t,n){p.Mixin.mountComponent.call(this,e,t,n),this._compositeLifeCycleState=A.MOUNTING,this.__reactAutoBindMap&&this._bindAutoBindMethods(),this.context=this._processContext(this._currentElement._context),this.props=this._processProps(this.props),this.state=this.getInitialState?this.getInitialState():null,D("object"==typeof this.state&&!Array.isArray(this.state)),this._pendingState=null,this._pendingForceUpdate=!1,this.componentWillMount&&(this.componentWillMount(),this._pendingState&&(this.state=this._pendingState,this._pendingState=null)),this._renderedComponent=O(this._renderValidatedComponent(),this._currentElement.type),this._compositeLifeCycleState=null;var r=this._renderedComponent.mountComponent(e,t,n+1);return this.componentDidMount&&t.getReactMountReady().enqueue(this.componentDidMount,this),r}),unmountComponent:function(){this._compositeLifeCycleState=A.UNMOUNTING,this.componentWillUnmount&&this.componentWillUnmount(),this._compositeLifeCycleState=null,this._renderedComponent.unmountComponent(),this._renderedComponent=null,p.Mixin.unmountComponent.call(this)},setState:function(e,t){D("object"==typeof e||null==e),this.replaceState(b({},this._pendingState||this.state,e),t)},replaceState:function(e,t){a(this),this._pendingState=e,this._compositeLifeCycleState!==A.MOUNTING&&M.enqueueUpdate(this,t)},_processContext:function(e){var t=null,n=this.constructor.contextTypes;if(n){t={};for(var r in n)t[r]=e[r]}return t},_processChildContext:function(e){var t=this.getChildContext&&this.getChildContext();if(this.constructor.displayName||"ReactCompositeComponent",t){D("object"==typeof this.constructor.childContextTypes);for(var n in t)D(n in this.constructor.childContextTypes);return b({},e,t)}return e},_processProps:function(e){return e},_checkPropTypes:function(e,t,r){var o=this.constructor.displayName;for(var a in e)if(e.hasOwnProperty(a)){var i=e[a](t,a,o,r);i instanceof Error&&n(this)}},performUpdateIfNecessary:function(e){var t=this._compositeLifeCycleState;if(t!==A.MOUNTING&&t!==A.RECEIVING_PROPS&&(null!=this._pendingElement||null!=this._pendingState||this._pendingForceUpdate)){var n=this.context,r=this.props,o=this._currentElement;null!=this._pendingElement&&(o=this._pendingElement,n=this._processContext(o._context),r=this._processProps(o.props),this._pendingElement=null,this._compositeLifeCycleState=A.RECEIVING_PROPS,this.componentWillReceiveProps&&this.componentWillReceiveProps(r,n)),this._compositeLifeCycleState=null;var a=this._pendingState||this.state;this._pendingState=null;var i=this._pendingForceUpdate||!this.shouldComponentUpdate||this.shouldComponentUpdate(r,a,n);i?(this._pendingForceUpdate=!1,this._performComponentUpdate(o,r,a,n,e)):(this._currentElement=o,this.props=r,this.state=a,this.context=n,this._owner=o._owner)}},_performComponentUpdate:function(e,t,n,r,o){var a=this._currentElement,i=this.props,s=this.state,u=this.context;this.componentWillUpdate&&this.componentWillUpdate(t,n,r),this._currentElement=e,this.props=t,this.state=n,this.context=r,this._owner=e._owner,this.updateComponent(o,a),this.componentDidUpdate&&o.getReactMountReady().enqueue(this.componentDidUpdate.bind(this,i,s,u),this)},receiveComponent:function(e,t){(e!==this._currentElement||null==e._owner)&&p.Mixin.receiveComponent.call(this,e,t)},updateComponent:E.measure("ReactCompositeComponent","updateComponent",function(e,t){p.Mixin.updateComponent.call(this,e,t);var n=this._renderedComponent,r=n._currentElement,o=this._renderValidatedComponent();if(w(r,o))n.receiveComponent(o,e);else{var a=this._rootNodeID,i=n._rootNodeID;n.unmountComponent(),this._renderedComponent=O(o,this._currentElement.type);var s=this._renderedComponent.mountComponent(a,e,this._mountDepth+1);p.BackendIDOperations.dangerouslyReplaceNodeWithMarkupByID(i,s)}}),forceUpdate:function(e){var t=this._compositeLifeCycleState;D(this.isMounted()||t===A.MOUNTING),D(t!==A.UNMOUNTING&&null==f.current),this._pendingForceUpdate=!0,M.enqueueUpdate(this,e)},_renderValidatedComponent:E.measure("ReactCompositeComponent","_renderValidatedComponent",function(){var e,t=d.current;d.current=this._processChildContext(this._currentElement._context),f.current=this;try{e=this.render(),null===e||e===!1?(e=m.getEmptyComponent(),m.registerNullComponentID(this._rootNodeID)):m.deregisterNullComponentID(this._rootNodeID)}finally{d.current=t,f.current=null}return D(h.isValidElement(e)),e}),_bindAutoBindMethods:function(){for(var e in this.__reactAutoBindMap)if(this.__reactAutoBindMap.hasOwnProperty(e)){var t=this.__reactAutoBindMap[e];this[e]=this._bindAutoBindMethod(v.guard(t,this.constructor.displayName+"."+e))}},_bindAutoBindMethod:function(e){var t=this,n=e.bind(t);return n}},U=function(){};b(U.prototype,p.Mixin,y.Mixin,C.Mixin,L);var F={LifeCycle:A,Base:U,createClass:function(e){var t=function(){};t.prototype=new U,t.prototype.constructor=t,I.forEach(i.bind(null,t)),i(t,e),t.getDefaultProps&&(t.defaultProps=t.getDefaultProps()),D(t.prototype.render);for(var n in S)t.prototype[n]||(t.prototype[n]=null);return g.wrapFactory(h.createFactory(t))},injection:{injectMixin:function(e){I.push(e)}}};t.exports=F},{"./Object.assign":27,"./ReactComponent":32,"./ReactContext":35,"./ReactCurrentOwner":36,"./ReactElement":50,"./ReactElementValidator":51,"./ReactEmptyComponent":52,"./ReactErrorUtils":53,"./ReactLegacyElement":59,"./ReactOwner":65,"./ReactPerf":66,"./ReactPropTransferer":67,"./ReactPropTypeLocationNames":68,"./ReactPropTypeLocations":69,"./ReactUpdates":77,"./instantiateReactComponent":123,"./invariant":124,"./keyMirror":130,"./keyOf":131,"./mapObject":132,"./monitorCodeUse":134,"./shouldUpdateReactComponent":138,"./warning":141}],35:[function(e,t){"use strict";var n=e("./Object.assign"),r={current:{},withContext:function(e,t){var o,a=r.current;r.current=n({},a,e);try{o=t()}finally{r.current=a}return o}};t.exports=r},{"./Object.assign":27}],36:[function(e,t){"use strict";var n={current:null};t.exports=n},{}],37:[function(e,t){"use strict";function n(e){return o.markNonLegacyFactory(r.createFactory(e))}var r=e("./ReactElement"),o=(e("./ReactElementValidator"),e("./ReactLegacyElement")),a=e("./mapObject"),i=a({a:"a",abbr:"abbr",address:"address",area:"area",article:"article",aside:"aside",audio:"audio",b:"b",base:"base",bdi:"bdi",bdo:"bdo",big:"big",blockquote:"blockquote",body:"body",br:"br",button:"button",canvas:"canvas",caption:"caption",cite:"cite",code:"code",col:"col",colgroup:"colgroup",data:"data",datalist:"datalist",dd:"dd",del:"del",details:"details",dfn:"dfn",dialog:"dialog",div:"div",dl:"dl",dt:"dt",em:"em",embed:"embed",fieldset:"fieldset",figcaption:"figcaption",figure:"figure",footer:"footer",form:"form",h1:"h1",h2:"h2",h3:"h3",h4:"h4",h5:"h5",h6:"h6",head:"head",header:"header",hr:"hr",html:"html",i:"i",iframe:"iframe",img:"img",input:"input",ins:"ins",kbd:"kbd",keygen:"keygen",label:"label",legend:"legend",li:"li",link:"link",main:"main",map:"map",mark:"mark",menu:"menu",menuitem:"menuitem",meta:"meta",meter:"meter",nav:"nav",noscript:"noscript",object:"object",ol:"ol",optgroup:"optgroup",option:"option",output:"output",p:"p",param:"param",picture:"picture",pre:"pre",progress:"progress",q:"q",rp:"rp",rt:"rt",ruby:"ruby",s:"s",samp:"samp",script:"script",section:"section",select:"select",small:"small",source:"source",span:"span",strong:"strong",style:"style",sub:"sub",summary:"summary",sup:"sup",table:"table",tbody:"tbody",td:"td",textarea:"textarea",tfoot:"tfoot",th:"th",thead:"thead",time:"time",title:"title",tr:"tr",track:"track",u:"u",ul:"ul","var":"var",video:"video",wbr:"wbr",circle:"circle",defs:"defs",ellipse:"ellipse",g:"g",line:"line",linearGradient:"linearGradient",mask:"mask",path:"path",pattern:"pattern",polygon:"polygon",polyline:"polyline",radialGradient:"radialGradient",rect:"rect",stop:"stop",svg:"svg",text:"text",tspan:"tspan"},n);t.exports=i},{"./ReactElement":50,"./ReactElementValidator":51,"./ReactLegacyElement":59,"./mapObject":132}],38:[function(e,t){"use strict";var n=e("./AutoFocusMixin"),r=e("./ReactBrowserComponentMixin"),o=e("./ReactCompositeComponent"),a=e("./ReactElement"),i=e("./ReactDOM"),s=e("./keyMirror"),u=a.createFactory(i.button.type),c=s({onClick:!0,onDoubleClick:!0,onMouseDown:!0,onMouseMove:!0,onMouseUp:!0,onClickCapture:!0,onDoubleClickCapture:!0,onMouseDownCapture:!0,onMouseMoveCapture:!0,onMouseUpCapture:!0}),l=o.createClass({displayName:"ReactDOMButton",mixins:[n,r],render:function(){var e={};for(var t in this.props)!this.props.hasOwnProperty(t)||this.props.disabled&&c[t]||(e[t]=this.props[t]);return u(e,this.props.children)}});t.exports=l},{"./AutoFocusMixin":2,"./ReactBrowserComponentMixin":29,"./ReactCompositeComponent":34,"./ReactDOM":37,"./ReactElement":50,"./keyMirror":130}],39:[function(e,t){"use strict";function n(e){e&&(g(null==e.children||null==e.dangerouslySetInnerHTML),g(null==e.style||"object"==typeof e.style))}function r(e,t,n,r){var o=d.findReactContainerForID(e);if(o){var a=o.nodeType===O?o.ownerDocument:o;C(t,a)}r.getPutListenerQueue().enqueuePutListener(e,t,n)}function o(e){_.call(P,e)||(g(x.test(e)),P[e]=!0)}function a(e){o(e),this._tag=e,this.tagName=e.toUpperCase()}var i=e("./CSSPropertyOperations"),s=e("./DOMProperty"),u=e("./DOMPropertyOperations"),c=e("./ReactBrowserComponentMixin"),l=e("./ReactComponent"),p=e("./ReactBrowserEventEmitter"),d=e("./ReactMount"),f=e("./ReactMultiChild"),h=e("./ReactPerf"),m=e("./Object.assign"),v=e("./escapeTextForBrowser"),g=e("./invariant"),y=(e("./isEventSupported"),e("./keyOf")),E=(e("./monitorCodeUse"),p.deleteListener),C=p.listenTo,R=p.registrationNameModules,M={string:!0,number:!0},b=y({style:null}),O=1,D={area:!0,base:!0,br:!0,col:!0,embed:!0,hr:!0,img:!0,input:!0,keygen:!0,link:!0,meta:!0,param:!0,source:!0,track:!0,wbr:!0},x=/^[a-zA-Z][a-zA-Z:_\.\-\d]*$/,P={},_={}.hasOwnProperty;a.displayName="ReactDOMComponent",a.Mixin={mountComponent:h.measure("ReactDOMComponent","mountComponent",function(e,t,r){l.Mixin.mountComponent.call(this,e,t,r),n(this.props);var o=D[this._tag]?"":"</"+this._tag+">";return this._createOpenTagMarkupAndPutListeners(t)+this._createContentMarkup(t)+o}),_createOpenTagMarkupAndPutListeners:function(e){var t=this.props,n="<"+this._tag;for(var o in t)if(t.hasOwnProperty(o)){var a=t[o];if(null!=a)if(R.hasOwnProperty(o))r(this._rootNodeID,o,a,e);else{o===b&&(a&&(a=t.style=m({},t.style)),a=i.createMarkupForStyles(a));var s=u.createMarkupForProperty(o,a);s&&(n+=" "+s)}}if(e.renderToStaticMarkup)return n+">";var c=u.createMarkupForID(this._rootNodeID);return n+" "+c+">"},_createContentMarkup:function(e){var t=this.props.dangerouslySetInnerHTML;if(null!=t){if(null!=t.__html)return t.__html}else{var n=M[typeof this.props.children]?this.props.children:null,r=null!=n?null:this.props.children;if(null!=n)return v(n);if(null!=r){var o=this.mountChildren(r,e);return o.join("")}}return""},receiveComponent:function(e,t){(e!==this._currentElement||null==e._owner)&&l.Mixin.receiveComponent.call(this,e,t)},updateComponent:h.measure("ReactDOMComponent","updateComponent",function(e,t){n(this._currentElement.props),l.Mixin.updateComponent.call(this,e,t),this._updateDOMProperties(t.props,e),this._updateDOMChildren(t.props,e)}),_updateDOMProperties:function(e,t){var n,o,a,i=this.props;for(n in e)if(!i.hasOwnProperty(n)&&e.hasOwnProperty(n))if(n===b){var u=e[n];for(o in u)u.hasOwnProperty(o)&&(a=a||{},a[o]="")}else R.hasOwnProperty(n)?E(this._rootNodeID,n):(s.isStandardName[n]||s.isCustomAttribute(n))&&l.BackendIDOperations.deletePropertyByID(this._rootNodeID,n);for(n in i){var c=i[n],p=e[n];if(i.hasOwnProperty(n)&&c!==p)if(n===b)if(c&&(c=i.style=m({},c)),p){for(o in p)!p.hasOwnProperty(o)||c&&c.hasOwnProperty(o)||(a=a||{},a[o]="");for(o in c)c.hasOwnProperty(o)&&p[o]!==c[o]&&(a=a||{},a[o]=c[o])}else a=c;else R.hasOwnProperty(n)?r(this._rootNodeID,n,c,t):(s.isStandardName[n]||s.isCustomAttribute(n))&&l.BackendIDOperations.updatePropertyByID(this._rootNodeID,n,c)}a&&l.BackendIDOperations.updateStylesByID(this._rootNodeID,a)},_updateDOMChildren:function(e,t){var n=this.props,r=M[typeof e.children]?e.children:null,o=M[typeof n.children]?n.children:null,a=e.dangerouslySetInnerHTML&&e.dangerouslySetInnerHTML.__html,i=n.dangerouslySetInnerHTML&&n.dangerouslySetInnerHTML.__html,s=null!=r?null:e.children,u=null!=o?null:n.children,c=null!=r||null!=a,p=null!=o||null!=i;null!=s&&null==u?this.updateChildren(null,t):c&&!p&&this.updateTextContent(""),null!=o?r!==o&&this.updateTextContent(""+o):null!=i?a!==i&&l.BackendIDOperations.updateInnerHTMLByID(this._rootNodeID,i):null!=u&&this.updateChildren(u,t)},unmountComponent:function(){this.unmountChildren(),p.deleteAllListeners(this._rootNodeID),l.Mixin.unmountComponent.call(this)}},m(a.prototype,l.Mixin,a.Mixin,f.Mixin,c),t.exports=a},{"./CSSPropertyOperations":5,"./DOMProperty":11,"./DOMPropertyOperations":12,"./Object.assign":27,"./ReactBrowserComponentMixin":29,"./ReactBrowserEventEmitter":30,"./ReactComponent":32,"./ReactMount":61,"./ReactMultiChild":62,"./ReactPerf":66,"./escapeTextForBrowser":107,"./invariant":124,"./isEventSupported":125,"./keyOf":131,"./monitorCodeUse":134}],40:[function(e,t){"use strict";var n=e("./EventConstants"),r=e("./LocalEventTrapMixin"),o=e("./ReactBrowserComponentMixin"),a=e("./ReactCompositeComponent"),i=e("./ReactElement"),s=e("./ReactDOM"),u=i.createFactory(s.form.type),c=a.createClass({displayName:"ReactDOMForm",mixins:[o,r],render:function(){return u(this.props)},componentDidMount:function(){this.trapBubbledEvent(n.topLevelTypes.topReset,"reset"),this.trapBubbledEvent(n.topLevelTypes.topSubmit,"submit")}});t.exports=c},{"./EventConstants":16,"./LocalEventTrapMixin":25,"./ReactBrowserComponentMixin":29,"./ReactCompositeComponent":34,"./ReactDOM":37,"./ReactElement":50}],41:[function(e,t){"use strict";var n=e("./CSSPropertyOperations"),r=e("./DOMChildrenOperations"),o=e("./DOMPropertyOperations"),a=e("./ReactMount"),i=e("./ReactPerf"),s=e("./invariant"),u=e("./setInnerHTML"),c={dangerouslySetInnerHTML:"`dangerouslySetInnerHTML` must be set using `updateInnerHTMLByID()`.",style:"`style` must be set using `updateStylesByID()`."},l={updatePropertyByID:i.measure("ReactDOMIDOperations","updatePropertyByID",function(e,t,n){var r=a.getNode(e);s(!c.hasOwnProperty(t)),null!=n?o.setValueForProperty(r,t,n):o.deleteValueForProperty(r,t)}),deletePropertyByID:i.measure("ReactDOMIDOperations","deletePropertyByID",function(e,t,n){var r=a.getNode(e);s(!c.hasOwnProperty(t)),o.deleteValueForProperty(r,t,n)}),updateStylesByID:i.measure("ReactDOMIDOperations","updateStylesByID",function(e,t){var r=a.getNode(e);n.setValueForStyles(r,t)}),updateInnerHTMLByID:i.measure("ReactDOMIDOperations","updateInnerHTMLByID",function(e,t){var n=a.getNode(e);u(n,t)}),updateTextContentByID:i.measure("ReactDOMIDOperations","updateTextContentByID",function(e,t){var n=a.getNode(e);r.updateTextContent(n,t)}),dangerouslyReplaceNodeWithMarkupByID:i.measure("ReactDOMIDOperations","dangerouslyReplaceNodeWithMarkupByID",function(e,t){var n=a.getNode(e);r.dangerouslyReplaceNodeWithMarkup(n,t)}),dangerouslyProcessChildrenUpdates:i.measure("ReactDOMIDOperations","dangerouslyProcessChildrenUpdates",function(e,t){for(var n=0;n<e.length;n++)e[n].parentNode=a.getNode(e[n].parentID);r.processUpdates(e,t)})};t.exports=l},{"./CSSPropertyOperations":5,"./DOMChildrenOperations":10,"./DOMPropertyOperations":12,"./ReactMount":61,"./ReactPerf":66,"./invariant":124,"./setInnerHTML":136}],42:[function(e,t){"use strict";var n=e("./EventConstants"),r=e("./LocalEventTrapMixin"),o=e("./ReactBrowserComponentMixin"),a=e("./ReactCompositeComponent"),i=e("./ReactElement"),s=e("./ReactDOM"),u=i.createFactory(s.img.type),c=a.createClass({displayName:"ReactDOMImg",tagName:"IMG",mixins:[o,r],render:function(){return u(this.props)},componentDidMount:function(){this.trapBubbledEvent(n.topLevelTypes.topLoad,"load"),this.trapBubbledEvent(n.topLevelTypes.topError,"error")}});t.exports=c},{"./EventConstants":16,"./LocalEventTrapMixin":25,"./ReactBrowserComponentMixin":29,"./ReactCompositeComponent":34,"./ReactDOM":37,"./ReactElement":50}],43:[function(e,t){"use strict";function n(){this.isMounted()&&this.forceUpdate()}var r=e("./AutoFocusMixin"),o=e("./DOMPropertyOperations"),a=e("./LinkedValueUtils"),i=e("./ReactBrowserComponentMixin"),s=e("./ReactCompositeComponent"),u=e("./ReactElement"),c=e("./ReactDOM"),l=e("./ReactMount"),p=e("./ReactUpdates"),d=e("./Object.assign"),f=e("./invariant"),h=u.createFactory(c.input.type),m={},v=s.createClass({displayName:"ReactDOMInput",mixins:[r,a.Mixin,i],getInitialState:function(){var e=this.props.defaultValue;return{initialChecked:this.props.defaultChecked||!1,initialValue:null!=e?e:null}},render:function(){var e=d({},this.props);e.defaultChecked=null,e.defaultValue=null;var t=a.getValue(this);e.value=null!=t?t:this.state.initialValue;var n=a.getChecked(this);return e.checked=null!=n?n:this.state.initialChecked,e.onChange=this._handleChange,h(e,this.props.children)},componentDidMount:function(){var e=l.getID(this.getDOMNode());m[e]=this},componentWillUnmount:function(){var e=this.getDOMNode(),t=l.getID(e);delete m[t]},componentDidUpdate:function(){var e=this.getDOMNode();null!=this.props.checked&&o.setValueForProperty(e,"checked",this.props.checked||!1);var t=a.getValue(this);null!=t&&o.setValueForProperty(e,"value",""+t)},_handleChange:function(e){var t,r=a.getOnChange(this);r&&(t=r.call(this,e)),p.asap(n,this);var o=this.props.name;if("radio"===this.props.type&&null!=o){for(var i=this.getDOMNode(),s=i;s.parentNode;)s=s.parentNode;for(var u=s.querySelectorAll("input[name="+JSON.stringify(""+o)+'][type="radio"]'),c=0,d=u.length;d>c;c++){var h=u[c];if(h!==i&&h.form===i.form){var v=l.getID(h);f(v);var g=m[v];f(g),p.asap(n,g)}}}return t}});t.exports=v},{"./AutoFocusMixin":2,"./DOMPropertyOperations":12,"./LinkedValueUtils":24,"./Object.assign":27,"./ReactBrowserComponentMixin":29,"./ReactCompositeComponent":34,"./ReactDOM":37,"./ReactElement":50,"./ReactMount":61,"./ReactUpdates":77,"./invariant":124}],44:[function(e,t){"use strict";var n=e("./ReactBrowserComponentMixin"),r=e("./ReactCompositeComponent"),o=e("./ReactElement"),a=e("./ReactDOM"),i=(e("./warning"),o.createFactory(a.option.type)),s=r.createClass({displayName:"ReactDOMOption",mixins:[n],componentWillMount:function(){},render:function(){return i(this.props,this.props.children)}});t.exports=s},{"./ReactBrowserComponentMixin":29,"./ReactCompositeComponent":34,"./ReactDOM":37,"./ReactElement":50,"./warning":141}],45:[function(e,t){"use strict";function n(){this.isMounted()&&(this.setState({value:this._pendingValue}),this._pendingValue=0)}function r(e,t){if(null!=e[t])if(e.multiple){if(!Array.isArray(e[t]))return new Error("The `"+t+"` prop supplied to <select> must be an array if `multiple` is true.")}else if(Array.isArray(e[t]))return new Error("The `"+t+"` prop supplied to <select> must be a scalar value if `multiple` is false.")}function o(e,t){var n,r,o,a=e.props.multiple,i=null!=t?t:e.state.value,s=e.getDOMNode().options;if(a)for(n={},r=0,o=i.length;o>r;++r)n[""+i[r]]=!0;else n=""+i;for(r=0,o=s.length;o>r;r++){var u=a?n.hasOwnProperty(s[r].value):s[r].value===n;u!==s[r].selected&&(s[r].selected=u)}}var a=e("./AutoFocusMixin"),i=e("./LinkedValueUtils"),s=e("./ReactBrowserComponentMixin"),u=e("./ReactCompositeComponent"),c=e("./ReactElement"),l=e("./ReactDOM"),p=e("./ReactUpdates"),d=e("./Object.assign"),f=c.createFactory(l.select.type),h=u.createClass({displayName:"ReactDOMSelect",mixins:[a,i.Mixin,s],propTypes:{defaultValue:r,value:r},getInitialState:function(){return{value:this.props.defaultValue||(this.props.multiple?[]:"")}},componentWillMount:function(){this._pendingValue=null},componentWillReceiveProps:function(e){!this.props.multiple&&e.multiple?this.setState({value:[this.state.value]}):this.props.multiple&&!e.multiple&&this.setState({value:this.state.value[0]})
},render:function(){var e=d({},this.props);return e.onChange=this._handleChange,e.value=null,f(e,this.props.children)},componentDidMount:function(){o(this,i.getValue(this))},componentDidUpdate:function(e){var t=i.getValue(this),n=!!e.multiple,r=!!this.props.multiple;(null!=t||n!==r)&&o(this,t)},_handleChange:function(e){var t,r=i.getOnChange(this);r&&(t=r.call(this,e));var o;if(this.props.multiple){o=[];for(var a=e.target.options,s=0,u=a.length;u>s;s++)a[s].selected&&o.push(a[s].value)}else o=e.target.value;return this._pendingValue=o,p.asap(n,this),t}});t.exports=h},{"./AutoFocusMixin":2,"./LinkedValueUtils":24,"./Object.assign":27,"./ReactBrowserComponentMixin":29,"./ReactCompositeComponent":34,"./ReactDOM":37,"./ReactElement":50,"./ReactUpdates":77}],46:[function(e,t){"use strict";function n(e,t,n,r){return e===n&&t===r}function r(e){var t=document.selection,n=t.createRange(),r=n.text.length,o=n.duplicate();o.moveToElementText(e),o.setEndPoint("EndToStart",n);var a=o.text.length,i=a+r;return{start:a,end:i}}function o(e){var t=window.getSelection&&window.getSelection();if(!t||0===t.rangeCount)return null;var r=t.anchorNode,o=t.anchorOffset,a=t.focusNode,i=t.focusOffset,s=t.getRangeAt(0),u=n(t.anchorNode,t.anchorOffset,t.focusNode,t.focusOffset),c=u?0:s.toString().length,l=s.cloneRange();l.selectNodeContents(e),l.setEnd(s.startContainer,s.startOffset);var p=n(l.startContainer,l.startOffset,l.endContainer,l.endOffset),d=p?0:l.toString().length,f=d+c,h=document.createRange();h.setStart(r,o),h.setEnd(a,i);var m=h.collapsed;return{start:m?f:d,end:m?d:f}}function a(e,t){var n,r,o=document.selection.createRange().duplicate();"undefined"==typeof t.end?(n=t.start,r=n):t.start>t.end?(n=t.end,r=t.start):(n=t.start,r=t.end),o.moveToElementText(e),o.moveStart("character",n),o.setEndPoint("EndToStart",o),o.moveEnd("character",r-n),o.select()}function i(e,t){if(window.getSelection){var n=window.getSelection(),r=e[c()].length,o=Math.min(t.start,r),a="undefined"==typeof t.end?o:Math.min(t.end,r);if(!n.extend&&o>a){var i=a;a=o,o=i}var s=u(e,o),l=u(e,a);if(s&&l){var p=document.createRange();p.setStart(s.node,s.offset),n.removeAllRanges(),o>a?(n.addRange(p),n.extend(l.node,l.offset)):(p.setEnd(l.node,l.offset),n.addRange(p))}}}var s=e("./ExecutionEnvironment"),u=e("./getNodeForCharacterOffset"),c=e("./getTextContentAccessor"),l=s.canUseDOM&&document.selection,p={getOffsets:l?r:o,setOffsets:l?a:i};t.exports=p},{"./ExecutionEnvironment":22,"./getNodeForCharacterOffset":117,"./getTextContentAccessor":119}],47:[function(e,t){"use strict";function n(){this.isMounted()&&this.forceUpdate()}var r=e("./AutoFocusMixin"),o=e("./DOMPropertyOperations"),a=e("./LinkedValueUtils"),i=e("./ReactBrowserComponentMixin"),s=e("./ReactCompositeComponent"),u=e("./ReactElement"),c=e("./ReactDOM"),l=e("./ReactUpdates"),p=e("./Object.assign"),d=e("./invariant"),f=(e("./warning"),u.createFactory(c.textarea.type)),h=s.createClass({displayName:"ReactDOMTextarea",mixins:[r,a.Mixin,i],getInitialState:function(){var e=this.props.defaultValue,t=this.props.children;null!=t&&(d(null==e),Array.isArray(t)&&(d(t.length<=1),t=t[0]),e=""+t),null==e&&(e="");var n=a.getValue(this);return{initialValue:""+(null!=n?n:e)}},render:function(){var e=p({},this.props);return d(null==e.dangerouslySetInnerHTML),e.defaultValue=null,e.value=null,e.onChange=this._handleChange,f(e,this.state.initialValue)},componentDidUpdate:function(){var e=a.getValue(this);if(null!=e){var t=this.getDOMNode();o.setValueForProperty(t,"value",""+e)}},_handleChange:function(e){var t,r=a.getOnChange(this);return r&&(t=r.call(this,e)),l.asap(n,this),t}});t.exports=h},{"./AutoFocusMixin":2,"./DOMPropertyOperations":12,"./LinkedValueUtils":24,"./Object.assign":27,"./ReactBrowserComponentMixin":29,"./ReactCompositeComponent":34,"./ReactDOM":37,"./ReactElement":50,"./ReactUpdates":77,"./invariant":124,"./warning":141}],48:[function(e,t){"use strict";function n(){this.reinitializeTransaction()}var r=e("./ReactUpdates"),o=e("./Transaction"),a=e("./Object.assign"),i=e("./emptyFunction"),s={initialize:i,close:function(){p.isBatchingUpdates=!1}},u={initialize:i,close:r.flushBatchedUpdates.bind(r)},c=[u,s];a(n.prototype,o.Mixin,{getTransactionWrappers:function(){return c}});var l=new n,p={isBatchingUpdates:!1,batchedUpdates:function(e,t,n){var r=p.isBatchingUpdates;p.isBatchingUpdates=!0,r?e(t,n):l.perform(e,null,t,n)}};t.exports=p},{"./Object.assign":27,"./ReactUpdates":77,"./Transaction":93,"./emptyFunction":105}],49:[function(e,t){"use strict";function n(){O.EventEmitter.injectReactEventListener(b),O.EventPluginHub.injectEventPluginOrder(s),O.EventPluginHub.injectInstanceHandle(D),O.EventPluginHub.injectMount(x),O.EventPluginHub.injectEventPluginsByName({SimpleEventPlugin:w,EnterLeaveEventPlugin:u,ChangeEventPlugin:o,CompositionEventPlugin:i,MobileSafariClickEventPlugin:p,SelectEventPlugin:P,BeforeInputEventPlugin:r}),O.NativeComponent.injectGenericComponentClass(m),O.NativeComponent.injectComponentClasses({button:v,form:g,img:y,input:E,option:C,select:R,textarea:M,html:N("html"),head:N("head"),body:N("body")}),O.CompositeComponent.injectMixin(d),O.DOMProperty.injectDOMPropertyConfig(l),O.DOMProperty.injectDOMPropertyConfig(T),O.EmptyComponent.injectEmptyComponent("noscript"),O.Updates.injectReconcileTransaction(f.ReactReconcileTransaction),O.Updates.injectBatchingStrategy(h),O.RootIndex.injectCreateReactRootIndex(c.canUseDOM?a.createReactRootIndex:_.createReactRootIndex),O.Component.injectEnvironment(f)}var r=e("./BeforeInputEventPlugin"),o=e("./ChangeEventPlugin"),a=e("./ClientReactRootIndex"),i=e("./CompositionEventPlugin"),s=e("./DefaultEventPluginOrder"),u=e("./EnterLeaveEventPlugin"),c=e("./ExecutionEnvironment"),l=e("./HTMLDOMPropertyConfig"),p=e("./MobileSafariClickEventPlugin"),d=e("./ReactBrowserComponentMixin"),f=e("./ReactComponentBrowserEnvironment"),h=e("./ReactDefaultBatchingStrategy"),m=e("./ReactDOMComponent"),v=e("./ReactDOMButton"),g=e("./ReactDOMForm"),y=e("./ReactDOMImg"),E=e("./ReactDOMInput"),C=e("./ReactDOMOption"),R=e("./ReactDOMSelect"),M=e("./ReactDOMTextarea"),b=e("./ReactEventListener"),O=e("./ReactInjection"),D=e("./ReactInstanceHandles"),x=e("./ReactMount"),P=e("./SelectEventPlugin"),_=e("./ServerReactRootIndex"),w=e("./SimpleEventPlugin"),T=e("./SVGDOMPropertyConfig"),N=e("./createFullPageComponent");t.exports={inject:n}},{"./BeforeInputEventPlugin":3,"./ChangeEventPlugin":7,"./ClientReactRootIndex":8,"./CompositionEventPlugin":9,"./DefaultEventPluginOrder":14,"./EnterLeaveEventPlugin":15,"./ExecutionEnvironment":22,"./HTMLDOMPropertyConfig":23,"./MobileSafariClickEventPlugin":26,"./ReactBrowserComponentMixin":29,"./ReactComponentBrowserEnvironment":33,"./ReactDOMButton":38,"./ReactDOMComponent":39,"./ReactDOMForm":40,"./ReactDOMImg":42,"./ReactDOMInput":43,"./ReactDOMOption":44,"./ReactDOMSelect":45,"./ReactDOMTextarea":47,"./ReactDefaultBatchingStrategy":48,"./ReactEventListener":55,"./ReactInjection":56,"./ReactInstanceHandles":58,"./ReactMount":61,"./SVGDOMPropertyConfig":78,"./SelectEventPlugin":79,"./ServerReactRootIndex":80,"./SimpleEventPlugin":81,"./createFullPageComponent":101}],50:[function(e,t){"use strict";var n=e("./ReactContext"),r=e("./ReactCurrentOwner"),o=(e("./warning"),{key:!0,ref:!0}),a=function(e,t,n,r,o,a){this.type=e,this.key=t,this.ref=n,this._owner=r,this._context=o,this.props=a};a.prototype={_isReactElement:!0},a.createElement=function(e,t,i){var s,u={},c=null,l=null;if(null!=t){l=void 0===t.ref?null:t.ref,c=null==t.key?null:""+t.key;for(s in t)t.hasOwnProperty(s)&&!o.hasOwnProperty(s)&&(u[s]=t[s])}var p=arguments.length-2;if(1===p)u.children=i;else if(p>1){for(var d=Array(p),f=0;p>f;f++)d[f]=arguments[f+2];u.children=d}if(e.defaultProps){var h=e.defaultProps;for(s in h)"undefined"==typeof u[s]&&(u[s]=h[s])}return new a(e,c,l,r.current,n.current,u)},a.createFactory=function(e){var t=a.createElement.bind(null,e);return t.type=e,t},a.cloneAndReplaceProps=function(e,t){var n=new a(e.type,e.key,e.ref,e._owner,e._context,t);return n},a.isValidElement=function(e){var t=!(!e||!e._isReactElement);return t},t.exports=a},{"./ReactContext":35,"./ReactCurrentOwner":36,"./warning":141}],51:[function(e,t){"use strict";function n(){var e=p.current;return e&&e.constructor.displayName||void 0}function r(e,t){e._store.validated||null!=e.key||(e._store.validated=!0,a("react_key_warning",'Each child in an array should have a unique "key" prop.',e,t))}function o(e,t,n){v.test(e)&&a("react_numeric_key_warning","Child objects should have non-numeric keys so ordering is preserved.",t,n)}function a(e,t,r,o){var a=n(),i=o.displayName,s=a||i,u=f[e];if(!u.hasOwnProperty(s)){u[s]=!0,t+=a?" Check the render method of "+a+".":" Check the renderComponent call using <"+i+">.";var c=null;r._owner&&r._owner!==p.current&&(c=r._owner.constructor.displayName,t+=" It was passed a child from "+c+"."),t+=" See http://fb.me/react-warning-keys for more information.",d(e,{component:s,componentOwner:c}),console.warn(t)}}function i(){var e=n()||"";h.hasOwnProperty(e)||(h[e]=!0,d("react_object_map_children"))}function s(e,t){if(Array.isArray(e))for(var n=0;n<e.length;n++){var a=e[n];c.isValidElement(a)&&r(a,t)}else if(c.isValidElement(e))e._store.validated=!0;else if(e&&"object"==typeof e){i();for(var s in e)o(s,e[s],t)}}function u(e,t,n,r){for(var o in t)if(t.hasOwnProperty(o)){var a;try{a=t[o](n,o,e,r)}catch(i){a=i}a instanceof Error&&!(a.message in m)&&(m[a.message]=!0,d("react_failed_descriptor_type_check",{message:a.message}))}}var c=e("./ReactElement"),l=e("./ReactPropTypeLocations"),p=e("./ReactCurrentOwner"),d=e("./monitorCodeUse"),f={react_key_warning:{},react_numeric_key_warning:{}},h={},m={},v=/^\d+$/,g={createElement:function(e){var t=c.createElement.apply(this,arguments);if(null==t)return t;for(var n=2;n<arguments.length;n++)s(arguments[n],e);var r=e.displayName;return e.propTypes&&u(r,e.propTypes,t.props,l.prop),e.contextTypes&&u(r,e.contextTypes,t._context,l.context),t},createFactory:function(e){var t=g.createElement.bind(null,e);return t.type=e,t}};t.exports=g},{"./ReactCurrentOwner":36,"./ReactElement":50,"./ReactPropTypeLocations":69,"./monitorCodeUse":134}],52:[function(e,t){"use strict";function n(){return u(i),i()}function r(e){c[e]=!0}function o(e){delete c[e]}function a(e){return c[e]}var i,s=e("./ReactElement"),u=e("./invariant"),c={},l={injectEmptyComponent:function(e){i=s.createFactory(e)}},p={deregisterNullComponentID:o,getEmptyComponent:n,injection:l,isNullComponentID:a,registerNullComponentID:r};t.exports=p},{"./ReactElement":50,"./invariant":124}],53:[function(e,t){"use strict";var n={guard:function(e){return e}};t.exports=n},{}],54:[function(e,t){"use strict";function n(e){r.enqueueEvents(e),r.processEventQueue()}var r=e("./EventPluginHub"),o={handleTopLevel:function(e,t,o,a){var i=r.extractEvents(e,t,o,a);n(i)}};t.exports=o},{"./EventPluginHub":18}],55:[function(e,t){"use strict";function n(e){var t=l.getID(e),n=c.getReactRootIDFromNodeID(t),r=l.findReactContainerForID(n),o=l.getFirstReactDOM(r);return o}function r(e,t){this.topLevelType=e,this.nativeEvent=t,this.ancestors=[]}function o(e){for(var t=l.getFirstReactDOM(f(e.nativeEvent))||window,r=t;r;)e.ancestors.push(r),r=n(r);for(var o=0,a=e.ancestors.length;a>o;o++){t=e.ancestors[o];var i=l.getID(t)||"";m._handleTopLevel(e.topLevelType,t,i,e.nativeEvent)}}function a(e){var t=h(window);e(t)}var i=e("./EventListener"),s=e("./ExecutionEnvironment"),u=e("./PooledClass"),c=e("./ReactInstanceHandles"),l=e("./ReactMount"),p=e("./ReactUpdates"),d=e("./Object.assign"),f=e("./getEventTarget"),h=e("./getUnboundedScrollPosition");d(r.prototype,{destructor:function(){this.topLevelType=null,this.nativeEvent=null,this.ancestors.length=0}}),u.addPoolingTo(r,u.twoArgumentPooler);var m={_enabled:!0,_handleTopLevel:null,WINDOW_HANDLE:s.canUseDOM?window:null,setHandleTopLevel:function(e){m._handleTopLevel=e},setEnabled:function(e){m._enabled=!!e},isEnabled:function(){return m._enabled},trapBubbledEvent:function(e,t,n){var r=n;return r?i.listen(r,t,m.dispatchEvent.bind(null,e)):void 0},trapCapturedEvent:function(e,t,n){var r=n;return r?i.capture(r,t,m.dispatchEvent.bind(null,e)):void 0},monitorScrollValue:function(e){var t=a.bind(null,e);i.listen(window,"scroll",t),i.listen(window,"resize",t)},dispatchEvent:function(e,t){if(m._enabled){var n=r.getPooled(e,t);try{p.batchedUpdates(o,n)}finally{r.release(n)}}}};t.exports=m},{"./EventListener":17,"./ExecutionEnvironment":22,"./Object.assign":27,"./PooledClass":28,"./ReactInstanceHandles":58,"./ReactMount":61,"./ReactUpdates":77,"./getEventTarget":115,"./getUnboundedScrollPosition":120}],56:[function(e,t){"use strict";var n=e("./DOMProperty"),r=e("./EventPluginHub"),o=e("./ReactComponent"),a=e("./ReactCompositeComponent"),i=e("./ReactEmptyComponent"),s=e("./ReactBrowserEventEmitter"),u=e("./ReactNativeComponent"),c=e("./ReactPerf"),l=e("./ReactRootIndex"),p=e("./ReactUpdates"),d={Component:o.injection,CompositeComponent:a.injection,DOMProperty:n.injection,EmptyComponent:i.injection,EventPluginHub:r.injection,EventEmitter:s.injection,NativeComponent:u.injection,Perf:c.injection,RootIndex:l.injection,Updates:p.injection};t.exports=d},{"./DOMProperty":11,"./EventPluginHub":18,"./ReactBrowserEventEmitter":30,"./ReactComponent":32,"./ReactCompositeComponent":34,"./ReactEmptyComponent":52,"./ReactNativeComponent":64,"./ReactPerf":66,"./ReactRootIndex":73,"./ReactUpdates":77}],57:[function(e,t){"use strict";function n(e){return o(document.documentElement,e)}var r=e("./ReactDOMSelection"),o=e("./containsNode"),a=e("./focusNode"),i=e("./getActiveElement"),s={hasSelectionCapabilities:function(e){return e&&("INPUT"===e.nodeName&&"text"===e.type||"TEXTAREA"===e.nodeName||"true"===e.contentEditable)},getSelectionInformation:function(){var e=i();return{focusedElem:e,selectionRange:s.hasSelectionCapabilities(e)?s.getSelection(e):null}},restoreSelection:function(e){var t=i(),r=e.focusedElem,o=e.selectionRange;t!==r&&n(r)&&(s.hasSelectionCapabilities(r)&&s.setSelection(r,o),a(r))},getSelection:function(e){var t;if("selectionStart"in e)t={start:e.selectionStart,end:e.selectionEnd};else if(document.selection&&"INPUT"===e.nodeName){var n=document.selection.createRange();n.parentElement()===e&&(t={start:-n.moveStart("character",-e.value.length),end:-n.moveEnd("character",-e.value.length)})}else t=r.getOffsets(e);return t||{start:0,end:0}},setSelection:function(e,t){var n=t.start,o=t.end;if("undefined"==typeof o&&(o=n),"selectionStart"in e)e.selectionStart=n,e.selectionEnd=Math.min(o,e.value.length);else if(document.selection&&"INPUT"===e.nodeName){var a=e.createTextRange();a.collapse(!0),a.moveStart("character",n),a.moveEnd("character",o-n),a.select()}else r.setOffsets(e,t)}};t.exports=s},{"./ReactDOMSelection":46,"./containsNode":99,"./focusNode":109,"./getActiveElement":111}],58:[function(e,t){"use strict";function n(e){return d+e.toString(36)}function r(e,t){return e.charAt(t)===d||t===e.length}function o(e){return""===e||e.charAt(0)===d&&e.charAt(e.length-1)!==d}function a(e,t){return 0===t.indexOf(e)&&r(t,e.length)}function i(e){return e?e.substr(0,e.lastIndexOf(d)):""}function s(e,t){if(p(o(e)&&o(t)),p(a(e,t)),e===t)return e;for(var n=e.length+f,i=n;i<t.length&&!r(t,i);i++);return t.substr(0,i)}function u(e,t){var n=Math.min(e.length,t.length);if(0===n)return"";for(var a=0,i=0;n>=i;i++)if(r(e,i)&&r(t,i))a=i;else if(e.charAt(i)!==t.charAt(i))break;var s=e.substr(0,a);return p(o(s)),s}function c(e,t,n,r,o,u){e=e||"",t=t||"",p(e!==t);var c=a(t,e);p(c||a(e,t));for(var l=0,d=c?i:s,f=e;;f=d(f,t)){var m;if(o&&f===e||u&&f===t||(m=n(f,c,r)),m===!1||f===t)break;p(l++<h)}}var l=e("./ReactRootIndex"),p=e("./invariant"),d=".",f=d.length,h=100,m={createReactRootID:function(){return n(l.createReactRootIndex())},createReactID:function(e,t){return e+t},getReactRootIDFromNodeID:function(e){if(e&&e.charAt(0)===d&&e.length>1){var t=e.indexOf(d,1);return t>-1?e.substr(0,t):e}return null},traverseEnterLeave:function(e,t,n,r,o){var a=u(e,t);a!==e&&c(e,a,n,r,!1,!0),a!==t&&c(a,t,n,o,!0,!1)},traverseTwoPhase:function(e,t,n){e&&(c("",e,t,n,!0,!1),c(e,"",t,n,!1,!0))},traverseAncestors:function(e,t,n){c("",e,t,n,!0,!1)},_getFirstCommonAncestorID:u,_getNextDescendantID:s,isAncestorIDOf:a,SEPARATOR:d};t.exports=m},{"./ReactRootIndex":73,"./invariant":124}],59:[function(e,t){"use strict";function n(e,t){if("function"==typeof t)for(var n in t)if(t.hasOwnProperty(n)){var r=t[n];if("function"==typeof r){var o=r.bind(t);for(var a in r)r.hasOwnProperty(a)&&(o[a]=r[a]);e[n]=o}else e[n]=r}}var r=(e("./ReactCurrentOwner"),e("./invariant")),o=(e("./monitorCodeUse"),e("./warning"),{}),a={},i={};i.wrapCreateFactory=function(e){var t=function(t){return"function"!=typeof t?e(t):t.isReactNonLegacyFactory?e(t.type):t.isReactLegacyFactory?e(t.type):t};return t},i.wrapCreateElement=function(e){var t=function(t){if("function"!=typeof t)return e.apply(this,arguments);var n;return t.isReactNonLegacyFactory?(n=Array.prototype.slice.call(arguments,0),n[0]=t.type,e.apply(this,n)):t.isReactLegacyFactory?(t._isMockFunction&&(t.type._mockedReactClassConstructor=t),n=Array.prototype.slice.call(arguments,0),n[0]=t.type,e.apply(this,n)):t.apply(null,Array.prototype.slice.call(arguments,1))};return t},i.wrapFactory=function(e){r("function"==typeof e);var t=function(){return e.apply(this,arguments)};return n(t,e.type),t.isReactLegacyFactory=o,t.type=e.type,t},i.markNonLegacyFactory=function(e){return e.isReactNonLegacyFactory=a,e},i.isValidFactory=function(e){return"function"==typeof e&&e.isReactLegacyFactory===o},i.isValidClass=function(e){return i.isValidFactory(e)},i._isLegacyCallWarningEnabled=!0,t.exports=i},{"./ReactCurrentOwner":36,"./invariant":124,"./monitorCodeUse":134,"./warning":141}],60:[function(e,t){"use strict";var n=e("./adler32"),r={CHECKSUM_ATTR_NAME:"data-react-checksum",addChecksumToMarkup:function(e){var t=n(e);return e.replace(">"," "+r.CHECKSUM_ATTR_NAME+'="'+t+'">')},canReuseMarkup:function(e,t){var o=t.getAttribute(r.CHECKSUM_ATTR_NAME);o=o&&parseInt(o,10);var a=n(e);return a===o}};t.exports=r},{"./adler32":96}],61:[function(e,t){"use strict";function n(e){var t=E(e);return t&&S.getID(t)}function r(e){var t=o(e);if(t)if(x.hasOwnProperty(t)){var n=x[t];n!==e&&(R(!s(n,t)),x[t]=e)}else x[t]=e;return t}function o(e){return e&&e.getAttribute&&e.getAttribute(D)||""}function a(e,t){var n=o(e);n!==t&&delete x[n],e.setAttribute(D,t),x[t]=e}function i(e){return x.hasOwnProperty(e)&&s(x[e],e)||(x[e]=S.findReactNodeByID(e)),x[e]}function s(e,t){if(e){R(o(e)===t);var n=S.findReactContainerForID(t);if(n&&g(n,e))return!0}return!1}function u(e){delete x[e]}function c(e){var t=x[e];return t&&s(t,e)?void(I=t):!1}function l(e){I=null,m.traverseAncestors(e,c);var t=I;return I=null,t}var p=e("./DOMProperty"),d=e("./ReactBrowserEventEmitter"),f=(e("./ReactCurrentOwner"),e("./ReactElement")),h=e("./ReactLegacyElement"),m=e("./ReactInstanceHandles"),v=e("./ReactPerf"),g=e("./containsNode"),y=e("./deprecated"),E=e("./getReactRootElementInContainer"),C=e("./instantiateReactComponent"),R=e("./invariant"),M=e("./shouldUpdateReactComponent"),b=(e("./warning"),h.wrapCreateElement(f.createElement)),O=m.SEPARATOR,D=p.ID_ATTRIBUTE_NAME,x={},P=1,_=9,w={},T={},N=[],I=null,S={_instancesByReactRootID:w,scrollMonitor:function(e,t){t()},_updateRootComponent:function(e,t,n,r){var o=t.props;return S.scrollMonitor(n,function(){e.replaceProps(o,r)}),e},_registerComponent:function(e,t){R(t&&(t.nodeType===P||t.nodeType===_)),d.ensureScrollValueMonitoring();var n=S.registerContainer(t);return w[n]=e,n},_renderNewRootComponent:v.measure("ReactMount","_renderNewRootComponent",function(e,t,n){var r=C(e,null),o=S._registerComponent(r,t);return r.mountComponentIntoNode(o,t,n),r}),render:function(e,t,r){R(f.isValidElement(e));var o=w[n(t)];if(o){var a=o._currentElement;if(M(a,e))return S._updateRootComponent(o,e,t,r);S.unmountComponentAtNode(t)}var i=E(t),s=i&&S.isRenderedByReact(i),u=s&&!o,c=S._renderNewRootComponent(e,t,u);return r&&r.call(c),c},constructAndRenderComponent:function(e,t,n){var r=b(e,t);return S.render(r,n)},constructAndRenderComponentByID:function(e,t,n){var r=document.getElementById(n);return R(r),S.constructAndRenderComponent(e,t,r)},registerContainer:function(e){var t=n(e);return t&&(t=m.getReactRootIDFromNodeID(t)),t||(t=m.createReactRootID()),T[t]=e,t},unmountComponentAtNode:function(e){var t=n(e),r=w[t];return r?(S.unmountComponentFromNode(r,e),delete w[t],delete T[t],!0):!1},unmountComponentFromNode:function(e,t){for(e.unmountComponent(),t.nodeType===_&&(t=t.documentElement);t.lastChild;)t.removeChild(t.lastChild)},findReactContainerForID:function(e){var t=m.getReactRootIDFromNodeID(e),n=T[t];return n},findReactNodeByID:function(e){var t=S.findReactContainerForID(e);return S.findComponentRoot(t,e)},isRenderedByReact:function(e){if(1!==e.nodeType)return!1;var t=S.getID(e);return t?t.charAt(0)===O:!1},getFirstReactDOM:function(e){for(var t=e;t&&t.parentNode!==t;){if(S.isRenderedByReact(t))return t;t=t.parentNode}return null},findComponentRoot:function(e,t){var n=N,r=0,o=l(t)||e;for(n[0]=o.firstChild,n.length=1;r<n.length;){for(var a,i=n[r++];i;){var s=S.getID(i);s?t===s?a=i:m.isAncestorIDOf(s,t)&&(n.length=r=0,n.push(i.firstChild)):n.push(i.firstChild),i=i.nextSibling}if(a)return n.length=0,a}n.length=0,R(!1)},getReactRootID:n,getID:r,setID:a,getNode:i,purgeID:u};S.renderComponent=y("ReactMount","renderComponent","render",this,S.render),t.exports=S},{"./DOMProperty":11,"./ReactBrowserEventEmitter":30,"./ReactCurrentOwner":36,"./ReactElement":50,"./ReactInstanceHandles":58,"./ReactLegacyElement":59,"./ReactPerf":66,"./containsNode":99,"./deprecated":104,"./getReactRootElementInContainer":118,"./instantiateReactComponent":123,"./invariant":124,"./shouldUpdateReactComponent":138,"./warning":141}],62:[function(e,t){"use strict";function n(e,t,n){h.push({parentID:e,parentNode:null,type:c.INSERT_MARKUP,markupIndex:m.push(t)-1,textContent:null,fromIndex:null,toIndex:n})}function r(e,t,n){h.push({parentID:e,parentNode:null,type:c.MOVE_EXISTING,markupIndex:null,textContent:null,fromIndex:t,toIndex:n})}function o(e,t){h.push({parentID:e,parentNode:null,type:c.REMOVE_NODE,markupIndex:null,textContent:null,fromIndex:t,toIndex:null})}function a(e,t){h.push({parentID:e,parentNode:null,type:c.TEXT_CONTENT,markupIndex:null,textContent:t,fromIndex:null,toIndex:null})}function i(){h.length&&(u.BackendIDOperations.dangerouslyProcessChildrenUpdates(h,m),s())}function s(){h.length=0,m.length=0}var u=e("./ReactComponent"),c=e("./ReactMultiChildUpdateTypes"),l=e("./flattenChildren"),p=e("./instantiateReactComponent"),d=e("./shouldUpdateReactComponent"),f=0,h=[],m=[],v={Mixin:{mountChildren:function(e,t){var n=l(e),r=[],o=0;this._renderedChildren=n;for(var a in n){var i=n[a];if(n.hasOwnProperty(a)){var s=p(i,null);n[a]=s;var u=this._rootNodeID+a,c=s.mountComponent(u,t,this._mountDepth+1);s._mountIndex=o,r.push(c),o++}}return r},updateTextContent:function(e){f++;var t=!0;try{var n=this._renderedChildren;for(var r in n)n.hasOwnProperty(r)&&this._unmountChildByName(n[r],r);this.setTextContent(e),t=!1}finally{f--,f||(t?s():i())}},updateChildren:function(e,t){f++;var n=!0;try{this._updateChildren(e,t),n=!1}finally{f--,f||(n?s():i())}},_updateChildren:function(e,t){var n=l(e),r=this._renderedChildren;if(n||r){var o,a=0,i=0;for(o in n)if(n.hasOwnProperty(o)){var s=r&&r[o],u=s&&s._currentElement,c=n[o];if(d(u,c))this.moveChild(s,i,a),a=Math.max(s._mountIndex,a),s.receiveComponent(c,t),s._mountIndex=i;else{s&&(a=Math.max(s._mountIndex,a),this._unmountChildByName(s,o));var f=p(c,null);this._mountChildByNameAtIndex(f,o,i,t)}i++}for(o in r)!r.hasOwnProperty(o)||n&&n[o]||this._unmountChildByName(r[o],o)}},unmountChildren:function(){var e=this._renderedChildren;for(var t in e){var n=e[t];n.unmountComponent&&n.unmountComponent()}this._renderedChildren=null},moveChild:function(e,t,n){e._mountIndex<n&&r(this._rootNodeID,e._mountIndex,t)},createChild:function(e,t){n(this._rootNodeID,t,e._mountIndex)},removeChild:function(e){o(this._rootNodeID,e._mountIndex)},setTextContent:function(e){a(this._rootNodeID,e)},_mountChildByNameAtIndex:function(e,t,n,r){var o=this._rootNodeID+t,a=e.mountComponent(o,r,this._mountDepth+1);e._mountIndex=n,this.createChild(e,a),this._renderedChildren=this._renderedChildren||{},this._renderedChildren[t]=e},_unmountChildByName:function(e,t){this.removeChild(e),e._mountIndex=null,e.unmountComponent(),delete this._renderedChildren[t]}}};t.exports=v},{"./ReactComponent":32,"./ReactMultiChildUpdateTypes":63,"./flattenChildren":108,"./instantiateReactComponent":123,"./shouldUpdateReactComponent":138}],63:[function(e,t){"use strict";var n=e("./keyMirror"),r=n({INSERT_MARKUP:null,MOVE_EXISTING:null,REMOVE_NODE:null,TEXT_CONTENT:null});t.exports=r},{"./keyMirror":130}],64:[function(e,t){"use strict";function n(e,t,n){var r=i[e];return null==r?(o(a),new a(e,t)):n===e?(o(a),new a(e,t)):new r.type(t)}var r=e("./Object.assign"),o=e("./invariant"),a=null,i={},s={injectGenericComponentClass:function(e){a=e},injectComponentClasses:function(e){r(i,e)}},u={createInstanceForTag:n,injection:s};t.exports=u},{"./Object.assign":27,"./invariant":124}],65:[function(e,t){"use strict";var n=e("./emptyObject"),r=e("./invariant"),o={isValidOwner:function(e){return!(!e||"function"!=typeof e.attachRef||"function"!=typeof e.detachRef)},addComponentAsRefTo:function(e,t,n){r(o.isValidOwner(n)),n.attachRef(t,e)},removeComponentAsRefFrom:function(e,t,n){r(o.isValidOwner(n)),n.refs[t]===e&&n.detachRef(t)},Mixin:{construct:function(){this.refs=n},attachRef:function(e,t){r(t.isOwnedBy(this));var o=this.refs===n?this.refs={}:this.refs;o[e]=t},detachRef:function(e){delete this.refs[e]}}};t.exports=o},{"./emptyObject":106,"./invariant":124}],66:[function(e,t){"use strict";function n(e,t,n){return n}var r={enableMeasure:!1,storedMeasure:n,measure:function(e,t,n){return n},injection:{injectMeasure:function(e){r.storedMeasure=e}}};t.exports=r},{}],67:[function(e,t){"use strict";function n(e){return function(t,n,r){t[n]=t.hasOwnProperty(n)?e(t[n],r):r}}function r(e,t){for(var n in t)if(t.hasOwnProperty(n)){var r=c[n];r&&c.hasOwnProperty(n)?r(e,n,t[n]):e.hasOwnProperty(n)||(e[n]=t[n])}return e}var o=e("./Object.assign"),a=e("./emptyFunction"),i=e("./invariant"),s=e("./joinClasses"),u=(e("./warning"),n(function(e,t){return o({},t,e)})),c={children:a,className:n(s),style:u},l={TransferStrategies:c,mergeProps:function(e,t){return r(o({},e),t)},Mixin:{transferPropsTo:function(e){return i(e._owner===this),r(e.props,this.props),e}}};t.exports=l},{"./Object.assign":27,"./emptyFunction":105,"./invariant":124,"./joinClasses":129,"./warning":141}],68:[function(e,t){"use strict";var n={};t.exports=n},{}],69:[function(e,t){"use strict";var n=e("./keyMirror"),r=n({prop:null,context:null,childContext:null});t.exports=r},{"./keyMirror":130}],70:[function(e,t){"use strict";function n(e){function t(t,n,r,o,a){if(o=o||C,null!=n[r])return e(n,r,o,a);var i=g[a];return t?new Error("Required "+i+" `"+r+"` was not specified in "+("`"+o+"`.")):void 0}var n=t.bind(null,!1);return n.isRequired=t.bind(null,!0),n}function r(e){function t(t,n,r,o){var a=t[n],i=h(a);if(i!==e){var s=g[o],u=m(a);return new Error("Invalid "+s+" `"+n+"` of type `"+u+"` "+("supplied to `"+r+"`, expected `"+e+"`."))}}return n(t)}function o(){return n(E.thatReturns())}function a(e){function t(t,n,r,o){var a=t[n];if(!Array.isArray(a)){var i=g[o],s=h(a);return new Error("Invalid "+i+" `"+n+"` of type "+("`"+s+"` supplied to `"+r+"`, expected an array."))}for(var u=0;u<a.length;u++){var c=e(a,u,r,o);if(c instanceof Error)return c}}return n(t)}function i(){function e(e,t,n,r){if(!v.isValidElement(e[t])){var o=g[r];return new Error("Invalid "+o+" `"+t+"` supplied to "+("`"+n+"`, expected a ReactElement."))}}return n(e)}function s(e){function t(t,n,r,o){if(!(t[n]instanceof e)){var a=g[o],i=e.name||C;return new Error("Invalid "+a+" `"+n+"` supplied to "+("`"+r+"`, expected instance of `"+i+"`."))}}return n(t)}function u(e){function t(t,n,r,o){for(var a=t[n],i=0;i<e.length;i++)if(a===e[i])return;var s=g[o],u=JSON.stringify(e);return new Error("Invalid "+s+" `"+n+"` of value `"+a+"` "+("supplied to `"+r+"`, expected one of "+u+"."))}return n(t)}function c(e){function t(t,n,r,o){var a=t[n],i=h(a);if("object"!==i){var s=g[o];return new Error("Invalid "+s+" `"+n+"` of type "+("`"+i+"` supplied to `"+r+"`, expected an object."))}for(var u in a)if(a.hasOwnProperty(u)){var c=e(a,u,r,o);if(c instanceof Error)return c}}return n(t)}function l(e){function t(t,n,r,o){for(var a=0;a<e.length;a++){var i=e[a];if(null==i(t,n,r,o))return}var s=g[o];return new Error("Invalid "+s+" `"+n+"` supplied to "+("`"+r+"`."))}return n(t)}function p(){function e(e,t,n,r){if(!f(e[t])){var o=g[r];return new Error("Invalid "+o+" `"+t+"` supplied to "+("`"+n+"`, expected a ReactNode."))}}return n(e)}function d(e){function t(t,n,r,o){var a=t[n],i=h(a);if("object"!==i){var s=g[o];return new Error("Invalid "+s+" `"+n+"` of type `"+i+"` "+("supplied to `"+r+"`, expected `object`."))}for(var u in e){var c=e[u];if(c){var l=c(a,u,r,o);if(l)return l}}}return n(t,"expected `object`")}function f(e){switch(typeof e){case"number":case"string":return!0;case"boolean":return!e;case"object":if(Array.isArray(e))return e.every(f);if(v.isValidElement(e))return!0;for(var t in e)if(!f(e[t]))return!1;return!0;default:return!1}}function h(e){var t=typeof e;return Array.isArray(e)?"array":e instanceof RegExp?"object":t}function m(e){var t=h(e);if("object"===t){if(e instanceof Date)return"date";if(e instanceof RegExp)return"regexp"}return t}var v=e("./ReactElement"),g=e("./ReactPropTypeLocationNames"),y=e("./deprecated"),E=e("./emptyFunction"),C="<<anonymous>>",R=i(),M=p(),b={array:r("array"),bool:r("boolean"),func:r("function"),number:r("number"),object:r("object"),string:r("string"),any:o(),arrayOf:a,element:R,instanceOf:s,node:M,objectOf:c,oneOf:u,oneOfType:l,shape:d,component:y("React.PropTypes","component","element",this,R),renderable:y("React.PropTypes","renderable","node",this,M)};t.exports=b},{"./ReactElement":50,"./ReactPropTypeLocationNames":68,"./deprecated":104,"./emptyFunction":105}],71:[function(e,t){"use strict";function n(){this.listenersToPut=[]}var r=e("./PooledClass"),o=e("./ReactBrowserEventEmitter"),a=e("./Object.assign");a(n.prototype,{enqueuePutListener:function(e,t,n){this.listenersToPut.push({rootNodeID:e,propKey:t,propValue:n})},putListeners:function(){for(var e=0;e<this.listenersToPut.length;e++){var t=this.listenersToPut[e];o.putListener(t.rootNodeID,t.propKey,t.propValue)}},reset:function(){this.listenersToPut.length=0},destructor:function(){this.reset()}}),r.addPoolingTo(n),t.exports=n},{"./Object.assign":27,"./PooledClass":28,"./ReactBrowserEventEmitter":30}],72:[function(e,t){"use strict";function n(){this.reinitializeTransaction(),this.renderToStaticMarkup=!1,this.reactMountReady=r.getPooled(null),this.putListenerQueue=s.getPooled()}var r=e("./CallbackQueue"),o=e("./PooledClass"),a=e("./ReactBrowserEventEmitter"),i=e("./ReactInputSelection"),s=e("./ReactPutListenerQueue"),u=e("./Transaction"),c=e("./Object.assign"),l={initialize:i.getSelectionInformation,close:i.restoreSelection},p={initialize:function(){var e=a.isEnabled();return a.setEnabled(!1),e},close:function(e){a.setEnabled(e)}},d={initialize:function(){this.reactMountReady.reset()},close:function(){this.reactMountReady.notifyAll()}},f={initialize:function(){this.putListenerQueue.reset()},close:function(){this.putListenerQueue.putListeners()}},h=[f,l,p,d],m={getTransactionWrappers:function(){return h},getReactMountReady:function(){return this.reactMountReady},getPutListenerQueue:function(){return this.putListenerQueue},destructor:function(){r.release(this.reactMountReady),this.reactMountReady=null,s.release(this.putListenerQueue),this.putListenerQueue=null}};c(n.prototype,u.Mixin,m),o.addPoolingTo(n),t.exports=n},{"./CallbackQueue":6,"./Object.assign":27,"./PooledClass":28,"./ReactBrowserEventEmitter":30,"./ReactInputSelection":57,"./ReactPutListenerQueue":71,"./Transaction":93}],73:[function(e,t){"use strict";
var n={injectCreateReactRootIndex:function(e){r.createReactRootIndex=e}},r={createReactRootIndex:null,injection:n};t.exports=r},{}],74:[function(e,t){"use strict";function n(e){c(o.isValidElement(e));var t;try{var n=a.createReactRootID();return t=s.getPooled(!1),t.perform(function(){var r=u(e,null),o=r.mountComponent(n,t,0);return i.addChecksumToMarkup(o)},null)}finally{s.release(t)}}function r(e){c(o.isValidElement(e));var t;try{var n=a.createReactRootID();return t=s.getPooled(!0),t.perform(function(){var r=u(e,null);return r.mountComponent(n,t,0)},null)}finally{s.release(t)}}var o=e("./ReactElement"),a=e("./ReactInstanceHandles"),i=e("./ReactMarkupChecksum"),s=e("./ReactServerRenderingTransaction"),u=e("./instantiateReactComponent"),c=e("./invariant");t.exports={renderToString:n,renderToStaticMarkup:r}},{"./ReactElement":50,"./ReactInstanceHandles":58,"./ReactMarkupChecksum":60,"./ReactServerRenderingTransaction":75,"./instantiateReactComponent":123,"./invariant":124}],75:[function(e,t){"use strict";function n(e){this.reinitializeTransaction(),this.renderToStaticMarkup=e,this.reactMountReady=o.getPooled(null),this.putListenerQueue=a.getPooled()}var r=e("./PooledClass"),o=e("./CallbackQueue"),a=e("./ReactPutListenerQueue"),i=e("./Transaction"),s=e("./Object.assign"),u=e("./emptyFunction"),c={initialize:function(){this.reactMountReady.reset()},close:u},l={initialize:function(){this.putListenerQueue.reset()},close:u},p=[l,c],d={getTransactionWrappers:function(){return p},getReactMountReady:function(){return this.reactMountReady},getPutListenerQueue:function(){return this.putListenerQueue},destructor:function(){o.release(this.reactMountReady),this.reactMountReady=null,a.release(this.putListenerQueue),this.putListenerQueue=null}};s(n.prototype,i.Mixin,d),r.addPoolingTo(n),t.exports=n},{"./CallbackQueue":6,"./Object.assign":27,"./PooledClass":28,"./ReactPutListenerQueue":71,"./Transaction":93,"./emptyFunction":105}],76:[function(e,t){"use strict";var n=e("./DOMPropertyOperations"),r=e("./ReactComponent"),o=e("./ReactElement"),a=e("./Object.assign"),i=e("./escapeTextForBrowser"),s=function(){};a(s.prototype,r.Mixin,{mountComponent:function(e,t,o){r.Mixin.mountComponent.call(this,e,t,o);var a=i(this.props);return t.renderToStaticMarkup?a:"<span "+n.createMarkupForID(e)+">"+a+"</span>"},receiveComponent:function(e){var t=e.props;t!==this.props&&(this.props=t,r.BackendIDOperations.updateTextContentByID(this._rootNodeID,t))}});var u=function(e){return new o(s,null,null,null,null,e)};u.type=s,t.exports=u},{"./DOMPropertyOperations":12,"./Object.assign":27,"./ReactComponent":32,"./ReactElement":50,"./escapeTextForBrowser":107}],77:[function(e,t){"use strict";function n(){h(O.ReactReconcileTransaction&&y)}function r(){this.reinitializeTransaction(),this.dirtyComponentsLength=null,this.callbackQueue=c.getPooled(),this.reconcileTransaction=O.ReactReconcileTransaction.getPooled()}function o(e,t,r){n(),y.batchedUpdates(e,t,r)}function a(e,t){return e._mountDepth-t._mountDepth}function i(e){var t=e.dirtyComponentsLength;h(t===m.length),m.sort(a);for(var n=0;t>n;n++){var r=m[n];if(r.isMounted()){var o=r._pendingCallbacks;if(r._pendingCallbacks=null,r.performUpdateIfNecessary(e.reconcileTransaction),o)for(var i=0;i<o.length;i++)e.callbackQueue.enqueue(o[i],r)}}}function s(e,t){return h(!t||"function"==typeof t),n(),y.isBatchingUpdates?(m.push(e),void(t&&(e._pendingCallbacks?e._pendingCallbacks.push(t):e._pendingCallbacks=[t]))):void y.batchedUpdates(s,e,t)}function u(e,t){h(y.isBatchingUpdates),v.enqueue(e,t),g=!0}var c=e("./CallbackQueue"),l=e("./PooledClass"),p=(e("./ReactCurrentOwner"),e("./ReactPerf")),d=e("./Transaction"),f=e("./Object.assign"),h=e("./invariant"),m=(e("./warning"),[]),v=c.getPooled(),g=!1,y=null,E={initialize:function(){this.dirtyComponentsLength=m.length},close:function(){this.dirtyComponentsLength!==m.length?(m.splice(0,this.dirtyComponentsLength),M()):m.length=0}},C={initialize:function(){this.callbackQueue.reset()},close:function(){this.callbackQueue.notifyAll()}},R=[E,C];f(r.prototype,d.Mixin,{getTransactionWrappers:function(){return R},destructor:function(){this.dirtyComponentsLength=null,c.release(this.callbackQueue),this.callbackQueue=null,O.ReactReconcileTransaction.release(this.reconcileTransaction),this.reconcileTransaction=null},perform:function(e,t,n){return d.Mixin.perform.call(this,this.reconcileTransaction.perform,this.reconcileTransaction,e,t,n)}}),l.addPoolingTo(r);var M=p.measure("ReactUpdates","flushBatchedUpdates",function(){for(;m.length||g;){if(m.length){var e=r.getPooled();e.perform(i,null,e),r.release(e)}if(g){g=!1;var t=v;v=c.getPooled(),t.notifyAll(),c.release(t)}}}),b={injectReconcileTransaction:function(e){h(e),O.ReactReconcileTransaction=e},injectBatchingStrategy:function(e){h(e),h("function"==typeof e.batchedUpdates),h("boolean"==typeof e.isBatchingUpdates),y=e}},O={ReactReconcileTransaction:null,batchedUpdates:o,enqueueUpdate:s,flushBatchedUpdates:M,injection:b,asap:u};t.exports=O},{"./CallbackQueue":6,"./Object.assign":27,"./PooledClass":28,"./ReactCurrentOwner":36,"./ReactPerf":66,"./Transaction":93,"./invariant":124,"./warning":141}],78:[function(e,t){"use strict";var n=e("./DOMProperty"),r=n.injection.MUST_USE_ATTRIBUTE,o={Properties:{cx:r,cy:r,d:r,dx:r,dy:r,fill:r,fillOpacity:r,fontFamily:r,fontSize:r,fx:r,fy:r,gradientTransform:r,gradientUnits:r,markerEnd:r,markerMid:r,markerStart:r,offset:r,opacity:r,patternContentUnits:r,patternUnits:r,points:r,preserveAspectRatio:r,r:r,rx:r,ry:r,spreadMethod:r,stopColor:r,stopOpacity:r,stroke:r,strokeDasharray:r,strokeLinecap:r,strokeOpacity:r,strokeWidth:r,textAnchor:r,transform:r,version:r,viewBox:r,x1:r,x2:r,x:r,y1:r,y2:r,y:r},DOMAttributeNames:{fillOpacity:"fill-opacity",fontFamily:"font-family",fontSize:"font-size",gradientTransform:"gradientTransform",gradientUnits:"gradientUnits",markerEnd:"marker-end",markerMid:"marker-mid",markerStart:"marker-start",patternContentUnits:"patternContentUnits",patternUnits:"patternUnits",preserveAspectRatio:"preserveAspectRatio",spreadMethod:"spreadMethod",stopColor:"stop-color",stopOpacity:"stop-opacity",strokeDasharray:"stroke-dasharray",strokeLinecap:"stroke-linecap",strokeOpacity:"stroke-opacity",strokeWidth:"stroke-width",textAnchor:"text-anchor",viewBox:"viewBox"}};t.exports=o},{"./DOMProperty":11}],79:[function(e,t){"use strict";function n(e){if("selectionStart"in e&&i.hasSelectionCapabilities(e))return{start:e.selectionStart,end:e.selectionEnd};if(window.getSelection){var t=window.getSelection();return{anchorNode:t.anchorNode,anchorOffset:t.anchorOffset,focusNode:t.focusNode,focusOffset:t.focusOffset}}if(document.selection){var n=document.selection.createRange();return{parentElement:n.parentElement(),text:n.text,top:n.boundingTop,left:n.boundingLeft}}}function r(e){if(!g&&null!=h&&h==u()){var t=n(h);if(!v||!p(v,t)){v=t;var r=s.getPooled(f.select,m,e);return r.type="select",r.target=h,a.accumulateTwoPhaseDispatches(r),r}}}var o=e("./EventConstants"),a=e("./EventPropagators"),i=e("./ReactInputSelection"),s=e("./SyntheticEvent"),u=e("./getActiveElement"),c=e("./isTextInputElement"),l=e("./keyOf"),p=e("./shallowEqual"),d=o.topLevelTypes,f={select:{phasedRegistrationNames:{bubbled:l({onSelect:null}),captured:l({onSelectCapture:null})},dependencies:[d.topBlur,d.topContextMenu,d.topFocus,d.topKeyDown,d.topMouseDown,d.topMouseUp,d.topSelectionChange]}},h=null,m=null,v=null,g=!1,y={eventTypes:f,extractEvents:function(e,t,n,o){switch(e){case d.topFocus:(c(t)||"true"===t.contentEditable)&&(h=t,m=n,v=null);break;case d.topBlur:h=null,m=null,v=null;break;case d.topMouseDown:g=!0;break;case d.topContextMenu:case d.topMouseUp:return g=!1,r(o);case d.topSelectionChange:case d.topKeyDown:case d.topKeyUp:return r(o)}}};t.exports=y},{"./EventConstants":16,"./EventPropagators":21,"./ReactInputSelection":57,"./SyntheticEvent":85,"./getActiveElement":111,"./isTextInputElement":127,"./keyOf":131,"./shallowEqual":137}],80:[function(e,t){"use strict";var n=Math.pow(2,53),r={createReactRootIndex:function(){return Math.ceil(Math.random()*n)}};t.exports=r},{}],81:[function(e,t){"use strict";var n=e("./EventConstants"),r=e("./EventPluginUtils"),o=e("./EventPropagators"),a=e("./SyntheticClipboardEvent"),i=e("./SyntheticEvent"),s=e("./SyntheticFocusEvent"),u=e("./SyntheticKeyboardEvent"),c=e("./SyntheticMouseEvent"),l=e("./SyntheticDragEvent"),p=e("./SyntheticTouchEvent"),d=e("./SyntheticUIEvent"),f=e("./SyntheticWheelEvent"),h=e("./getEventCharCode"),m=e("./invariant"),v=e("./keyOf"),g=(e("./warning"),n.topLevelTypes),y={blur:{phasedRegistrationNames:{bubbled:v({onBlur:!0}),captured:v({onBlurCapture:!0})}},click:{phasedRegistrationNames:{bubbled:v({onClick:!0}),captured:v({onClickCapture:!0})}},contextMenu:{phasedRegistrationNames:{bubbled:v({onContextMenu:!0}),captured:v({onContextMenuCapture:!0})}},copy:{phasedRegistrationNames:{bubbled:v({onCopy:!0}),captured:v({onCopyCapture:!0})}},cut:{phasedRegistrationNames:{bubbled:v({onCut:!0}),captured:v({onCutCapture:!0})}},doubleClick:{phasedRegistrationNames:{bubbled:v({onDoubleClick:!0}),captured:v({onDoubleClickCapture:!0})}},drag:{phasedRegistrationNames:{bubbled:v({onDrag:!0}),captured:v({onDragCapture:!0})}},dragEnd:{phasedRegistrationNames:{bubbled:v({onDragEnd:!0}),captured:v({onDragEndCapture:!0})}},dragEnter:{phasedRegistrationNames:{bubbled:v({onDragEnter:!0}),captured:v({onDragEnterCapture:!0})}},dragExit:{phasedRegistrationNames:{bubbled:v({onDragExit:!0}),captured:v({onDragExitCapture:!0})}},dragLeave:{phasedRegistrationNames:{bubbled:v({onDragLeave:!0}),captured:v({onDragLeaveCapture:!0})}},dragOver:{phasedRegistrationNames:{bubbled:v({onDragOver:!0}),captured:v({onDragOverCapture:!0})}},dragStart:{phasedRegistrationNames:{bubbled:v({onDragStart:!0}),captured:v({onDragStartCapture:!0})}},drop:{phasedRegistrationNames:{bubbled:v({onDrop:!0}),captured:v({onDropCapture:!0})}},focus:{phasedRegistrationNames:{bubbled:v({onFocus:!0}),captured:v({onFocusCapture:!0})}},input:{phasedRegistrationNames:{bubbled:v({onInput:!0}),captured:v({onInputCapture:!0})}},keyDown:{phasedRegistrationNames:{bubbled:v({onKeyDown:!0}),captured:v({onKeyDownCapture:!0})}},keyPress:{phasedRegistrationNames:{bubbled:v({onKeyPress:!0}),captured:v({onKeyPressCapture:!0})}},keyUp:{phasedRegistrationNames:{bubbled:v({onKeyUp:!0}),captured:v({onKeyUpCapture:!0})}},load:{phasedRegistrationNames:{bubbled:v({onLoad:!0}),captured:v({onLoadCapture:!0})}},error:{phasedRegistrationNames:{bubbled:v({onError:!0}),captured:v({onErrorCapture:!0})}},mouseDown:{phasedRegistrationNames:{bubbled:v({onMouseDown:!0}),captured:v({onMouseDownCapture:!0})}},mouseMove:{phasedRegistrationNames:{bubbled:v({onMouseMove:!0}),captured:v({onMouseMoveCapture:!0})}},mouseOut:{phasedRegistrationNames:{bubbled:v({onMouseOut:!0}),captured:v({onMouseOutCapture:!0})}},mouseOver:{phasedRegistrationNames:{bubbled:v({onMouseOver:!0}),captured:v({onMouseOverCapture:!0})}},mouseUp:{phasedRegistrationNames:{bubbled:v({onMouseUp:!0}),captured:v({onMouseUpCapture:!0})}},paste:{phasedRegistrationNames:{bubbled:v({onPaste:!0}),captured:v({onPasteCapture:!0})}},reset:{phasedRegistrationNames:{bubbled:v({onReset:!0}),captured:v({onResetCapture:!0})}},scroll:{phasedRegistrationNames:{bubbled:v({onScroll:!0}),captured:v({onScrollCapture:!0})}},submit:{phasedRegistrationNames:{bubbled:v({onSubmit:!0}),captured:v({onSubmitCapture:!0})}},touchCancel:{phasedRegistrationNames:{bubbled:v({onTouchCancel:!0}),captured:v({onTouchCancelCapture:!0})}},touchEnd:{phasedRegistrationNames:{bubbled:v({onTouchEnd:!0}),captured:v({onTouchEndCapture:!0})}},touchMove:{phasedRegistrationNames:{bubbled:v({onTouchMove:!0}),captured:v({onTouchMoveCapture:!0})}},touchStart:{phasedRegistrationNames:{bubbled:v({onTouchStart:!0}),captured:v({onTouchStartCapture:!0})}},wheel:{phasedRegistrationNames:{bubbled:v({onWheel:!0}),captured:v({onWheelCapture:!0})}}},E={topBlur:y.blur,topClick:y.click,topContextMenu:y.contextMenu,topCopy:y.copy,topCut:y.cut,topDoubleClick:y.doubleClick,topDrag:y.drag,topDragEnd:y.dragEnd,topDragEnter:y.dragEnter,topDragExit:y.dragExit,topDragLeave:y.dragLeave,topDragOver:y.dragOver,topDragStart:y.dragStart,topDrop:y.drop,topError:y.error,topFocus:y.focus,topInput:y.input,topKeyDown:y.keyDown,topKeyPress:y.keyPress,topKeyUp:y.keyUp,topLoad:y.load,topMouseDown:y.mouseDown,topMouseMove:y.mouseMove,topMouseOut:y.mouseOut,topMouseOver:y.mouseOver,topMouseUp:y.mouseUp,topPaste:y.paste,topReset:y.reset,topScroll:y.scroll,topSubmit:y.submit,topTouchCancel:y.touchCancel,topTouchEnd:y.touchEnd,topTouchMove:y.touchMove,topTouchStart:y.touchStart,topWheel:y.wheel};for(var C in E)E[C].dependencies=[C];var R={eventTypes:y,executeDispatch:function(e,t,n){var o=r.executeDispatch(e,t,n);o===!1&&(e.stopPropagation(),e.preventDefault())},extractEvents:function(e,t,n,r){var v=E[e];if(!v)return null;var y;switch(e){case g.topInput:case g.topLoad:case g.topError:case g.topReset:case g.topSubmit:y=i;break;case g.topKeyPress:if(0===h(r))return null;case g.topKeyDown:case g.topKeyUp:y=u;break;case g.topBlur:case g.topFocus:y=s;break;case g.topClick:if(2===r.button)return null;case g.topContextMenu:case g.topDoubleClick:case g.topMouseDown:case g.topMouseMove:case g.topMouseOut:case g.topMouseOver:case g.topMouseUp:y=c;break;case g.topDrag:case g.topDragEnd:case g.topDragEnter:case g.topDragExit:case g.topDragLeave:case g.topDragOver:case g.topDragStart:case g.topDrop:y=l;break;case g.topTouchCancel:case g.topTouchEnd:case g.topTouchMove:case g.topTouchStart:y=p;break;case g.topScroll:y=d;break;case g.topWheel:y=f;break;case g.topCopy:case g.topCut:case g.topPaste:y=a}m(y);var C=y.getPooled(v,n,r);return o.accumulateTwoPhaseDispatches(C),C}};t.exports=R},{"./EventConstants":16,"./EventPluginUtils":20,"./EventPropagators":21,"./SyntheticClipboardEvent":82,"./SyntheticDragEvent":84,"./SyntheticEvent":85,"./SyntheticFocusEvent":86,"./SyntheticKeyboardEvent":88,"./SyntheticMouseEvent":89,"./SyntheticTouchEvent":90,"./SyntheticUIEvent":91,"./SyntheticWheelEvent":92,"./getEventCharCode":112,"./invariant":124,"./keyOf":131,"./warning":141}],82:[function(e,t){"use strict";function n(e,t,n){r.call(this,e,t,n)}var r=e("./SyntheticEvent"),o={clipboardData:function(e){return"clipboardData"in e?e.clipboardData:window.clipboardData}};r.augmentClass(n,o),t.exports=n},{"./SyntheticEvent":85}],83:[function(e,t){"use strict";function n(e,t,n){r.call(this,e,t,n)}var r=e("./SyntheticEvent"),o={data:null};r.augmentClass(n,o),t.exports=n},{"./SyntheticEvent":85}],84:[function(e,t){"use strict";function n(e,t,n){r.call(this,e,t,n)}var r=e("./SyntheticMouseEvent"),o={dataTransfer:null};r.augmentClass(n,o),t.exports=n},{"./SyntheticMouseEvent":89}],85:[function(e,t){"use strict";function n(e,t,n){this.dispatchConfig=e,this.dispatchMarker=t,this.nativeEvent=n;var r=this.constructor.Interface;for(var o in r)if(r.hasOwnProperty(o)){var i=r[o];this[o]=i?i(n):n[o]}var s=null!=n.defaultPrevented?n.defaultPrevented:n.returnValue===!1;this.isDefaultPrevented=s?a.thatReturnsTrue:a.thatReturnsFalse,this.isPropagationStopped=a.thatReturnsFalse}var r=e("./PooledClass"),o=e("./Object.assign"),a=e("./emptyFunction"),i=e("./getEventTarget"),s={type:null,target:i,currentTarget:a.thatReturnsNull,eventPhase:null,bubbles:null,cancelable:null,timeStamp:function(e){return e.timeStamp||Date.now()},defaultPrevented:null,isTrusted:null};o(n.prototype,{preventDefault:function(){this.defaultPrevented=!0;var e=this.nativeEvent;e.preventDefault?e.preventDefault():e.returnValue=!1,this.isDefaultPrevented=a.thatReturnsTrue},stopPropagation:function(){var e=this.nativeEvent;e.stopPropagation?e.stopPropagation():e.cancelBubble=!0,this.isPropagationStopped=a.thatReturnsTrue},persist:function(){this.isPersistent=a.thatReturnsTrue},isPersistent:a.thatReturnsFalse,destructor:function(){var e=this.constructor.Interface;for(var t in e)this[t]=null;this.dispatchConfig=null,this.dispatchMarker=null,this.nativeEvent=null}}),n.Interface=s,n.augmentClass=function(e,t){var n=this,a=Object.create(n.prototype);o(a,e.prototype),e.prototype=a,e.prototype.constructor=e,e.Interface=o({},n.Interface,t),e.augmentClass=n.augmentClass,r.addPoolingTo(e,r.threeArgumentPooler)},r.addPoolingTo(n,r.threeArgumentPooler),t.exports=n},{"./Object.assign":27,"./PooledClass":28,"./emptyFunction":105,"./getEventTarget":115}],86:[function(e,t){"use strict";function n(e,t,n){r.call(this,e,t,n)}var r=e("./SyntheticUIEvent"),o={relatedTarget:null};r.augmentClass(n,o),t.exports=n},{"./SyntheticUIEvent":91}],87:[function(e,t){"use strict";function n(e,t,n){r.call(this,e,t,n)}var r=e("./SyntheticEvent"),o={data:null};r.augmentClass(n,o),t.exports=n},{"./SyntheticEvent":85}],88:[function(e,t){"use strict";function n(e,t,n){r.call(this,e,t,n)}var r=e("./SyntheticUIEvent"),o=e("./getEventCharCode"),a=e("./getEventKey"),i=e("./getEventModifierState"),s={key:a,location:null,ctrlKey:null,shiftKey:null,altKey:null,metaKey:null,repeat:null,locale:null,getModifierState:i,charCode:function(e){return"keypress"===e.type?o(e):0},keyCode:function(e){return"keydown"===e.type||"keyup"===e.type?e.keyCode:0},which:function(e){return"keypress"===e.type?o(e):"keydown"===e.type||"keyup"===e.type?e.keyCode:0}};r.augmentClass(n,s),t.exports=n},{"./SyntheticUIEvent":91,"./getEventCharCode":112,"./getEventKey":113,"./getEventModifierState":114}],89:[function(e,t){"use strict";function n(e,t,n){r.call(this,e,t,n)}var r=e("./SyntheticUIEvent"),o=e("./ViewportMetrics"),a=e("./getEventModifierState"),i={screenX:null,screenY:null,clientX:null,clientY:null,ctrlKey:null,shiftKey:null,altKey:null,metaKey:null,getModifierState:a,button:function(e){var t=e.button;return"which"in e?t:2===t?2:4===t?1:0},buttons:null,relatedTarget:function(e){return e.relatedTarget||(e.fromElement===e.srcElement?e.toElement:e.fromElement)},pageX:function(e){return"pageX"in e?e.pageX:e.clientX+o.currentScrollLeft},pageY:function(e){return"pageY"in e?e.pageY:e.clientY+o.currentScrollTop}};r.augmentClass(n,i),t.exports=n},{"./SyntheticUIEvent":91,"./ViewportMetrics":94,"./getEventModifierState":114}],90:[function(e,t){"use strict";function n(e,t,n){r.call(this,e,t,n)}var r=e("./SyntheticUIEvent"),o=e("./getEventModifierState"),a={touches:null,targetTouches:null,changedTouches:null,altKey:null,metaKey:null,ctrlKey:null,shiftKey:null,getModifierState:o};r.augmentClass(n,a),t.exports=n},{"./SyntheticUIEvent":91,"./getEventModifierState":114}],91:[function(e,t){"use strict";function n(e,t,n){r.call(this,e,t,n)}var r=e("./SyntheticEvent"),o=e("./getEventTarget"),a={view:function(e){if(e.view)return e.view;var t=o(e);if(null!=t&&t.window===t)return t;var n=t.ownerDocument;return n?n.defaultView||n.parentWindow:window},detail:function(e){return e.detail||0}};r.augmentClass(n,a),t.exports=n},{"./SyntheticEvent":85,"./getEventTarget":115}],92:[function(e,t){"use strict";function n(e,t,n){r.call(this,e,t,n)}var r=e("./SyntheticMouseEvent"),o={deltaX:function(e){return"deltaX"in e?e.deltaX:"wheelDeltaX"in e?-e.wheelDeltaX:0},deltaY:function(e){return"deltaY"in e?e.deltaY:"wheelDeltaY"in e?-e.wheelDeltaY:"wheelDelta"in e?-e.wheelDelta:0},deltaZ:null,deltaMode:null};r.augmentClass(n,o),t.exports=n},{"./SyntheticMouseEvent":89}],93:[function(e,t){"use strict";var n=e("./invariant"),r={reinitializeTransaction:function(){this.transactionWrappers=this.getTransactionWrappers(),this.wrapperInitData?this.wrapperInitData.length=0:this.wrapperInitData=[],this._isInTransaction=!1},_isInTransaction:!1,getTransactionWrappers:null,isInTransaction:function(){return!!this._isInTransaction},perform:function(e,t,r,o,a,i,s,u){n(!this.isInTransaction());var c,l;try{this._isInTransaction=!0,c=!0,this.initializeAll(0),l=e.call(t,r,o,a,i,s,u),c=!1}finally{try{if(c)try{this.closeAll(0)}catch(p){}else this.closeAll(0)}finally{this._isInTransaction=!1}}return l},initializeAll:function(e){for(var t=this.transactionWrappers,n=e;n<t.length;n++){var r=t[n];try{this.wrapperInitData[n]=o.OBSERVED_ERROR,this.wrapperInitData[n]=r.initialize?r.initialize.call(this):null}finally{if(this.wrapperInitData[n]===o.OBSERVED_ERROR)try{this.initializeAll(n+1)}catch(a){}}}},closeAll:function(e){n(this.isInTransaction());for(var t=this.transactionWrappers,r=e;r<t.length;r++){var a,i=t[r],s=this.wrapperInitData[r];try{a=!0,s!==o.OBSERVED_ERROR&&i.close&&i.close.call(this,s),a=!1}finally{if(a)try{this.closeAll(r+1)}catch(u){}}}this.wrapperInitData.length=0}},o={Mixin:r,OBSERVED_ERROR:{}};t.exports=o},{"./invariant":124}],94:[function(e,t){"use strict";var n=e("./getUnboundedScrollPosition"),r={currentScrollLeft:0,currentScrollTop:0,refreshScrollValues:function(){var e=n(window);r.currentScrollLeft=e.x,r.currentScrollTop=e.y}};t.exports=r},{"./getUnboundedScrollPosition":120}],95:[function(e,t){"use strict";function n(e,t){if(r(null!=t),null==e)return t;var n=Array.isArray(e),o=Array.isArray(t);return n&&o?(e.push.apply(e,t),e):n?(e.push(t),e):o?[e].concat(t):[e,t]}var r=e("./invariant");t.exports=n},{"./invariant":124}],96:[function(e,t){"use strict";function n(e){for(var t=1,n=0,o=0;o<e.length;o++)t=(t+e.charCodeAt(o))%r,n=(n+t)%r;return t|n<<16}var r=65521;t.exports=n},{}],97:[function(e,t){function n(e){return e.replace(r,function(e,t){return t.toUpperCase()})}var r=/-(.)/g;t.exports=n},{}],98:[function(e,t){"use strict";function n(e){return r(e.replace(o,"ms-"))}var r=e("./camelize"),o=/^-ms-/;t.exports=n},{"./camelize":97}],99:[function(e,t){function n(e,t){return e&&t?e===t?!0:r(e)?!1:r(t)?n(e,t.parentNode):e.contains?e.contains(t):e.compareDocumentPosition?!!(16&e.compareDocumentPosition(t)):!1:!1}var r=e("./isTextNode");t.exports=n},{"./isTextNode":128}],100:[function(e,t){function n(e){return!!e&&("object"==typeof e||"function"==typeof e)&&"length"in e&&!("setInterval"in e)&&"number"!=typeof e.nodeType&&(Array.isArray(e)||"callee"in e||"item"in e)}function r(e){return n(e)?Array.isArray(e)?e.slice():o(e):[e]}var o=e("./toArray");t.exports=r},{"./toArray":139}],101:[function(e,t){"use strict";function n(e){var t=o.createFactory(e),n=r.createClass({displayName:"ReactFullPageComponent"+e,componentWillUnmount:function(){a(!1)},render:function(){return t(this.props)}});return n}var r=e("./ReactCompositeComponent"),o=e("./ReactElement"),a=e("./invariant");t.exports=n},{"./ReactCompositeComponent":34,"./ReactElement":50,"./invariant":124}],102:[function(e,t){function n(e){var t=e.match(c);return t&&t[1].toLowerCase()}function r(e,t){var r=u;s(!!u);var o=n(e),c=o&&i(o);if(c){r.innerHTML=c[1]+e+c[2];for(var l=c[0];l--;)r=r.lastChild}else r.innerHTML=e;var p=r.getElementsByTagName("script");p.length&&(s(t),a(p).forEach(t));for(var d=a(r.childNodes);r.lastChild;)r.removeChild(r.lastChild);return d}var o=e("./ExecutionEnvironment"),a=e("./createArrayFrom"),i=e("./getMarkupWrap"),s=e("./invariant"),u=o.canUseDOM?document.createElement("div"):null,c=/^\s*<(\w+)/;t.exports=r},{"./ExecutionEnvironment":22,"./createArrayFrom":100,"./getMarkupWrap":116,"./invariant":124}],103:[function(e,t){"use strict";function n(e,t){var n=null==t||"boolean"==typeof t||""===t;if(n)return"";var r=isNaN(t);return r||0===t||o.hasOwnProperty(e)&&o[e]?""+t:("string"==typeof t&&(t=t.trim()),t+"px")}var r=e("./CSSProperty"),o=r.isUnitlessNumber;t.exports=n},{"./CSSProperty":4}],104:[function(e,t){function n(e,t,n,r,o){return o}e("./Object.assign"),e("./warning");t.exports=n},{"./Object.assign":27,"./warning":141}],105:[function(e,t){function n(e){return function(){return e}}function r(){}r.thatReturns=n,r.thatReturnsFalse=n(!1),r.thatReturnsTrue=n(!0),r.thatReturnsNull=n(null),r.thatReturnsThis=function(){return this},r.thatReturnsArgument=function(e){return e},t.exports=r},{}],106:[function(e,t){"use strict";var n={};t.exports=n},{}],107:[function(e,t){"use strict";function n(e){return o[e]}function r(e){return(""+e).replace(a,n)}var o={"&":"&amp;",">":"&gt;","<":"&lt;",'"':"&quot;","'":"&#x27;"},a=/[&><"']/g;t.exports=r},{}],108:[function(e,t){"use strict";function n(e,t,n){var r=e,a=!r.hasOwnProperty(n);if(a&&null!=t){var i,s=typeof t;i="string"===s?o(t):"number"===s?o(""+t):t,r[n]=i}}function r(e){if(null==e)return e;var t={};return a(e,n,t),t}{var o=e("./ReactTextComponent"),a=e("./traverseAllChildren");e("./warning")}t.exports=r},{"./ReactTextComponent":76,"./traverseAllChildren":140,"./warning":141}],109:[function(e,t){"use strict";function n(e){try{e.focus()}catch(t){}}t.exports=n},{}],110:[function(e,t){"use strict";var n=function(e,t,n){Array.isArray(e)?e.forEach(t,n):e&&t.call(n,e)};t.exports=n},{}],111:[function(e,t){function n(){try{return document.activeElement||document.body}catch(e){return document.body}}t.exports=n},{}],112:[function(e,t){"use strict";function n(e){var t,n=e.keyCode;return"charCode"in e?(t=e.charCode,0===t&&13===n&&(t=13)):t=n,t>=32||13===t?t:0}t.exports=n},{}],113:[function(e,t){"use strict";function n(e){if(e.key){var t=o[e.key]||e.key;if("Unidentified"!==t)return t}if("keypress"===e.type){var n=r(e);return 13===n?"Enter":String.fromCharCode(n)}return"keydown"===e.type||"keyup"===e.type?a[e.keyCode]||"Unidentified":""}var r=e("./getEventCharCode"),o={Esc:"Escape",Spacebar:" ",Left:"ArrowLeft",Up:"ArrowUp",Right:"ArrowRight",Down:"ArrowDown",Del:"Delete",Win:"OS",Menu:"ContextMenu",Apps:"ContextMenu",Scroll:"ScrollLock",MozPrintableKey:"Unidentified"},a={8:"Backspace",9:"Tab",12:"Clear",13:"Enter",16:"Shift",17:"Control",18:"Alt",19:"Pause",20:"CapsLock",27:"Escape",32:" ",33:"PageUp",34:"PageDown",35:"End",36:"Home",37:"ArrowLeft",38:"ArrowUp",39:"ArrowRight",40:"ArrowDown",45:"Insert",46:"Delete",112:"F1",113:"F2",114:"F3",115:"F4",116:"F5",117:"F6",118:"F7",119:"F8",120:"F9",121:"F10",122:"F11",123:"F12",144:"NumLock",145:"ScrollLock",224:"Meta"};t.exports=n},{"./getEventCharCode":112}],114:[function(e,t){"use strict";function n(e){var t=this,n=t.nativeEvent;if(n.getModifierState)return n.getModifierState(e);var r=o[e];return r?!!n[r]:!1}function r(){return n}var o={Alt:"altKey",Control:"ctrlKey",Meta:"metaKey",Shift:"shiftKey"};t.exports=r},{}],115:[function(e,t){"use strict";function n(e){var t=e.target||e.srcElement||window;return 3===t.nodeType?t.parentNode:t}t.exports=n},{}],116:[function(e,t){function n(e){return o(!!a),p.hasOwnProperty(e)||(e="*"),i.hasOwnProperty(e)||(a.innerHTML="*"===e?"<link />":"<"+e+"></"+e+">",i[e]=!a.firstChild),i[e]?p[e]:null}var r=e("./ExecutionEnvironment"),o=e("./invariant"),a=r.canUseDOM?document.createElement("div"):null,i={circle:!0,defs:!0,ellipse:!0,g:!0,line:!0,linearGradient:!0,path:!0,polygon:!0,polyline:!0,radialGradient:!0,rect:!0,stop:!0,text:!0},s=[1,'<select multiple="true">',"</select>"],u=[1,"<table>","</table>"],c=[3,"<table><tbody><tr>","</tr></tbody></table>"],l=[1,"<svg>","</svg>"],p={"*":[1,"?<div>","</div>"],area:[1,"<map>","</map>"],col:[2,"<table><tbody></tbody><colgroup>","</colgroup></table>"],legend:[1,"<fieldset>","</fieldset>"],param:[1,"<object>","</object>"],tr:[2,"<table><tbody>","</tbody></table>"],optgroup:s,option:s,caption:u,colgroup:u,tbody:u,tfoot:u,thead:u,td:c,th:c,circle:l,defs:l,ellipse:l,g:l,line:l,linearGradient:l,path:l,polygon:l,polyline:l,radialGradient:l,rect:l,stop:l,text:l};t.exports=n},{"./ExecutionEnvironment":22,"./invariant":124}],117:[function(e,t){"use strict";function n(e){for(;e&&e.firstChild;)e=e.firstChild;return e}function r(e){for(;e;){if(e.nextSibling)return e.nextSibling;e=e.parentNode}}function o(e,t){for(var o=n(e),a=0,i=0;o;){if(3==o.nodeType){if(i=a+o.textContent.length,t>=a&&i>=t)return{node:o,offset:t-a};a=i}o=n(r(o))}}t.exports=o},{}],118:[function(e,t){"use strict";function n(e){return e?e.nodeType===r?e.documentElement:e.firstChild:null}var r=9;t.exports=n},{}],119:[function(e,t){"use strict";function n(){return!o&&r.canUseDOM&&(o="textContent"in document.documentElement?"textContent":"innerText"),o}var r=e("./ExecutionEnvironment"),o=null;t.exports=n},{"./ExecutionEnvironment":22}],120:[function(e,t){"use strict";function n(e){return e===window?{x:window.pageXOffset||document.documentElement.scrollLeft,y:window.pageYOffset||document.documentElement.scrollTop}:{x:e.scrollLeft,y:e.scrollTop}}t.exports=n},{}],121:[function(e,t){function n(e){return e.replace(r,"-$1").toLowerCase()}var r=/([A-Z])/g;t.exports=n},{}],122:[function(e,t){"use strict";function n(e){return r(e).replace(o,"-ms-")}var r=e("./hyphenate"),o=/^ms-/;t.exports=n},{"./hyphenate":121}],123:[function(e,t){"use strict";function n(e,t){var n;return n="string"==typeof e.type?r.createInstanceForTag(e.type,e.props,t):new e.type(e.props),n.construct(e),n}{var r=(e("./warning"),e("./ReactElement"),e("./ReactLegacyElement"),e("./ReactNativeComponent"));e("./ReactEmptyComponent")}t.exports=n},{"./ReactElement":50,"./ReactEmptyComponent":52,"./ReactLegacyElement":59,"./ReactNativeComponent":64,"./warning":141}],124:[function(e,t){"use strict";var n=function(e,t,n,r,o,a,i,s){if(!e){var u;if(void 0===t)u=new Error("Minified exception occurred; use the non-minified dev environment for the full error message and additional helpful warnings.");else{var c=[n,r,o,a,i,s],l=0;u=new Error("Invariant Violation: "+t.replace(/%s/g,function(){return c[l++]}))}throw u.framesToPop=1,u}};t.exports=n},{}],125:[function(e,t){"use strict";function n(e,t){if(!o.canUseDOM||t&&!("addEventListener"in document))return!1;var n="on"+e,a=n in document;if(!a){var i=document.createElement("div");i.setAttribute(n,"return;"),a="function"==typeof i[n]}return!a&&r&&"wheel"===e&&(a=document.implementation.hasFeature("Events.wheel","3.0")),a}var r,o=e("./ExecutionEnvironment");o.canUseDOM&&(r=document.implementation&&document.implementation.hasFeature&&document.implementation.hasFeature("","")!==!0),t.exports=n},{"./ExecutionEnvironment":22}],126:[function(e,t){function n(e){return!(!e||!("function"==typeof Node?e instanceof Node:"object"==typeof e&&"number"==typeof e.nodeType&&"string"==typeof e.nodeName))}t.exports=n},{}],127:[function(e,t){"use strict";function n(e){return e&&("INPUT"===e.nodeName&&r[e.type]||"TEXTAREA"===e.nodeName)}var r={color:!0,date:!0,datetime:!0,"datetime-local":!0,email:!0,month:!0,number:!0,password:!0,range:!0,search:!0,tel:!0,text:!0,time:!0,url:!0,week:!0};t.exports=n},{}],128:[function(e,t){function n(e){return r(e)&&3==e.nodeType}var r=e("./isNode");t.exports=n},{"./isNode":126}],129:[function(e,t){"use strict";function n(e){e||(e="");var t,n=arguments.length;if(n>1)for(var r=1;n>r;r++)t=arguments[r],t&&(e=(e?e+" ":"")+t);return e}t.exports=n},{}],130:[function(e,t){"use strict";var n=e("./invariant"),r=function(e){var t,r={};n(e instanceof Object&&!Array.isArray(e));for(t in e)e.hasOwnProperty(t)&&(r[t]=t);return r};t.exports=r},{"./invariant":124}],131:[function(e,t){var n=function(e){var t;for(t in e)if(e.hasOwnProperty(t))return t;return null};t.exports=n},{}],132:[function(e,t){"use strict";function n(e,t,n){if(!e)return null;var o={};for(var a in e)r.call(e,a)&&(o[a]=t.call(n,e[a],a,e));return o}var r=Object.prototype.hasOwnProperty;t.exports=n},{}],133:[function(e,t){"use strict";function n(e){var t={};return function(n){return t.hasOwnProperty(n)?t[n]:t[n]=e.call(this,n)}}t.exports=n},{}],134:[function(e,t){"use strict";function n(e){r(e&&!/[^a-z0-9_]/.test(e))}var r=e("./invariant");t.exports=n},{"./invariant":124}],135:[function(e,t){"use strict";function n(e){return o(r.isValidElement(e)),e}var r=e("./ReactElement"),o=e("./invariant");t.exports=n},{"./ReactElement":50,"./invariant":124}],136:[function(e,t){"use strict";var n=e("./ExecutionEnvironment"),r=/^[ \r\n\t\f]/,o=/<(!--|link|noscript|meta|script|style)[ \r\n\t\f\/>]/,a=function(e,t){e.innerHTML=t};if(n.canUseDOM){var i=document.createElement("div");i.innerHTML=" ",""===i.innerHTML&&(a=function(e,t){if(e.parentNode&&e.parentNode.replaceChild(e,e),r.test(t)||"<"===t[0]&&o.test(t)){e.innerHTML=""+t;var n=e.firstChild;1===n.data.length?e.removeChild(n):n.deleteData(0,1)}else e.innerHTML=t})}t.exports=a},{"./ExecutionEnvironment":22}],137:[function(e,t){"use strict";
function n(e,t){if(e===t)return!0;var n;for(n in e)if(e.hasOwnProperty(n)&&(!t.hasOwnProperty(n)||e[n]!==t[n]))return!1;for(n in t)if(t.hasOwnProperty(n)&&!e.hasOwnProperty(n))return!1;return!0}t.exports=n},{}],138:[function(e,t){"use strict";function n(e,t){return e&&t&&e.type===t.type&&e.key===t.key&&e._owner===t._owner?!0:!1}t.exports=n},{}],139:[function(e,t){function n(e){var t=e.length;if(r(!Array.isArray(e)&&("object"==typeof e||"function"==typeof e)),r("number"==typeof t),r(0===t||t-1 in e),e.hasOwnProperty)try{return Array.prototype.slice.call(e)}catch(n){}for(var o=Array(t),a=0;t>a;a++)o[a]=e[a];return o}var r=e("./invariant");t.exports=n},{"./invariant":124}],140:[function(e,t){"use strict";function n(e){return d[e]}function r(e,t){return e&&null!=e.key?a(e.key):t.toString(36)}function o(e){return(""+e).replace(f,n)}function a(e){return"$"+o(e)}function i(e,t,n){return null==e?0:h(e,"",0,t,n)}var s=e("./ReactElement"),u=e("./ReactInstanceHandles"),c=e("./invariant"),l=u.SEPARATOR,p=":",d={"=":"=0",".":"=1",":":"=2"},f=/[=.:]/g,h=function(e,t,n,o,i){var u,d,f=0;if(Array.isArray(e))for(var m=0;m<e.length;m++){var v=e[m];u=t+(t?p:l)+r(v,m),d=n+f,f+=h(v,u,d,o,i)}else{var g=typeof e,y=""===t,E=y?l+r(e,0):t;if(null==e||"boolean"===g)o(i,null,E,n),f=1;else if("string"===g||"number"===g||s.isValidElement(e))o(i,e,E,n),f=1;else if("object"===g){c(!e||1!==e.nodeType);for(var C in e)e.hasOwnProperty(C)&&(u=t+(t?p:l)+a(C)+p+r(e[C],0),d=n+f,f+=h(e[C],u,d,o,i))}}return f};t.exports=i},{"./ReactElement":50,"./ReactInstanceHandles":58,"./invariant":124}],141:[function(e,t){"use strict";var n=e("./emptyFunction"),r=n;t.exports=r},{"./emptyFunction":105}]},{},[1])(1)});
}).call(this,typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})
},{}],46:[function(require,module,exports){
/**
 * selectize.js (v0.11.0)
 * Copyright (c) 2013 Brian Reavis & contributors
 *
 * Licensed under the Apache License, Version 2.0 (the "License"); you may not use this
 * file except in compliance with the License. You may obtain a copy of the License at:
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software distributed under
 * the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF
 * ANY KIND, either express or implied. See the License for the specific language
 * governing permissions and limitations under the License.
 *
 * @author Brian Reavis <brian@thirdroute.com>
 */

/*jshint curly:false */
/*jshint browser:true */

(function(root, factory) {
	if (typeof define === 'function' && define.amd) {
		define(['jquery','sifter','microplugin'], factory);
	} else if (typeof exports === 'object') {
		module.exports = factory(require('jquery'), require('sifter'), require('microplugin'));
	} else {
		root.Selectize = factory(root.jQuery, root.Sifter, root.MicroPlugin);
	}
}(this, function($, Sifter, MicroPlugin) {
	'use strict';

	var highlight = function($element, pattern) {
		if (typeof pattern === 'string' && !pattern.length) return;
		var regex = (typeof pattern === 'string') ? new RegExp(pattern, 'i') : pattern;
	
		var highlight = function(node) {
			var skip = 0;
			if (node.nodeType === 3) {
				var pos = node.data.search(regex);
				if (pos >= 0 && node.data.length > 0) {
					var match = node.data.match(regex);
					var spannode = document.createElement('span');
					spannode.className = 'highlight';
					var middlebit = node.splitText(pos);
					var endbit = middlebit.splitText(match[0].length);
					var middleclone = middlebit.cloneNode(true);
					spannode.appendChild(middleclone);
					middlebit.parentNode.replaceChild(spannode, middlebit);
					skip = 1;
				}
			} else if (node.nodeType === 1 && node.childNodes && !/(script|style)/i.test(node.tagName)) {
				for (var i = 0; i < node.childNodes.length; ++i) {
					i += highlight(node.childNodes[i]);
				}
			}
			return skip;
		};
	
		return $element.each(function() {
			highlight(this);
		});
	};
	
	var MicroEvent = function() {};
	MicroEvent.prototype = {
		on: function(event, fct){
			this._events = this._events || {};
			this._events[event] = this._events[event] || [];
			this._events[event].push(fct);
		},
		off: function(event, fct){
			var n = arguments.length;
			if (n === 0) return delete this._events;
			if (n === 1) return delete this._events[event];
	
			this._events = this._events || {};
			if (event in this._events === false) return;
			this._events[event].splice(this._events[event].indexOf(fct), 1);
		},
		trigger: function(event /* , args... */){
			this._events = this._events || {};
			if (event in this._events === false) return;
			for (var i = 0; i < this._events[event].length; i++){
				this._events[event][i].apply(this, Array.prototype.slice.call(arguments, 1));
			}
		}
	};
	
	/**
	 * Mixin will delegate all MicroEvent.js function in the destination object.
	 *
	 * - MicroEvent.mixin(Foobar) will make Foobar able to use MicroEvent
	 *
	 * @param {object} the object which will support MicroEvent
	 */
	MicroEvent.mixin = function(destObject){
		var props = ['on', 'off', 'trigger'];
		for (var i = 0; i < props.length; i++){
			destObject.prototype[props[i]] = MicroEvent.prototype[props[i]];
		}
	};
	
	var IS_MAC        = /Mac/.test(navigator.userAgent);
	
	var KEY_A         = 65;
	var KEY_COMMA     = 188;
	var KEY_RETURN    = 13;
	var KEY_ESC       = 27;
	var KEY_LEFT      = 37;
	var KEY_UP        = 38;
	var KEY_P         = 80;
	var KEY_RIGHT     = 39;
	var KEY_DOWN      = 40;
	var KEY_N         = 78;
	var KEY_BACKSPACE = 8;
	var KEY_DELETE    = 46;
	var KEY_SHIFT     = 16;
	var KEY_CMD       = IS_MAC ? 91 : 17;
	var KEY_CTRL      = IS_MAC ? 18 : 17;
	var KEY_TAB       = 9;
	
	var TAG_SELECT    = 1;
	var TAG_INPUT     = 2;
	
	
	var isset = function(object) {
		return typeof object !== 'undefined';
	};
	
	/**
	 * Converts a scalar to its best string representation
	 * for hash keys and HTML attribute values.
	 *
	 * Transformations:
	 *   'str'     -> 'str'
	 *   null      -> ''
	 *   undefined -> ''
	 *   true      -> '1'
	 *   false     -> '0'
	 *   0         -> '0'
	 *   1         -> '1'
	 *
	 * @param {string} value
	 * @returns {string|null}
	 */
	var hash_key = function(value) {
		if (typeof value === 'undefined' || value === null) return null;
		if (typeof value === 'boolean') return value ? '1' : '0';
		return value + '';
	};
	
	/**
	 * Escapes a string for use within HTML.
	 *
	 * @param {string} str
	 * @returns {string}
	 */
	var escape_html = function(str) {
		return (str + '')
			.replace(/&/g, '&amp;')
			.replace(/</g, '&lt;')
			.replace(/>/g, '&gt;')
			.replace(/"/g, '&quot;');
	};
	
	/**
	 * Escapes "$" characters in replacement strings.
	 *
	 * @param {string} str
	 * @returns {string}
	 */
	var escape_replace = function(str) {
		return (str + '').replace(/\$/g, '$$$$');
	};
	
	var hook = {};
	
	/**
	 * Wraps `method` on `self` so that `fn`
	 * is invoked before the original method.
	 *
	 * @param {object} self
	 * @param {string} method
	 * @param {function} fn
	 */
	hook.before = function(self, method, fn) {
		var original = self[method];
		self[method] = function() {
			fn.apply(self, arguments);
			return original.apply(self, arguments);
		};
	};
	
	/**
	 * Wraps `method` on `self` so that `fn`
	 * is invoked after the original method.
	 *
	 * @param {object} self
	 * @param {string} method
	 * @param {function} fn
	 */
	hook.after = function(self, method, fn) {
		var original = self[method];
		self[method] = function() {
			var result = original.apply(self, arguments);
			fn.apply(self, arguments);
			return result;
		};
	};
	
	/**
	 * Builds a hash table out of an array of
	 * objects, using the specified `key` within
	 * each object.
	 *
	 * @param {string} key
	 * @param {mixed} objects
	 */
	var build_hash_table = function(key, objects) {
		if (!$.isArray(objects)) return objects;
		var i, n, table = {};
		for (i = 0, n = objects.length; i < n; i++) {
			if (objects[i].hasOwnProperty(key)) {
				table[objects[i][key]] = objects[i];
			}
		}
		return table;
	};
	
	/**
	 * Wraps `fn` so that it can only be invoked once.
	 *
	 * @param {function} fn
	 * @returns {function}
	 */
	var once = function(fn) {
		var called = false;
		return function() {
			if (called) return;
			called = true;
			fn.apply(this, arguments);
		};
	};
	
	/**
	 * Wraps `fn` so that it can only be called once
	 * every `delay` milliseconds (invoked on the falling edge).
	 *
	 * @param {function} fn
	 * @param {int} delay
	 * @returns {function}
	 */
	var debounce = function(fn, delay) {
		var timeout;
		return function() {
			var self = this;
			var args = arguments;
			window.clearTimeout(timeout);
			timeout = window.setTimeout(function() {
				fn.apply(self, args);
			}, delay);
		};
	};
	
	/**
	 * Debounce all fired events types listed in `types`
	 * while executing the provided `fn`.
	 *
	 * @param {object} self
	 * @param {array} types
	 * @param {function} fn
	 */
	var debounce_events = function(self, types, fn) {
		var type;
		var trigger = self.trigger;
		var event_args = {};
	
		// override trigger method
		self.trigger = function() {
			var type = arguments[0];
			if (types.indexOf(type) !== -1) {
				event_args[type] = arguments;
			} else {
				return trigger.apply(self, arguments);
			}
		};
	
		// invoke provided function
		fn.apply(self, []);
		self.trigger = trigger;
	
		// trigger queued events
		for (type in event_args) {
			if (event_args.hasOwnProperty(type)) {
				trigger.apply(self, event_args[type]);
			}
		}
	};
	
	/**
	 * A workaround for http://bugs.jquery.com/ticket/6696
	 *
	 * @param {object} $parent - Parent element to listen on.
	 * @param {string} event - Event name.
	 * @param {string} selector - Descendant selector to filter by.
	 * @param {function} fn - Event handler.
	 */
	var watchChildEvent = function($parent, event, selector, fn) {
		$parent.on(event, selector, function(e) {
			var child = e.target;
			while (child && child.parentNode !== $parent[0]) {
				child = child.parentNode;
			}
			e.currentTarget = child;
			return fn.apply(this, [e]);
		});
	};
	
	/**
	 * Determines the current selection within a text input control.
	 * Returns an object containing:
	 *   - start
	 *   - length
	 *
	 * @param {object} input
	 * @returns {object}
	 */
	var getSelection = function(input) {
		var result = {};
		if ('selectionStart' in input) {
			result.start = input.selectionStart;
			result.length = input.selectionEnd - result.start;
		} else if (document.selection) {
			input.focus();
			var sel = document.selection.createRange();
			var selLen = document.selection.createRange().text.length;
			sel.moveStart('character', -input.value.length);
			result.start = sel.text.length - selLen;
			result.length = selLen;
		}
		return result;
	};
	
	/**
	 * Copies CSS properties from one element to another.
	 *
	 * @param {object} $from
	 * @param {object} $to
	 * @param {array} properties
	 */
	var transferStyles = function($from, $to, properties) {
		var i, n, styles = {};
		if (properties) {
			for (i = 0, n = properties.length; i < n; i++) {
				styles[properties[i]] = $from.css(properties[i]);
			}
		} else {
			styles = $from.css();
		}
		$to.css(styles);
	};
	
	/**
	 * Measures the width of a string within a
	 * parent element (in pixels).
	 *
	 * @param {string} str
	 * @param {object} $parent
	 * @returns {int}
	 */
	var measureString = function(str, $parent) {
		if (!str) {
			return 0;
		}
	
		var $test = $('<test>').css({
			position: 'absolute',
			top: -99999,
			left: -99999,
			width: 'auto',
			padding: 0,
			whiteSpace: 'pre'
		}).text(str).appendTo('body');
	
		transferStyles($parent, $test, [
			'letterSpacing',
			'fontSize',
			'fontFamily',
			'fontWeight',
			'textTransform'
		]);
	
		var width = $test.width();
		$test.remove();
	
		return width;
	};
	
	/**
	 * Sets up an input to grow horizontally as the user
	 * types. If the value is changed manually, you can
	 * trigger the "update" handler to resize:
	 *
	 * $input.trigger('update');
	 *
	 * @param {object} $input
	 */
	var autoGrow = function($input) {
		var currentWidth = null;
	
		var update = function(e, options) {
			var value, keyCode, printable, placeholder, width;
			var shift, character, selection;
			e = e || window.event || {};
			options = options || {};
	
			if (e.metaKey || e.altKey) return;
			if (!options.force && $input.data('grow') === false) return;
	
			value = $input.val();
			if (e.type && e.type.toLowerCase() === 'keydown') {
				keyCode = e.keyCode;
				printable = (
					(keyCode >= 97 && keyCode <= 122) || // a-z
					(keyCode >= 65 && keyCode <= 90)  || // A-Z
					(keyCode >= 48 && keyCode <= 57)  || // 0-9
					keyCode === 32 // space
				);
	
				if (keyCode === KEY_DELETE || keyCode === KEY_BACKSPACE) {
					selection = getSelection($input[0]);
					if (selection.length) {
						value = value.substring(0, selection.start) + value.substring(selection.start + selection.length);
					} else if (keyCode === KEY_BACKSPACE && selection.start) {
						value = value.substring(0, selection.start - 1) + value.substring(selection.start + 1);
					} else if (keyCode === KEY_DELETE && typeof selection.start !== 'undefined') {
						value = value.substring(0, selection.start) + value.substring(selection.start + 1);
					}
				} else if (printable) {
					shift = e.shiftKey;
					character = String.fromCharCode(e.keyCode);
					if (shift) character = character.toUpperCase();
					else character = character.toLowerCase();
					value += character;
				}
			}
	
			placeholder = $input.attr('placeholder');
			if (!value && placeholder) {
				value = placeholder;
			}
	
			width = measureString(value, $input) + 4;
			if (width !== currentWidth) {
				currentWidth = width;
				$input.width(width);
				$input.triggerHandler('resize');
			}
		};
	
		$input.on('keydown keyup update blur', update);
		update();
	};
	
	var Selectize = function($input, settings) {
		var key, i, n, dir, input, self = this;
		input = $input[0];
		input.selectize = self;
	
		// detect rtl environment
		dir = window.getComputedStyle ? window.getComputedStyle(input, null).getPropertyValue('direction') : input.currentStyle && input.currentStyle.direction;
		dir = dir || $input.parents('[dir]:first').attr('dir') || '';
	
		// setup default state
		$.extend(self, {
			settings         : settings,
			$input           : $input,
			tagType          : input.tagName.toLowerCase() === 'select' ? TAG_SELECT : TAG_INPUT,
			rtl              : /rtl/i.test(dir),
	
			eventNS          : '.selectize' + (++Selectize.count),
			highlightedValue : null,
			isOpen           : false,
			isDisabled       : false,
			isRequired       : $input.is('[required]'),
			isInvalid        : false,
			isLocked         : false,
			isFocused        : false,
			isInputHidden    : false,
			isSetup          : false,
			isShiftDown      : false,
			isCmdDown        : false,
			isCtrlDown       : false,
			ignoreFocus      : false,
			ignoreBlur       : false,
			ignoreHover      : false,
			hasOptions       : false,
			currentResults   : null,
			lastValue        : '',
			caretPos         : 0,
			loading          : 0,
			loadedSearches   : {},
	
			$activeOption    : null,
			$activeItems     : [],
	
			optgroups        : {},
			options          : {},
			userOptions      : {},
			items            : [],
			renderCache      : {},
			onSearchChange   : settings.loadThrottle === null ? self.onSearchChange : debounce(self.onSearchChange, settings.loadThrottle)
		});
	
		// search system
		self.sifter = new Sifter(this.options, {diacritics: settings.diacritics});
	
		// build options table
		$.extend(self.options, build_hash_table(settings.valueField, settings.options));
		delete self.settings.options;
	
		// build optgroup table
		$.extend(self.optgroups, build_hash_table(settings.optgroupValueField, settings.optgroups));
		delete self.settings.optgroups;
	
		// option-dependent defaults
		self.settings.mode = self.settings.mode || (self.settings.maxItems === 1 ? 'single' : 'multi');
		if (typeof self.settings.hideSelected !== 'boolean') {
			self.settings.hideSelected = self.settings.mode === 'multi';
		}
	
		if (self.settings.create) {
			self.canCreate = function(input) {
				var filter = self.settings.createFilter;
				return input.length
					&& (typeof filter !== 'function' || filter.apply(self, [input]))
					&& (typeof filter !== 'string' || new RegExp(filter).test(input))
					&& (!(filter instanceof RegExp) || filter.test(input));
			};
		}
	
		self.initializePlugins(self.settings.plugins);
		self.setupCallbacks();
		self.setupTemplates();
		self.setup();
	};
	
	// mixins
	// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
	
	MicroEvent.mixin(Selectize);
	MicroPlugin.mixin(Selectize);
	
	// methods
	// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
	
	$.extend(Selectize.prototype, {
	
		/**
		 * Creates all elements and sets up event bindings.
		 */
		setup: function() {
			var self      = this;
			var settings  = self.settings;
			var eventNS   = self.eventNS;
			var $window   = $(window);
			var $document = $(document);
			var $input    = self.$input;
	
			var $wrapper;
			var $control;
			var $control_input;
			var $dropdown;
			var $dropdown_content;
			var $dropdown_parent;
			var inputMode;
			var timeout_blur;
			var timeout_focus;
			var tab_index;
			var classes;
			var classes_plugins;
	
			inputMode         = self.settings.mode;
			tab_index         = $input.attr('tabindex') || '';
			classes           = $input.attr('class') || '';
	
			$wrapper          = $('<div>').addClass(settings.wrapperClass).addClass(classes).addClass(inputMode);
			$control          = $('<div>').addClass(settings.inputClass).addClass('items').appendTo($wrapper);
			$control_input    = $('<input type="text" autocomplete="off" />').appendTo($control).attr('tabindex', tab_index);
			$dropdown_parent  = $(settings.dropdownParent || $wrapper);
			$dropdown         = $('<div>').addClass(settings.dropdownClass).addClass(classes).addClass(inputMode).hide().appendTo($dropdown_parent);
			$dropdown_content = $('<div>').addClass(settings.dropdownContentClass).appendTo($dropdown);
	
			$wrapper.css({
				width: $input[0].style.width
			});
	
			if (self.plugins.names.length) {
				classes_plugins = 'plugin-' + self.plugins.names.join(' plugin-');
				$wrapper.addClass(classes_plugins);
				$dropdown.addClass(classes_plugins);
			}
	
			if ((settings.maxItems === null || settings.maxItems > 1) && self.tagType === TAG_SELECT) {
				$input.attr('multiple', 'multiple');
			}
	
			if (self.settings.placeholder) {
				$control_input.attr('placeholder', settings.placeholder);
			}
	
			if ($input.attr('autocorrect')) {
				$control_input.attr('autocorrect', $input.attr('autocorrect'));
			}
	
			if ($input.attr('autocapitalize')) {
				$control_input.attr('autocapitalize', $input.attr('autocapitalize'));
			}
	
			self.$wrapper          = $wrapper;
			self.$control          = $control;
			self.$control_input    = $control_input;
			self.$dropdown         = $dropdown;
			self.$dropdown_content = $dropdown_content;
	
			$dropdown.on('mouseenter', '[data-selectable]', function() { return self.onOptionHover.apply(self, arguments); });
			$dropdown.on('mousedown', '[data-selectable]', function() { return self.onOptionSelect.apply(self, arguments); });
			watchChildEvent($control, 'mousedown', '*:not(input)', function() { return self.onItemSelect.apply(self, arguments); });
			autoGrow($control_input);
	
			$control.on({
				mousedown : function() { return self.onMouseDown.apply(self, arguments); },
				click     : function() { return self.onClick.apply(self, arguments); }
			});
	
			$control_input.on({
				mousedown : function(e) { e.stopPropagation(); },
				keydown   : function() { return self.onKeyDown.apply(self, arguments); },
				keyup     : function() { return self.onKeyUp.apply(self, arguments); },
				keypress  : function() { return self.onKeyPress.apply(self, arguments); },
				resize    : function() { self.positionDropdown.apply(self, []); },
				blur      : function() { return self.onBlur.apply(self, arguments); },
				focus     : function() { self.ignoreBlur = false; return self.onFocus.apply(self, arguments); },
				paste     : function() { return self.onPaste.apply(self, arguments); }
			});
	
			$document.on('keydown' + eventNS, function(e) {
				self.isCmdDown = e[IS_MAC ? 'metaKey' : 'ctrlKey'];
				self.isCtrlDown = e[IS_MAC ? 'altKey' : 'ctrlKey'];
				self.isShiftDown = e.shiftKey;
			});
	
			$document.on('keyup' + eventNS, function(e) {
				if (e.keyCode === KEY_CTRL) self.isCtrlDown = false;
				if (e.keyCode === KEY_SHIFT) self.isShiftDown = false;
				if (e.keyCode === KEY_CMD) self.isCmdDown = false;
			});
	
			$document.on('mousedown' + eventNS, function(e) {
				if (self.isFocused) {
					// prevent events on the dropdown scrollbar from causing the control to blur
					if (e.target === self.$dropdown[0] || e.target.parentNode === self.$dropdown[0]) {
						return false;
					}
					// blur on click outside
					if (!self.$control.has(e.target).length && e.target !== self.$control[0]) {
						self.blur();
					}
				}
			});
	
			$window.on(['scroll' + eventNS, 'resize' + eventNS].join(' '), function() {
				if (self.isOpen) {
					self.positionDropdown.apply(self, arguments);
				}
			});
			$window.on('mousemove' + eventNS, function() {
				self.ignoreHover = false;
			});
	
			// store original children and tab index so that they can be
			// restored when the destroy() method is called.
			this.revertSettings = {
				$children : $input.children().detach(),
				tabindex  : $input.attr('tabindex')
			};
	
			$input.attr('tabindex', -1).hide().after(self.$wrapper);
	
			if ($.isArray(settings.items)) {
				self.setValue(settings.items);
				delete settings.items;
			}
	
			// feature detect for the validation API
			if ($input[0].validity) {
				$input.on('invalid' + eventNS, function(e) {
					e.preventDefault();
					self.isInvalid = true;
					self.refreshState();
				});
			}
	
			self.updateOriginalInput();
			self.refreshItems();
			self.refreshState();
			self.updatePlaceholder();
			self.isSetup = true;
	
			if ($input.is(':disabled')) {
				self.disable();
			}
	
			self.on('change', this.onChange);
	
			$input.data('selectize', self);
			$input.addClass('selectized');
			self.trigger('initialize');
	
			// preload options
			if (settings.preload === true) {
				self.onSearchChange('');
			}
	
		},
	
		/**
		 * Sets up default rendering functions.
		 */
		setupTemplates: function() {
			var self = this;
			var field_label = self.settings.labelField;
			var field_optgroup = self.settings.optgroupLabelField;
	
			var templates = {
				'optgroup': function(data) {
					return '<div class="optgroup">' + data.html + '</div>';
				},
				'optgroup_header': function(data, escape) {
					return '<div class="optgroup-header">' + escape(data[field_optgroup]) + '</div>';
				},
				'option': function(data, escape) {
					return '<div class="option">' + escape(data[field_label]) + '</div>';
				},
				'item': function(data, escape) {
					return '<div class="item">' + escape(data[field_label]) + '</div>';
				},
				'option_create': function(data, escape) {
					return '<div class="create">Add <strong>' + escape(data.input) + '</strong>&hellip;</div>';
				}
			};
	
			self.settings.render = $.extend({}, templates, self.settings.render);
		},
	
		/**
		 * Maps fired events to callbacks provided
		 * in the settings used when creating the control.
		 */
		setupCallbacks: function() {
			var key, fn, callbacks = {
				'initialize'     : 'onInitialize',
				'change'         : 'onChange',
				'item_add'       : 'onItemAdd',
				'item_remove'    : 'onItemRemove',
				'clear'          : 'onClear',
				'option_add'     : 'onOptionAdd',
				'option_remove'  : 'onOptionRemove',
				'option_clear'   : 'onOptionClear',
				'dropdown_open'  : 'onDropdownOpen',
				'dropdown_close' : 'onDropdownClose',
				'type'           : 'onType'
			};
	
			for (key in callbacks) {
				if (callbacks.hasOwnProperty(key)) {
					fn = this.settings[callbacks[key]];
					if (fn) this.on(key, fn);
				}
			}
		},
	
		/**
		 * Triggered when the main control element
		 * has a click event.
		 *
		 * @param {object} e
		 * @return {boolean}
		 */
		onClick: function(e) {
			var self = this;
	
			// necessary for mobile webkit devices (manual focus triggering
			// is ignored unless invoked within a click event)
			if (!self.isFocused) {
				self.focus();
				e.preventDefault();
			}
		},
	
		/**
		 * Triggered when the main control element
		 * has a mouse down event.
		 *
		 * @param {object} e
		 * @return {boolean}
		 */
		onMouseDown: function(e) {
			var self = this;
			var defaultPrevented = e.isDefaultPrevented();
			var $target = $(e.target);
	
			if (self.isFocused) {
				// retain focus by preventing native handling. if the
				// event target is the input it should not be modified.
				// otherwise, text selection within the input won't work.
				if (e.target !== self.$control_input[0]) {
					if (self.settings.mode === 'single') {
						// toggle dropdown
						self.isOpen ? self.close() : self.open();
					} else if (!defaultPrevented) {
						self.setActiveItem(null);
					}
					return false;
				}
			} else {
				// give control focus
				if (!defaultPrevented) {
					window.setTimeout(function() {
						self.focus();
					}, 0);
				}
			}
		},
	
		/**
		 * Triggered when the value of the control has been changed.
		 * This should propagate the event to the original DOM
		 * input / select element.
		 */
		onChange: function() {
			this.$input.trigger('change');
		},
	
	
		/**
		 * Triggered on <input> paste.
		 *
		 * @param {object} e
		 * @returns {boolean}
		 */
		onPaste: function(e) {
			var self = this;
			if (self.isFull() || self.isInputHidden || self.isLocked) {
				e.preventDefault();
			}
		},
	
		/**
		 * Triggered on <input> keypress.
		 *
		 * @param {object} e
		 * @returns {boolean}
		 */
		onKeyPress: function(e) {
			if (this.isLocked) return e && e.preventDefault();
			var character = String.fromCharCode(e.keyCode || e.which);
			if (this.settings.create && character === this.settings.delimiter) {
				this.createItem();
				e.preventDefault();
				return false;
			}
		},
	
		/**
		 * Triggered on <input> keydown.
		 *
		 * @param {object} e
		 * @returns {boolean}
		 */
		onKeyDown: function(e) {
			var isInput = e.target === this.$control_input[0];
			var self = this;
	
			if (self.isLocked) {
				if (e.keyCode !== KEY_TAB) {
					e.preventDefault();
				}
				return;
			}
	
			switch (e.keyCode) {
				case KEY_A:
					if (self.isCmdDown) {
						self.selectAll();
						return;
					}
					break;
				case KEY_ESC:
					self.close();
					return;
				case KEY_N:
					if (!e.ctrlKey || e.altKey) break;
				case KEY_DOWN:
					if (!self.isOpen && self.hasOptions) {
						self.open();
					} else if (self.$activeOption) {
						self.ignoreHover = true;
						var $next = self.getAdjacentOption(self.$activeOption, 1);
						if ($next.length) self.setActiveOption($next, true, true);
					}
					e.preventDefault();
					return;
				case KEY_P:
					if (!e.ctrlKey || e.altKey) break;
				case KEY_UP:
					if (self.$activeOption) {
						self.ignoreHover = true;
						var $prev = self.getAdjacentOption(self.$activeOption, -1);
						if ($prev.length) self.setActiveOption($prev, true, true);
					}
					e.preventDefault();
					return;
				case KEY_RETURN:
					if (self.isOpen && self.$activeOption) {
						self.onOptionSelect({currentTarget: self.$activeOption});
					}
					e.preventDefault();
					return;
				case KEY_LEFT:
					self.advanceSelection(-1, e);
					return;
				case KEY_RIGHT:
					self.advanceSelection(1, e);
					return;
				case KEY_TAB:
					if (self.settings.selectOnTab && self.isOpen && self.$activeOption) {
						self.onOptionSelect({currentTarget: self.$activeOption});
						e.preventDefault();
					}
					if (self.settings.create && self.createItem()) {
						e.preventDefault();
					}
					return;
				case KEY_BACKSPACE:
				case KEY_DELETE:
					self.deleteSelection(e);
					return;
			}
	
			if ((self.isFull() || self.isInputHidden) && !(IS_MAC ? e.metaKey : e.ctrlKey)) {
				e.preventDefault();
				return;
			}
		},
	
		/**
		 * Triggered on <input> keyup.
		 *
		 * @param {object} e
		 * @returns {boolean}
		 */
		onKeyUp: function(e) {
			var self = this;
	
			if (self.isLocked) return e && e.preventDefault();
			var value = self.$control_input.val() || '';
			if (self.lastValue !== value) {
				self.lastValue = value;
				self.onSearchChange(value);
				self.refreshOptions();
				self.trigger('type', value);
			}
		},
	
		/**
		 * Invokes the user-provide option provider / loader.
		 *
		 * Note: this function is debounced in the Selectize
		 * constructor (by `settings.loadDelay` milliseconds)
		 *
		 * @param {string} value
		 */
		onSearchChange: function(value) {
			var self = this;
			var fn = self.settings.load;
			if (!fn) return;
			if (self.loadedSearches.hasOwnProperty(value)) return;
			self.loadedSearches[value] = true;
			self.load(function(callback) {
				fn.apply(self, [value, callback]);
			});
		},
	
		/**
		 * Triggered on <input> focus.
		 *
		 * @param {object} e (optional)
		 * @returns {boolean}
		 */
		onFocus: function(e) {
			var self = this;
	
			self.isFocused = true;
			if (self.isDisabled) {
				self.blur();
				e && e.preventDefault();
				return false;
			}
	
			if (self.ignoreFocus) return;
			if (self.settings.preload === 'focus') self.onSearchChange('');
	
			if (!self.$activeItems.length) {
				self.showInput();
				self.setActiveItem(null);
				self.refreshOptions(!!self.settings.openOnFocus);
			}
	
			self.refreshState();
		},
	
		/**
		 * Triggered on <input> blur.
		 *
		 * @param {object} e
		 * @returns {boolean}
		 */
		onBlur: function(e) {
			var self = this;
			self.isFocused = false;
			if (self.ignoreFocus) return;
	
			// necessary to prevent IE closing the dropdown when the scrollbar is clicked
			if (!self.ignoreBlur && document.activeElement === self.$dropdown_content[0]) {
				self.ignoreBlur = true;
				self.onFocus(e);
	
				return;
			}
	
			if (self.settings.create && self.settings.createOnBlur) {
				self.createItem(false);
			}
	
			self.close();
			self.setTextboxValue('');
			self.setActiveItem(null);
			self.setActiveOption(null);
			self.setCaret(self.items.length);
			self.refreshState();
		},
	
		/**
		 * Triggered when the user rolls over
		 * an option in the autocomplete dropdown menu.
		 *
		 * @param {object} e
		 * @returns {boolean}
		 */
		onOptionHover: function(e) {
			if (this.ignoreHover) return;
			this.setActiveOption(e.currentTarget, false);
		},
	
		/**
		 * Triggered when the user clicks on an option
		 * in the autocomplete dropdown menu.
		 *
		 * @param {object} e
		 * @returns {boolean}
		 */
		onOptionSelect: function(e) {
			var value, $target, $option, self = this;
	
			if (e.preventDefault) {
				e.preventDefault();
				e.stopPropagation();
			}
	
			$target = $(e.currentTarget);
			if ($target.hasClass('create')) {
				self.createItem();
			} else {
				value = $target.attr('data-value');
				if (typeof value !== 'undefined') {
					self.lastQuery = null;
					self.setTextboxValue('');
					self.addItem(value);
					if (!self.settings.hideSelected && e.type && /mouse/.test(e.type)) {
						self.setActiveOption(self.getOption(value));
					}
				}
			}
		},
	
		/**
		 * Triggered when the user clicks on an item
		 * that has been selected.
		 *
		 * @param {object} e
		 * @returns {boolean}
		 */
		onItemSelect: function(e) {
			var self = this;
	
			if (self.isLocked) return;
			if (self.settings.mode === 'multi') {
				e.preventDefault();
				self.setActiveItem(e.currentTarget, e);
			}
		},
	
		/**
		 * Invokes the provided method that provides
		 * results to a callback---which are then added
		 * as options to the control.
		 *
		 * @param {function} fn
		 */
		load: function(fn) {
			var self = this;
			var $wrapper = self.$wrapper.addClass('loading');
	
			self.loading++;
			fn.apply(self, [function(results) {
				self.loading = Math.max(self.loading - 1, 0);
				if (results && results.length) {
					self.addOption(results);
					self.refreshOptions(self.isFocused && !self.isInputHidden);
				}
				if (!self.loading) {
					$wrapper.removeClass('loading');
				}
				self.trigger('load', results);
			}]);
		},
	
		/**
		 * Sets the input field of the control to the specified value.
		 *
		 * @param {string} value
		 */
		setTextboxValue: function(value) {
			var $input = this.$control_input;
			var changed = $input.val() !== value;
			if (changed) {
				$input.val(value).triggerHandler('update');
				this.lastValue = value;
			}
		},
	
		/**
		 * Returns the value of the control. If multiple items
		 * can be selected (e.g. <select multiple>), this returns
		 * an array. If only one item can be selected, this
		 * returns a string.
		 *
		 * @returns {mixed}
		 */
		getValue: function() {
			if (this.tagType === TAG_SELECT && this.$input.attr('multiple')) {
				return this.items;
			} else {
				return this.items.join(this.settings.delimiter);
			}
		},
	
		/**
		 * Resets the selected items to the given value.
		 *
		 * @param {mixed} value
		 */
		setValue: function(value) {
			debounce_events(this, ['change'], function() {
				this.clear();
				this.addItems(value);
			});
		},
	
		/**
		 * Sets the selected item.
		 *
		 * @param {object} $item
		 * @param {object} e (optional)
		 */
		setActiveItem: function($item, e) {
			var self = this;
			var eventName;
			var i, idx, begin, end, item, swap;
			var $last;
	
			if (self.settings.mode === 'single') return;
			$item = $($item);
	
			// clear the active selection
			if (!$item.length) {
				$(self.$activeItems).removeClass('active');
				self.$activeItems = [];
				if (self.isFocused) {
					self.showInput();
				}
				return;
			}
	
			// modify selection
			eventName = e && e.type.toLowerCase();
	
			if (eventName === 'mousedown' && self.isShiftDown && self.$activeItems.length) {
				$last = self.$control.children('.active:last');
				begin = Array.prototype.indexOf.apply(self.$control[0].childNodes, [$last[0]]);
				end   = Array.prototype.indexOf.apply(self.$control[0].childNodes, [$item[0]]);
				if (begin > end) {
					swap  = begin;
					begin = end;
					end   = swap;
				}
				for (i = begin; i <= end; i++) {
					item = self.$control[0].childNodes[i];
					if (self.$activeItems.indexOf(item) === -1) {
						$(item).addClass('active');
						self.$activeItems.push(item);
					}
				}
				e.preventDefault();
			} else if ((eventName === 'mousedown' && self.isCtrlDown) || (eventName === 'keydown' && this.isShiftDown)) {
				if ($item.hasClass('active')) {
					idx = self.$activeItems.indexOf($item[0]);
					self.$activeItems.splice(idx, 1);
					$item.removeClass('active');
				} else {
					self.$activeItems.push($item.addClass('active')[0]);
				}
			} else {
				$(self.$activeItems).removeClass('active');
				self.$activeItems = [$item.addClass('active')[0]];
			}
	
			// ensure control has focus
			self.hideInput();
			if (!this.isFocused) {
				self.focus();
			}
		},
	
		/**
		 * Sets the selected item in the dropdown menu
		 * of available options.
		 *
		 * @param {object} $object
		 * @param {boolean} scroll
		 * @param {boolean} animate
		 */
		setActiveOption: function($option, scroll, animate) {
			var height_menu, height_item, y;
			var scroll_top, scroll_bottom;
			var self = this;
	
			if (self.$activeOption) self.$activeOption.removeClass('active');
			self.$activeOption = null;
	
			$option = $($option);
			if (!$option.length) return;
	
			self.$activeOption = $option.addClass('active');
	
			if (scroll || !isset(scroll)) {
	
				height_menu   = self.$dropdown_content.height();
				height_item   = self.$activeOption.outerHeight(true);
				scroll        = self.$dropdown_content.scrollTop() || 0;
				y             = self.$activeOption.offset().top - self.$dropdown_content.offset().top + scroll;
				scroll_top    = y;
				scroll_bottom = y - height_menu + height_item;
	
				if (y + height_item > height_menu + scroll) {
					self.$dropdown_content.stop().animate({scrollTop: scroll_bottom}, animate ? self.settings.scrollDuration : 0);
				} else if (y < scroll) {
					self.$dropdown_content.stop().animate({scrollTop: scroll_top}, animate ? self.settings.scrollDuration : 0);
				}
	
			}
		},
	
		/**
		 * Selects all items (CTRL + A).
		 */
		selectAll: function() {
			var self = this;
			if (self.settings.mode === 'single') return;
	
			self.$activeItems = Array.prototype.slice.apply(self.$control.children(':not(input)').addClass('active'));
			if (self.$activeItems.length) {
				self.hideInput();
				self.close();
			}
			self.focus();
		},
	
		/**
		 * Hides the input element out of view, while
		 * retaining its focus.
		 */
		hideInput: function() {
			var self = this;
	
			self.setTextboxValue('');
			self.$control_input.css({opacity: 0, position: 'absolute', left: self.rtl ? 10000 : -10000});
			self.isInputHidden = true;
		},
	
		/**
		 * Restores input visibility.
		 */
		showInput: function() {
			this.$control_input.css({opacity: 1, position: 'relative', left: 0});
			this.isInputHidden = false;
		},
	
		/**
		 * Gives the control focus. If "trigger" is falsy,
		 * focus handlers won't be fired--causing the focus
		 * to happen silently in the background.
		 *
		 * @param {boolean} trigger
		 */
		focus: function() {
			var self = this;
			if (self.isDisabled) return;
	
			self.ignoreFocus = true;
			self.$control_input[0].focus();
			window.setTimeout(function() {
				self.ignoreFocus = false;
				self.onFocus();
			}, 0);
		},
	
		/**
		 * Forces the control out of focus.
		 */
		blur: function() {
			this.$control_input.trigger('blur');
		},
	
		/**
		 * Returns a function that scores an object
		 * to show how good of a match it is to the
		 * provided query.
		 *
		 * @param {string} query
		 * @param {object} options
		 * @return {function}
		 */
		getScoreFunction: function(query) {
			return this.sifter.getScoreFunction(query, this.getSearchOptions());
		},
	
		/**
		 * Returns search options for sifter (the system
		 * for scoring and sorting results).
		 *
		 * @see https://github.com/brianreavis/sifter.js
		 * @return {object}
		 */
		getSearchOptions: function() {
			var settings = this.settings;
			var sort = settings.sortField;
			if (typeof sort === 'string') {
				sort = {field: sort};
			}
	
			return {
				fields      : settings.searchField,
				conjunction : settings.searchConjunction,
				sort        : sort
			};
		},
	
		/**
		 * Searches through available options and returns
		 * a sorted array of matches.
		 *
		 * Returns an object containing:
		 *
		 *   - query {string}
		 *   - tokens {array}
		 *   - total {int}
		 *   - items {array}
		 *
		 * @param {string} query
		 * @returns {object}
		 */
		search: function(query) {
			var i, value, score, result, calculateScore;
			var self     = this;
			var settings = self.settings;
			var options  = this.getSearchOptions();
	
			// validate user-provided result scoring function
			if (settings.score) {
				calculateScore = self.settings.score.apply(this, [query]);
				if (typeof calculateScore !== 'function') {
					throw new Error('Selectize "score" setting must be a function that returns a function');
				}
			}
	
			// perform search
			if (query !== self.lastQuery) {
				self.lastQuery = query;
				result = self.sifter.search(query, $.extend(options, {score: calculateScore}));
				self.currentResults = result;
			} else {
				result = $.extend(true, {}, self.currentResults);
			}
	
			// filter out selected items
			if (settings.hideSelected) {
				for (i = result.items.length - 1; i >= 0; i--) {
					if (self.items.indexOf(hash_key(result.items[i].id)) !== -1) {
						result.items.splice(i, 1);
					}
				}
			}
	
			return result;
		},
	
		/**
		 * Refreshes the list of available options shown
		 * in the autocomplete dropdown menu.
		 *
		 * @param {boolean} triggerDropdown
		 */
		refreshOptions: function(triggerDropdown) {
			var i, j, k, n, groups, groups_order, option, option_html, optgroup, optgroups, html, html_children, has_create_option;
			var $active, $active_before, $create;
	
			if (typeof triggerDropdown === 'undefined') {
				triggerDropdown = true;
			}
	
			var self              = this;
			var query             = self.$control_input.val();
			var results           = self.search(query);
			var $dropdown_content = self.$dropdown_content;
			var active_before     = self.$activeOption && hash_key(self.$activeOption.attr('data-value'));
	
			// build markup
			n = results.items.length;
			if (typeof self.settings.maxOptions === 'number') {
				n = Math.min(n, self.settings.maxOptions);
			}
	
			// render and group available options individually
			groups = {};
	
			if (self.settings.optgroupOrder) {
				groups_order = self.settings.optgroupOrder;
				for (i = 0; i < groups_order.length; i++) {
					groups[groups_order[i]] = [];
				}
			} else {
				groups_order = [];
			}
	
			for (i = 0; i < n; i++) {
				option      = self.options[results.items[i].id];
				option_html = self.render('option', option);
				optgroup    = option[self.settings.optgroupField] || '';
				optgroups   = $.isArray(optgroup) ? optgroup : [optgroup];
	
				for (j = 0, k = optgroups && optgroups.length; j < k; j++) {
					optgroup = optgroups[j];
					if (!self.optgroups.hasOwnProperty(optgroup)) {
						optgroup = '';
					}
					if (!groups.hasOwnProperty(optgroup)) {
						groups[optgroup] = [];
						groups_order.push(optgroup);
					}
					groups[optgroup].push(option_html);
				}
			}
	
			// render optgroup headers & join groups
			html = [];
			for (i = 0, n = groups_order.length; i < n; i++) {
				optgroup = groups_order[i];
				if (self.optgroups.hasOwnProperty(optgroup) && groups[optgroup].length) {
					// render the optgroup header and options within it,
					// then pass it to the wrapper template
					html_children = self.render('optgroup_header', self.optgroups[optgroup]) || '';
					html_children += groups[optgroup].join('');
					html.push(self.render('optgroup', $.extend({}, self.optgroups[optgroup], {
						html: html_children
					})));
				} else {
					html.push(groups[optgroup].join(''));
				}
			}
	
			$dropdown_content.html(html.join(''));
	
			// highlight matching terms inline
			if (self.settings.highlight && results.query.length && results.tokens.length) {
				for (i = 0, n = results.tokens.length; i < n; i++) {
					highlight($dropdown_content, results.tokens[i].regex);
				}
			}
	
			// add "selected" class to selected options
			if (!self.settings.hideSelected) {
				for (i = 0, n = self.items.length; i < n; i++) {
					self.getOption(self.items[i]).addClass('selected');
				}
			}
	
			// add create option
			has_create_option = self.settings.create && self.canCreate(results.query);
			if (has_create_option) {
				$dropdown_content.prepend(self.render('option_create', {input: query}));
				$create = $($dropdown_content[0].childNodes[0]);
			}
	
			// activate
			self.hasOptions = results.items.length > 0 || has_create_option;
			if (self.hasOptions) {
				if (results.items.length > 0) {
					$active_before = active_before && self.getOption(active_before);
					if ($active_before && $active_before.length) {
						$active = $active_before;
					} else if (self.settings.mode === 'single' && self.items.length) {
						$active = self.getOption(self.items[0]);
					}
					if (!$active || !$active.length) {
						if ($create && !self.settings.addPrecedence) {
							$active = self.getAdjacentOption($create, 1);
						} else {
							$active = $dropdown_content.find('[data-selectable]:first');
						}
					}
				} else {
					$active = $create;
				}
				self.setActiveOption($active);
				if (triggerDropdown && !self.isOpen) { self.open(); }
			} else {
				self.setActiveOption(null);
				if (triggerDropdown && self.isOpen) { self.close(); }
			}
		},
	
		/**
		 * Adds an available option. If it already exists,
		 * nothing will happen. Note: this does not refresh
		 * the options list dropdown (use `refreshOptions`
		 * for that).
		 *
		 * Usage:
		 *
		 *   this.addOption(data)
		 *
		 * @param {object} data
		 */
		addOption: function(data) {
			var i, n, optgroup, value, self = this;
	
			if ($.isArray(data)) {
				for (i = 0, n = data.length; i < n; i++) {
					self.addOption(data[i]);
				}
				return;
			}
	
			value = hash_key(data[self.settings.valueField]);
			if (typeof value !== 'string' || self.options.hasOwnProperty(value)) return;
	
			self.userOptions[value] = true;
			self.options[value] = data;
			self.lastQuery = null;
			self.trigger('option_add', value, data);
		},
	
		/**
		 * Registers a new optgroup for options
		 * to be bucketed into.
		 *
		 * @param {string} id
		 * @param {object} data
		 */
		addOptionGroup: function(id, data) {
			this.optgroups[id] = data;
			this.trigger('optgroup_add', id, data);
		},
	
		/**
		 * Updates an option available for selection. If
		 * it is visible in the selected items or options
		 * dropdown, it will be re-rendered automatically.
		 *
		 * @param {string} value
		 * @param {object} data
		 */
		updateOption: function(value, data) {
			var self = this;
			var $item, $item_new;
			var value_new, index_item, cache_items, cache_options;
	
			value     = hash_key(value);
			value_new = hash_key(data[self.settings.valueField]);
	
			// sanity checks
			if (value === null) return;
			if (!self.options.hasOwnProperty(value)) return;
			if (typeof value_new !== 'string') throw new Error('Value must be set in option data');
	
			// update references
			if (value_new !== value) {
				delete self.options[value];
				index_item = self.items.indexOf(value);
				if (index_item !== -1) {
					self.items.splice(index_item, 1, value_new);
				}
			}
			self.options[value_new] = data;
	
			// invalidate render cache
			cache_items = self.renderCache['item'];
			cache_options = self.renderCache['option'];
	
			if (cache_items) {
				delete cache_items[value];
				delete cache_items[value_new];
			}
			if (cache_options) {
				delete cache_options[value];
				delete cache_options[value_new];
			}
	
			// update the item if it's selected
			if (self.items.indexOf(value_new) !== -1) {
				$item = self.getItem(value);
				$item_new = $(self.render('item', data));
				if ($item.hasClass('active')) $item_new.addClass('active');
				$item.replaceWith($item_new);
			}
	
			// update dropdown contents
			if (self.isOpen) {
				self.refreshOptions(false);
			}
		},
	
		/**
		 * Removes a single option.
		 *
		 * @param {string} value
		 */
		removeOption: function(value) {
			var self = this;
			value = hash_key(value);
	
			var cache_items = self.renderCache['item'];
			var cache_options = self.renderCache['option'];
			if (cache_items) delete cache_items[value];
			if (cache_options) delete cache_options[value];
	
			delete self.userOptions[value];
			delete self.options[value];
			self.lastQuery = null;
			self.trigger('option_remove', value);
			self.removeItem(value);
		},
	
		/**
		 * Clears all options.
		 */
		clearOptions: function() {
			var self = this;
	
			self.loadedSearches = {};
			self.userOptions = {};
			self.renderCache = {};
			self.options = self.sifter.items = {};
			self.lastQuery = null;
			self.trigger('option_clear');
			self.clear();
		},
	
		/**
		 * Returns the jQuery element of the option
		 * matching the given value.
		 *
		 * @param {string} value
		 * @returns {object}
		 */
		getOption: function(value) {
			return this.getElementWithValue(value, this.$dropdown_content.find('[data-selectable]'));
		},
	
		/**
		 * Returns the jQuery element of the next or
		 * previous selectable option.
		 *
		 * @param {object} $option
		 * @param {int} direction  can be 1 for next or -1 for previous
		 * @return {object}
		 */
		getAdjacentOption: function($option, direction) {
			var $options = this.$dropdown.find('[data-selectable]');
			var index    = $options.index($option) + direction;
	
			return index >= 0 && index < $options.length ? $options.eq(index) : $();
		},
	
		/**
		 * Finds the first element with a "data-value" attribute
		 * that matches the given value.
		 *
		 * @param {mixed} value
		 * @param {object} $els
		 * @return {object}
		 */
		getElementWithValue: function(value, $els) {
			value = hash_key(value);
	
			if (typeof value !== 'undefined' && value !== null) {
				for (var i = 0, n = $els.length; i < n; i++) {
					if ($els[i].getAttribute('data-value') === value) {
						return $($els[i]);
					}
				}
			}
	
			return $();
		},
	
		/**
		 * Returns the jQuery element of the item
		 * matching the given value.
		 *
		 * @param {string} value
		 * @returns {object}
		 */
		getItem: function(value) {
			return this.getElementWithValue(value, this.$control.children());
		},
	
		/**
		 * "Selects" multiple items at once. Adds them to the list
		 * at the current caret position.
		 *
		 * @param {string} value
		 */
		addItems: function(values) {
			var items = $.isArray(values) ? values : [values];
			for (var i = 0, n = items.length; i < n; i++) {
				this.isPending = (i < n - 1);
				this.addItem(items[i]);
			}
		},
	
		/**
		 * "Selects" an item. Adds it to the list
		 * at the current caret position.
		 *
		 * @param {string} value
		 */
		addItem: function(value) {
			debounce_events(this, ['change'], function() {
				var $item, $option, $options;
				var self = this;
				var inputMode = self.settings.mode;
				var i, active, value_next, wasFull;
				value = hash_key(value);
	
				if (self.items.indexOf(value) !== -1) {
					if (inputMode === 'single') self.close();
					return;
				}
	
				if (!self.options.hasOwnProperty(value)) return;
				if (inputMode === 'single') self.clear();
				if (inputMode === 'multi' && self.isFull()) return;
	
				$item = $(self.render('item', self.options[value]));
				wasFull = self.isFull();
				self.items.splice(self.caretPos, 0, value);
				self.insertAtCaret($item);
				if (!self.isPending || (!wasFull && self.isFull())) {
					self.refreshState();
				}
	
				if (self.isSetup) {
					$options = self.$dropdown_content.find('[data-selectable]');
	
					// update menu / remove the option (if this is not one item being added as part of series)
					if (!self.isPending) {
						$option = self.getOption(value);
						value_next = self.getAdjacentOption($option, 1).attr('data-value');
						self.refreshOptions(self.isFocused && inputMode !== 'single');
						if (value_next) {
							self.setActiveOption(self.getOption(value_next));
						}
					}
	
					// hide the menu if the maximum number of items have been selected or no options are left
					if (!$options.length || self.isFull()) {
						self.close();
					} else {
						self.positionDropdown();
					}
	
					self.updatePlaceholder();
					self.trigger('item_add', value, $item);
					self.updateOriginalInput();
				}
			});
		},
	
		/**
		 * Removes the selected item matching
		 * the provided value.
		 *
		 * @param {string} value
		 */
		removeItem: function(value) {
			var self = this;
			var $item, i, idx;
	
			$item = (typeof value === 'object') ? value : self.getItem(value);
			value = hash_key($item.attr('data-value'));
			i = self.items.indexOf(value);
	
			if (i !== -1) {
				$item.remove();
				if ($item.hasClass('active')) {
					idx = self.$activeItems.indexOf($item[0]);
					self.$activeItems.splice(idx, 1);
				}
	
				self.items.splice(i, 1);
				self.lastQuery = null;
				if (!self.settings.persist && self.userOptions.hasOwnProperty(value)) {
					self.removeOption(value);
				}
	
				if (i < self.caretPos) {
					self.setCaret(self.caretPos - 1);
				}
	
				self.refreshState();
				self.updatePlaceholder();
				self.updateOriginalInput();
				self.positionDropdown();
				self.trigger('item_remove', value);
			}
		},
	
		/**
		 * Invokes the `create` method provided in the
		 * selectize options that should provide the data
		 * for the new item, given the user input.
		 *
		 * Once this completes, it will be added
		 * to the item list.
		 *
		 * @return {boolean}
		 */
		createItem: function(triggerDropdown) {
			var self  = this;
			var input = $.trim(self.$control_input.val() || '');
			var caret = self.caretPos;
			if (!self.canCreate(input)) return false;
			self.lock();
	
			if (typeof triggerDropdown === 'undefined') {
				triggerDropdown = true;
			}
	
			var setup = (typeof self.settings.create === 'function') ? this.settings.create : function(input) {
				var data = {};
				data[self.settings.labelField] = input;
				data[self.settings.valueField] = input;
				return data;
			};
	
			var create = once(function(data) {
				self.unlock();
	
				if (!data || typeof data !== 'object') return;
				var value = hash_key(data[self.settings.valueField]);
				if (typeof value !== 'string') return;
	
				self.setTextboxValue('');
				self.addOption(data);
				self.setCaret(caret);
				self.addItem(value);
				self.refreshOptions(triggerDropdown && self.settings.mode !== 'single');
			});
	
			var output = setup.apply(this, [input, create]);
			if (typeof output !== 'undefined') {
				create(output);
			}
	
			return true;
		},
	
		/**
		 * Re-renders the selected item lists.
		 */
		refreshItems: function() {
			this.lastQuery = null;
	
			if (this.isSetup) {
				for (var i = 0; i < this.items.length; i++) {
					this.addItem(this.items);
				}
			}
	
			this.refreshState();
			this.updateOriginalInput();
		},
	
		/**
		 * Updates all state-dependent attributes
		 * and CSS classes.
		 */
		refreshState: function() {
			var invalid, self = this;
			if (self.isRequired) {
				if (self.items.length) self.isInvalid = false;
				self.$control_input.prop('required', invalid);
			}
			self.refreshClasses();
		},
	
		/**
		 * Updates all state-dependent CSS classes.
		 */
		refreshClasses: function() {
			var self     = this;
			var isFull   = self.isFull();
			var isLocked = self.isLocked;
	
			self.$wrapper
				.toggleClass('rtl', self.rtl);
	
			self.$control
				.toggleClass('focus', self.isFocused)
				.toggleClass('disabled', self.isDisabled)
				.toggleClass('required', self.isRequired)
				.toggleClass('invalid', self.isInvalid)
				.toggleClass('locked', isLocked)
				.toggleClass('full', isFull).toggleClass('not-full', !isFull)
				.toggleClass('input-active', self.isFocused && !self.isInputHidden)
				.toggleClass('dropdown-active', self.isOpen)
				.toggleClass('has-options', !$.isEmptyObject(self.options))
				.toggleClass('has-items', self.items.length > 0);
	
			self.$control_input.data('grow', !isFull && !isLocked);
		},
	
		/**
		 * Determines whether or not more items can be added
		 * to the control without exceeding the user-defined maximum.
		 *
		 * @returns {boolean}
		 */
		isFull: function() {
			return this.settings.maxItems !== null && this.items.length >= this.settings.maxItems;
		},
	
		/**
		 * Refreshes the original <select> or <input>
		 * element to reflect the current state.
		 */
		updateOriginalInput: function() {
			var i, n, options, self = this;
	
			if (self.tagType === TAG_SELECT) {
				options = [];
				for (i = 0, n = self.items.length; i < n; i++) {
					options.push('<option value="' + escape_html(self.items[i]) + '" selected="selected"></option>');
				}
				if (!options.length && !this.$input.attr('multiple')) {
					options.push('<option value="" selected="selected"></option>');
				}
				self.$input.html(options.join(''));
			} else {
				self.$input.val(self.getValue());
				self.$input.attr('value',self.$input.val());
			}
	
			if (self.isSetup) {
				self.trigger('change', self.$input.val());
			}
		},
	
		/**
		 * Shows/hide the input placeholder depending
		 * on if there items in the list already.
		 */
		updatePlaceholder: function() {
			if (!this.settings.placeholder) return;
			var $input = this.$control_input;
	
			if (this.items.length) {
				$input.removeAttr('placeholder');
			} else {
				$input.attr('placeholder', this.settings.placeholder);
			}
			$input.triggerHandler('update', {force: true});
		},
	
		/**
		 * Shows the autocomplete dropdown containing
		 * the available options.
		 */
		open: function() {
			var self = this;
	
			if (self.isLocked || self.isOpen || (self.settings.mode === 'multi' && self.isFull())) return;
			self.focus();
			self.isOpen = true;
			self.refreshState();
			self.$dropdown.css({visibility: 'hidden', display: 'block'});
			self.positionDropdown();
			self.$dropdown.css({visibility: 'visible'});
			self.trigger('dropdown_open', self.$dropdown);
		},
	
		/**
		 * Closes the autocomplete dropdown menu.
		 */
		close: function() {
			var self = this;
			var trigger = self.isOpen;
	
			if (self.settings.mode === 'single' && self.items.length) {
				self.hideInput();
			}
	
			self.isOpen = false;
			self.$dropdown.hide();
			self.setActiveOption(null);
			self.refreshState();
	
			if (trigger) self.trigger('dropdown_close', self.$dropdown);
		},
	
		/**
		 * Calculates and applies the appropriate
		 * position of the dropdown.
		 */
		positionDropdown: function() {
			var $control = this.$control;
			var offset = this.settings.dropdownParent === 'body' ? $control.offset() : $control.position();
			offset.top += $control.outerHeight(true);
	
			this.$dropdown.css({
				width : $control.outerWidth(),
				top   : offset.top,
				left  : offset.left
			});
		},
	
		/**
		 * Resets / clears all selected items
		 * from the control.
		 */
		clear: function() {
			var self = this;
	
			if (!self.items.length) return;
			self.$control.children(':not(input)').remove();
			self.items = [];
			self.lastQuery = null;
			self.setCaret(0);
			self.setActiveItem(null);
			self.updatePlaceholder();
			self.updateOriginalInput();
			self.refreshState();
			self.showInput();
			self.trigger('clear');
		},
	
		/**
		 * A helper method for inserting an element
		 * at the current caret position.
		 *
		 * @param {object} $el
		 */
		insertAtCaret: function($el) {
			var caret = Math.min(this.caretPos, this.items.length);
			if (caret === 0) {
				this.$control.prepend($el);
			} else {
				$(this.$control[0].childNodes[caret]).before($el);
			}
			this.setCaret(caret + 1);
		},
	
		/**
		 * Removes the current selected item(s).
		 *
		 * @param {object} e (optional)
		 * @returns {boolean}
		 */
		deleteSelection: function(e) {
			var i, n, direction, selection, values, caret, option_select, $option_select, $tail;
			var self = this;
	
			direction = (e && e.keyCode === KEY_BACKSPACE) ? -1 : 1;
			selection = getSelection(self.$control_input[0]);
	
			if (self.$activeOption && !self.settings.hideSelected) {
				option_select = self.getAdjacentOption(self.$activeOption, -1).attr('data-value');
			}
	
			// determine items that will be removed
			values = [];
	
			if (self.$activeItems.length) {
				$tail = self.$control.children('.active:' + (direction > 0 ? 'last' : 'first'));
				caret = self.$control.children(':not(input)').index($tail);
				if (direction > 0) { caret++; }
	
				for (i = 0, n = self.$activeItems.length; i < n; i++) {
					values.push($(self.$activeItems[i]).attr('data-value'));
				}
				if (e) {
					e.preventDefault();
					e.stopPropagation();
				}
			} else if ((self.isFocused || self.settings.mode === 'single') && self.items.length) {
				if (direction < 0 && selection.start === 0 && selection.length === 0) {
					values.push(self.items[self.caretPos - 1]);
				} else if (direction > 0 && selection.start === self.$control_input.val().length) {
					values.push(self.items[self.caretPos]);
				}
			}
	
			// allow the callback to abort
			if (!values.length || (typeof self.settings.onDelete === 'function' && self.settings.onDelete.apply(self, [values]) === false)) {
				return false;
			}
	
			// perform removal
			if (typeof caret !== 'undefined') {
				self.setCaret(caret);
			}
			while (values.length) {
				self.removeItem(values.pop());
			}
	
			self.showInput();
			self.positionDropdown();
			self.refreshOptions(true);
	
			// select previous option
			if (option_select) {
				$option_select = self.getOption(option_select);
				if ($option_select.length) {
					self.setActiveOption($option_select);
				}
			}
	
			return true;
		},
	
		/**
		 * Selects the previous / next item (depending
		 * on the `direction` argument).
		 *
		 * > 0 - right
		 * < 0 - left
		 *
		 * @param {int} direction
		 * @param {object} e (optional)
		 */
		advanceSelection: function(direction, e) {
			var tail, selection, idx, valueLength, cursorAtEdge, $tail;
			var self = this;
	
			if (direction === 0) return;
			if (self.rtl) direction *= -1;
	
			tail = direction > 0 ? 'last' : 'first';
			selection = getSelection(self.$control_input[0]);
	
			if (self.isFocused && !self.isInputHidden) {
				valueLength = self.$control_input.val().length;
				cursorAtEdge = direction < 0
					? selection.start === 0 && selection.length === 0
					: selection.start === valueLength;
	
				if (cursorAtEdge && !valueLength) {
					self.advanceCaret(direction, e);
				}
			} else {
				$tail = self.$control.children('.active:' + tail);
				if ($tail.length) {
					idx = self.$control.children(':not(input)').index($tail);
					self.setActiveItem(null);
					self.setCaret(direction > 0 ? idx + 1 : idx);
				}
			}
		},
	
		/**
		 * Moves the caret left / right.
		 *
		 * @param {int} direction
		 * @param {object} e (optional)
		 */
		advanceCaret: function(direction, e) {
			var self = this, fn, $adj;
	
			if (direction === 0) return;
	
			fn = direction > 0 ? 'next' : 'prev';
			if (self.isShiftDown) {
				$adj = self.$control_input[fn]();
				if ($adj.length) {
					self.hideInput();
					self.setActiveItem($adj);
					e && e.preventDefault();
				}
			} else {
				self.setCaret(self.caretPos + direction);
			}
		},
	
		/**
		 * Moves the caret to the specified index.
		 *
		 * @param {int} i
		 */
		setCaret: function(i) {
			var self = this;
	
			if (self.settings.mode === 'single') {
				i = self.items.length;
			} else {
				i = Math.max(0, Math.min(self.items.length, i));
			}
	
			if(!self.isPending) {
				// the input must be moved by leaving it in place and moving the
				// siblings, due to the fact that focus cannot be restored once lost
				// on mobile webkit devices
				var j, n, fn, $children, $child;
				$children = self.$control.children(':not(input)');
				for (j = 0, n = $children.length; j < n; j++) {
					$child = $($children[j]).detach();
					if (j <  i) {
						self.$control_input.before($child);
					} else {
						self.$control.append($child);
					}
				}
			}
	
			self.caretPos = i;
		},
	
		/**
		 * Disables user input on the control. Used while
		 * items are being asynchronously created.
		 */
		lock: function() {
			this.close();
			this.isLocked = true;
			this.refreshState();
		},
	
		/**
		 * Re-enables user input on the control.
		 */
		unlock: function() {
			this.isLocked = false;
			this.refreshState();
		},
	
		/**
		 * Disables user input on the control completely.
		 * While disabled, it cannot receive focus.
		 */
		disable: function() {
			var self = this;
			self.$input.prop('disabled', true);
			self.isDisabled = true;
			self.lock();
		},
	
		/**
		 * Enables the control so that it can respond
		 * to focus and user input.
		 */
		enable: function() {
			var self = this;
			self.$input.prop('disabled', false);
			self.isDisabled = false;
			self.unlock();
		},
	
		/**
		 * Completely destroys the control and
		 * unbinds all event listeners so that it can
		 * be garbage collected.
		 */
		destroy: function() {
			var self = this;
			var eventNS = self.eventNS;
			var revertSettings = self.revertSettings;
	
			self.trigger('destroy');
			self.off();
			self.$wrapper.remove();
			self.$dropdown.remove();
	
			self.$input
				.html('')
				.append(revertSettings.$children)
				.removeAttr('tabindex')
				.removeClass('selectized')
				.attr({tabindex: revertSettings.tabindex})
				.show();
	
			self.$control_input.removeData('grow');
			self.$input.removeData('selectize');
	
			$(window).off(eventNS);
			$(document).off(eventNS);
			$(document.body).off(eventNS);
	
			delete self.$input[0].selectize;
		},
	
		/**
		 * A helper method for rendering "item" and
		 * "option" templates, given the data.
		 *
		 * @param {string} templateName
		 * @param {object} data
		 * @returns {string}
		 */
		render: function(templateName, data) {
			var value, id, label;
			var html = '';
			var cache = false;
			var self = this;
			var regex_tag = /^[\t ]*<([a-z][a-z0-9\-_]*(?:\:[a-z][a-z0-9\-_]*)?)/i;
	
			if (templateName === 'option' || templateName === 'item') {
				value = hash_key(data[self.settings.valueField]);
				cache = !!value;
			}
	
			// pull markup from cache if it exists
			if (cache) {
				if (!isset(self.renderCache[templateName])) {
					self.renderCache[templateName] = {};
				}
				if (self.renderCache[templateName].hasOwnProperty(value)) {
					return self.renderCache[templateName][value];
				}
			}
	
			// render markup
			html = self.settings.render[templateName].apply(this, [data, escape_html]);
	
			// add mandatory attributes
			if (templateName === 'option' || templateName === 'option_create') {
				html = html.replace(regex_tag, '<$1 data-selectable');
			}
			if (templateName === 'optgroup') {
				id = data[self.settings.optgroupValueField] || '';
				html = html.replace(regex_tag, '<$1 data-group="' + escape_replace(escape_html(id)) + '"');
			}
			if (templateName === 'option' || templateName === 'item') {
				html = html.replace(regex_tag, '<$1 data-value="' + escape_replace(escape_html(value || '')) + '"');
			}
	
			// update cache
			if (cache) {
				self.renderCache[templateName][value] = html;
			}
	
			return html;
		},
	
		/**
		 * Clears the render cache for a template. If
		 * no template is given, clears all render
		 * caches.
		 *
		 * @param {string} templateName
		 */
		clearCache: function(templateName) {
			var self = this;
			if (typeof templateName === 'undefined') {
				self.renderCache = {};
			} else {
				delete self.renderCache[templateName];
			}
		}
	
	
	});
	
	
	Selectize.count = 0;
	Selectize.defaults = {
		plugins: [],
		delimiter: ',',
		persist: true,
		diacritics: true,
		create: false,
		createOnBlur: false,
		createFilter: null,
		highlight: true,
		openOnFocus: true,
		maxOptions: 1000,
		maxItems: null,
		hideSelected: null,
		addPrecedence: false,
		selectOnTab: false,
		preload: false,
		allowEmptyOption: false,
	
		scrollDuration: 60,
		loadThrottle: 300,
	
		dataAttr: 'data-data',
		optgroupField: 'optgroup',
		valueField: 'value',
		labelField: 'text',
		optgroupLabelField: 'label',
		optgroupValueField: 'value',
		optgroupOrder: null,
	
		sortField: '$order',
		searchField: ['text'],
		searchConjunction: 'and',
	
		mode: null,
		wrapperClass: 'selectize-control',
		inputClass: 'selectize-input',
		dropdownClass: 'selectize-dropdown',
		dropdownContentClass: 'selectize-dropdown-content',
	
		dropdownParent: null,
	
		/*
		load            : null, // function(query, callback) { ... }
		score           : null, // function(search) { ... }
		onInitialize    : null, // function() { ... }
		onChange        : null, // function(value) { ... }
		onItemAdd       : null, // function(value, $item) { ... }
		onItemRemove    : null, // function(value) { ... }
		onClear         : null, // function() { ... }
		onOptionAdd     : null, // function(value, data) { ... }
		onOptionRemove  : null, // function(value) { ... }
		onOptionClear   : null, // function() { ... }
		onDropdownOpen  : null, // function($dropdown) { ... }
		onDropdownClose : null, // function($dropdown) { ... }
		onType          : null, // function(str) { ... }
		onDelete        : null, // function(values) { ... }
		*/
	
		render: {
			/*
			item: null,
			optgroup: null,
			optgroup_header: null,
			option: null,
			option_create: null
			*/
		}
	};
	
	$.fn.selectize = function(settings_user) {
		var defaults             = $.fn.selectize.defaults;
		var settings             = $.extend({}, defaults, settings_user);
		var attr_data            = settings.dataAttr;
		var field_label          = settings.labelField;
		var field_value          = settings.valueField;
		var field_optgroup       = settings.optgroupField;
		var field_optgroup_label = settings.optgroupLabelField;
		var field_optgroup_value = settings.optgroupValueField;
	
		/**
		 * Initializes selectize from a <input type="text"> element.
		 *
		 * @param {object} $input
		 * @param {object} settings_element
		 */
		var init_textbox = function($input, settings_element) {
			var i, n, values, option, value = $.trim($input.val() || '');
			if (!settings.allowEmptyOption && !value.length) return;
	
			values = value.split(settings.delimiter);
			for (i = 0, n = values.length; i < n; i++) {
				option = {};
				option[field_label] = values[i];
				option[field_value] = values[i];
	
				settings_element.options[values[i]] = option;
			}
	
			settings_element.items = values;
		};
	
		/**
		 * Initializes selectize from a <select> element.
		 *
		 * @param {object} $input
		 * @param {object} settings_element
		 */
		var init_select = function($input, settings_element) {
			var i, n, tagName, $children, order = 0;
			var options = settings_element.options;
	
			var readData = function($el) {
				var data = attr_data && $el.attr(attr_data);
				if (typeof data === 'string' && data.length) {
					return JSON.parse(data);
				}
				return null;
			};
	
			var addOption = function($option, group) {
				var value, option;
	
				$option = $($option);
	
				value = $option.attr('value') || '';
				if (!value.length && !settings.allowEmptyOption) return;
	
				// if the option already exists, it's probably been
				// duplicated in another optgroup. in this case, push
				// the current group to the "optgroup" property on the
				// existing option so that it's rendered in both places.
				if (options.hasOwnProperty(value)) {
					if (group) {
						if (!options[value].optgroup) {
							options[value].optgroup = group;
						} else if (!$.isArray(options[value].optgroup)) {
							options[value].optgroup = [options[value].optgroup, group];
						} else {
							options[value].optgroup.push(group);
						}
					}
					return;
				}
	
				option                 = readData($option) || {};
				option[field_label]    = option[field_label] || $option.text();
				option[field_value]    = option[field_value] || value;
				option[field_optgroup] = option[field_optgroup] || group;
	
				option.$order = ++order;
				options[value] = option;
	
				if ($option.is(':selected')) {
					settings_element.items.push(value);
				}
			};
	
			var addGroup = function($optgroup) {
				var i, n, id, optgroup, $options;
	
				$optgroup = $($optgroup);
				id = $optgroup.attr('label');
	
				if (id) {
					optgroup = readData($optgroup) || {};
					optgroup[field_optgroup_label] = id;
					optgroup[field_optgroup_value] = id;
					settings_element.optgroups[id] = optgroup;
				}
	
				$options = $('option', $optgroup);
				for (i = 0, n = $options.length; i < n; i++) {
					addOption($options[i], id);
				}
			};
	
			settings_element.maxItems = $input.attr('multiple') ? null : 1;
	
			$children = $input.children();
			for (i = 0, n = $children.length; i < n; i++) {
				tagName = $children[i].tagName.toLowerCase();
				if (tagName === 'optgroup') {
					addGroup($children[i]);
				} else if (tagName === 'option') {
					addOption($children[i]);
				}
			}
		};
	
		return this.each(function() {
			if (this.selectize) return;
	
			var instance;
			var $input = $(this);
			var tag_name = this.tagName.toLowerCase();
			var placeholder = $input.attr('placeholder') || $input.attr('data-placeholder');
			if (!placeholder && !settings.allowEmptyOption) {
				placeholder = $input.children('option[value=""]').text();
			}
	
			var settings_element = {
				'placeholder' : placeholder,
				'options'     : {},
				'optgroups'   : {},
				'items'       : []
			};
	
			if (tag_name === 'select') {
				init_select($input, settings_element);
			} else {
				init_textbox($input, settings_element);
			}
	
			instance = new Selectize($input, $.extend(true, {}, defaults, settings_element, settings_user));
		});
	};
	
	$.fn.selectize.defaults = Selectize.defaults;
	
	
	Selectize.define('drag_drop', function(options) {
		if (!$.fn.sortable) throw new Error('The "drag_drop" plugin requires jQuery UI "sortable".');
		if (this.settings.mode !== 'multi') return;
		var self = this;
	
		self.lock = (function() {
			var original = self.lock;
			return function() {
				var sortable = self.$control.data('sortable');
				if (sortable) sortable.disable();
				return original.apply(self, arguments);
			};
		})();
	
		self.unlock = (function() {
			var original = self.unlock;
			return function() {
				var sortable = self.$control.data('sortable');
				if (sortable) sortable.enable();
				return original.apply(self, arguments);
			};
		})();
	
		self.setup = (function() {
			var original = self.setup;
			return function() {
				original.apply(this, arguments);
	
				var $control = self.$control.sortable({
					items: '[data-value]',
					forcePlaceholderSize: true,
					disabled: self.isLocked,
					start: function(e, ui) {
						ui.placeholder.css('width', ui.helper.css('width'));
						$control.css({overflow: 'visible'});
					},
					stop: function() {
						$control.css({overflow: 'hidden'});
						var active = self.$activeItems ? self.$activeItems.slice() : null;
						var values = [];
						$control.children('[data-value]').each(function() {
							values.push($(this).attr('data-value'));
						});
						self.setValue(values);
						self.setActiveItem(active);
					}
				});
			};
		})();
	
	});
	
	Selectize.define('dropdown_header', function(options) {
		var self = this;
	
		options = $.extend({
			title         : 'Untitled',
			headerClass   : 'selectize-dropdown-header',
			titleRowClass : 'selectize-dropdown-header-title',
			labelClass    : 'selectize-dropdown-header-label',
			closeClass    : 'selectize-dropdown-header-close',
	
			html: function(data) {
				return (
					'<div class="' + data.headerClass + '">' +
						'<div class="' + data.titleRowClass + '">' +
							'<span class="' + data.labelClass + '">' + data.title + '</span>' +
							'<a href="javascript:void(0)" class="' + data.closeClass + '">&times;</a>' +
						'</div>' +
					'</div>'
				);
			}
		}, options);
	
		self.setup = (function() {
			var original = self.setup;
			return function() {
				original.apply(self, arguments);
				self.$dropdown_header = $(options.html(options));
				self.$dropdown.prepend(self.$dropdown_header);
			};
		})();
	
	});
	
	Selectize.define('optgroup_columns', function(options) {
		var self = this;
	
		options = $.extend({
			equalizeWidth  : true,
			equalizeHeight : true
		}, options);
	
		this.getAdjacentOption = function($option, direction) {
			var $options = $option.closest('[data-group]').find('[data-selectable]');
			var index    = $options.index($option) + direction;
	
			return index >= 0 && index < $options.length ? $options.eq(index) : $();
		};
	
		this.onKeyDown = (function() {
			var original = self.onKeyDown;
			return function(e) {
				var index, $option, $options, $optgroup;
	
				if (this.isOpen && (e.keyCode === KEY_LEFT || e.keyCode === KEY_RIGHT)) {
					self.ignoreHover = true;
					$optgroup = this.$activeOption.closest('[data-group]');
					index = $optgroup.find('[data-selectable]').index(this.$activeOption);
	
					if(e.keyCode === KEY_LEFT) {
						$optgroup = $optgroup.prev('[data-group]');
					} else {
						$optgroup = $optgroup.next('[data-group]');
					}
	
					$options = $optgroup.find('[data-selectable]');
					$option  = $options.eq(Math.min($options.length - 1, index));
					if ($option.length) {
						this.setActiveOption($option);
					}
					return;
				}
	
				return original.apply(this, arguments);
			};
		})();
	
		var getScrollbarWidth = function() {
			var div;
			var width = getScrollbarWidth.width;
			var doc = document;
	
			if (typeof width === 'undefined') {
				div = doc.createElement('div');
				div.innerHTML = '<div style="width:50px;height:50px;position:absolute;left:-50px;top:-50px;overflow:auto;"><div style="width:1px;height:100px;"></div></div>';
				div = div.firstChild;
				doc.body.appendChild(div);
				width = getScrollbarWidth.width = div.offsetWidth - div.clientWidth;
				doc.body.removeChild(div);
			}
			return width;
		};
	
		var equalizeSizes = function() {
			var i, n, height_max, width, width_last, width_parent, $optgroups;
	
			$optgroups = $('[data-group]', self.$dropdown_content);
			n = $optgroups.length;
			if (!n || !self.$dropdown_content.width()) return;
	
			if (options.equalizeHeight) {
				height_max = 0;
				for (i = 0; i < n; i++) {
					height_max = Math.max(height_max, $optgroups.eq(i).height());
				}
				$optgroups.css({height: height_max});
			}
	
			if (options.equalizeWidth) {
				width_parent = self.$dropdown_content.innerWidth() - getScrollbarWidth();
				width = Math.round(width_parent / n);
				$optgroups.css({width: width});
				if (n > 1) {
					width_last = width_parent - width * (n - 1);
					$optgroups.eq(n - 1).css({width: width_last});
				}
			}
		};
	
		if (options.equalizeHeight || options.equalizeWidth) {
			hook.after(this, 'positionDropdown', equalizeSizes);
			hook.after(this, 'refreshOptions', equalizeSizes);
		}
	
	
	});
	
	Selectize.define('remove_button', function(options) {
		if (this.settings.mode === 'single') return;
	
		options = $.extend({
			label     : '&times;',
			title     : 'Remove',
			className : 'remove',
			append    : true
		}, options);
	
		var self = this;
		var html = '<a href="javascript:void(0)" class="' + options.className + '" tabindex="-1" title="' + escape_html(options.title) + '">' + options.label + '</a>';
	
		/**
		 * Appends an element as a child (with raw HTML).
		 *
		 * @param {string} html_container
		 * @param {string} html_element
		 * @return {string}
		 */
		var append = function(html_container, html_element) {
			var pos = html_container.search(/(<\/[^>]+>\s*)$/);
			return html_container.substring(0, pos) + html_element + html_container.substring(pos);
		};
	
		this.setup = (function() {
			var original = self.setup;
			return function() {
				// override the item rendering method to add the button to each
				if (options.append) {
					var render_item = self.settings.render.item;
					self.settings.render.item = function(data) {
						return append(render_item.apply(this, arguments), html);
					};
				}
	
				original.apply(this, arguments);
	
				// add event listener
				this.$control.on('click', '.' + options.className, function(e) {
					e.preventDefault();
					if (self.isLocked) return;
	
					var $item = $(e.currentTarget).parent();
					self.setActiveItem($item);
					if (self.deleteSelection()) {
						self.setCaret(self.items.length);
					}
				});
	
			};
		})();
	
	});
	
	Selectize.define('restore_on_backspace', function(options) {
		var self = this;
	
		options.text = options.text || function(option) {
			return option[this.settings.labelField];
		};
	
		this.onKeyDown = (function(e) {
			var original = self.onKeyDown;
			return function(e) {
				var index, option;
				if (e.keyCode === KEY_BACKSPACE && this.$control_input.val() === '' && !this.$activeItems.length) {
					index = this.caretPos - 1;
					if (index >= 0 && index < this.items.length) {
						option = this.options[this.items[index]];
						if (this.deleteSelection(e)) {
							this.setTextboxValue(options.text.apply(this, [option]));
							this.refreshOptions(true);
						}
						e.preventDefault();
						return;
					}
				}
				return original.apply(this, arguments);
			};
		})();
	});

	return Selectize;
}));
},{"jquery":36,"microplugin":41,"sifter":47}],47:[function(require,module,exports){
/*! sifter.js | https://github.com/brianreavis/sifter.js | Apache License (v2) */
(function(r,t){if(typeof define==="function"&&define.amd){define(t)}else if(typeof exports==="object"){module.exports=t()}else{r.Sifter=t()}})(this,function(){var r=function(r,t){this.items=r;this.settings=t||{diacritics:true}};r.prototype.tokenize=function(r){r=n(String(r||"").toLowerCase());if(!r||!r.length)return[];var t,e,o,s;var u=[];var a=r.split(/ +/);for(t=0,e=a.length;t<e;t++){o=i(a[t]);if(this.settings.diacritics){for(s in f){if(f.hasOwnProperty(s)){o=o.replace(new RegExp(s,"g"),f[s])}}}u.push({string:a[t],regex:new RegExp(o,"i")})}return u};r.prototype.iterator=function(r,t){var e;if(o(r)){e=Array.prototype.forEach||function(r){for(var t=0,e=this.length;t<e;t++){r(this[t],t,this)}}}else{e=function(r){for(var t in this){if(this.hasOwnProperty(t)){r(this[t],t,this)}}}}e.apply(r,[t])};r.prototype.getScoreFunction=function(r,t){var e,n,i,o;e=this;r=e.prepareSearch(r,t);i=r.tokens;n=r.options.fields;o=i.length;var f=function(r,t){var e,n;if(!r)return 0;r=String(r||"");n=r.search(t.regex);if(n===-1)return 0;e=t.string.length/r.length;if(n===0)e+=.5;return e};var s=function(){var r=n.length;if(!r){return function(){return 0}}if(r===1){return function(r,t){return f(t[n[0]],r)}}return function(t,e){for(var i=0,o=0;i<r;i++){o+=f(e[n[i]],t)}return o/r}}();if(!o){return function(){return 0}}if(o===1){return function(r){return s(i[0],r)}}if(r.options.conjunction==="and"){return function(r){var t;for(var e=0,n=0;e<o;e++){t=s(i[e],r);if(t<=0)return 0;n+=t}return n/o}}else{return function(r){for(var t=0,e=0;t<o;t++){e+=s(i[t],r)}return e/o}}};r.prototype.getSortFunction=function(r,e){var n,i,o,f,s,u,a,c,p,l,h;o=this;r=o.prepareSearch(r,e);h=!r.query&&e.sort_empty||e.sort;p=function(r,t){if(r==="$score")return t.score;return o.items[t.id][r]};s=[];if(h){for(n=0,i=h.length;n<i;n++){if(r.query||h[n].field!=="$score"){s.push(h[n])}}}if(r.query){l=true;for(n=0,i=s.length;n<i;n++){if(s[n].field==="$score"){l=false;break}}if(l){s.unshift({field:"$score",direction:"desc"})}}else{for(n=0,i=s.length;n<i;n++){if(s[n].field==="$score"){s.splice(n,1);break}}}c=[];for(n=0,i=s.length;n<i;n++){c.push(s[n].direction==="desc"?-1:1)}u=s.length;if(!u){return null}else if(u===1){f=s[0].field;a=c[0];return function(r,e){return a*t(p(f,r),p(f,e))}}else{return function(r,e){var n,i,o,f,a;for(n=0;n<u;n++){a=s[n].field;i=c[n]*t(p(a,r),p(a,e));if(i)return i}return 0}}};r.prototype.prepareSearch=function(r,t){if(typeof r==="object")return r;t=e({},t);var n=t.fields;var i=t.sort;var f=t.sort_empty;if(n&&!o(n))t.fields=[n];if(i&&!o(i))t.sort=[i];if(f&&!o(f))t.sort_empty=[f];return{options:t,query:String(r||"").toLowerCase(),tokens:this.tokenize(r),total:0,items:[]}};r.prototype.search=function(r,t){var e=this,n,i,o,f;var s;var u;o=this.prepareSearch(r,t);t=o.options;r=o.query;u=t.score||e.getScoreFunction(o);if(r.length){e.iterator(e.items,function(r,e){i=u(r);if(t.filter===false||i>0){o.items.push({score:i,id:e})}})}else{e.iterator(e.items,function(r,t){o.items.push({score:1,id:t})})}s=e.getSortFunction(o,t);if(s)o.items.sort(s);o.total=o.items.length;if(typeof t.limit==="number"){o.items=o.items.slice(0,t.limit)}return o};var t=function(r,t){if(typeof r==="number"&&typeof t==="number"){return r>t?1:r<t?-1:0}r=String(r||"").toLowerCase();t=String(t||"").toLowerCase();if(r>t)return 1;if(t>r)return-1;return 0};var e=function(r,t){var e,n,i,o;for(e=1,n=arguments.length;e<n;e++){o=arguments[e];if(!o)continue;for(i in o){if(o.hasOwnProperty(i)){r[i]=o[i]}}}return r};var n=function(r){return(r+"").replace(/^\s+|\s+$|/g,"")};var i=function(r){return(r+"").replace(/([.?*+^$[\]\\(){}|-])/g,"\\$1")};var o=Array.isArray||$&&$.isArray||function(r){return Object.prototype.toString.call(r)==="[object Array]"};var f={a:"[a\xc0\xc1\xc2\xc3\xc4\xc5\xe0\xe1\xe2\xe3\xe4\xe5\u0100\u0101]",c:"[c\xc7\xe7\u0107\u0106\u010d\u010c]",d:"[d\u0111\u0110\u010f\u010e]",e:"[e\xc8\xc9\xca\xcb\xe8\xe9\xea\xeb\u011b\u011a\u0112\u0113]",i:"[i\xcc\xcd\xce\xcf\xec\xed\xee\xef\u012a\u012b]",n:"[n\xd1\xf1\u0148\u0147]",o:"[o\xd2\xd3\xd4\xd5\xd5\xd6\xd8\xf2\xf3\xf4\xf5\xf6\xf8\u014c\u014d]",r:"[r\u0159\u0158]",s:"[s\u0160\u0161]",t:"[t\u0165\u0164]",u:"[u\xd9\xda\xdb\xdc\xf9\xfa\xfb\xfc\u016f\u016e\u016a\u016b]",y:"[y\u0178\xff\xfd\xdd]",z:"[z\u017d\u017e]"};return r});
},{}]},{},[1]);
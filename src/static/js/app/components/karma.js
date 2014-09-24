/** @jsx React.DOM */

var $ = require('jquery')
var _ = require('lodash')
var React = require('react')
var bootstrap_tooltip = require('bootstrap.tooltip')
var bootstrap_popover = require('bootstrap.popover')
var Favico = require('favico')
window.Favico = Favico;

try {
	var favico = new Favico({
	    animation:'slide'
	});
} catch (e) {
	console.warn("Failed to initialize favico", e);
}

$.extend($.fn.popover.Constructor.DEFAULTS, {react: false});
var oldSetContent = $.fn.popover.Constructor.prototype.setContent;
$.fn.popover.Constructor.prototype.setContent = function() {
	if (!this.options.react) {
		return oldSetContent.call(this);
	}
	var $tip = this.tip();
	var title = this.getTitle();
	var content = this.getContent();
	$tip.removeClass('fade top bottom left right in');
	if (!$tip.find('.popover-content').html()) {
		var $title = $tip.find('.popover-title');
		if (title) {
			React.renderComponent(title, $title[0]);
		} else {
			$title.hide();
		}
		React.renderComponent(content, $tip.find('.popover-content')[0]);
	}
};

var KarmaTemplates = {
	PostUpvote: function (item) {
		if (item.instances.length === 1) {
			var name = item.instances[0].name.split(' ')[0];
			return name+" votou na sua publicação '"+item.name+"'"
		} else {
			var names = _.map(item.instances, function (i) {
				return i.name.split(' ')[0];
			})
			return names.join(',')+" votaram na sua publicação '"+item.name+"'"
		}
	}
}

if (window.user) {

	var KarmaItem = React.createClass({displayName: 'KarmaItem',
		handleClick: function () {
			var self = this;
			console.log('Clicked notification on path', self.props.data.url);
			window.location.href = self.props.data.url;
		},
		render: function () {
			// var thumbnailStyle = {
			// 	backgroundImage: 'url('+this.props.data.thumbnailUrl+')',
			// };
			var date = window.calcTimeFrom(this.props.data.last_update);
			var message = KarmaTemplates[this.props.data.type](this.props.data)
					// {this.props.data.thumbnailUrl?
					// <div className="thumbnail" style={thumbnailStyle}></div>:undefined}
			return (
				React.DOM.li( {className:"notificationItem", 'data-seen':this.props.seen,
				onClick:this.handleClick}, 
					React.DOM.div( {className:"notificationItemBody"}, 
						React.DOM.span(null, message),
						React.DOM.time(null, date),
						"}"
					)
				)
			);
						// <span dangerouslySetInnerHTML={{__html: message}} />
		},
	});

	var KarmaList = React.createClass({displayName: 'KarmaList',
		render: function () {
			var notifications = this.props.data.items.map(function (i) {
				return (
					KarmaItem( {key:i.id, data:i} )
				);
			}.bind(this));
			return (
				React.DOM.div( {className:"notificationList"}, 
					notifications
				)
			);
		}
	});

	var Points = React.createClass({displayName: 'Points',
		getInitialState: function () {
			return { seen_all: true }
		},
		componentWillMount: function () {
			var self = this;
			// Hide popover when mouse-click happens outside it.
			$(document).mouseup(function (e) {
				var container = $(self.refs.button.getDOMNode());
				if (!container.is(e.target) && container.has(e.target).length === 0
					&& $(e.target).parents('.popover.in').length === 0) {
					$(self.refs.button.getDOMNode()).popover('hide');
				}
			});
		},
		getKarma: function () {
			// Get notification data.
			// var self = this;
			// $.ajax({
			// 	url: '/api/me/notifications',
			// 	type: 'get',
			// 	dataType: 'json',
			// }).done(function (response) {
			// 	if (response.error) {
			// 		if (app && app.flash)
			// 			app.flash.alert("Error in retrieving notifications.")
			// 		return;
			// 	}
			// 	var docs = _.sortBy(response.data.docs, function (i) { return -i.dateSent; }).slice(0,7);
			// 	var notSeen = _.filter(docs, function(i){ return i.dateSent > response.data.last_seen; });

				// $('[data-info=unseen-notifs]').html(notSeen.length);
				// $('[data-info=unseen-notifs]').addClass(notSeen?'nonzero':'zero');
				// this.setState({seen_all: notSeen.length === 0});
				// this.updateFavicon(notSeen.length);

			// }.bind(this)).always(function () {
			// 	// setTimeout(this.getNotifications, 5*60*1000);
			// }.bind(this));
		},
		onClick: function () {
			// if (!this.state.seen_all) {
			// 	this.state.seen_all = true;
			// 	$.post('/api/me/notifications/seen');
			// 	$('[data-info=unseen-notifs]').html(0);
			// 	$('[data-info=unseen-notifs]').addClass('zero');
			// 	this.setState({ seen_all: true });
			// 	this.updateFavicon(0);
			// 	console.log('new', this.state.seen_all)
			// }

			if (!this.fetchedData) {
				this.fetchedData = true;
				var self = this;
				$.ajax({
					url: '/api/me/karma',
					type: 'get',
					dataType: 'json',
				}).done(function (response) {
					if (response.error) {
						app.flash && app.flash.warn(response.error);
						return;
					}
					console.log("PORRA")
					var destroyPopover = function () {
						$(this.refs.button.getDOMNode()).popover('destroy');
					}.bind(this);
					$button = $(this.refs.button.getDOMNode()).popover({
						react: true,
						content: KarmaList( {data:response.data, destroy:destroyPopover}),
						placement: 'bottom',
						container: 'nav.bar',
						trigger: 'manual'
					});
					if ($button.data('bs.popover') &&
						$button.data('bs.popover').tip().hasClass('in')) { // already visible
						console.log("NOT")
						$button.popover('hide');
					} else {
						$button.popover('show');
					}
				}.bind(this));
			} else {
				var $button = $(this.refs.button.getDOMNode());
				$button.popover('show');
			}
		},
		render: function () {
			return (
				React.DOM.button(
					{ref:"button",
					className:"icon-btn bell "+(this.state.seen_all?"":"active"),
					'data-action':"show-karma",
					onClick:this.onClick}, 
					React.DOM.i( {className:"icon-bell2"}),
					React.DOM.sup( {ref:"nCount", className:"count"}, window.user.karma)
				)
			);
		},
	});

	if (document.getElementById('nav-karma'))
		React.renderComponent(Points(null ),
			document.getElementById('nav-karma'));
}
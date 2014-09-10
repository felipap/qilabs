/** @jsx React.DOM */

var $ = require('jquery')
var _ = require('lodash')
var React = require('react')
var bootstrap_tooltip = require('bootstrap.tooltip')
var bootstrap_popover = require('bootstrap.popover')

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

if (window.user) {

	var Notification = React.createClass({displayName: 'Notification',
		handleClick: function () {
			var self = this;
			if (true || self.props.data.accessed) {
				console.log('Clicked notification on path', self.props.data.url);
				window.location.href = self.props.data.url;	
			} else {
				$.ajax({
					url: '/api/me/notifications/'+this.props.data.id+'/access',
					data: { see: true },
					type: 'get',
					datatType: 'json',
				}).done(function (data) {
					window.location.href = self.props.data.url;
				});
			}
		},
		render: function () {
			var thumbnailStyle = {
				backgroundImage: 'url('+this.props.data.thumbnailUrl+')',
			};
			var date = window.calcTimeFrom(this.props.data.dateSent);
			return (
				React.DOM.li( {className:"notificationItem", 'data-seen':this.props.seen,
				onClick:this.handleClick}, 
					this.props.data.thumbnailUrl?
					React.DOM.div( {className:"thumbnail", style:thumbnailStyle}):undefined,
					React.DOM.div( {className:"notificationItemBody"}, 
						React.DOM.span( {dangerouslySetInnerHTML:{__html: this.props.data.msgHtml}} ),
						React.DOM.time(null, date)
					)
				)
			);
		},
	});

	var NotificationList = React.createClass({displayName: 'NotificationList',
		render: function () {
			var notifications = this.props.data.docs.map(function (i) {
				return (
					Notification( {key:i.id, data:i, seen:i.dateSent < this.props.data.last_seen})
				);
			}.bind(this));
			return (
				React.DOM.div( {className:"notificationList"}, 
					notifications
				)
			);
					// <li className="action" onClick={this.props.destroy} data-trigger="component" data-component="notifications">
					// 	Ver +
					// </li>
		}
	});

	var Bell = React.createClass({displayName: 'Bell',
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

			this.getNotifications();
		},
		getNotifications: function () {
			// Get notification data.
			var self = this;
			$.ajax({
				url: '/api/me/notifications',
				type: 'get',
				dataType: 'json',
			}).done(function (response) {
				if (response.error) {
					if (app && app.flash)
						app.flash.alert("Error in retrieving notifications.")
					return;
				}
				var docs = _.sortBy(response.data.docs, function (i) { return -i.dateSent; });
				var notSeen = _.filter(docs, function(i){ return i.dateSent > response.data.last_seen; });

				$('[data-info=unseen-notifs]').html(notSeen.length);
				$('[data-info=unseen-notifs]').addClass(notSeen?'nonzero':'zero');
				this.setState({seen_all: notSeen.length === 0});

				var destroyPopover = function () {
					$(this.refs.button.getDOMNode()).popover('destroy');
				}.bind(this);
				$(this.refs.button.getDOMNode()).popover({
					react: true,
					content: NotificationList( {data:response.data, destroy:destroyPopover}),
					placement: 'bottom',
					container: 'nav.bar',
					trigger: 'manual'
				});
			}.bind(this)).always(function () {
				// setTimeout(this.getNotifications, 5*60*1000);
			}.bind(this));
		},
		onClickBell: function () {
			if (!this.state.seen_all) {
				this.state.seen_all = true;
				$.post('/api/me/notifications/seen');
				$('[data-info=unseen-notifs]').html(0);
				$('[data-info=unseen-notifs]').addClass('zero');
				this.setState({ seen_all: true });
				console.log('new', this.state.seen_all)
			}

			var button = $(this.refs.button.getDOMNode());
			if (button.data('bs.popover') &&
				button.data('bs.popover').tip().hasClass('in')) { // already visible
				button.popover('hide');
			} else {
				button.popover('show');
			}
		},
		render: function () {
			return (
				React.DOM.button(
					{ref:"button",
					className:"icon-btn bell "+(this.state.seen_all?"":"active"),
					'data-action':"show-notifications",
					onClick:this.onClickBell}, 
					React.DOM.i( {className:"icon-bell2"}),
					React.DOM.sup( {ref:"nCount", 'data-info':"unseen-notifs", className:"count"}, "0")
				)
			);
		},
	});

	if (document.getElementById('nav-bell'))
		React.renderComponent(Bell(null ),
			document.getElementById('nav-bell'));
}
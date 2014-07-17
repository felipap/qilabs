/** @jsx React.DOM */

define([
	'jquery',
	'underscore',
	'react',
	'bootstrap.tooltip',
	'bootstrap.popover',
	], function ($, _, React) {

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
			if (title)
				React.renderComponent(title, $title[0]);
			else
				$title.hide();
			React.renderComponent(content, $tip.find('.popover-content')[0]);
		}
	};

	if (window.user) {

		var Notification = React.createClass({displayName: 'Notification',
			handleClick: function () {
				var self = this;
				if (self.props.data.accessed) {
					window.location.href = self.props.data.url;	
				} else {
					$.ajax({
						url: '/api/me/notifications/'+this.props.data.id+'/access',
						data: {see: true},
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
					React.DOM.li( {className:"notificationItem", 'data-seen':this.props.data.seen, 'data-accessed':this.props.data.accessed,
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
				var notifications = this.props.data.map(function (i) {
					return (
						Notification( {key:i.id, data:i} )
					);
				});
				return (
					React.DOM.div( {className:"notificationList"}, 
						notifications
					)
				);
			}
		});

		var Bell = React.createClass({displayName: 'Bell',
			componentWillMount: function () {
				this.seen = false;
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

					var allSeen = _.all(response.data, function(i){return i.seen;}),
						allAccessed = _.all(response.data, function(i){return i.accessed;});

					if (!allAccessed || !allSeen) {
						$(self.getDOMNode()).addClass('nonempty');
						self.refs.nCount.getDOMNode().innerHTML = _.filter(response.data, function(i){return !i.accessed;}).length;
					} else {
						$(self.getDOMNode()).removeClass('nonempty');
						self.refs.nCount.getDOMNode().innerHTML = '0';
					}

					if (!allSeen) {
						$(self.getDOMNode()).addClass('active');
					} else {
						$(self.getDOMNode()).removeClass('active');						
					}

					$('[data-info=unseen-notifs]').html(_.filter(response.data, function(i){return !i.seen;}).length);
					$('[data-info=unseen-notifs]').addClass(allSeen?'zero':'nonzero');

					this.seen = !allSeen;

					$(self.refs.button.getDOMNode()).popover({
						react: true,
						content: NotificationList( {data:response.data}),
						placement: 'bottom',
						container: 'nav.bar',
						trigger: 'manual'
					});
				}).always(function () {
					// setTimeout(self.getNotifications, 5*60*1000);
				});
			},
			onClickBell: function () {
				var button = $(this.refs.button.getDOMNode());
				if (!this.seen) {
					this.seen = true;
					$.post('/api/me/notifications/seen');
					this.refs.nCount.getDOMNode().innerHTML = '';
				}

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
						className:"icon-btn bell",
						'data-action':"show-notifications",
						onClick:this.onClickBell}, 
						React.DOM.i( {className:"icon-bell2"}),
						React.DOM.sup( {ref:"nCount", className:"count"}, "0")
					)
				);
			},
		});

		if (document.getElementById('nav-bell'))
			React.renderComponent(Bell(null ),
				document.getElementById('nav-bell'));
	}

});
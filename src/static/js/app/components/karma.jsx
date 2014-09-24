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
			// return name+" votou na sua publicação '"+item.name+"'"
			return name+" votou"
		} else {
			var names = _.map(item.instances.slice(0, item.instances.length-1),
				function (i) {
					return i.name.split(' ')[0];
				}).join(', ')
			names += " e "+(item.instances[item.instances.length-1].name.split(' '))[0]+" ";
			return names+" votaram";
		}
	}
}

if (window.user) {

	var Points = {
		'PostUpvote': 5
	};

	var KarmaItem = React.createClass({
		handleClick: function () {
			if (this.props.data.path) {
				window.location.href = this.props.data.path;
			}
		},
		render: function () {
			// var thumbnailStyle = {
			// 	backgroundImage: 'url('+this.props.data.thumbnailUrl+')',
			// };
			// <span dangerouslySetInnerHTML={{__html: message}} />
			// {this.props.data.thumbnailUrl?
			// <div className="thumbnail" style={thumbnailStyle}></div>:undefined}
			// }

			var ptype = this.props.data.object.postType;
			if (ptype) {
				var icon = (
					<i className={ptype=='Note'?"icon-file-text":"icon-chat3"}></i>
				);
			}

			var date = window.calcTimeFrom(this.props.data.last_update);
			var message = KarmaTemplates[this.props.data.type](this.props.data)
			console.log(Points, this.props.data.type, this.props.data.multiplier)
			var delta = Points[this.props.data.type]*this.props.data.multiplier;
			return (
				<li data-seen={this.props.seen} onClick={this.handleClick}>
					<div className="left">
						<div className="delta">
							+{delta}
						</div>
					</div>
					<div className="right body">
						<span className="name">{icon} {this.props.data.object.name}</span>
						<span className="read">{message}</span>
					</div>
				</li>
			);
						// <time>{date}</time>
		},
	});

	var KarmaPopoverList = React.createClass({
		render: function () {
			var items = this.props.data.items.map(function (i) {
				return (
					<KarmaItem key={i.id} data={i} />
				);
			}.bind(this));
			return (
				<div className="popover-inner">
					<div className="top">
						Karma <div className="detail">+{window.user.karma}</div>
					</div>
					<div className="popover-list">
						{items}
					</div>
				</div>
			);
		}
	});

	var KarmaList = React.createClass({
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
						content: <KarmaPopoverList data={response.data} destroy={destroyPopover}/>,
						placement: 'bottom',
						// container: 'nav.bar',
						container: 'body',
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
				<button
					ref='button'
					className={"icon-btn karma "+(this.state.seen_all?"":"active")}
					data-action="show-karma"
					onClick={this.onClick}>
					<i className="icon-fire2"></i>
					<sup ref="nCount" className="count">{window.user.karma}</sup>
				</button>
			);
		},
	});

	if (document.getElementById('nav-karma'))
		React.renderComponent(<KarmaList />,
			document.getElementById('nav-karma'));
}
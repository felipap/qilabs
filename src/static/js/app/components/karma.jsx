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
		'PostUpvote': 10
	};

	var KarmaItem = React.createClass({
		handleClick: function () {
			if (this.props.data.path) {
				window.location.href = this.props.data.path;
			}
		},
		render: function () {
			var ptype = this.props.data.object.postType;
			if (ptype) {
				var icon = (
					<i className={ptype=='Note'?"icon-file-text":"icon-chat3"}></i>
				);
			}

			var date = window.calcTimeFrom(this.props.data.last_update);
			var message = KarmaTemplates[this.props.data.type](this.props.data)
			var delta = Points[this.props.data.type]*this.props.data.multiplier;

						// <time>{date}</time>
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
		componentWillMount: function () {
			var self = this;
			// Hide popover when mouse-click happens outside it.
			$(document).mouseup(function (e) {
				var container = $(self.refs.button.getDOMNode());
				if (!container.is(e.target) && container.has(e.target).length === 0
					&& $(e.target).parents('.popover.in').length === 0) {
					$(self.refs.button.getDOMNode()).popover('destroy');
				}
			});
		},
		toggleMe: function () {
			if (this.data) {
				$button = $(this.refs.button.getDOMNode());
				//

				$button.popover({
					react: true,
					content: <KarmaPopoverList data={this.data} />,
					placement: 'bottom',
					container: 'body',
					trigger: 'manual',
				});
				// $button.popover('destroy');

				$button.popover('show');
				// if ($button.data('bs.popover') &&
				// $button.data('bs.popover').tip().hasClass('in')) { // already visible
				// 	console.log("HIDE")
				// 	$button.popover('hide');
				// } else {
				// 	console.log("SHOW")
				// }
			}
		},
		onClick: function () {
			if (!this.startedFetching) {
				this.startedFetching = true;
				$.ajax({
					url: '/api/me/karma',
					type: 'get',
					dataType: 'json',
				}).done(function (response) {
					if (response.error) {
						app.flash && app.flash.warn(response.error);
						// Allow user to try again
						this.startedFetching = false;
					} else {
						this.data = response.data;
						this.toggleMe();
					}
				}.bind(this));
			} else if (this.data) {
				this.toggleMe();
			} else {
				console.log("Wait for it.");
			}
		},
		render: function () {
			return (
				<button
					ref='button'
					className="icon-btn karma"
					data-action="show-karma"
					onClick={this.onClick}>
					<span ref="nCount" className="count">{window.user.karma}</span>
					<i className="icon-lightbulb2"></i>
				</button>
			);
		},
	});

	if (document.getElementById('nav-karma'))
		React.renderComponent(<KarmaList />,
			document.getElementById('nav-karma'));
}
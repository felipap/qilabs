/** @jsx React.DOM */

var $ = require('jquery')
var _ = require('lodash')
window.React = require('react')

var Box = React.createClass({
	close: function () {
		this.props.onClose();
	},
	render: function () {
		return (
			<div>
				<div className="box-blackout" onClick={this.close} data-action="close-dialog"></div>
				<div className="box">
					{this.props.children}
				</div>
			</div>
		);
	}
});

var Modal = module.exports = function (component, className, onRender) {
	var $el = $('<div class="dialog">').appendTo("body");
	if (className) {
		$el.addClass(className);
	}
	function onClose () {
		$el.fadeOut();
		React.unmountComponentAtNode($el[0]);
	}
	var c = React.renderComponent(<Box onClose={onClose}>{component}</Box>, $el[0],
		function () {
			// Defer execution, so variable c is set.
			setTimeout(function () {
				$el.fadeIn();
				onRender && onRender($el[0], c);
			}, 10);
		});
}

var Share = React.createClass({
	onClickBlackout: function () {
		$(this).fadeOut();
	},
	render: function () {
		var urls = {
			facebook: 'http://www.facebook.com/sharer.php?u='+encodeURIComponent(this.props.url)+
				'&ref=fbshare&t='+encodeURIComponent(this.props.title),
			gplus: 'https://plus.google.com/share?url='+encodeURIComponent(this.props.url),
			twitter: 'http://twitter.com/share?url='+encodeURIComponent(this.props.url)+
				'&ref=twitbtn&text='+encodeURIComponent(this.props.title),
		}

		function genOnClick(url) {
			return function () {
				window.open(url,"mywindow","menubar=1,resizable=1,width=500,height=500");
			};
		}

		return (
			<div>
				<label>{this.props.message}</label>
				<input type="text" name="url" readOnly value={this.props.url} />
				<div className="share-icons">
					<button className="share-gp" onClick={genOnClick(urls.gplus)}
						title="Compartilhe essa questão no Google+">
						<i className="icon-google-plus-square"></i> Google+
					</button>
					<button className="share-fb" onClick={genOnClick(urls.facebook)}
						title="Compartilhe essa questão no Facebook">
						<i className="icon-facebook-square"></i> Facebook
					</button>
					<button className="share-tw" onClick={genOnClick(urls.twitter)}
						title="Compartilhe essa questão no Twitter">
						<i className="icon-twitter-square"></i> Twitter
					</button>
				</div>
			</div>
		);
	},
});

module.exports.ShareDialog = function (data, onRender) {
	Modal(
		Share(data),
		"share-dialog",
		function (elm, component) {
			$(component.getDOMNode()).find('input').focus();
			onRender && onRender.call(this, elm, component);
		}
	);
};
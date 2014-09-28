/** @jsx React.DOM */

var $ = require('jquery')
var _ = require('lodash')
window.React = require('react')

var Modal = React.createClass({displayName: 'Modal',
	close: function () {
		this.props.onClose();
	},
	render: function () {
		return (
			React.DOM.div(null, 
				React.DOM.div( {className:"box-blackout", onClick:this.close, 'data-action':"close-dialog"}),
				React.DOM.div( {className:"box"}, 
					this.props.children
				)
			)
		);
	}
});

module.exports = function (component, className, onRender) {

	var $el = $('<div class="dialog">').appendTo("body");
	if (className) {
		$el.addClass(className);
	}
	function onClose () {
		$el.fadeOut();
		React.unmountComponentAtNode($el[0]);
	}
	var c = React.renderComponent(Modal( {onClose:onClose}, component), $el[0],
		function () {
			$el.fadeIn();
			onRender && onRender();
		});
}

module.exports.ShareModal = React.createClass({displayName: 'ShareModal',
		render: function () {
			return (
				React.DOM.div(null
				)
			);
		}
	});
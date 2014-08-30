/** @jsx React.DOM */

var $ = require('jquery')
var models = require('../components/models.js')
var React = require('react')
var _ = require("underscore")

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
	selectInterest: function () {
	},
	render: function () {
		React.DOM.button( {className:"btn-follow", 'data-action':"unfollow"})
		var items = _.map(pageMap, function (page, key) {
			var pageFollowed = Math.random()>.5?true:false;
			return (
				React.DOM.li( {key:key}, 
					React.DOM.a( {href:page.path}, 
						React.DOM.i( {className:page.icon}),
						React.DOM.span( {className:"name"}, page.name)
					),
					
						pageFollowed?
						React.DOM.button( {className:"btn-follow", 'data-action':"unfollow", 'data-page':key})
						:React.DOM.button( {className:"btn-follow", 'data-action':"follow", 'data-page':key})
					
				)
			);
		});

		return (
			React.DOM.div( {className:"qi-box"}, 
				React.DOM.i( {className:"close-btn", onClick:this.close}),
				React.DOM.label(null, "Selecione os seus interesses"),
				React.DOM.div( {className:"list"}, 
					items
				)
			)
		);
	},
});
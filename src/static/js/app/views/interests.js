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
		$(this.getDOMNode()).on('click', 'button[data-page]', function (evt) {
			self.selectInterest(this.dataset.page, this.dataset.action==="follow");
		});
	},
	selectInterest: function (key, select) {
		var self = this;
		$.ajax({
			type: 'put',
			dataType: 'json',
			url: select?'/api/me/interests/add':'/api/me/interests/remove',
			data: { item: key }
		}).done(function (response) {
			if (response && !response.error) {
				app.flash.info("OK.");
				$(self.getDOMNode()).find('[data-page="'+key+'"]')[0].dataset.action = select?"unfollow":"follow";
			} else {
				app.flash.alert("Puts.");
			}
		}).fail(function (response) {
			app.flash.warn("Fail.");
		});
	},
	render: function () {
		var self = this;
		if (!window.user)
			return null;

		var items = _.map(pageMap, function (page, key) {
			function toggleMe () {
				self.selectInterest(key, $());
			}
			var pageFollowed = window.user.preferences.interests.indexOf(key) != -1;
			return (
				React.DOM.li( {key:key, 'data-tag':key}, 
					React.DOM.a( {href:page.path}, 
						React.DOM.div( {className:"item"}, 
							React.DOM.i( {className:"circle"}),
							React.DOM.span( {className:"name"}, page.name)
						)
					),
					
						pageFollowed?
						React.DOM.button( {className:"btn-follow", 'data-action':"unfollow", 'data-page':key})
						:React.DOM.button( {className:"btn-follow", 'data-action':"follow", 'data-page':key})
					
				)
			);
						// <i className={"icon-square"+(pageFollowed?'-o':'')}></i>
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
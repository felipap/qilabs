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
	render: function () {
		// <button className='btn-follow' data-action='unfollow'></button>
		var items = _.map(this.props.list, function (person) {
			console.log(person)
			return (
				React.DOM.li( {key:person._id}, 
					React.DOM.a( {href:person.path}, 
						React.DOM.div( {className:"avatarWrapper"}, 
							React.DOM.div( {className:"avatar", style: {background: 'url('+person.avatarUrl+')'} })
						),
						React.DOM.span( {className:"name"}, person.name)
					),
					
						(!window.user || window.user.id === person._id)?
						null
						:(
							person.meta.followed?
							React.DOM.button( {className:"btn-follow", 'data-action':"unfollow", 'data-user':person._id})
							:React.DOM.button( {className:"btn-follow", 'data-action':"follow", 'data-user':person._id})
						)
					
				)
			);
		});
		if (this.props.isFollowing)
			var label = this.props.profile.name+' segue '+this.props.list.length+' pessoas';
		else
			var label = this.props.list.length+' pessoas seguem '+this.props.profile.name;

		return (
			React.DOM.div( {className:"qi-box white"}, 
				React.DOM.i( {className:"close-btn", onClick:this.close}),
				React.DOM.label(null, label),
				React.DOM.div( {className:"list"}, 
					items
				)
			)
		);
	},
});
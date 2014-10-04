/** @jsx React.DOM */

var $ = require('jquery')
var models = require('../components/models.js')
var React = require('react')
var _ = require("underscore")

module.exports = React.createClass({
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
				<li key={person.id}>
					<a href={person.path}>
						<div className='user-avatar'>
							<div className='avatar' style={ {background: 'url('+person.avatarUrl+')'} }></div>
						</div>
						<span className='name'>{person.name}</span>
					</a>
					{
						(!window.user || window.user.id === person.id)?
						null
						:(
							person.meta.followed?
							<button className='btn-follow' data-action='unfollow' data-user={person.id}></button>
							:<button className='btn-follow' data-action='follow' data-user={person.id}></button>
						)
					}
				</li>
			);
		});
		if (this.props.isFollowing)
			var label = this.props.profile.name+' segue '+this.props.list.length+' pessoas';
		else
			var label = this.props.list.length+' pessoas seguem '+this.props.profile.name;

		return (
			<div className='qi-box white'>
				<i className='close-btn' onClick={this.close}></i>
				<label>{label}</label>
				<div className='list'>
					{items}
				</div>
			</div>
		);
	},
});
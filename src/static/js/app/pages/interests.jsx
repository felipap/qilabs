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
	selectInterest: function () {
	},
	render: function () {
		<button className='btn-follow' data-action='unfollow'></button>
		var items = _.map(pageMap, function (page, key) {
			var pageFollowed = Math.random()>.5?true:false;
			return (
				<li key={key}>
					<a href={page.path}>
						<i className={page.icon}></i>
						<span className='name'>{page.name}</span>
					</a>
					{
						pageFollowed?
						<button className='btn-follow' data-action='unfollow' data-page={key}></button>
						:<button className='btn-follow' data-action='follow' data-page={key}></button>
					}
				</li>
			);
		});

		return (
			<div className='qi-box'>
				<i className='close-btn' onClick={this.close}></i>
				<label>Selecione os seus interesses</label>
				<div className='list'>
					{items}
				</div>
			</div>
		);
	},
});
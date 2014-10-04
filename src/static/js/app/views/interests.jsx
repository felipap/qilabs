/** @jsx React.DOM */

var $ = require('jquery')
var React = require('react')
var _ = require("underscore")

var models = require('../components/models.js')
var Modal = require('./parts/modal.js')

var InterestsBox = React.createClass({
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
		}).fail(function (xhr) {
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
				<li key={key} data-tag={key}>
					<a href={page.path}>
						<div className="item">
							<i className="circle tag-bg" data-tag={key}></i>
							<span className='name'>{page.name}</span>
						</div>
					</a>
					{
						pageFollowed?
						<button className='btn-follow' data-action="unfollow" data-page={key}></button>
						:<button className='btn-follow' data-action="follow" data-page={key}></button>
					}
				</li>
			);
		});

		return (
			<div>
				<label>Selecione os seus interesses</label>
				<div className='list'>
					{items}
				</div>
			</div>
		);
	},
});


module.exports = function (data, onRender) {
	Modal(
		InterestsBox(data),
		"interests-dialog",
		function (elm, component) {
			onRender && onRender.call(this, elm, component);
		}
	);
};

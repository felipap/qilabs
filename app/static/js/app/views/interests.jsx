/** @jsx React.DOM */

var $ = require('jquery')
var React = require('react')
var _ = require('lodash')

var Dialog = require('../components/modal.jsx')

var InterestsBox = React.createClass({
	close: function () {
		this.props.page.destroy();
	},
	getInitialState: function () {
		return { interests: window.user.preferences.labs };
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
			self.selectInterest(this.dataset.page);
		});
	},
	selectInterest: function (key) {
		$.ajax({
			type: 'put',
			dataType: 'json',
			url: '/api/me/interests/toggle',
			data: { item: key }
		}).done(function (response) {
			if (response.error) {
				app.flash.alert("Puts.");
			} else {
				// $(self.getDOMNode()).find('[data-page="'+key+'"]')[0].dataset.action = select?"unfollow":"follow";
				window.user.preferences.interests = response.data;
				this.setState({ interests: response.data });
				app.flash.info("<i class='icon-tick'></i>");
			}
		}.bind(this)).fail(function (xhr) {
			app.flash.warn(xhr.responseJSON && xhr.responseJSON.message || "Erro.");
		}.bind(this));
	},
	render: function () {
		var self = this;
		if (!window.user)
			return null;

		var items = _.map(pageMap, function (page, key) {
			var pageFollowed = this.state.interests.indexOf(key) != -1;
			function toggleMe () {
				self.selectInterest(key, !pageFollowed);
			}
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
		}.bind(this));

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
	Dialog(
		InterestsBox(data),
		"interests-dialog",
		function (elm, component) {
			onRender && onRender.call(this, elm, component);
		}
	);
};

/** @jsx React.DOM */

var React = require('react')

var NotificationsPage;
module.exports = React.createClass({
	getInitialState: function () {
		return {notes:[]};
	},
	close: function () {
		this.props.page.destroy();
	},
	componentDidMount: function () {
		var self = this;
		$.ajax({
			url: '/api/me/notifications?limit=30',
			type: 'get',
			dataType: 'json',
		}).done(function (response) {
			if (response.error) {
				if (response.message)
					app.flash.alert(response.message);
			} else {
				self.setState({notes:response.data});
			}
		});
	},
	render: function () {
		var notes = _.map(this.state.notes, function (item) {
			return (
				<li className='notification' key={item.id}
					data-seen={item.seen} data-accessed={item.accessed}>
					<img className='thumbnail' src={item.thumbnailUrl} />
					<p onClick={function(){window.location.href=item.url} }>
						{item.msg}
					</p>
					<time data-time-count={1*new Date(item.dateSent)} title={formatFullDate(new Date(item.dateSent))}>
						{window.calcTimeFrom(item.dateSent)}
					</time>
				</li>
			);
		});

		return (
			<div className='pcontainer'>
				<i className='close-btn' onClick={this.close}></i>
				<ul className='notificationsWrapper'>
					{notes}
				</ul>
			</div>
		)
	},
});
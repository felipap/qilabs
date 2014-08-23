/** @jsx React.DOM */

var React = require('react')

var NotificationsPage;
module.exports = React.createClass({displayName: 'exports',
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
				React.DOM.li( {className:"notification", key:item.id,
					'data-seen':item.seen, 'data-accessed':item.accessed}, 
					React.DOM.img( {className:"thumbnail", src:item.thumbnailUrl} ),
					React.DOM.p( {onClick:function(){window.location.href=item.url} }, 
						item.msg
					),
					React.DOM.time( {'data-time-count':1*new Date(item.dateSent)}, 
						window.calcTimeFrom(item.dateSent)
					)
				)
			);
		});

		return (
			React.DOM.div( {className:"cContainer"}, 
				React.DOM.i( {className:"close-btn", onClick:this.close}),
				React.DOM.ul( {className:"notificationsWrapper"}, 
					notes
				)
			)
		)
	},
});
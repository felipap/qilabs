/** @jsx React.DOM */

var postViews = require('../components/postViews.js')
var React = require('react')

module.exports = React.createClass({displayName: 'exports',

		componentWillMount: function () {
			var update = function () {
				this.forceUpdate(function(){});
			}
			this.props.model.on('add reset remove change', update.bind(this));
		},

		close: function () {
			this.props.page.destroy();
		},

		onClickEdit: function () {
			window.location.href = this.props.model.get('path')+'/edit';
		},

		onClickTrash: function () {
			if (confirm('Tem certeza que deseja excluir essa postagem?')) {
				this.props.model.destroy();
				this.close();
				// Signal to the wall that the post with this ID must be removed.
				// This isn't automatic (as in deleting comments) because the models on
				// the wall aren't the same as those on post FullPostView.
				console.log('id being removed:',this.props.model.get('id'))
				app.postList.remove({id:this.props.model.get('id')})
				$('.tooltip').remove(); // fuckin bug
			}
		},

		toggleVote: function () {
			this.props.model.handleToggleVote();
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
			var post = this.props.model.attributes,
				author = this.props.model.get('author'),
				type = this.props.type;
			if (type in postViews) {
				var postView = postViews[type];
			} else {
				console.error('Couldn\'t find view for post of type '+type, post);
				return React.DOM.div(null);
			}

			return (
				React.DOM.div( {className:"qi-box postBox", 'data-post-type':this.props.model.get('type'), 'data-post-id':this.props.model.get('id')}, 
					React.DOM.i( {className:"close-btn", 'data-action':"close-page", onClick:this.close}),
					postView( {model:this.props.model, parent:this} )
				)
			);
		},
});
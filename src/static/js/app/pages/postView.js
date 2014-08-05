/** @jsx React.DOM */

define(['common', 'react', 'components.postViews', 'components.postModels', 'medium-editor', 'typeahead-bundle'],
	function (common, React, postViews, postModels) {

	return React.createClass({

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
			console.log('oi')
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
			var post = this.props.model.attributes;
			var author = this.props.model.get('author');
			var postType = this.props.model.get('type');
			if (postType in postViews) {
				var postView = postViews[postType];
			} else {
				console.warn('Couldn\'t find view for post of type '+postType);
				return React.DOM.div(null);
			}

			return (
				React.DOM.div( {className:"postBox", 'data-post-type':this.props.model.get('type'), 'data-post-id':this.props.model.get('id')}, 
					React.DOM.i( {className:"close-btn", 'data-action':"close-page", onClick:this.close}),
					React.DOM.div( {className:"postCol"}, 
						postView( {model:this.props.model, parent:this} )
					)
				)
			);
		},
	});
});
/** @jsx React.DOM */

define(['common', 'react', 'components.postModels', 'medium-editor', 'typeahead-bundle'],
	function (common, React, postModels) {

	var FollowList;
	return FollowList = React.createClass({displayName: 'FollowList',
		close: function () {
			this.props.page.destroy();
		},
		render: function () {
			// <button className='btn-follow' data-action='unfollow'></button>
			var items = _.map(this.props.list, function (person) {
				return (
					React.DOM.li(null, 
						React.DOM.a( {href:person.path}, 
							React.DOM.div( {className:"avatarWrapper"}, 
								React.DOM.div( {className:"avatar", style: {background: 'url('+person.avatarUrl+')'} })
							),
							React.DOM.span( {className:"name"}, person.name),
							
								(!window.user || window.user.id === person.id)?
								null
								:(
									person.meta.followed?
									React.DOM.button( {className:"btn-follow", 'data-action':"unfollow", 'data-user':person.id})
									:React.DOM.button( {className:"btn-follow", 'data-action':"follow", 'data-user':person.id})
								)
							
						)
					)
				);
			});
			if (this.props.isFollowing)
				var label = this.props.profile.name+' segue '+this.props.list.length+' pessoas';
			else
				var label = this.props.list.length+' pessoas seguem '+this.props.profile.name;

			return (
				React.DOM.div( {className:"cContainer"}, 
					React.DOM.i( {className:"close-btn", onClick:this.close}),
					React.DOM.div( {className:"listWrapper"}, 
						React.DOM.div( {className:"left"}, 
							React.DOM.button( {'data-action':"close-page", onClick:this.close}, "Voltar")
						),
						React.DOM.label(null, label),
						items
					)
				)
			);
		},
	});

;
});
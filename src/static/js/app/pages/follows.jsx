/** @jsx React.DOM */

define(['common', 'react', 'components.models', 'medium-editor', 'typeahead-bundle'],
	function (common, React, models) {

	var FollowList;
	return FollowList = React.createClass({
		close: function () {
			this.props.page.destroy();
		},
		render: function () {
			// <button className='btn-follow' data-action='unfollow'></button>
			var items = _.map(this.props.list, function (person) {
				return (
					<li>
						<a href={person.path}>
							<div className='avatarWrapper'>
								<div className='avatar' style={ {background: 'url('+person.avatarUrl+')'} }></div>
							</div>
							<span className='name'>{person.name}</span>
							{
								(!window.user || window.user.id === person.id)?
								null
								:(
									person.meta.followed?
									<button className='btn-follow' data-action='unfollow' data-user={person.id}></button>
									:<button className='btn-follow' data-action='follow' data-user={person.id}></button>
								)
							}
						</a>
					</li>
				);
			});
			if (this.props.isFollowing)
				var label = this.props.profile.name+' segue '+this.props.list.length+' pessoas';
			else
				var label = this.props.list.length+' pessoas seguem '+this.props.profile.name;

			return (
				<div className='cContainer'>
					<i className='close-btn' onClick={this.close}></i>
					<div className='listWrapper'>
						<div className='left'>
							<button data-action='close-page' onClick={this.close}>Voltar</button>
						</div>
						<label>{label}</label>
						{items}
					</div>
				</div>
			);
		},
	});

;
});
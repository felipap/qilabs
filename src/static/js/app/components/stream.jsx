/** @jsx React.DOM */

/*
** stream.jsx
** Copyright QILabs.org
** BSD License
*/

define(['jquery', 'backbone', 'underscore', 'components.postModels', 'react',],
	function ($, Backbone, _, postModels, React) {

	var backboneModel = {
		componentWillMount: function () {
			var update = function () {
				this.forceUpdate(function(){});
			}
			this.props.model.on('add reset remove change', update.bind(this));
		},
	};

	var ItemView = React.createClass({
			mixins: [backboneModel],
			componentDidMount: function () {},
			render: function () {
				function gotoPost () {
					app.navigate('/posts/'+post.id, {trigger:true});
				}
				var post = this.props.model.attributes;
				var mediaUserStyle = {
					background: 'url('+post.author.avatarUrl+')',
				};

				var tagList = (
					<div className="tags">
					{_.map(this.props.tags, function (tagId) {
						return (
							<div className="tag" key={tagId}>
								#{tagMap[tagId].label}
							</div>
						);
					})}
					</div>
				);

				return (
					<div className="cardView" onClick={gotoPost}>
						<div className="cardHeader">
							<span className="cardType">
								{post.translatedType}
							</span>
							<div className="iconStats">
								<div>
									{this.props.model.liked?<i className="icon-heart icon-red"></i>:<i className="icon-heart"></i>}
									&nbsp;
									{post.voteSum}
								</div>
								{post.type === "Question"?
									<div>
										<i className="icon-bulb"></i>&nbsp;
										{this.props.model.get('childrenCount').Answer}
									</div>
									:<div>
										<i className="icon-comment-o"></i>&nbsp;
										{this.props.model.get('childrenCount').Comment}
									</div>
								}
							</div>
						</div>

						<div className="cardBody">
							<span ref="cardBodySpan">{post.content.title}</span>
						</div>

						<div className="cardFoot">
							<div className="authorship">
								<div className="avatarWrapper">
									<a href={post.author.path}>
										<div className="avatar" style={mediaUserStyle}></div>
									</a>
								</div>
								<a href={post.author.path} className="username">
									{post.author.name}
								</a>
							</div>
							<time data-time-count={1*new Date(post.published)}>
								{window.calcTimeFrom(post.published)}
							</time>
							<i className="icon-circle"></i>
							{tagList}
						</div>
					</div>
				);
			}
	});
	
	var FeedStreamView;
	return FeedStreamView = React.createClass({
		getInitialState: function () {
			return {selectedForm:null};
		},
		componentWillMount: function () {
		},
		render: function () {
			var cards = app.postList.map(function (post) {
				if (post.get('__t') === 'Post')
					return ItemView({model:post, key:post.id});
				return null;
			});
			return (
				<div className="timeline">
					{cards}
				</div>
			);
		},
	});
});

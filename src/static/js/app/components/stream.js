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

	var ItemView = React.createClass({displayName: 'ItemView',
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
					React.DOM.div( {className:"tags"}, 
					_.map(this.props.model.get('tags'), function (tagId) {
						return (
							React.DOM.div( {className:"tag", key:tagId}, 
								"#",tagMap[tagId].label
							)
						);
					})
					)
				);

				var mainTag = null;
				if (this.props.model.get('tags').length) {
					var f = this.props.model.get('tags')[0];
					if (f in tagMap) {
						mainTag = tagMap[f].name;
					}
				}

				return (
					React.DOM.div( {className:"cardView", onClick:gotoPost}, 
						React.DOM.div( {className:"cardHeader"}, 
							React.DOM.span( {className:"cardType"}, 
								mainTag
							),
							React.DOM.div( {className:"iconStats"}, 
								React.DOM.div( {className:"stats-likes"}, 
									this.props.model.liked?React.DOM.i( {className:"icon-heart icon-red"}):React.DOM.i( {className:"icon-heart"}),
									" ",
									post.voteSum
								),
								React.DOM.div( {className:"stats-comments"}, 
									React.DOM.i( {className:"icon-comments2"})," ",
									this.props.model.get('childrenCount').Comment
								)
							)
						),

						React.DOM.div( {className:"cardBody"}, 
							React.DOM.span( {ref:"cardBodySpan"}, post.content.title)
						),

						React.DOM.div( {className:"cardFoot"}, 
							React.DOM.div( {className:"authorship"}, 
								React.DOM.div( {className:"avatarWrapper"}, 
									React.DOM.a( {href:post.author.path}, 
										React.DOM.div( {className:"avatar", style:mediaUserStyle})
									)
								),
								React.DOM.a( {href:post.author.path, className:"username"}, 
									post.author.name
								)
							),
							React.DOM.time( {'data-time-count':1*new Date(post.published)}, 
								window.calcTimeFrom(post.published)
							),
							React.DOM.div( {className:"iconStats"}, 
								React.DOM.div( {className:"stats-comments"}, 
									React.DOM.span( {className:"count"}, this.props.model.get('childrenCount').Comment),
									React.DOM.i( {className:"icon-chat2"})
								),
								React.DOM.div( {className:this.props.model.liked?"stats-likes active":"stats-likes"}, 
									React.DOM.span( {className:"count"}, post.voteSum),
									this.props.model.liked?React.DOM.i( {className:"icon-heart"}):React.DOM.i( {className:"icon-heart2"})
								)
							),
							React.DOM.i( {className:"icon-circle"}),
							tagList
						),
						React.DOM.div( {className:"veil"}, 
							React.DOM.time( {'data-time-count':1*new Date(post.published)}, 
								window.calcTimeFrom(post.published)
							)
						)
					)
				);
			}
	});
	
	var FeedStreamView;
	return FeedStreamView = React.createClass({displayName: 'FeedStreamView',
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
				React.DOM.div( {className:"timeline"}, 
					cards
				)
			);
		},
	});
});


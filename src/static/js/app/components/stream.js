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
					_.map(this.props.tags, function (tagId) {
						return (
							React.DOM.div( {className:"tag", key:tagId}, 
								"#",tagMap[tagId].label
							)
						);
					})
					)
				);

				return (
					React.DOM.div( {className:"cardView", onClick:gotoPost}, 
						React.DOM.div( {className:"cardHeader"}, 
							React.DOM.span( {className:"cardType"}, 
								post.translatedType
							),
							React.DOM.div( {className:"iconStats"}, 
								React.DOM.div(null, 
									this.props.model.liked?React.DOM.i( {className:"icon-heart icon-red"}):React.DOM.i( {className:"icon-heart"}),
									" ",
									post.voteSum
								),
								post.type === "Question"?
									React.DOM.div(null, 
										React.DOM.i( {className:"icon-bulb"})," ",
										this.props.model.get('childrenCount').Answer
									)
									:React.DOM.div(null, 
										React.DOM.i( {className:"icon-comment-o"})," ",
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
							React.DOM.i( {className:"icon-circle"}),
							tagList
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


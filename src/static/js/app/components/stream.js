/** @jsx React.DOM */

/*
** stream.jsx
** Copyright QILabs.org
** BSD License
*/

define(['jquery', 'backbone', 'underscore', 'components.models', 'react',],
	function ($, Backbone, _, models, React) {

	var backboneModel = {
		componentWillMount: function () {
			var update = function () {
				this.forceUpdate(function(){});
			}
			this.props.model.on('add reset remove change', update.bind(this));
		},
	};

	var Card = React.createClass({displayName: 'Card',
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

				var mainTag = null;
				if (this.props.model.get('tag')) {
					var f = this.props.model.get('tags')[0];
					if (f in tagMap) {
						mainTag = tagMap[f].name;
					}
				}

				return (
					React.DOM.div( {className:"cardView", onClick:gotoPost}, 
						React.DOM.div( {className:"cardHeader"}, 
							React.DOM.span( {className:"cardType"}, 
								this.props.model.get()
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
							)
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
	
	var ListItem = React.createClass({displayName: 'ListItem',
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
							"#",tagMap[tagId].name
						)
					);
				})
				)
			);

			return (
				React.DOM.div( {className:"listItem", onClick:gotoPost}, 
					React.DOM.div( {className:"cell lefty"}, 
						React.DOM.div( {className:"item-col stats-col"}, 
							React.DOM.div( {className:"stats-likes"}, 
								this.props.model.liked?React.DOM.i( {className:"icon-heart icon-red"}):React.DOM.i( {className:"icon-heart-o"}),
								React.DOM.span( {className:"count"}, post.voteSum)
							)
						),
						React.DOM.div( {className:"item-col stats-col"}, 
							React.DOM.div( {className:"stats-comments"}, 
								React.DOM.i( {className:"icon-comments2"}),
								React.DOM.span( {className:"count"}, this.props.model.get('childrenCount').Comment)
							)
						)
					),
					React.DOM.div( {className:"cell center"}, 
						React.DOM.div( {className:"title"}, 
							React.DOM.span( {ref:"cardBodySpan"}, post.content.title)
						),
						React.DOM.div( {className:"info-bar"}, 
							React.DOM.a( {href:post.author.path, className:"username"}, 
								React.DOM.span( {className:"pre"}, "por")," ",post.author.name
							),
							React.DOM.i( {className:"icon-circle"}),
							React.DOM.time( {'data-time-count':1*new Date(post.published)}, 
								window.calcTimeFrom(post.published)
							)
						)
					),
					React.DOM.div( {className:"cell righty"}, 
						React.DOM.div( {className:"item-col"}, 
							React.DOM.div( {className:"user-avatar item-author-avatar"}, 
								React.DOM.a( {href:post.author.path}, 
									React.DOM.div( {className:"avatar", style:mediaUserStyle})
								)
							)
						)
					)
				)
			);
		}
	});
	
	var ProblemCard = React.createClass({displayName: 'ProblemCard',
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
							"#",tagMap[tagId].name
						)
					);
				})
				)
			);

			return (
				React.DOM.div( {className:"listItem", onClick:gotoPost}, 
					React.DOM.div( {className:"cell lefty"}, 
						React.DOM.div( {className:"item-col stats-col"}, 
							React.DOM.div( {className:"stats-likes"}, 
								this.props.model.liked?React.DOM.i( {className:"icon-heart icon-red"}):React.DOM.i( {className:"icon-heart-o"}),
								React.DOM.span( {className:"count"}, post.voteSum)
							)
						),
						React.DOM.div( {className:"item-col stats-col"}, 
							React.DOM.div( {className:"stats-comments"}, 
								React.DOM.i( {className:"icon-comments2"}),
								React.DOM.span( {className:"count"}, this.props.model.get('childrenCount').Comment)
							)
						)
					),
					React.DOM.div( {className:"cell center"}, 
						React.DOM.div( {className:"title"}, 
							React.DOM.span( {ref:"cardBodySpan"}, post.content.title)
						),
						React.DOM.div( {className:"info-bar"}, 
							React.DOM.a( {href:post.author.path, className:"username"}, 
								React.DOM.span( {className:"pre"}, "por")," ",post.author.name
							),
							React.DOM.i( {className:"icon-circle"}),
							React.DOM.time( {'data-time-count':1*new Date(post.published)}, 
								window.calcTimeFrom(post.published)
							)
						)
					),
					React.DOM.div( {className:"cell righty"}, 
						React.DOM.div( {className:"item-col"}, 
							React.DOM.div( {className:"user-avatar item-author-avatar"}, 
								React.DOM.a( {href:post.author.path}, 
									React.DOM.div( {className:"avatar", style:mediaUserStyle})
								)
							)
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
				if (post.get('__t') === 'Post') {
					if (conf.streamRender === "ListView")
						return ListItem({model:post, key:post.id});
					if (post.get('type') == 'Problem')
						return ProblemCard({model:post, key:post.id});
					return Card({model:post, key:post.id});
				}
				return null;
			});
			if (app.postList.length)
				return (
					React.DOM.div( {className:"stream"}, 
						cards
					)
				);
			else
				return (
					React.DOM.div( {className:"stream"}, 
						React.DOM.div( {className:"stream-msg"}, 
							"Ainda não há nada por aqui. Tente ", React.DOM.a( {href:"/descubra/pessoas"}, "seguir alguém"),", ou ", React.DOM.a( {href:"/descubra/atividades"}, "adicione interesses"),". ", React.DOM.i( {className:"icon-happy"})
						)
					)
				);
		},
	});
});


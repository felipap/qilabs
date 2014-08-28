/** @jsx React.DOM */

/*
** stream.jsx
** Copyright QILabs.org
** BSD License
*/

var $ = require('jquery')
var Backbone = require('backbone')
var _ = require('underscore')
var models = require('./models.js')
var React = require('react')
var AwesomeGrid = require('awesome-grid')

var backboneModel = {
	componentWillMount: function () {
		var update = function () {
			this.forceUpdate(function(){});
		}
		this.props.model.on('add reset remove change', update.bind(this));
	},
};

// var Card = React.createClass({
// 		mixins: [backboneModel],
// 		componentDidMount: function () {},
// 		render: function () {
// 			function gotoPost () {
// 				app.navigate(post.path, {trigger:true});
// 			}
// 			var post = this.props.model.attributes;
// 			var mediaUserStyle = {
// 				'background-image': 'url('+post.author.avatarUrl+')',
// 			};

// 			var pageName;
// 			if (post.subject && post.subject in pageMap) {
// 				pageName = pageMap[post.subject].name;
// 			}

// 			return (
// 				<div className="cardView" onClick={gotoPost}>
// 					<div className="cardHeader">
// 						<span className="cardType">
// 							{pageName}
// 						</span>
// 						<div className="iconStats">
// 							<div className="stats-likes">
// 								{this.props.model.liked?<i className="icon-heart icon-red"></i>:<i className="icon-heart"></i>}
// 								&nbsp;
// 								{post.counts.votes}
// 							</div>
// 							<div className="stats-comments">
// 								<i className="icon-comments2"></i>&nbsp;
// 								{this.props.model.get('counts').children}
// 							</div>
// 						</div>
// 					</div>

// 					<div className="cardBody">
// 						<span ref="cardBodySpan">{post.content.title}</span>
// 					</div>

// 					<div className="cardFoot">
// 						<div className="authorship">
// 							<div className="avatarWrapper">
// 								<a href={post.author.path}>
// 									<div className="avatar" style={mediaUserStyle}></div>
// 								</a>
// 							</div>
// 							<a href={post.author.path} className="username">
// 								{post.author.name}
// 							</a>
// 						</div>
// 						<time data-time-count={1*new Date(post.created_at)}>
// 							{window.calcTimeFrom(post.created_at)}
// 						</time>
// 						<div className="iconStats">
// 							<div className="stats-comments">
// 								<span className="count">{this.props.model.get('counts').children}</span>
// 								<i className="icon-chat2"></i>
// 							</div>
// 							<div className={this.props.model.liked?"stats-likes active":"stats-likes"}>
// 								<span className="count">{post.counts.votes}</span>
// 								{this.props.model.liked?<i className="icon-heart"></i>:<i className="icon-heart2"></i>}
// 							</div>
// 						</div>
// 					</div>
// 					<div className="veil">
// 						<time data-time-count={1*new Date(post.created_at)}>
// 							{window.calcTimeFrom(post.created_at)}
// 						</time>
// 					</div>
// 				</div>
// 			);
// 		}
// });

var Card = React.createClass({displayName: 'Card',
		mixins: [backboneModel],
		componentDidMount: function () {},
		render: function () {
			function gotoPost () {
				app.navigate(post.path, {trigger:true});
			}
			var post = this.props.model.attributes;

			var pageName;
			if (post.subject && post.subject in pageMap) {
				pageName = pageMap[post.subject].name;
			}

			var subtagsUniverse = {};
			if (post.subject && pageMap[post.subject] && pageMap[post.subject].children)
				subtagsUniverse = pageMap[post.subject].children;

			var tagNames = [];
			if (pageName) {
				tagNames.push(pageName);
				_.each(post.tags, function (id) {
					if (id in subtagsUniverse)
						tagNames.push(subtagsUniverse[id].name);
				});
			}

			return (
				React.DOM.div( {className:"card", onClick:gotoPost}, 
					React.DOM.div( {className:"card-header"}, 
						React.DOM.span( {className:"cardType"}, 
							pageName
						),
						React.DOM.div( {className:"iconStats"}, 
							React.DOM.div( {className:"stats-likes"}, 
								this.props.model.liked?React.DOM.i( {className:"icon-heart icon-red"}):React.DOM.i( {className:"icon-heart"}),
								" ",
								post.counts.votes
							),
							React.DOM.div( {className:"stats-comments"}, 
								React.DOM.i( {className:"icon-comments2"})," ",
								this.props.model.get('counts').children
							)
						),
						React.DOM.div( {className:"authorship"}, 
						React.DOM.a( {href:post.author.path, className:"username"}, 
							post.author.name
						)
						),
						"// ", React.DOM.div( {className:"stats-comments"}, 
						"//  ", 	React.DOM.span( {className:"count"}, this.props.model.get('counts').children),
						"//  ", 	React.DOM.i( {className:"icon-chat2"}),
						"// " ),
						"// ", React.DOM.div( {className:this.props.model.liked?"stats-likes active":"stats-likes"}, 
						"//  ", 	React.DOM.span( {className:"count"}, post.counts.votes),
						"//  ", 	this.props.model.liked?React.DOM.i( {className:"icon-heart"}):React.DOM.i( {className:"icon-heart2"}),
						"// " ),
						"// ", React.DOM.time( {'data-time-count':1*new Date(post.created_at)}, 
						"//  ", 	window.calcTimeFrom(post.created_at),
						"// " )
					),

					React.DOM.div( {className:"card-icon"}, 
						
							post.type === 'Note'?
							React.DOM.i( {className:"icon-file-text"})
							:React.DOM.i( {className:"icon-chat3"})
						
					),

					
						post.content.image?
						React.DOM.div( {className:"card-body cover"}, 
							React.DOM.div( {className:"card-body-cover"}, 
								React.DOM.div( {className:"bg", style:{ 'background-image': 'url('+post.content.image+')' }}),
								React.DOM.div( {className:"user-avatar"}, 
									React.DOM.div( {className:"avatar", style:{ 'background-image': 'url('+post.author.avatarUrl+')' }})
								),
								React.DOM.div( {className:"username"}, 
									"por ", post.author.name.split(' ')[0]
								)
							),
							React.DOM.div( {className:"card-body-span", ref:"cardBodySpan"}, 
								post.content.title
							),
							React.DOM.div( {className:"card-body-tags"}, 
								_.map(tagNames, function (name) {
									return (
										React.DOM.div( {className:"tag", key:name}, 
											"#",name
										)
									);
								})
							)
						)
						:React.DOM.div( {className:"card-body"}, 
							React.DOM.div( {className:"user-avatar"}, 
								React.DOM.div( {className:"avatar", style:{ 'background-image': 'url('+post.author.avatarUrl+')' }})
							),
							React.DOM.div( {className:"right"}, 
							React.DOM.div( {className:"card-body-span", ref:"cardBodySpan"}, 
								post.content.title
							),
							React.DOM.div( {className:"card-body-tags"}, 
								_.map(tagNames, function (name) {
									return (
										React.DOM.div( {className:"tag", key:name}, 
											"#",name
										)
									);
								})
							)
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
			app.navigate(post.path, {trigger:true});
		}

		var post = this.props.model.attributes;
		var mediaUserStyle = {
			'background-image': 'url('+post.author.avatarUrl+')',
		};

		var tagList = (
			React.DOM.div( {className:"tags"}, 
			_.map(this.props.model.get('tags'), function (tagId) {
				return (
					React.DOM.div( {className:"tag", key:tagId}, 
						tagId
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
							React.DOM.span( {className:"count"}, post.counts.votes)
						)
					),
					React.DOM.div( {className:"item-col stats-col"}, 
						React.DOM.div( {className:"stats-comments"}, 
							React.DOM.i( {className:"icon-comments2"}),
							React.DOM.span( {className:"count"}, this.props.model.get('counts').children)
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
						React.DOM.time( {'data-time-count':1*new Date(post.created_at)}, 
							window.calcTimeFrom(post.created_at)
						),
						tagList
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
			app.navigate(post.path, {trigger:true});
		}
		var post = this.props.model.attributes;
		var mediaUserStyle = {
			'background-image': 'url('+post.author.avatarUrl+')',
		};

		var tagList = (
			React.DOM.div( {className:"tags"}, 
			_.map(this.props.model.get('tags'), function (tagId) {
				return (
					React.DOM.div( {className:"tag", key:tagId}, 
						"#",pageMap[tagId].name
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
							React.DOM.span( {className:"count"}, post.counts.votes)
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
						React.DOM.time( {'data-time-count':1*new Date(post.created_at)}, 
							window.calcTimeFrom(post.created_at)
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
module.exports = FeedStreamView = React.createClass({displayName: 'FeedStreamView',
	getInitialState: function () {
		return {selectedForm:null};
	},
	componentWillMount: function () {
	},
	componentDidUpdate: function () {
		console.log('oi')
		setTimeout(function () {
			$('.stream').AwesomeGrid({
				rowSpacing  : 30,    // row gutter spacing
				colSpacing  : 30,    // column gutter spacing
				initSpacing : 0,     // apply column spacing for the first elements
				responsive  : true,  // itching for responsiveness?
				fadeIn      : true,  // allow fadeIn effect for an element?
				hiddenClass : false, // ignore an element having this class or false for none
				item        : '.card',  // item selector to stack on the grid
				onReady     : function(item){},  // callback fired when an element is stacked
				columns     : {      // supply an object to display columns based on the viewport
				    'defaults' : 4,  // default number of columns
				    '800'      : 2   // when viewport <= 800, show 2 columns
				},       // you can also use an integer instead of a json object if you don't care about responsiveness
				context     : 'window'    // resizing context, 'window' by default. Set as 'self' to use the container as the context.
			})
		}, 1);
	},
	render: function () {
		var cards = app.postList.map(function (doc) {
			if (doc.get('__t') === 'Post') {
				if (conf.streamRender === "ListView")
					return ListItem({model:doc, key:doc.id});
				return Card({model:doc, key:doc.id});
			}
			if (doc.get('__t') == 'Problem')
				return ProblemCard({model:doc, key:doc.id});
			throw "Unrecognized post item.";
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


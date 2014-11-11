/** @jsx React.DOM */

var $ = require('jquery')
var Backbone = require('backbone')
var _ = require('lodash')
var React = require('react')
var AwesomeGrid = require('awesome-grid')

var ReactCSSTransitionGroup = React.addons.CSSTransitionGroup;

var backboneModel = {
	propTypes: {
		model: React.PropTypes.any.isRequired,
	},
	componentWillMount: function () {
		var update = function () {
			this.forceUpdate(function(){});
		}
		this.props.model.on('add reset remove change', update.bind(this));
	},
};

var Card = React.createClass({displayName: 'Card',
	mixins: [backboneModel],
	render: function () {
		function gotoPost () {
			app.navigate(post.path, {trigger:true});
		}
		var post = this.props.model.attributes;

		var pageName;
		var tagNames = [];
		if (post.subject && post.subject in pageMap) {
			pageName = pageMap[post.subject].name;

			var subtagsUniverse = {};
			if (pageMap[post.subject].children)
				subtagsUniverse = pageMap[post.subject].children;

			if (pageName) {
				tagNames.push(pageName);
				_.each(post.tags, function (id) {
					if (id in subtagsUniverse)
						tagNames.push(subtagsUniverse[id].name);
				});
			}
		}

		// Get me at most 2
		var bodyTags =  (
			React.DOM.div( {className:"card-body-tags"}, 
				_.map(tagNames.slice(0,2), function (name) {
					return (
						React.DOM.div( {className:"tag", key:name}, 
							"#",name
						)
					);
				})
			)
		);

		if (!post.content.image && post.content.link_image) {
			post.content.image = post.content.link_image;
		}

		return (
			React.DOM.div( {className:"card", onClick:gotoPost, style:{display: 'none'}, 'data-lab':post.subject}, 
				React.DOM.div( {className:"card-icons"}, 
					React.DOM.i( {className:post.content.link?"icon-paperclip":"icon-description"})
				),

				React.DOM.div( {className:"card-stats"}, 
					React.DOM.span( {className:"count"}, post.counts.votes),
					React.DOM.i( {className:"icon-heart "+((this.props.model.liked || this.props.model.userIsAuthor)?"liked":"")})
				),

				
					post.content.image?
					React.DOM.div( {className:"card-body cover"}, 
						React.DOM.div( {className:"card-body-cover"}, 
							React.DOM.div( {className:"bg", style:{ 'background-image': 'url('+post.content.image+')' }}),
							React.DOM.div( {className:"user-avatar"}, 
								React.DOM.div( {className:"avatar", style:{ 'background-image': 'url('+post.author.avatarUrl+')' }})
							),
							React.DOM.div( {className:"username"}, 
								"por ", post.author.name
							)
						),
						React.DOM.div( {className:"card-body-span", ref:"cardBodySpan"}, 
							post.content.title
						),
						bodyTags
					)
					:React.DOM.div( {className:"card-body"}, 
						React.DOM.div( {className:"user-avatar"}, 
							React.DOM.div( {className:"avatar", style:{ 'background-image': 'url('+post.author.avatarUrl+')' }})
						),
						React.DOM.div( {className:"right"}, 
						React.DOM.div( {className:"card-body-span", ref:"cardBodySpan"}, 
							post.content.title
						),
						bodyTags
						)
					)
				
			)
		);
	}
});

var ProblemCard = React.createClass({displayName: 'ProblemCard',
	mixins: [backboneModel],
	render: function () {
		function gotoPost () {
			app.navigate(post.path, {trigger:true});
		}
		var post = this.props.model.attributes;

		var pageName;
		var tagNames = ['Nível '+post.level, post.translatedTopic];
		var bodyTags =  (
			React.DOM.div( {className:"card-body-tags"}, 
				_.map(tagNames, function (name) {
					return (
						React.DOM.div( {className:"tag", key:name}, 
							"#",name
						)
					);
				})
			)
		);

		if (!post.content.image && post.content.link_image) {
			post.content.image = post.content.link_image;
		}

		return (
			React.DOM.div( {className:"card", onClick:gotoPost, style:{display: 'none'}, 'data-lab':post.subject}, 

				React.DOM.div( {className:"card-icons"}
				),

				React.DOM.div( {className:"card-stats"}, 
					React.DOM.span( {className:"count"}, post.counts.votes),
					React.DOM.i( {className:"icon-heart "+(this.props.model.liked?"liked":"")}),
					React.DOM.i( {className:"icon-tick "+(this.props.model.solved?"solved":"")})
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
						bodyTags
					)
					:React.DOM.div( {className:"card-body"}, 
						React.DOM.div( {className:"user-avatar"}, 
							React.DOM.div( {className:"avatar", style:{ 'background-image': 'url('+post.author.avatarUrl+')' }})
						),
						React.DOM.div( {className:"right"}, 
						React.DOM.div( {className:"card-body-span", ref:"cardBodySpan"}, 
							post.content.title
						),
						bodyTags
						)
					)
				
			)
		);
	}
});

var ListItem = React.createClass({displayName: 'ListItem',
	mixins: [backboneModel],
	componentDidMount: function () {
	},
	render: function () {
		function gotoPost () {
			app.navigate(post.path, {trigger:true});
		}
		var post = this.props.model.attributes;
		var pageName;
		if (post.subject && post.subject in pageMap) {
			pageName = pageMap[post.subject].name;
			var subtagsUniverse = pageMap[post.subject].children || {};
			var tagNames = [];
			_.each(post.tags, function (id) {
				if (id in subtagsUniverse)
					tagNames.push(subtagsUniverse[id].name);
			});
		}
		var tagList = (
			React.DOM.div( {className:"tags"}, 
				_.map(tagNames, function (name) {
					return (
						React.DOM.div( {className:"tag", key:name}, 
							"#",name
						)
					);
				})
			)
		);

		// var l = _.find(post.participations, function (i) { return i.user.id === post.author.id })
		// console.log(l)

		var participations = (post.participations || []).slice();
		if (!_.find(participations, { user: { id: post.author.id } })) {
			participations.push({
				user: post.author,
				count: 1
			})
		}
		var participants = _.map(participations.slice(0, 6), function (one) {
			return (
				React.DOM.div( {className:"user-avatar", key:one.user.id,
					'data-toggle':"tooltip", 'data-placement':"bottom", title:one.user.name, 'data-container':"body"}, 
					React.DOM.div( {className:"avatar", style:{ 'background-image': 'url('+one.user.avatarUrl+')' }})
				)
			);
		});

		var thumbnail = post.content.link_image || post.content.image;

		return (
			React.DOM.div( {className:"hcard", onClick:gotoPost,
				'data-liked':this.props.model.liked,
				'data-watching':this.props.model.watching}, 
				React.DOM.div( {className:"cell lefty"}, 
					React.DOM.div( {className:"item-col likes-col"}, 
						React.DOM.div( {className:"stats-likes"}, 
							
								this.props.model.liked?
								React.DOM.i( {className:"icon-thumbs-up3 icon-orange"})
								:React.DOM.i( {className:"icon-thumbs-up3"}),
							
							React.DOM.span( {className:"count"}, post.counts.votes)
						)
					)
				),
				React.DOM.div( {className:"cell center"}, 
					React.DOM.div( {className:"title"}, 
						React.DOM.span( {ref:"cardBodySpan"}, post.content.title),
						
							this.props.model.watching?
							React.DOM.span( {className:"watching-indicator"}, React.DOM.i( {className:"icon-eye2"}))
							:null
						
					),
					React.DOM.div( {className:"info-bar"}, 
						tagList,
						React.DOM.a( {href:post.author.path, className:"username"}, 
							React.DOM.span( {className:"pre"}, "por")," ",post.author.name
						),
						React.DOM.i( {className:"icon-dot"}),
						React.DOM.time( {'data-time-count':1*new Date(post.created_at), title:formatFullDate(new Date(post.created_at))}, 
							window.calcTimeFrom(post.created_at)
						)
					)
				),
				React.DOM.div( {className:"cell righty"}, 
					React.DOM.div( {className:"item-col participants"}, 
						participants
					),
					React.DOM.div( {className:"item-col stats-col"}, 
						React.DOM.div( {className:"stats-comments"}, 
							React.DOM.i( {className:"icon-comment"}),
							React.DOM.span( {className:"count"}, post.counts.children)
						)
					)
				),
				
					thumbnail?
					React.DOM.div( {className:"cell thumbnail", style:{ 'background-image': 'url('+thumbnail+')' }})
					:null
				
			)
		);
	}
});

var FeedStreamView;
module.exports = FeedStreamView = React.createClass({displayName: 'FeedStreamView',
	getInitialState: function () {
		return { EOF: false };
	},
	componentWillMount: function () {
		var update = function (model, xhr) {
			this.forceUpdate(function(){});
			this.hasUpdated = true;
		}
		var eof = function (model, xhr) {
			this.setState({ EOF: true });
			console.log('eof')
		}
		var reset = function (model, xhr) {
			// console.log('update')
			this.checkedItems = {}
			this.forceUpdate(function(){});
			this.hasUpdated = true;
		}
		this.checkedItems = {};
		app.postList.on('add Achange remove', update.bind(this));
		app.postList.on('reset', reset.bind(this));
		app.postList.on('eof', eof.bind(this));
	},
	componentDidMount: function () {
		if (this.props.wall) {
			// Defer to prevent miscalculating cards' width
			setTimeout(function () {
				$(this.refs.stream.getDOMNode()).AwesomeGrid({
					rowSpacing  : 30,    	// row gutter spacing
					colSpacing  : 30,    	// column gutter spacing
					initSpacing : 20,     // apply column spacing for the first elements
					mobileSpacing: 10,
					responsive  : true,  	// itching for responsiveness?
					fadeIn      : true,// allow fadeIn effect for an element?
					hiddenClass : false, 	// ignore an element having this class or false for none
					item        : '.card',// item selector to stack on the grid
					onReady     : function(item){},  // callback fired when an element is stacked
					columns     : {
						'defaults': 5,
					    1500: 4,
					    1310: 3,
					    800: 2, // when viewport <= 800, show 2 columns
					    550: 1,
					},
					context: 'self'
				})
			}.bind(this), 400)
		}
	},
	componentDidUpdate: function () {
		if (_.isEmpty(this.checkedItems)) { // updating
			// console.log('refreshed', this.checkedItems)
			$(this.refs.stream.getDOMNode()).trigger('ag-refresh');
			var ni = $(this.refs.stream.getDOMNode()).find('> .card, > .hcard');
			for (var i=0; i<ni.length; ++i) {
				var key = $(ni[i]).data('reactid');
				this.checkedItems[key] = true;
			}
		} else if (this.props.wall) {
			var ni = $(this.refs.stream.getDOMNode()).find('> .card, > .hcard');
			for (var i=0; i<ni.length; ++i) {
				var key = $(ni[i]).data('reactid');
				if (this.checkedItems[key])
					continue;
				this.checkedItems[key] = true;
				$(this.refs.stream.getDOMNode()).trigger('ag-refresh-one', ni[i]);
			}
		}
	},
	render: function () {
		var cards = app.postList.map(function (doc) {
			if (doc.get('__t') == 'Problem') {
				return (
					ProblemCard( {model:doc, key:doc.id} )
				);
			}
			if (this.props.wall)
				return Card( {model:doc, key:doc.id} )
			else
				return ListItem( {model:doc, key:doc.id} )
		}.bind(this));
		if (app.postList.length) {
			return (
				React.DOM.div( {ref:"stream", className:"stream"}, 
					cards,
					
						this.state.EOF?
						React.DOM.div( {className:"stream-msg eof"}, 
							"EOF."
						)
						:null
					
				)
			);
		} else {
			return (
				React.DOM.div( {ref:"stream", className:"stream"}, 
					
						this.hasUpdated?
						React.DOM.div( {className:"stream-msg"}, 
							"Nenhum resultado por aqui. ", React.DOM.i( {className:"icon-sad"})
						)
						:React.DOM.div( {className:"stream-msg"}, 
							"Carregando..."
						)
					
				)
			);
		}
	},
});
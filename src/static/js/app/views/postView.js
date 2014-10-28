/** @jsx React.DOM */

var $ = require('jquery')
var Backbone = require('backbone')
var _ = require('lodash')
var React = require('react')
var MediumEditor = require('medium-editor')

var models = require('../components/models.js')
var toolbar = require('./parts/toolbar.js')
var Modal = require('./parts/modal.js')
var ExchangeSection= require('./parts/exchange.js')

function refreshLatex () {
	setTimeout(function () {
		if (window.MathJax)
			MathJax.Hub.Queue(["Typeset",MathJax.Hub]);
		else
			console.warn("MathJax object not found.");
	}, 10);
}

var backboneCollection = {
	componentWillMount: function () {
		var update = function () {
			this.forceUpdate(function(){});
		}
		this.props.collection.on('add reset change remove', update.bind(this));
	},
};

var backboneModel = {
	componentWillMount: function () {
		var update = function () {
			this.forceUpdate(function(){});
		}
		this.props.model.on('add reset remove change', update.bind(this));
	},
};

var EditablePost = {
	onClickTrash: function () {
		if (confirm('Tem certeza que quer excluir permanentemente essa publicação?')) {
			this.props.model.destroy({
				success: function (model, response, options) {
				},
				error: function (model, response, options) {
					// if (xhr.responseJSON && xhr.responseJSON.message)
					// 	app.flash.alert(xhr.responseJSON.message);
					if (response.responseJSON && response.responseJSON.message) {
						app.flash.alert(response.responseJSON.message);
					} else {
						if (response.textStatus === 'timeout')
							app.flash.alert("Falha de comunicação com o servidor.");
						else if (response.status === 429)
							app.flash.alert("Excesso de requisições. Espere alguns segundos.")
						else
							app.flash.alert("Erro.");
					}
				}
			});
		}
	},
};

marked = require('marked');
var renderer = new marked.Renderer();
renderer.codespan = function (html) {
	// Don't consider codespans in markdown (they're actually 'latex')
	return '`'+html+'`';
}

marked.setOptions({
	renderer: renderer,
	gfm: false,
	tables: false,
	breaks: false,
	pedantic: false,
	sanitize: true,
	smartLists: true,
	smartypants: true,
})

var PostHeader = React.createClass({displayName: 'PostHeader',
	mixins: [EditablePost],

	onClickShare: function () {
		Modal.ShareDialog({
			message: 'Compartilhe essa publicação',
			title: this.props.model.get('content').title,
			url: 'http://www.qilabs.org'+this.props.model.get('path'),
		});
	},

	render: function () {
		var post = this.props.model.attributes;

		var FollowBtn = null;
		if (window.user) {
			if (!this.props.model.userIsAuthor && post._meta && typeof post._meta.authorFollowed !== 'undefined') {
				if (post._meta.authorFollowed) {
					FollowBtn = (
						React.DOM.button( {className:"btn-follow", 'data-action':"unfollow", 'data-user':post.author.id})
					)
				} else {
					FollowBtn = (
						React.DOM.button( {className:"btn-follow", 'data-action':"follow", 'data-user':post.author.id})
					)
				}
			}
		}

		var pageObj;
		var tagNames = [];
		var subtagsUniverse = {};
		if (post.subject && post.subject in pageMap) {
			pageObj = pageMap[post.subject];

			if (post.subject && pageMap[post.subject] && pageMap[post.subject].children)
				subtagsUniverse = pageMap[post.subject].children;

			if (pageObj) {
				tagNames.push(_.extend(pageObj, { id: post.subject }));
				_.each(post.tags, function (id) {
					if (id in subtagsUniverse)
						tagNames.push({
							id: id,
							name: subtagsUniverse[id].name,
							path: pageMap[post.subject].path+'?tag='+id
						});
				});
			}
		}

		var views;
		if (post._meta.views && post._meta.views > 1) {
			var count = Math.floor(post._meta.views/10)*10;
			// change this
			views = (
				React.DOM.span( {className:"views"}, 
					React.DOM.i( {className:"icon-dot"}), " ", count, " VISUALIZAÇÕES"
				)
			);
		}

		// <div className="type">
		// 	{post.translatedType}
		// </div>
		return (
			React.DOM.div( {className:"postHeader"}, 
				React.DOM.div( {className:"tags"}, 
					_.map(tagNames, function (obj) {
						if (obj.path)
							return (
								React.DOM.a( {className:"tag tag-bg", 'data-tag':obj.id, href:obj.path, key:obj.name}, 
									"#",obj.name
								)
							);
						return (
							React.DOM.div( {className:"tag tag-bg", 'data-tag':obj.id, key:obj.name}, 
								"#",obj.name
							)
						);
					})
				),
				React.DOM.div( {className:"postTitle"}, 
					post.content.title
				),
				React.DOM.time(null, 
					" publicado ",
					React.DOM.span( {'data-time-count':1*new Date(post.created_at)}, 
						window.calcTimeFrom(post.created_at)
					),
					(post.updated_at && 1*new Date(post.updated_at) > 1*new Date(post.created_at))?
						(React.DOM.span(null, 
							", ",React.DOM.span( {'data-toggle':"tooltip", title:window.calcTimeFrom(post.updated_at)}, "editado")
						)
						)
						:null,
					
					views
				),

				React.DOM.div( {className:"authorInfo"}, 
					React.DOM.a( {href:post.author.path, className:"username"}, 
						React.DOM.div( {className:"user-avatar"}, 
							React.DOM.div( {className:"avatar", style: { background: 'url('+post.author.avatarUrl+')' } })
						),
						post.author.name
					),
					FollowBtn
				),

				
					(this.props.model.userIsAuthor)?
					React.DOM.div( {className:"flatBtnBox"}, 
						toolbar.LikeBtn({
							cb: function () {},
							active: true,
							text: post.counts.votes
						}),
						toolbar.EditBtn({cb: this.props.parent.onClickEdit}), 
						toolbar.ShareBtn({cb: this.onClickShare}) 
					)
					:React.DOM.div( {className:"flatBtnBox"}, 
						toolbar.LikeBtn({
							cb: this.props.parent.toggleVote,
							active: this.props.model.liked,
							text: post.counts.votes
						}),
						toolbar.ShareBtn({cb: this.onClickShare}),
						toolbar.FlagBtn({cb: this.onClickFlag})
					)
				
			)
		);
	}
});

var LinkPreview = React.createClass({displayName: 'LinkPreview',
	propTypes: {
		link: React.PropTypes.string.isRequired,
		data: React.PropTypes.object.isRequired,
	},

	open: function () {
		window.open(this.props.link, '_blank');
	},

	render: function () {

		var hostname = URL && new URL(this.props.link).hostname;

		return (
			React.DOM.div( {className:"linkDisplay"}, 
				
					this.props.data.link_image?
					React.DOM.a( {href:this.props.data.link_image}, 
					React.DOM.div( {className:"thumbnail",
					style:{backgroundImage:'url('+this.props.data.link_image+')'}}, 
						React.DOM.div( {className:"blackout"}),
						React.DOM.i( {className:"icon-link"})
					)
					)
					:null,
				
				React.DOM.div( {className:"right", onClick:this.open, tabIndex:1}, 
					React.DOM.div( {className:"title"}, 
						React.DOM.a( {href:this.props.link}, 
							this.props.data.link_title
						)
					),
					React.DOM.div( {className:"description"}, this.props.data.link_description),
					React.DOM.div( {className:"hostname"}, 
						React.DOM.a( {href:this.props.link}, 
							hostname
						)
					)
				)
			)
		);
	}
});

module.exports = React.createClass({displayName: 'exports',
	mixins: [EditablePost, backboneModel],

	render: function () {
		var post = this.props.model.attributes;
		var body = this.props.model.get('content').body;
		// var body = marked(this.props.model.get('content').body);

		return (
			React.DOM.div( {className:"postCol"}, 
				PostHeader( {model:this.props.model, parent:this.props.parent} ),

				
					post.content.link?
					LinkPreview( {data:post.content, link:post.content.link} )
					:null,
				

				React.DOM.div( {className:"postBody", dangerouslySetInnerHTML:{__html: body}}
				),

				React.DOM.div( {className:"postInfobar"}, 
					React.DOM.ul( {className:"left"})
				),

				React.DOM.div( {className:"postFooter"}, 
					ExchangeSection( {collection:this.props.model.children, parent:this.props.model} )
				)
			)
		);
	},
});
/** @jsx React.DOM */

var $ = require('jquery')
var Backbone = require('backbone')
var _ = require('lodash')
var React = require('react')
var MediumEditor = require('medium-editor')

var models = require('../components/models.js')
var toolbar = require('./parts/toolbar.js')
var Modal = require('./parts/modal.js')
var ExchangeSection= require('./parts/comments.js')

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

var PostHeader = React.createClass({
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
						<button className="btn-follow" data-action="unfollow" data-user={post.author.id}></button>
					)
				} else {
					FollowBtn = (
						<button className="btn-follow" data-action="follow" data-user={post.author.id}></button>
					)
				}
			}
		}

		var pageObj;
		var tagNames = [];
		var subtagsUniverse = {};
		if (post.lab && post.lab in pageMap) {
			pageObj = pageMap[post.lab];

			if (post.lab && pageMap[post.lab] && pageMap[post.lab].children)
				subtagsUniverse = pageMap[post.lab].children;

			if (pageObj) {
				tagNames.push(_.extend(pageObj, { id: post.lab }));
				_.each(post.tags, function (id) {
					if (id in subtagsUniverse)
						tagNames.push({
							id: id,
							name: subtagsUniverse[id].name,
							path: pageMap[post.lab].path+'?tag='+id
						});
				});
			}
		}

		var views;
		if (post._meta.views && post._meta.views > 1) {
			var count = post._meta.views; // Math.floor(post._meta.views/10)*10;
			views = (
				<span className="views">
					<i className="icon-dot"></i> <i className="icon-eye2"></i> {count}
				</span>
			);
		}
		return (
			<div className="postHeader">
				<div className="tags">
					{_.map(tagNames, function (obj) {
						if (obj.path)
							return (
								<a className="tag tag-bg" data-tag={obj.id} href={obj.path} key={obj.name}>
									#{obj.name}
								</a>
							);
						return (
							<div className="tag tag-bg" data-tag={obj.id} key={obj.name}>
								#{obj.name}
							</div>
						);
					})}
				</div>
				<div className="postTitle">
					{post.content.title}
				</div>
				<div className="stats">
					<span title={formatFullDate(new Date(post.created_at))}>
					publicado&nbsp;
					<time data-time-count={1*new Date(post.created_at)} data-short="false">
						{window.calcTimeFrom(post.created_at)}
					</time>
					</span>
					{(post.updated_at && 1*new Date(post.updated_at) > 1*new Date(post.created_at))?
						(<span>
							,&nbsp;<span title={formatFullDate(post.updated_at)}>editado</span>
						</span>
						)
						:null
					}
					{views}
				</div>

				<div className="authorInfo">
					<a href={post.author.path} className="username">
						<div className="user-avatar">
							<div className="avatar" style={ { background: 'url('+post.author.avatarUrl+')' } }></div>
						</div>
						{post.author.name}
					</a>
					{FollowBtn}
				</div>

				{
					(this.props.model.userIsAuthor)?
					<div className="flatBtnBox">
						{toolbar.LikeBtn({
							cb: function () {},
							active: true,
							text: post.counts.votes
						})}
						{toolbar.EditBtn({cb: this.props.parent.onClickEdit}) }
						{toolbar.ShareBtn({cb: this.onClickShare}) }
					</div>
					:<div className="flatBtnBox">
						{toolbar.LikeBtn({
							cb: this.props.model.toggleVote.bind(this.props.model),
							active: this.props.model.liked,
							text: post.counts.votes
						})}
						{toolbar.ShareBtn({cb: this.onClickShare})}
						{toolbar.FlagBtn({cb: this.onClickFlag})}
					</div>
				}
			</div>
		);
	}
});

var LinkPreview = React.createClass({
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
			<div className="linkDisplay"  onClick={this.open} tabIndex={1}>
				{
					this.props.data.link_image?
					<div className="thumbnail" style={{backgroundImage:'url('+this.props.data.link_image+')'}}>
						<div className="blackout"></div>
						<i className="icon-link"></i>
					</div>
					:<div className="thumbnail show-icon">
						<div className="blackout"></div>
						<i className="icon-link"></i>
					</div>
				}
				<div className="right">
					<div className="title">
						<a href={this.props.link}>
							{this.props.data.link_title}
						</a>
					</div>
					<div className="description">{this.props.data.link_description}</div>
					<div className="hostname">
						<a href={this.props.link}>
							{hostname}
						</a>
					</div>
				</div>
			</div>
		);
	}
});

module.exports = React.createClass({
	mixins: [EditablePost, backboneModel],

	render: function () {
		var post = this.props.model.attributes;
		var body = this.props.model.get('content').body;
		// var body = marked(this.props.model.get('content').body);

		return (
			<div className='postCol'>
				<PostHeader model={this.props.model} parent={this.props.parent} />

				{
					post.content.link?
					<LinkPreview data={post.content} link={post.content.link} />
					:null
				}

				<div className="postBody" dangerouslySetInnerHTML={{__html: body}}>
				</div>

				<div className="postInfobar">
					<ul className="left"></ul>
				</div>

				<div className="postFooter">
					<ExchangeSection collection={this.props.model.comments} post={this.props.model} />
				</div>
			</div>
		);
	},
});
/** @jsx React.DOM */

var $ = require('jquery')
var _ = require('lodash')
var React = require('react')
var marked = require('marked');

var Toolbar = require('./parts/toolbar.jsx')
var Dialog 	= require('./parts/dialog.jsx')
var Comments= require('./parts/comments.jsx')

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
	onClickShare: function () {
		Dialog.ShareDialog({
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
		if (post._meta.views) {
			var count = post._meta.views || 1; // Math.floor(post._meta.views/10)*10;
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

				<div className="author">
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
					<div className="sideBtns">
						{Toolbar.LikeBtn({
							cb: function () {},
							active: true,
							text: post.counts.votes
						})}
						{Toolbar.EditBtn({cb: this.props.parent.onClickEdit}) }
						{Toolbar.ShareBtn({cb: this.onClickShare}) }
					</div>
					:<div className="sideBtns">
						{Toolbar.LikeBtn({
							cb: this.props.model.toggleVote.bind(this.props.model),
							active: this.props.model.liked,
							text: post.counts.votes
						})}
						{Toolbar.ShareBtn({cb: this.onClickShare})}
						{Toolbar.FlagBtn({cb: this.onClickFlag})}
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
						<i className="icon-paperclip"></i>
					</div>
					:<div className="thumbnail show-icon">
						<div className="blackout"></div>
						<i className="icon-paperclip"></i>
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
	componentWillMount: function () {
		var update = function () {
			this.forceUpdate(function(){});
		}
		this.props.model.on('add reset remove change', update.bind(this));
	},

	render: function () {
		var post = this.props.model.attributes;
		var body = this.props.model.get('content').body;
		// var body = marked(this.props.model.get('content').body);
		if (true) {
			body = marked(body);
			if (post.content.cover)
				body = "<img src='"+post.content.cover+"' />"+body;
			for (var i=0; i<post.content.images.length; ++i)
				body += "<img src='"+post.content.images[i]+"' />"
		}

		return (
			<div className='postCol'>
				<PostHeader model={this.props.model} parent={this.props.parent} />

				{
					post.content.link?
					<LinkPreview data={post.content} link={post.content.link} />
					:null
				}

				<div className="postBody" dangerouslySetInnerHTML={{__html: body}}></div>

				<div className="postInfobar">
					<ul className="left"></ul>
				</div>

				<div className="postFooter">
					<Comments collection={this.props.model.comments} post={this.props.model} />
				</div>
			</div>
		);
	},
});
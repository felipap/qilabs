
var $ = require('jquery')
var _ = require('lodash')
var React = require('react')
var marked = require('marked')

require('react.backbone')
require('jquery-linkify')

var Toolbar = require('./parts/toolbar.jsx')
var Dicomalog	= require('../components/modal.jsx')
var Comments = require('./parts/comments.jsx')
var Dialog 	= require('../components/modal.jsx')

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

var PsetHeader = React.createClass({
	onClickShare: function () {
		Dialog.ShareDialog({
			message: 'Compartilhe essa publicação',
			title: this.props.model.get('content').title,
			url: 'http://www.qilabs.org'+this.props.model.get('shortPath'),
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
					<i className="icon-dot"></i> <i className="icon-eye"></i> {count}
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
					{
						(post.flags && post.flags.hot)?
						<div className="tag tag-fire">
							<i className="icon-whatshot"></i> <span>Popular</span>
						</div>
						:null
					}
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
						<Toolbar.LikeBtn
							cb={function () {}}
							active={true}
							text={post.counts.votes} />
						<Toolbar.EditBtn cb={this.props.parent.onClickEdit} />
						<Toolbar.ShareBtn cb={this.onClickShare} />
					</div>
					:<div className="sideBtns">
						<Toolbar.LikeBtn
							cb={this.props.model.toggleVote.bind(this.props.model)}
							active={this.props.model.liked}
							text={post.counts.votes} />
						<Toolbar.ShareBtn cb={this.onClickShare} />
						<Toolbar.FlagBtn cb={this.onClickFlag} />
					</div>
				}
			</div>
		);
	}
});

var ProblemSetView = React.createBackboneClass({

	componentDidMount: function () {
		$(this.refs.postBody.getDOMNode()).linkify();
	},

	render: function () {
		var doc = this.getModel().attributes;
		var body = marked(doc.description);

		return (
			<div className='psetCol'>
				<PsetHeader model={this.getModel()} parent={this.props.parent} />
				<div className="postBody" ref="postBody" dangerouslySetInnerHTML={{__html: body}}></div>
			</div>
		);
	},
});

module.exports = ProblemSetView;
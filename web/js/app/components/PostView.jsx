
var $ = require('jquery')
var _ = require('lodash')
var React = require('react')
var marked = require('marked');

require('jquery-linkify')

var SideBtns = require('../components/sideButtons.jsx')
var Dicomalog	= require('../lib/dialogs.jsx')
var Comments = require('../components/Comments.jsx')
var Dialog 	= require('../lib/dialogs.jsx')

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

var PostHeader = React.createBackboneClass({
	displayName: 'PostHeader',

	onClickShare: function () {
		Dialog.Share({
			message: 'Compartilhe essa publicação',
			title: this.props.model.get('content').title,
			url: 'http://www.qilabs.org'+this.props.model.get('shortPath'),
		});
	},

	onClickEdit: function () {
		window.location.href = this.props.model.get('path')+'/editar';
	},


	render: function () {
		var doc = this.props.model.attributes;

		var GenTags = function () {
			var pageObj;
			var tagNames = [];
			var subtagsUniverse = {};
			if (doc.lab && doc.lab in pageMap) {
				pageObj = pageMap[doc.lab];

				if (doc.lab && pageMap[doc.lab] && pageMap[doc.lab].children)
					subtagsUniverse = pageMap[doc.lab].children;

				if (pageObj) {
					tagNames.push(_.extend(pageObj, { id: doc.lab }));
					_.each(doc.tags, function (id) {
						if (id in subtagsUniverse)
							tagNames.push({
								id: id,
								name: subtagsUniverse[id].name,
								path: pageMap[doc.lab].path+'?tag='+id
							});
					});
				}
			}

			return (
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
						(doc.flags && doc.flags.hot)?
						<div className="tag tag-fire">
							<i className="icon-whatshot"></i> <span>Popular</span>
						</div>
						:null
					}
					</div>
			)
		}.bind(this)

		var GenStats = function () {

			var views;
			if (doc._meta.views) {
				var count = doc._meta.views || 1; // Math.floor(doc._meta.views/10)*10;
				views = (
					<span className="views">
						<i className="icon-dot-single"></i> <i className="icon-visibility"></i> {count}
					</span>
				);
			}

			return (
				<div className="stats">
					<span title={formatFullDate(new Date(doc.created_at))}>
					publicado&nbsp;
					<time data-time-count={1*new Date(doc.created_at)} data-short="false">
						{window.calcTimeFrom(doc.created_at)}
					</time>
					</span>
					{(doc.updated_at && 1*new Date(doc.updated_at) > 1*new Date(doc.created_at))?
						(<span>
							,&nbsp;<span title={formatFullDate(doc.updated_at)}>editado</span>
						</span>
						)
						:null
					}
					{views}
				</div>
			);
		}.bind(this)

		var GenAuthor = function () {
			var FollowBtn = null;
			if (window.user) {
				if (!this.props.model.userIsAuthor && doc._meta && typeof doc._meta.authorFollowed !== 'undefined') {
					if (doc._meta.authorFollowed) {
						FollowBtn = (
							<button className="btn-follow" data-action="unfollow" data-user={doc.author.id}></button>
						)
					} else {
						FollowBtn = (
							<button className="btn-follow" data-action="follow" data-user={doc.author.id}></button>
						)
					}
				}
			}

			return (
				<div className="author">
					<a href={doc.author.path} className="username">
						<div className="user-avatar">
							<div className="avatar" style={ { background: 'url('+doc.author.avatarUrl+')' } }></div>
						</div>
						{doc.author.name}
					</a>
					{FollowBtn}
				</div>
			);
		}.bind(this)

		var GenSidebtns = function () {
			if (this.props.model.userIsAuthor) {
				return (
					<div className="sideButtons">
						<SideBtns.Like
							cb={function () {}}
							active={true}
							text={doc.counts.votes} />
						<SideBtns.Edit cb={this.onClickEdit} />
						<SideBtns.Share cb={this.onClickShare} />
					</div>
				)
			}
			return (
				<div className="sideButtons">
					<SideBtns.Like
						cb={this.props.model.toggleVote.bind(this.props.model)}
						active={this.props.model.liked}
						text={doc.counts.votes} />
					<SideBtns.Share cb={this.onClickShare} />
					<SideBtns.Flag cb={this.onClickFlag} />
				</div>
			)
		}.bind(this)

		return (
			<div className="postHeader">
				{GenTags()}
				<div className="postTitle">
					{doc.content.title}
				</div>
				{GenStats()}
				{GenAuthor()}
				{GenSidebtns()}
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

var PostView = React.createClass({
	componentWillMount: function () {
		var update = function () {
			this.forceUpdate(function(){});
		}
		this.props.model.on('add reset remove change', update.bind(this));
	},

	componentDidMount: function () {
		$(this.refs.postBody.getDOMNode()).linkify();
	},

	render: function () {
		var post = this.props.model.attributes;
		var body = this.props.model.get('content').body;
		// var body = marked(this.props.model.get('content').body);
		if (true) {
			body = marked(body);
			// if (post.content.cover)
			// 	body = "<img src='"+post.content.cover+"' />"+body;
			for (var i=0; i<post.content.images.length; ++i)
				body += "<img src='"+post.content.images[i]+"' />"
		}

		return (
			<div className='PostView'>
				<PostHeader model={this.props.model} parent={this.props.parent} />

				{
					post.content.link?
					<LinkPreview data={post.content} link={post.content.link} />
					:null
				}

				<div className="postBody" ref="postBody" dangerouslySetInnerHTML={{__html: body}}></div>

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

module.exports = PostView;
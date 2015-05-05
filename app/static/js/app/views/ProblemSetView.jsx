
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

var PsetHeader = React.createBackboneClass({
	onClickShare: function () {
		Dialog.ShareDialog({
			message: 'Compartilhe essa coleção',
			title: this.props.model.getTitle(),
			url: 'http://www.qilabs.org'+this.props.model.get('path'),
		});
	},

	render: function () {
		var doc = this.props.model.attributes;

		var GenTags = function () {

			var pageObj;
			var tagNames = [];
			var subtagsUniverse = {};
			if (doc.subject && doc.subject in pageMap) {
				pageObj = pageMap[doc.subject];

				if (doc.subject && pageMap[doc.subject] && pageMap[doc.subject].topics)
					subtagsUniverse = pageMap[doc.subject].topics;

				if (pageObj) {
					tagNames.push(_.extend(pageObj, { id: doc.subject }));
					_.each(doc.tags, function (id) {
						if (id in subtagsUniverse)
							tagNames.push({
								id: id,
								name: subtagsUniverse[id].name,
								path: pageMap[doc.subject].path+'?tag='+id
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
						<i className="icon-dot"></i> <i className="icon-eye"></i> {count}
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
					<div className="sideBtns">
						<Toolbar.LikeBtn
							cb={function () {}}
							active={true}
							text={doc.counts.votes} />
						<Toolbar.EditBtn cb={this.props.parent.onClickEdit} />
						<Toolbar.ShareBtn cb={this.onClickShare} />
					</div>
				)
			}
			return (
				<div className="sideBtns">
					<Toolbar.LikeBtn
						cb={this.props.model.toggleVote.bind(this.props.model)}
						active={this.props.model.liked}
						text={doc.counts.votes} />
					<Toolbar.ShareBtn cb={this.onClickShare} />
					<Toolbar.FlagBtn cb={this.onClickFlag} />
				</div>
			)
		}.bind(this)

		return (
			<div className="postHeader">
				{GenTags()}
				<div className="postTitle">
					{doc.name}
				</div>
				{GenStats()}
				{GenAuthor()}
				{GenSidebtns()}
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

		var GenProblemList = function () {
			console.log(this.getModel().problems)
			var problems = this.getModel().problems.map(function (p) {
				console.log(p)
				return (
					<li>
						{p.get('content').title}
					</li>
				);
			})

			return (
				<div className="problemList">
					{problems}
				</div>
			)
		}.bind(this)

		return (
			<div className='postCol'>
				<PsetHeader model={this.getModel()} parent={this.props.parent} />
				<div className="postBody" ref="postBody" dangerouslySetInnerHTML={{__html: body}}></div>
				{GenProblemList()}
			</div>
		);
	},
});

module.exports = ProblemSetView;
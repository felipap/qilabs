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

var backboneModel = {
	componentWillMount: function () {
		var update = function () {
			this.forceUpdate(function(){});
		}
		this.props.model.on('add reset remove change', update.bind(this));
	},
};

var Card = React.createClass({
		mixins: [backboneModel],
		componentDidMount: function () {},
		render: function () {
			function gotoPost () {
				app.navigate(post.path, {trigger:true});
			}
			var post = this.props.model.attributes;
			var mediaUserStyle = {
				background: 'url('+post.author.avatarUrl+')',
			};

			var pageName;
			if (post.subject && post.subject in pageMap) {
				pageName = pageMap[post.subject].name;
			}

			return (
				<div className="cardView" onClick={gotoPost}>
					<div className="cardHeader">
						<span className="cardType">
							{pageName}
						</span>
						<div className="iconStats">
							<div className="stats-likes">
								{this.props.model.liked?<i className="icon-heart icon-red"></i>:<i className="icon-heart"></i>}
								&nbsp;
								{post.counts.votes}
							</div>
							<div className="stats-comments">
								<i className="icon-comments2"></i>&nbsp;
								{this.props.model.get('counts').children}
							</div>
						</div>
					</div>

					<div className="cardBody">
						<span ref="cardBodySpan">{post.content.title}</span>
					</div>

					<div className="cardFoot">
						<div className="authorship">
							<div className="avatarWrapper">
								<a href={post.author.path}>
									<div className="avatar" style={mediaUserStyle}></div>
								</a>
							</div>
							<a href={post.author.path} className="username">
								{post.author.name}
							</a>
						</div>
						<time data-time-count={1*new Date(post.created_at)}>
							{window.calcTimeFrom(post.created_at)}
						</time>
						<div className="iconStats">
							<div className="stats-comments">
								<span className="count">{this.props.model.get('counts').children}</span>
								<i className="icon-chat2"></i>
							</div>
							<div className={this.props.model.liked?"stats-likes active":"stats-likes"}>
								<span className="count">{post.counts.votes}</span>
								{this.props.model.liked?<i className="icon-heart"></i>:<i className="icon-heart2"></i>}
							</div>
						</div>
					</div>
					<div className="veil">
						<time data-time-count={1*new Date(post.created_at)}>
							{window.calcTimeFrom(post.created_at)}
						</time>
					</div>
				</div>
			);
		}
});

var ListItem = React.createClass({
	mixins: [backboneModel],
	componentDidMount: function () {},
	render: function () {
		function gotoPost () {
			app.navigate(post.path, {trigger:true});
		}

		var post = this.props.model.attributes;
		var mediaUserStyle = {
			background: 'url('+post.author.avatarUrl+')',
		};

		var tagList = (
			<div className="tags">
			{_.map(this.props.model.get('tags'), function (tagId) {
				return (
					<div className="tag" key={tagId}>
						{tagId}
					</div>
				);
			})}
			</div>
		);

		return (
			<div className="listItem" onClick={gotoPost}>
				<div className="cell lefty">
					<div className="item-col stats-col">
						<div className="stats-likes">
							{this.props.model.liked?<i className="icon-heart icon-red"></i>:<i className="icon-heart-o"></i>}
							<span className="count">{post.counts.votes}</span>
						</div>
					</div>
					<div className="item-col stats-col">
						<div className="stats-comments">
							<i className="icon-comments2"></i>
							<span className="count">{this.props.model.get('counts').children}</span>
						</div>
					</div>
				</div>
				<div className="cell center">
					<div className="title">
						<span ref="cardBodySpan">{post.content.title}</span>
					</div>
					<div className="info-bar">
						<a href={post.author.path} className="username">
							<span className="pre">por</span>&nbsp;{post.author.name}
						</a>
						<i className="icon-circle"></i>
						<time data-time-count={1*new Date(post.created_at)}>
							{window.calcTimeFrom(post.created_at)}
						</time>
						{tagList}
					</div>
				</div>
				<div className="cell righty">
					<div className="item-col">
						<div className="user-avatar item-author-avatar">
							<a href={post.author.path}>
								<div className="avatar" style={mediaUserStyle}></div>
							</a>
						</div>
					</div>
				</div>
			</div>
		);
	}
});

var ProblemCard = React.createClass({
	mixins: [backboneModel],
	componentDidMount: function () {},
	render: function () {
		function gotoPost () {
			app.navigate(post.path, {trigger:true});
		}
		var post = this.props.model.attributes;
		var mediaUserStyle = {
			background: 'url('+post.author.avatarUrl+')',
		};

		var tagList = (
			<div className="tags">
			{_.map(this.props.model.get('tags'), function (tagId) {
				return (
					<div className="tag" key={tagId}>
						#{pageMap[tagId].name}
					</div>
				);
			})}
			</div>
		);

		return (
			<div className="listItem" onClick={gotoPost}>
				<div className="cell lefty">
					<div className="item-col stats-col">
						<div className="stats-likes">
							{this.props.model.liked?<i className="icon-heart icon-red"></i>:<i className="icon-heart-o"></i>}
							<span className="count">{post.counts.votes}</span>
						</div>
					</div>
				</div>
				<div className="cell center">
					<div className="title">
						<span ref="cardBodySpan">{post.content.title}</span>
					</div>
					<div className="info-bar">
						<a href={post.author.path} className="username">
							<span className="pre">por</span>&nbsp;{post.author.name}
						</a>
						<i className="icon-circle"></i>
						<time data-time-count={1*new Date(post.created_at)}>
							{window.calcTimeFrom(post.created_at)}
						</time>
					</div>
				</div>
				<div className="cell righty">
					<div className="item-col">
						<div className="user-avatar item-author-avatar">
							<a href={post.author.path}>
								<div className="avatar" style={mediaUserStyle}></div>
							</a>
						</div>
					</div>
				</div>
			</div>
		);
	}
});

var FeedStreamView;
module.exports = FeedStreamView = React.createClass({
	getInitialState: function () {
		return {selectedForm:null};
	},
	componentWillMount: function () {
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
				<div className="stream">
					{cards}
				</div>
			);
		else
			return (
				<div className="stream">
					<div className="stream-msg">
						Ainda não há nada por aqui. Tente <a href="/descubra/pessoas">seguir alguém</a>, ou <a href="/descubra/atividades">adicione interesses</a>. <i className="icon-happy"></i>
					</div>
				</div>
			);
	},
});


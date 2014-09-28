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

var Card = React.createClass({
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
			<div className="card-body-tags">
				{_.map(tagNames.slice(0,2), function (name) {
					return (
						<div className="tag" key={name}>
							#{name}
						</div>
					);
				})}
			</div>
		);

		return (
			<div className="card" onClick={gotoPost} style={{display: 'none'}} data-lab={post.subject}>
				<div className="card-header">
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
					<div className="authorship">
					<a href={post.author.path} className="username">
						{post.author.name}
					</a>
					</div>
					// <div className="stats-comments">
					// 	<span className="count">{this.props.model.get('counts').children}</span>
					// 	<i className="icon-chat2"></i>
					// </div>
					// <time data-time-count={1*new Date(post.created_at)}>
					// 	{window.calcTimeFrom(post.created_at)}
					// </time>
				</div>

				<div className="card-icons">
					<i className={post.type === 'Note'?"icon-file-text":"icon-chat3"}></i>
				</div>

				<div className="card-likes">
					<span className="count">{post.counts.votes}</span>
					<i className={"icon-heart3 "+(this.props.model.liked?"liked":"")}></i>
				</div>

				{
					post.content.image?
					<div className="card-body cover">
						<div className="card-body-cover">
							<div className="bg" style={{ 'background-image': 'url('+post.content.image+')' }}></div>
							<div className="user-avatar">
								<div className="avatar" style={{ 'background-image': 'url('+post.author.avatarUrl+')' }}></div>
							</div>
							<div className="username">
								por {post.author.name.split(' ')[0]}
							</div>
						</div>
						<div className="card-body-span" ref="cardBodySpan">
							{post.content.title}
						</div>
						{bodyTags}
					</div>
					:<div className="card-body">
						<div className="user-avatar">
							<div className="avatar" style={{ 'background-image': 'url('+post.author.avatarUrl+')' }}></div>
						</div>
						<div className="right">
						<div className="card-body-span" ref="cardBodySpan">
							{post.content.title}
						</div>
						{bodyTags}
						</div>
					</div>
				}
			</div>
		);
	}
});

var ProblemCard = React.createClass({
	mixins: [backboneModel],
	render: function () {
		function gotoPost () {
			app.navigate(post.path, {trigger:true});
		}
		var post = this.props.model.attributes;

		var pageName;
		var tagNames = ['Nível '+post.level, post.translatedTopic];
		var bodyTags =  (
			<div className="card-body-tags">
				{_.map(tagNames, function (name) {
					return (
						<div className="tag" key={name}>
							#{name}
						</div>
					);
				})}
			</div>
		);

		return (
			<div className="card" onClick={gotoPost} style={{display: 'none'}} data-lab={post.subject}>
				<div className="card-header">
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
					<div className="authorship">
					<a href={post.author.path} className="username">
						{post.author.name}
					</a>
					</div>
					// <div className="stats-comments">
					// 	<span className="count">{this.props.model.get('counts').children}</span>
					// 	<i className="icon-chat2"></i>
					// </div>
					// <time data-time-count={1*new Date(post.created_at)}>
					// 	{window.calcTimeFrom(post.created_at)}
					// </time>
				</div>

				<div className="card-icons">
					<i className={post.type === 'Note'?"icon-file-text":"icon-chat3"}></i>
				</div>

				<div className="card-likes">
					<span className="count">{post.counts.votes}</span>
					<i className={"icon-heart3 "+(this.props.model.liked?"liked":"")}></i>
				</div>

				{
					post.content.image?
					<div className="card-body cover">
						<div className="card-body-cover">
							<div className="bg" style={{ 'background-image': 'url('+post.content.image+')' }}></div>
							<div className="user-avatar">
								<div className="avatar" style={{ 'background-image': 'url('+post.author.avatarUrl+')' }}></div>
							</div>
							<div className="username">
								por {post.author.name.split(' ')[0]}
							</div>
						</div>
						<div className="card-body-span" ref="cardBodySpan">
							{post.content.title}
						</div>
						{bodyTags}
					</div>
					:<div className="card-body">
						<div className="user-avatar">
							<div className="avatar" style={{ 'background-image': 'url('+post.author.avatarUrl+')' }}></div>
						</div>
						<div className="right">
						<div className="card-body-span" ref="cardBodySpan">
							{post.content.title}
						</div>
						{bodyTags}
						</div>
					</div>
				}
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

		var pageName;
		if (post.subject && post.subject in pageMap) {
			pageName = pageMap[post.subject].name;

			var subtagsUniverse = pageMap[post.subject].children || {};

			console.log('subject', post.subject, pageMap[post.subject].children)
			console.log('subtags', subtagsUniverse)
			var tagNames = [];
			_.each(post.tags, function (id) {
				console.log('id', id)
				if (id in subtagsUniverse)
					tagNames.push(subtagsUniverse[id].name);
			});
			console.log('-----------------------------------')
		}
		var tagList = (
			<div className="tags">
				{_.map(tagNames, function (name) {
					return (
						<div className="tag" key={name}>
							#{name}
						</div>
					);
				})}
			</div>
		);

		var participants = _.map((this.props.model.get('participations') || []).slice(0, 6), function (one) {
			return (
				<div className="user-avatar"
					data-toggle="tooltip" data-placement="bottom" title={one.user.name} data-container="body">
					<div className="avatar" style={{ 'background-image': 'url('+one.user.avatarUrl+')' }}></div>
				</div>
			);
		});

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
						{
							this.props.model.get('type') === 'Note'?
							<i className="icon-comment-o"></i>
							:<i className="icon-chat3"></i>
						}
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
					{
						(this.props.model.get('type') === 'Discussion')?
						<div className="item-col participants">
							{participants}
						</div>
						:<div className="item-col">
							<div className="user-avatar item-author-avatar">
								<a href={post.author.path}>
									<div className="avatar" style={{ 'background-image': 'url('+post.author.avatarUrl+')' }}></div>
								</a>
							</div>
						</div>
					}
				</div>
			</div>
		);
	}
});

var FeedStreamView;
module.exports = FeedStreamView = React.createClass({
	componentDidMount: function () {
		$(this.refs.stream.getDOMNode()).AwesomeGrid({
			rowSpacing  : 30,    // row gutter spacing
			colSpacing  : 30,    // column gutter spacing
			initSpacing : 20,     // apply column spacing for the first elements
			mobileSpacing: 10,
			responsive  : true,  // itching for responsiveness?
			// fadeIn      : true,  // allow fadeIn effect for an element?
			hiddenClass : false, // ignore an element having this class or false for none
			item        : '.card',  // item selector to stack on the grid
			onReady     : function(item){},  // callback fired when an element is stacked
			columns     : {      // supply an object to display columns based on the viewport
				'defaults': 5,
			    1500: 4,
			    1050: 3,
			    800: 2, // when viewport <= 800, show 2 columns
			    550: 1,
			},  // you can also use an integer instead of a json object if you don't care about responsiveness
			context: 'window' // resizing context, 'window' by default. Set as 'self' to use the container as the context.
		})
	},
	componentDidUpdate: function () {
		$(this.refs.stream.getDOMNode()).trigger('ag-refresh');
	},
	render: function () {
		var cards = app.postList.map(function (doc) {
			if (doc.get('__t') == 'Problem') {
				return (
					<ProblemCard model={doc} key={doc.id} />
				);
			}
			if (conf.streamRender === "ListView")
				return ListItem({model:doc, key:doc.id});
			return (
				<Card model={doc} key={doc.id} />
			);
		});
		if (app.postList.length)
			return (
				<div ref="stream" className="stream">
					{cards}
				</div>
			);
		else
			return (
				<div ref="stream" className="stream">
					<div className="stream-msg">
						Ainda não há nada por aqui. <i className="icon-wondering"></i>
					</div>
				</div>
			);
	},
});


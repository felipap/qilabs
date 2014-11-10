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

		if (!post.content.image && post.content.link_image) {
			post.content.image = post.content.link_image;
		}

		return (
			<div className="card" onClick={gotoPost} style={{display: 'none'}} data-lab={post.subject}>
				<div className="card-icons">
					<i className={post.content.link?"icon-paperclip":"icon-description"}></i>
				</div>

				<div className="card-stats fading">
					<span className="count">{post.counts.votes}</span>
					<i className={"icon-heart "+((this.props.model.liked || this.props.model.userIsAuthor)?"liked":"")}></i>
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
								por {post.author.name}
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

		if (!post.content.image && post.content.link_image) {
			post.content.image = post.content.link_image;
		}

		return (
			<div className="card" onClick={gotoPost} style={{display: 'none'}} data-lab={post.subject}>

				<div className="card-icons">
				</div>

				<div className="card-stats">
					<span className="count">{post.counts.votes}</span>
					<i className={"icon-heart "+(this.props.model.liked?"liked":"")}></i>
					<i className={"icon-tick "+(this.props.model.solved?"solved":"")}></i>
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
				<div className="user-avatar" key={one.user.id}
					data-toggle="tooltip" data-placement="bottom" title={one.user.name} data-container="body">
					<div className="avatar" style={{ 'background-image': 'url('+one.user.avatarUrl+')' }}></div>
				</div>
			);
		});

		var thumbnail = post.content.link_image || post.content.image;

		return (
			<div className="hcard" onClick={gotoPost}
				data-liked={this.props.model.liked}
				data-watching={this.props.model.watching}>
				<div className="cell lefty">
					<div className="item-col likes-col">
						<div className="stats-likes">
							{
								this.props.model.liked?
								<i className="icon-thumbs-up3 icon-orange"></i>
								:<i className="icon-thumbs-up3"></i>
							}
							<span className="count">{post.counts.votes}</span>
						</div>
					</div>
				</div>
				<div className="cell center">
					<div className="title">
						<span ref="cardBodySpan">{post.content.title}</span>
						{
							this.props.model.watching?
							<span className="watching-indicator"><i className="icon-eye2"></i></span>
							:null
						}
					</div>
					<div className="info-bar">
						{tagList}
						<a href={post.author.path} className="username">
							<span className="pre">por</span>&nbsp;{post.author.name}
						</a>
						<i className="icon-dot"></i>
						<time data-time-count={1*new Date(post.created_at)} title={formatFullDate(new Date(post.created_at))}>
							{window.calcTimeFrom(post.created_at)}
						</time>
					</div>
				</div>
				<div className="cell righty">
					<div className="item-col participants">
						{participants}
					</div>
					<div className="item-col stats-col">
						<div className="stats-comments">
							<i className="icon-comment"></i>
							<span className="count">{post.counts.children}</span>
						</div>
					</div>
				</div>
				{
					thumbnail?
					<div className="cell thumbnail" style={{ 'background-image': 'url('+thumbnail+')' }}></div>
					:null
				}
			</div>
		);
	}
});

var FeedStreamView;
module.exports = FeedStreamView = React.createClass({
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
					<ProblemCard model={doc} key={doc.id} />
				);
			}
			if (this.props.wall)
				return <Card model={doc} key={doc.id} />
			else
				return <ListItem model={doc} key={doc.id} />
		}.bind(this));
		if (app.postList.length) {
			return (
				<div ref="stream" className="stream">
					{cards}
					{
						this.state.EOF?
						<div className="stream-msg eof">
							EOF.
						</div>
						:null
					}
				</div>
			);
		} else {
			return (
				<div ref="stream" className="stream">
					{
						this.hasUpdated?
						<div className="stream-msg">
							Nenhum resultado por aqui. <i className="icon-sad"></i>
						</div>
						:<div className="stream-msg">
							Carregando...
						</div>
					}
				</div>
			);
		}
	},
});
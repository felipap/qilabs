
var $ = require('jquery')
var _ = require('lodash')
var React = require('react')
var AwesomeGrid = require('awesome-grid')

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

/////////////////////////////////////////////////////

var Card = React.createClass({
	mixins: [backboneModel],
	render: function () {
		function gotoPost () {
			app.navigate(post.path, {trigger:true});
			// if (window.user)
			// else
			// 	window.location.href = post.path;
		}
		var post = this.props.model.attributes;

		var pageName;
		var tagNames = [];
		if (post.lab && post.lab in pageMap) {
			pageName = pageMap[post.lab].name;

			var subtagsUniverse = {};
			if (pageMap[post.lab].children)
				subtagsUniverse = pageMap[post.lab].children;

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

		if (!post.content.cover && post.content.link_image) {
			post.content.cover = post.content.link_image;
		}

		if (window.conf && window.conf.lastAccess) {
			// console.log(new Date(window.conf.lastAccess), post.created_at)
			if (new Date(window.conf.lastAccess) < new Date(post.created_at))
				var blink = true;
		}

		return (
			<div className={"card "+(blink?"blink":null)} onClick={gotoPost} style={{display: 'none'}} data-lab={post.lab}>
				<div className="card-icons">
					<i className={post.content.link?"icon-paperclip":"icon-description"}></i>
				</div>

				<div className="card-stats">
					<span className="count">{post.counts.votes}</span>
					<i className={"icon-heart "+((this.props.model.liked || this.props.model.userIsAuthor)?"liked":"")}></i>
				</div>

				{
					post.content.cover?
					<div className="card-body cover">
						<div className="card-body-cover">
							<div className="bg" style={{ backgroundImage: 'url('+post.content.cover+')' }}></div>
							<div className="user-avatar">
								<div className="avatar" style={{ backgroundImage: 'url('+post.author.avatarUrl+')' }}></div>
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
							<div className="avatar" style={{ backgroundImage: 'url('+post.author.avatarUrl+')' }}></div>
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
	componentDidMount: function () {
	},
	render: function () {
		function gotoPost () {
			if (window.user)
				app.navigate(post.path, {trigger:true});
			else
				app.flash.info("Entre para visualizar e resolver esse problema.")
		}

		var post = this.props.model.attributes;

		function GenTagList () {
			if (post.subject && post.subject in pageMap) {
				var pageName = pageMap[post.subject].name;
				var subtagsUniverse = pageMap[post.subject].topics || {};
				var tags = [];

				// Populate tags
				tags.push(_.extend(pageMap[post.subject], { id: post.subject }));
				// console.log(post.topic, subtagsUniverse)

				if (post.topic) {
					if (found = _.find(subtagsUniverse, function (i) { return i.id === post.topic })) {
						tags.push(found);
					}
				}

				return (
					<div className="tags">
						{_.map(tags, function (obj) {
							return (
								<div className="tag tag-bg" key={obj.id} data-tag={obj.id}>
									#{obj.name}
								</div>
							);
						})}
						<div className="tag tag-bg" data-tag={"level"+post.level}>
							Nível {post.level}
						</div>
					</div>
				);
			}
			return null;
		}

		function GenParticipations () {
			var participations = (post.participations || []).slice();
			if (!_.find(participations, function (i) { return i.user.id === post.author.id })) {
				participations.push({
					user: post.author,
					count: 1
				})
			}
			participations = _.unique(participations, function (i) { return i.user.id });
			return _.map(participations.slice(0, 6), function (one) {
				return (
					<div className="user-avatar" key={one.user.id} title={one.user.name} data-container="body">
						<div className="avatar" style={{ backgroundImage: 'url('+one.user.avatarUrl+')' }}></div>
					</div>
				);
			});
		}

		var thumbnail = post.content.link_image || post.content.cover || post.author.avatarUrl;

		return (
			<div className="vcard" onClick={gotoPost}
				data-liked={this.props.model.liked}
				data-watching={this.props.model.watching}>
				<div className="left">
					<div className="thumbnail" style={{ backgroundImage: 'url('+thumbnail+')' }}></div>
					<div className="backdrop"></div>
					<div className="over">
						<div>
							{
								this.props.model.liked?
								<i className="icon-thumb-up icon-orange"></i>
								:<i className="icon-thumb-up"></i>
							}
							<span className="count">{post.counts.votes}</span>
						</div>
					</div>
				</div>
				<div className="right">
					<div className="header">
						<div className="title">
							{post.content.title}
						</div>
						<div className="info">
							<a href={post.author.path} className="author">
								{post.author.name}
							</a>
							<i className="icon-dot"></i>
							<time data-time-count={1*new Date(post.created_at)} data-short="false" title={formatFullDate(new Date(post.created_at))}>
								{window.calcTimeFrom(post.created_at, false)}
							</time>
						</div>
					</div>
					<div className="body">
						{post.content.cardBody}
					</div>
					<div className="footer">
						<ul>
							<div className="stats">
							</div>
							{GenTagList()}
						</ul>
						<ul className="right">
						</ul>
					</div>
				</div>
			</div>
		);
							// <div className="participations">
							// 	<span className="count">{post.counts.children}</span>
							// 	<i className="icon-insert-comment"></i>
							// 	{GenParticipations()}
							// </div>
	}
});


var ListItem = React.createClass({
	mixins: [backboneModel],
	componentDidMount: function () {
	},
	render: function () {
		function gotoPost () {
			app.navigate(post.path, {trigger:true});
			// if (window.user)
			// else
			// 	window.location.href = post.path;
		}

		var post = this.props.model.attributes;

		function GenTagList () {
			if (post.lab && post.lab in pageMap) {
				var pageName = pageMap[post.lab].name;
				var subtagsUniverse = pageMap[post.lab].children || {};
				var tags = [];

				// Populate tags
				tags.push(_.extend(pageMap[post.lab], { id: post.lab }));
				_.each(post.tags, function (id) {
					if (id in subtagsUniverse)
						tags.push(_.extend(subtagsUniverse[id], { id: id }));
				});

				return (
					<div className="tags">
						{_.map(tags, function (obj) {
							return (
								<div className="tag tag-bg" key={obj.id} data-tag={obj.id}>
									#{obj.name}
								</div>
							);
						})}
					</div>
				);
			}
			return null;
		}

		function GenParticipations () {
			// var l = _.find(post.participations, function (i) { return i.user.id === post.author.id })
			// console.log(l)

			var participations = (post.participations || []).slice();
			// if (!_.find(participations, function (i) { return i.user.id === post.author.id })) {
			// 	participations.push({
			// 		user: post.author,
			// 		count: 1
			// 	})
			// }
			participations = _.unique(participations, function (i) { return i.user.id });
			return _.map(participations.slice(0, 6), function (one) {
				return (
					<div className="user-avatar" key={one.user.id} title={one.user.name} data-container="body">
						<div className="avatar" style={{ backgroundImage: 'url('+one.user.avatarUrl+')' }}></div>
					</div>
				);
			});
		}

		if (window.conf && window.conf.lastAccess) {
			// console.log(new Date(window.conf.lastAccess), post.created_at)
			if (new Date(window.conf.lastAccess) < new Date(post.created_at))
				var blink = true;
		}

		var thumbnail = post.content.link_image || post.content.cover || post.author.avatarUrl;

		return (
			<div className={"vcard "+(blink?"blink":null)} onClick={gotoPost}
				data-liked={this.props.model.liked}
				data-watching={this.props.model.watching}>
				<div className="left">
					<div className="thumbnail" style={{ backgroundImage: 'url('+thumbnail+')' }}></div>
					<div className="backdrop"></div>
					<div className="over">
						<div className="likes">
							<span className="count">{post.counts.votes}</span>
							{
								this.props.model.liked?
								<i className="icon-thumb-up icon-orange"></i>
								:<i className="icon-thumb-up"></i>
							}
						</div>
					</div>
				</div>
				<div className="right">
					<div className="header">
						<div className="title">
							{post.content.title}
						</div>
						<div className="info">
							<a href={post.author.path} className="author">
								{post.author.name}
							</a>
							<i className="icon-dot"></i>
							<time data-time-count={1*new Date(post.created_at)} data-short="false" title={formatFullDate(new Date(post.created_at))}>
								{window.calcTimeFrom(post.created_at, false)}
							</time>
						</div>
					</div>
					<div className="body">
						{post.content.cardBody}
					</div>
					<div className="footer">
						<ul>
							<div className="stats">
							</div>
							{GenTagList()}
						</ul>
						<ul className="right">
							<div className="participations">
								<i className="icon-insert-comment"></i>
								{GenParticipations()}
							</div>
						</ul>
					</div>
				</div>
			</div>
		);
								// <span className="count">{post.counts.children}</span>
	}
});

module.exports = React.createClass({
	getInitialState: function () {
		return { EOF: false };
	},
	componentWillMount: function () {
		var update = function (model, xhr) {
			this.forceUpdate(function(){});
		}
		var eof = function (model, xhr) {
			this.setState({ EOF: true });
		}
		var reset = function (model, xhr) {
			// console.log('update')
			this.checkedItems = {}
			this.forceUpdate(function(){});
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
					    1100: 3,
					    800: 2, // when viewport <= 800, show 2 columns
					    550: 1,
					},
					context: 'self'
				})
			}.bind(this), 400)
		}
	},
	componentDidUpdate: function () {
		if (this.props.wall) {
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
		}
	},
	render: function () {
		var cards = app.postList.map(function (doc) {
			if (doc.get('type') == 'Problem') {
				return (
					<ProblemCard model={doc} key={doc.id} />
				);
			}
			if (this.props.wall)
				return <Card model={doc} key={doc.id} />
			else {
				return <ListItem model={doc} key={doc.id} />
			}
		}.bind(this));
		if (app.postList.length) {
			return (
				<div ref="stream" className="stream">
					{cards}
					{
						this.state.EOF?
						<div className="stream-msg eof">
							<span data-toggle="tooltip" title="Fim. :)" data-placement="right">
							EOF.
							</span>
						</div>
						:<div className="stream-msg">
							<span style={{float:'right'}} id="stream-load-indicator" className="loader"><span className="loader-inner"></span></span>
						</div>
					}
				</div>
			);
		} else {
			return (
				<div ref="stream" className="stream">
					{
						app.postList.empty?
						<div className="stream-msg">
							Nada por aqui. <i className="icon-sad"></i>
						</div>
						:<div className="stream-msg">
							<span style={{float:'right'}} id="stream-load-indicator" className="loader"><span className="loader-inner"></span></span>
						</div>
					}
				</div>
			);
		}
	},
});
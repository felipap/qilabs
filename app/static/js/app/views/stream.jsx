
var $ = require('jquery')
var _ = require('lodash')
var React = require('react')

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


function extractTextFromMarkdown (text) {
	var newtext = text.slice();
	// Remove images
	newtext = newtext.replace(/(!\[.*?\]\()(.+?)(\))/g, '');
	// Remove ** and __'s
	newtext = newtext.replace(/\*\*/g, '').replace(/\_\_/g, '');
	// // Remove link markdown
	// newtext = newtext.replace(/(!\[.*?\]\()(.+?)(\))/g, '\1');
	// ^ not a good idea
	return newtext;
}

/////////////////////////////////////////////////////

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
						{extractTextFromMarkdown(post.content.cardBody || '')}
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

		var before, after;
		if (post.content.link_image || post.content.cover) {
			before = (
				<div className="left">
					<div className="thumbnail" style={{ backgroundImage: 'url('+thumbnail+')' }}></div>
				</div>
			);
		} else {
			after = (
				<div className="left">
					<div className="thumbnail" style={{ backgroundImage: 'url('+thumbnail+')' }}></div>
				</div>
			);
		}

		return (
			<div className={"vcard "+(blink?"blink":null)} onClick={gotoPost}
				data-liked={this.props.model.liked}
				data-liked={this.props.model.liked}
				data-watching={this.props.model.watching}>
				{before}
				<div className="right">
					<div className="header">
						<div className="title">
							{post.content.title}
						</div>
						<div className="info">
							<span className="author">
								{post.author.name}
							</span>
							<i className="icon-dot"></i>
							<time data-time-count={1*new Date(post.created_at)} data-short="false" title={formatFullDate(new Date(post.created_at))}>
								{window.calcTimeFrom(post.created_at, false)}
							</time>
						</div>
						{
							(post.flags && post.flags.hot)?
							<div className="fire" title="Esse texto é popular.">
								<i className="icon-whatshot"></i>
							</div>
							:null
						}
					</div>
					<div className="body">
						{extractTextFromMarkdown(post.content.cardBody || '')}
					</div>
					<div className="footer">
						<ul>
							<div className="stats">
								<div className="likes">
									{
										(this.props.model.liked || (this.props.model.get('author').id === (window.user && window.user.id)))?
										<i className="icon-heart5 red"></i>
										:<i className="icon-heart5"></i>
									}
									<span className="count">{post.counts.votes}</span>
								</div>
							</div>
							<div className="participations">
								<i className="icon-insert-comment"></i>
								{GenParticipations()}
							</div>
						</ul>
						<ul className="right">
							{GenTagList()}
						</ul>
					</div>
				</div>
				{after}
			</div>
		);
					// <div className="backdrop"></div>
					// <div className="over">
					// 	<div className="likes">
					// 		{
					// 			this.props.model.liked?
					// 			<i className="icon-thumb-up icon-orange"></i>
					// 			:<i className="icon-thumb-up"></i>
					// 		}
					// 		<span className="count">{post.counts.votes}</span>
					// 	</div>
					// </div>
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
			this.checkedItems = {}
			this.forceUpdate(function(){});
		}
		this.checkedItems = {};
		app.postList.on('add Achange remove', update.bind(this));
		app.postList.on('reset', reset.bind(this));
		app.postList.on('eof', eof.bind(this));
	},
	componentDidMount: function () {
	},
	componentDidUpdate: function () {
	},
	render: function () {
		var cards = app.postList.map(function (doc) {
			if (doc.get('type') == 'Problem') {
				return (
					<ProblemCard model={doc} key={doc.id} />
				);
			}
			return <ListItem model={doc} key={doc.id} />
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


var $ = require('jquery')
var _ = require('lodash')
var React = require('react')


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

module.exports.Problem = React.createClass({
	mixins: [backboneModel],
	componentDidMount: function () {
	},
	render: function () {
		function gotoPost () {
			if (window.user)
				app.navigate(post.path, {trigger:true});
			else
				Utils.flash.info("Entre para visualizar e resolver esse problema.")
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
								<i className="icon-thumb_up icon-orange"></i>
								:<i className="icon-thumb_up"></i>
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
							<i className="icon-dot-single"></i>
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
	}
});

module.exports.Post = React.createClass({
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
		if (false && (post.content.link_image || post.content.cover)) {
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
							<i className="icon-dot-single"></i>
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
										<i className="icon-favorite red"></i>
										:<i className="icon-favorite"></i>
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
					// 			<i className="icon-thumb_up icon-orange"></i>
					// 			:<i className="icon-thumb_up"></i>
					// 		}
					// 		<span className="count">{post.counts.votes}</span>
					// 	</div>
					// </div>
								// <span className="count">{post.counts.children}</span>
	}
});

module.exports.User = React.createClass({

  render: function () {
  	var model = this.props.model;
  	// console.log(model.attributes)
  	function gotoPerson () {
  		window.location.href = '/@'+model.get('username');
  	}

    return (
			<div className="UserCard">
				{
					(!window.user || window.user.id === model.get('id'))?
					null
					:(
						model.get('meta').followed?
						<button className='btn-follow' data-action='unfollow' data-user={model.get('id')}></button>
						:<button className='btn-follow' data-action='follow' data-user={model.get('id')}></button>
					)
				}
				<div className='user-avatar'>
					<div className='avatar' style={ {background: 'url('+model.get('avatarUrl')+')'} }></div>
				</div>
				<div onClick={gotoPerson}>
					<div className='name'>
						{model.get('name')}
					</div>
					<div className="userInfo">
						{model.get('profile').location} <i className="icon-dot-single"></i> {model.get('profile').home}
					</div>
					<div className="userStats">
						<li>
							<div className="value">{model.get('stats').following}</div>
							<div className="label">seguindo</div>
						</li>
						<li>
							<div className="value">{model.get('stats').followers}</div>
							<div className="label">seguidores</div>
						</li>
						<li>
							<div className="value">{model.get('stats').karma}</div>
							<div className="label">pontos</div>
						</li>
					</div>
				</div>
      </div>
    );
  }
});

module.exports.ProblemSet = React.createClass({
	mixins: [backboneModel],

	render: function () {
		var doc = this.props.model.attributes;

		function gotoPset () {
			location.href = doc.path;
		}

		function GenTagList() {
			if (doc.subject && doc.subject in pageMap) {
				var pageName = pageMap[doc.subject].name;
				var subtagsUniverse = pageMap[doc.subject].topics || {};
				var tags = [];

				// Populate tags
				tags.push(_.extend(pageMap[doc.subject], { id: doc.subject }));
				// console.log(doc.topic, subtagsUniverse)

				if (doc.topic) {
					if (found = _.find(subtagsUniverse, function (i) { return i.id === doc.topic })) {
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
						<div className="tag tag-bg" data-tag={"level"+doc.level}>
							Nível {doc.level}
						</div>
					</div>
				);
			}
			return null;
		}

		return (
			<div className="PsetCard" onClick={gotoPset}>
				<div className="header">
					<div className="title">
						{doc.name}
					</div>
					<div className="info">
					</div>
				</div>
				<div className="body">
					{GenTagList()}
				</div>
				<div className="footer">
					<ul>
						<div className="stats">
						</div>
					</ul>
					<ul className="right">
					</ul>
				</div>
			</div>
		);
	}
});
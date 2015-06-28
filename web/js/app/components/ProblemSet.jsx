
'use strict'

var $ = require('jquery')
var _ = require('lodash')
var React = require('react')

require('react.backbone')
require('jquery-linkify')

var Dialog = require('../lib/dialogs.jsx')
var SideBtns = require('./sideButtons.jsx')
var ProblemContent = require('./Problem.jsx')

function genStatusTag (model) {
	var status = model.getUserStatus();

	var label = {
		'trying': model.userTriesLeft+' tentativas sobrando',
		'missed': 'Você Errou',
		'solved': 'Resolvido',
		'not-tried': 'Não Resolvido',
	}[status];

	return (
		<div className="status" data-status={status}>
			{label}
		</div>
	);
}


var PsetProblemView = React.createBackboneClass({
	displayName: 'PsetProblemView',

	render: function () {
		var doc = this.getModel().attributes;

		var GenHeader = function () {
			return (
				<div className="PsetHeader">
					<div className="right">
						<button className="nav-btn"
							onClick={this.props.nav.goHome}
							title="Mostrar todos">
							<i className="icon-expand_less"></i>
						</button>
						<button className={"nav-btn "+(this.props.nav.hasPrevious()?'':'disabled')}
							onClick={this.props.nav.previous}
							title="Anterior">
							<i className="icon-chevron_left"></i>
						</button>
						<button className={"nav-btn "+(this.props.nav.hasNext()?'':'disabled')}
							onClick={this.props.nav.next}
							title="Próximo">
							<i className="icon-chevron_right"></i>
						</button>
					</div>
					<div className="pset">
						<label>
							Coleção:
						</label>
						{this.props.pset.get('name')}, {this.props.pset.get('nivel')}, {this.props.pset.get('fase')}
					</div>
					<div className="index">
						Problema {doc.originalIndex}
					</div>
					<div className="info">
						<div className="tag tag-color" data-tag={doc.topic}>
							{doc.topico}
						</div>
						&nbsp;<i className="icon-dot-single"></i>&nbsp;
						{genStatusTag(this.getModel())}
					</div>
				</div>
			)
		}.bind(this)

		return (
			<div className="PsetProblem postCol">
				{GenHeader()}
				<ProblemContent {...this.props} />
			</div>
		);
	},
});


var PsetIndexHeader = React.createBackboneClass({
	displayName: 'PsetIndexHeader',


	render: function () {
		var doc = this.props.model.attributes;

		var GenTags = () => {
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
		}

		var GenStats = () => {
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
					{views}
				</div>
			);
		}

		var GenAuthor = () => {
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
					<a href={doc.author.path}>
						<div className="user-avatar">
							<div className="avatar" style={ { background: 'url('+doc.author.avatarUrl+')' } }></div>
						</div>
						<span className="username">{doc.author.name}</span>
						<span className="note">editor</span>
					</a>
					{FollowBtn}
				</div>
			);
		}

		var GenSidebtns = () => {
			var events = {
				onClickShare: () => {
					Dialog.FacebookShare({
						message: 'Compartilhe essa coleção',
						title: this.getModel().getTitle(),
						url: 'http://www.qilabs.org'+this.props.model.get('path'),
					});
				},
				onClickEdit: () => {
					location.href = this.getModel().get('path')+'/editar';
				}
			}

			if (window.user && window.user.flags.editor) {
				console.log('true')
				return (
					<div className="sideButtons">
						<SideBtns.Like
							cb={function () {}}
							active={true}
							text={doc.counts.likes} />
						<SideBtns.Edit cb={events.onClickEdit} />
						<SideBtns.FacebookShare cb={events.onClickShare} />
					</div>
				)
			}
			return (
				<div className="sideButtons">
					<SideBtns.Like
						cb={this.props.model.toggleVote.bind(this.props.model)}
						active={this.props.model.liked}
						text={doc.counts.likes} />
					<SideBtns.FacebookShare cb={events.onClickShare} />
					<SideBtns.Flag cb={this.onClickFlag} />
				</div>
			)
		}

		return (
			<div className="Header">
				<div className="title">
					{doc.name} {doc.year}, {doc.nivel}, {doc.fase}
				</div>
				{GenTags()}
				{GenStats()}
				{GenSidebtns()}
			</div>
		);
	}
});


var PsetIndexView = React.createBackboneClass({
	displayName: 'PsetIndexView',


	componentDidMount: function () {
		$(this.refs.postBody.getDOMNode()).linkify();
	},

	render: function () {
		var doc = this.getModel().attributes;
		var body = Utils.renderMarkdown(doc.description);

		var GenProblemList = () => {
			var problems = this.getModel().problems.map((p, index) => {
				var gotoProblem = () => {
					this.props.nav.gotoProblem(index);
				}

				var topicData = _.find(pageMap[p.get('subject')].topics, { id: p.get('topic') });
				// if (!topicData) {
				// 	console.warn("WTF, dude!")
				// 	return null;
				// }

				if (p.userSolved) {
					var estado = "resolvido";
					var status = "solved";
				} else if (p.userTriesLeft === 0) {
					var estado = "errado";
					var status = "failed";
				} else if (p.userTries && p.userTriesLeft) {
					var estado = ""+p.userTriesLeft+" tentativas restando";
					var status = "still-can"
				}

				return (
					<li className="" onClick={gotoProblem} key={index}>
						<div className="title">
							Problema {p.get('originalIndex')}
						</div>
						{
							topicData && (
							<div className="subject tag-color" data-tag={topicData.id}>
								{topicData.name}
							</div>
							)
						}
						{genStatusTag(p)}
					</li>
				);
			})

			return (
				<ul className="problemList">
					{problems}
				</ul>
			)
		}

		return (
			<div className="PsetIndex postCol">
				<PsetIndexHeader model={this.getModel()} parent={this.props.parent} />
				<div className="Body" ref="postBody" dangerouslySetInnerHTML={{__html: body}}></div>
				{GenProblemList()}
			</div>
		);
	},
});


var ProblemSetView = React.createBackboneClass({
	displayName: 'ProblemSetView',

	getInitialState: function () {
		var index = null;
		if (this.props.pindex) {
			index = this.props.pindex-1;
			if (!this.getModel().problems.at(index)) {
				console.warn('Problem at index '+index+' not found in problem set.');
				app.navigate(this.getModel().get('path'), { trigger: false });
				index = null;
			}
		}

		return {
			selectedProblem: index,
		}
	},

	render: function () {
		var model = this.getModel();

		// Navigation functions for changing the currently selectedProblem in the
		// problem set.
		var nav = {
			getIndex: () => {
				return this.state.selectedProblem;
			},

			goHome: () => {
				this.setState({ selectedProblem: null });
				app.navigate(this.getModel().get('path'), { trigger: false });
			},

			gotoProblem: (index) => {
				if (typeof index !== 'number') {
					throw new Error('What do you think you\'re doing, boy?');
				}

				if (index >= model.get('problemIds').length) {
					console.warn('Problem at index '+index+' not found in problem set.');
					return;
				}
				app.navigate(this.getModel().get('path')+'/'+(index+1), { trigger: false });
				this.setState({ selectedProblem: index });
			},

			next: () => {
				if (this.state.selectedProblem === model.get('problemIds').length-1) {
					// We're at the limit.
					return;
				}
				nav.gotoProblem(this.state.selectedProblem+1);
			},

			hasNext: () => {
				return this.state.selectedProblem !== model.get('problemIds').length-1;
			},

			hasPrevious: () => {
				return this.state.selectedProblem !== 0;
			},

			previous: () => {
				if (this.state.selectedProblem === 0) {
					// We're at the limit.
					return;
				}
				nav.gotoProblem(this.state.selectedProblem-1);
			},
		};

		if (this.state.selectedProblem !== null) {
			var pmodel = this.getModel().problems.at(this.state.selectedProblem);
			if (!pmodel) {
				throw "Failed to get problem at index "+this.state.selectedProblem+".";
			}
			return (
				<div className="PsetView" data-page="problem">
					<PsetProblemView {...this.props} pset={this.getModel()} model={pmodel} nav={nav} />
				</div>
			);
		} else {
			return (
				<div className="PsetView">
					<PsetIndexView {...this.props} nav={nav} />
				</div>
			);
		}
	},
});

module.exports = ProblemSetView;
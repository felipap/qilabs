
var $ = require('jquery')
var _ = require('lodash')
var React = require('react')

require('react.backbone')
require('jquery-linkify')

var ActionBtns = require('./actionButtons.jsx')
var Dialog 	= require('../lib/dialogs.jsx')

var ProblemContent = React.createClass({

	componentDidMount: function () {
		window.Utils.refreshLatex();
	},

	componentDidUpdate: function () {
		window.Utils.refreshLatex();
	},

	componentWillMount: function () {
		var update = function () {
			this.forceUpdate(function(){});
		}
		this.props.model.on('add reset remove change', update.bind(this));
	},

	//

	onClickEdit: function () {
		window.location.href = this.props.model.get('path')+'/editar';
	},

	onClickShare: function () {
		Modal.ShareDialog({
			message: "Compartilhe esse problema",
			title: this.props.model.get('content').title,
			url: 'http://www.qilabs.org'+this.props.model.get('path'),
		});
	},

	tryAnswer: function (e) {
		if (this.props.model.get('answer').is_mc) {
			var data = { value: e.target.dataset.value };
		} else {
			var data = { value: this.refs.answerInput.getDOMNode().value };
		}
		this.props.model.try(data);
	},

	render: function () {
		var doc = this.props.model.attributes;

		// if window.user.id in this.props.model.get('hasSeenAnswer'), show answers
		var source = doc.content.source;
		var isAdaptado = source && (!!source.match(/(^\[adaptado\])|(adaptado)/));

		var GenHeader = function () {
			//-------------------------------------------------
			// // Gen level element
			// var Level = (
			// 	<div className="tag tag-bg">
			// 		Nível {doc.level}
			// 	</div>
			// );
			// // Gen subject element
			// var Subject = (
			// 	<div className="tag subject tag-bg" data-tag={doc.subject}>
			// 		{doc.materia}
			// 	</div>
			// );
			// Gen topic element
			var Topic = (
				<div className="tag topic tag-bg" data-tag={doc.topic}>
					{doc.topico}
				</div>
			);

			return (
				<div className="ProblemHeader">

					<div className="tags">
						{Topic}
					</div>

					{
						(this.props.model.userIsAuthor)?
						<div className="sideBtns">
							{ActionBtns.Like({
								cb: function () {},
								active: true,
								text: doc.counts.votes
							})}
							<ActionBtns.Edit cb={this.onClickEdit} />
							<ActionBtns.Share cb={this.onClickShare} />
						</div>
						:<div className="sideBtns">
							<ActionBtns.Like
								cb={this.props.model.toggleVote.bind(this.props.model)}
								active={this.props.model.liked}
								text={doc.counts.votes} />
							<ActionBtns.Share cb={this.onClickShare} />
							<ActionBtns.Flag cb={this.onClickShare} />
						</div>
					}

					<div className="title">
						Problema {this.props.nav.getIndex()+1}
					</div>
				</div>
			)
		}.bind(this)

		var GenProblemInput = function () {

			var inputLeftCol = (
				<div className="left">
				</div>
			);

			//---------------------------------------------------------------
			// MAKE LEFT COL ------------------------------------------------

			/**
			 * Situations:
			 * 0. User is author
			 * 1. User solved problem
			 * 2. User never interacted with this problem
			 * 3. User answered wrong and HAS NO tried left
			 * 4. User answered wrong and HAS tries left
			 * 5. User chose just to see answers
			 */

			var m = this.props.model;

			// var SeeSolutionBtn = (
			// 	<button className="see-solutions">
			// 		Ver solução
			// 	</button>
			// );
			var SeeSolutionBtn = null;

			if (m.userIsAuthor) { // 0
				console.log(0)
				var inputEnabled = false;
				var inputLeftCol = (
					<div className="left">
						<div className="info">
							<div className="main">Você criou esse problema.</div>
							<div className="sub">
								Que isso, hein...
							</div>
							{SeeSolutionBtn}
						</div>
					</div>
				);
			} else if (m.userSolved) { // 1
				console.log(1)
				var inputEnabled = false;
				var inputLeftCol = (
					<div className="left">
						<div className="info">
							<div className="main">Você <strong>acertou</strong> esse problema. :)</div>
							<div className="sub">
								E ganhou um biscoito!
							</div>
							{SeeSolutionBtn}
						</div>
					</div>
				);
			} else if (!m.userTried && !m.userSawAnswer) { // 2
				console.log(2)
				var inputEnabled = true;
				var inputLeftCol = (
					<div className="left">
						<div className="info">
							<div className="main">Acerte esse problema, mano.</div>
							<div className="sub">
								E ganhe um biscoito.
							</div>
							{SeeSolutionBtn}
						</div>
					</div>
				);
			} else if (m.userTried && !m.userSolved && !m.userTriesLeft) { // 3
				console.log(3)
				var inputEnabled = false;
				var inputLeftCol = (
					<div className="left">
						<div className="info">
							<div className="main">Você errou esse problema.</div>
							<div className="sub">
								Too bad. :(
							</div>
							{SeeSolutionBtn}
						</div>
					</div>
				);
			} else if (m.userTried && !m.userSolved && m.userTriesLeft) { // 4
				console.log(4)
				var inputEnabled = true;
				var inputLeftCol = (
					<div className="left">
						<div className="info">
							<div className="main">Você foi burro, mas ainda pode não ser (?).</div>
							<div className="sub">
								Lute pelo seu biscoito. Você ainda tem {m.userTriesLeft} chances.
							</div>
							{SeeSolutionBtn}
						</div>
					</div>
				);
			} else if (m.userSawAnswer) { // 5
				console.log(5)
				var inputEnabled = false;
				var inputLeftCol = (
					<div className="left">
						<div className="info">
							<div className="main">Você não respondeu esse problema.</div>
							{SeeSolutionBtn}
						</div>
					</div>
				)
			}

			if (doc.answer.is_mc) {
				var lis = _.map(doc.answer.mc_options, function (item, index) {
					return (
						<li>
							<button className={inputEnabled?'':(index==0?"right-choice":"wrong-choice")}
								onClick={this.tryAnswer} disabled={!inputEnabled}
								data-index={index} data-value={item}>
								{item}
							</button>
						</li>
					)
				}.bind(this));
				if (inputEnabled) {
					var inputRightCol = (
						<div className="right">
							<div className="multiple-choice">
							{lis}
							</div>
						</div>
					);
				} else {
					var inputRightCol = (
						<div className="right">
							<div className="multiple-choice disabled">
							{lis}
							</div>
						</div>
					);
				}
			} else {
				if (inputEnabled) {
					var inputRightCol = (
						<div className="right">
							<div className="answer-input">
								<input ref="answerInput" defaultValue={ _.unescape(doc.answer.value) } placeholder="Resultado" />
								<button className="try-answer" onClick={this.tryAnswer}>Responder</button>
							</div>
						</div>
					);
				} else {
					var inputRightCol = (
						<div className="right">
						</div>
					);
					// <div className="answer-input disabled">
					// 	<input ref="answerInput" disabled={true} defaultValue={ _.unescape(doc.answer.value) } placeholder="Resultado" />
					// 	<button className="try-answer" disabled={true} onClick={this.tryAnswer}>Responder</button>
					// </div>
				}
			}


			var classSolved = m.userSolved && "solved" || null;
			var classFailed = !m.userSolved && m.userTriesLeft===0 && !m.userIsAuthor || null;

			return (
				<div className={"problemInput "+(classSolved?"solved":"")+" "+(classFailed?"failed":"")}>
					{inputLeftCol}
					{inputRightCol}
				</div>
			);
		}.bind(this)

		return (
			<div className="PsetProblem problem">
				{GenHeader()}

				<div className="Body">
					{
						doc.content.image &&
						<div className="image"><img src={doc.content.image} /></div>
					}
					<div className="body" dangerouslySetInnerHTML={{__html: window.Utils.renderMarkdown(doc.content.body)}}></div>
				</div>

				<div className="Footer">
					<ul className="right">
						<li className="solved">
						{
							!doc.counts.solved?
							"Ninguém resolveu"
							:(doc.counts.solved === 1)?
								"1 resolveu"
								:''+doc.counts.solved+" resolveram"
						}
						</li>
					</ul>
				</div>

				{GenProblemInput()}
			</div>
		);
	},
});


var PsetProblemView = React.createBackboneClass({
	displayName: 'PsetProblemView',


	render: function () {
		var doc = this.getModel().attributes;

		var GenHeader = function () {
			return (
				<div className="PsetHeader">
					<div className="right">
						<button className="nav-btn" onClick={this.props.nav.goHome}>
							Topo
						</button>
						<button className="nav-btn" onClick={this.props.nav.previous}>
							Anterior
						</button>
						<button className="nav-btn" onClick={this.props.nav.next}>
							Próximo
						</button>
					</div>
					<div className="title">
						<div className="note">
							Coleção:
						</div>
						{this.props.pset.get('name')}
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
					<a href={doc.author.path}>
						<div className="user-avatar">
							<div className="avatar" style={ { background: 'url('+doc.author.avatarUrl+')' } }></div>
						</div>
						<span className="username">{doc.author.name}</span>
						<span className="note">(edição)</span>
					</a>
					{FollowBtn}
				</div>
			);
		}.bind(this)

		var GenSidebtns = function () {
			if (this.props.model.userIsAuthor) {
				function onClickEdit() {
					location.href = doc.path+'/editar';
				}

				return (
					<div className="sideBtns">
						<ActionBtns.Like
							cb={function () {}}
							active={true}
							text={doc.counts.votes} />
						<ActionBtns.Edit cb={onClickEdit} />
						<ActionBtns.Share cb={this.onClickShare} />
					</div>
				)
			}
			return (
				<div className="sideBtns">
					<ActionBtns.Like
						cb={this.props.model.toggleVote.bind(this.props.model)}
						active={this.props.model.liked}
						text={doc.counts.votes} />
					<ActionBtns.Share cb={this.onClickShare} />
					<ActionBtns.Flag cb={this.onClickFlag} />
				</div>
			)
		}.bind(this)

		return (
			<div className="Header">
				{GenTags()}
				<div className="title">
					{doc.name}
				</div>
				{GenStats()}
				{GenAuthor()}
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

		var self = this;

		var GenProblemList = function () {
			var problems = this.getModel().problems.map(function (p, index) {
				function gotoProblem() {
					self.props.nav.gotoProblem(index);
				}

				var topicData = _.find(pageMap[p.get('subject')].topics, { id: p.get('topic') });
				// if (!topicData) {
				// 	console.warn("WTF, dude!")
				// 	return null;
				// }

				m = p;
				console.log(p)

				if (p.userSolved) {
					var status = "resolvido";
				} else if (p.userTriesLeft === 0) {
					var status = "failed";
				} else if (p.userTries && p.userTriesLeft) {
					var status = ""+p.userTriesLeft+" tentativas restando";
				}

				return (
					<li className="" onClick={gotoProblem}>
						<div class="num">
							{p.name}
						</div>
						{
							status && (
								<div class="status">
									status: {status}
								</div>
							)
						}
						{
							topicData && (
							<div className="tag tag-bg" data-tag={topicData.id}>
								{topicData.name}
							</div>
							)
						}
					</li>
				);
			})

			return (
				<ul className="problemList">
					{problems}
				</ul>
			)
		}.bind(this)

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
		var index = this.props.pindex || null;
		if (index >= this.getModel().get('problem_ids').length) {
			console.warn('Problem at index '+index+' not found in problem set.');
			index = null;
		}
		if (typeof index !== 'number' || index%1 !== 0) {
			console.warn('Invalid index '+JSON.stringify(index)+' for problem set.')
			index = null;
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
			getIndex: function () {
				return this.state.selectedProblem;
			}.bind(this),

			goHome: function () {
				this.setState({ selectedProblem: null });
			}.bind(this),

			gotoProblem: function (index) {
				if (index >= model.get('problem_ids').length) {
					console.warn('Problem at index '+index+' not found in problem set.');
					return;
				}
				app.navigate(model.get('path')+'/'+index, { trigger: false });
				this.setState({ selectedProblem: index });
			}.bind(this),

			next: function () {
				if (this.state.selectedProblem === model.get('problem_ids').length-1) {
					// We're at the limit.
					return;
				}
				nav.gotoProblem(this.state.selectedProblem+1);
			}.bind(this),

			previous: function () {
				if (this.state.selectedProblem === 0) {
					// We're at the limit.
					return;
				}
				nav.gotoProblem(this.state.selectedProblem-1);
			}.bind(this),
		};

		if (this.state.selectedProblem !== null) {
			var pmodel = this.getModel().problems.at(this.state.selectedProblem);
			if (!pmodel) {
				throw "Failed to get problem at index "+this.state.selectedProblem+".";
			}
			return (
				<div className="Pset" data-page="problem">
					<PsetProblemView {...this.props} pset={this.getModel()} model={pmodel} nav={nav} />
				</div>
			);
		} else {
			return (
				<div className="Pset">
					<PsetIndexView {...this.props} nav={nav} />
				</div>
			);
		}
	},
});

module.exports = ProblemSetView;
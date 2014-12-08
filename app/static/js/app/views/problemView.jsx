
var $ = require('jquery')
var _ = require('lodash')
var React = require('react')

var Toolbar = require('./parts/toolbar.jsx')
var Modal = require('./parts/dialog.jsx')

//

module.exports = React.createClass({

	componentDidMount: function () {
		app.utils.refreshLatex();
	},

	componentDidUpdate: function () {
		app.utils.refreshLatex();
	},

	componentWillMount: function () {
		var update = function () {
			this.forceUpdate(function(){});
		}
		this.props.model.on('add reset remove change', update.bind(this));
	},

	//

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
						<div className="main">Foi mal, você é burro.</div>
						<div className="sub">
							Da próxima vez...
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
							<input ref="answerInput" defaultValue={doc.answer.value} placeholder="Resultado" />
							<button className="try-answer" onClick={this.tryAnswer}>Responder</button>
						</div>
					</div>
				);
			} else {
				var inputRightCol = (
					<div className="right">
						<div className="answer-input disabled">
							<input ref="answerInput" defaultValue={doc.answer.value} placeholder="Resultado" />
							<button className="try-answer" onClick={this.tryAnswer}>Responder</button>
						</div>
					</div>
				);
			}
		}

		//-------------------------------------------------
		// Generate FollowBtn
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

		//-------------------------------------------------
		// Gen level element
		var Level = (
			<div className="level">
				Nível {doc.level}
			</div>
		);
		// Gen subject element
		var Subject = (
			<div className="subject tag-color" data-tag={doc.subject}>
				{doc.materia}
			</div>
		);
		// Gen topic element
		var Topic = (
			<div className="topic tag-color" data-tag={doc.topic}>
				{doc.topico}
			</div>
		);

		var classSolved = m.userSolved && "solved" || null;
		var classFailed = !m.userSolved && m.userTriesLeft===0 && !m.userIsAuthor || null;

		return (
			<div className="problem">
				<div className="problem-header">
					<div className="breadcrumbs">
						{Subject} >
						{Topic} >
						{Level}
					</div>

					{
						(this.props.model.userIsAuthor)?
						<div className="sideBtns">
							{Toolbar.LikeBtn({
								cb: function () {},
								active: true,
								text: doc.counts.votes
							})}
							<Toolbar.EditBtn cb={this.props.parent.onClickEdit} />
							<Toolbar.ShareBtn cb={this.onClickShare} />
						</div>
						:<div className="sideBtns">
							<Toolbar.LikeBtn
								cb={this.props.model.toggleVote.bind(this.props.model)}
								active={this.props.model.liked}
								text={doc.counts.votes} />
							<Toolbar.ShareBtn cb={this.onClickShare} />
							<Toolbar.FlagBtn cb={this.onClickShare} />
						</div>
					}
				</div>

				<div className="problem-content">
					<div className="title">
						{doc.content.title}
					</div>
					{
						doc.content.image &&
						<div className="image"><img src={doc.content.image} /></div>
					}
					<div className="body" dangerouslySetInnerHTML={{__html: app.utils.renderMarkdown(doc.content.body)}}></div>
					{
						source?
						<div className="sauce">Coleção: {source}</div>
						:null
					}
				</div>

				<div className="problem-footer">
					<ul>
						<li className="author">
							<a href={doc.author.path} className="username">
								<div className="user-avatar">
									<div className="avatar" style={ { background: 'url('+doc.author.avatarUrl+')' } }></div>
								</div>
								{doc.author.name}
							</a>
						</li>
						<li>
							<i className="icon-dot"></i>
							<time data-time-count={1*new Date(doc.created_at)} data-short="false" title={formatFullDate(new Date(doc.created_at))}>
								{window.calcTimeFrom(doc.created_at, false)}
							</time>
						</li>
					</ul>
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

				<div className={"problem-input "+classSolved+" "+classFailed}>
					{inputLeftCol}
					{inputRightCol}
				</div>
			</div>
		);
	},
})
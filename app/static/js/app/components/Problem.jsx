
var $ = require('jquery')
var _ = require('lodash')
var React = require('react')

var SideBtns = require('./sideButtons.jsx')
var Dialog = require('../lib/dialogs.jsx')

var ProblemContent = React.createBackboneClass({

	componentDidMount: function () {
		window.Utils.refreshLatex();
	},

	componentDidUpdate: function () {
		window.Utils.refreshLatex();
	},

	_tryAnswer: function (e) {
		if (this.getModel().get('answer').is_mc) {
			var data = { value: e.target.dataset.value };
		} else {
			var data = { value: this.refs.answerInput.getDOMNode().value };
		}
		this.getModel().try(data);
	},

	render: function () {
		var doc = this.getModel().attributes;

		var events = {
			onClickEdit: () => {
				window.location.href = this.getModel().get('path')+'/editar';
			},

			onClickShare: () => {
				Dialog.ShareDialog({
					message: "Compartilhe esse problema",
					title: this.getModel().get('title'),
					url: 'http://www.qilabs.org'+this.getModel().get('path'),
				});
			},
		};

		var GenHeader = () => {
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

			return (
				<div className="Header">

					<div className="tags">
						<div className="tag topic tag-bg" data-tag={doc.topic}>
							{doc.topico}
						</div>
					</div>

					{
						(window.user && window.user.flags.editor || this.getModel().userIsAuthor)?
						<div className="sideButtons">
							{SideBtns.Like({
								cb: function () {},
								active: true,
								text: doc.counts.votes
							})}
							<SideBtns.Edit cb={events.onClickEdit} />
							<SideBtns.Share cb={events.onClickShare} />
						</div>
						:<div className="sideButtons">
							<SideBtns.Like
								cb={this.getModel().toggleVote.bind(this.props.model)}
								active={this.getModel().liked}
								text={doc.counts.votes} />
							<SideBtns.Share cb={events.onClickShare} />
							<SideBtns.Flag cb={events.onClickShare} />
						</div>
					}
					<div className="title">
						{this.getModel().get('title')}
					</div>
				</div>
			)
		}

		var GenProblemInput = () => {

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
								A resposta é <strong></strong>
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
			} else {
				throw new Error("WTF");
			}

			if (doc.answer.is_mc) {
				var lis = _.map(doc.answer.mc_options, function (item, index) {
					return (
						<li key={index}>
							<button className={inputEnabled?'':(index==0?"right-choice":"wrong-choice")}
								onClick={this._tryAnswer} disabled={!inputEnabled}
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
								<button className="try-answer" onClick={this._tryAnswer}>Responder</button>
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
					// 	<button className="try-answer" disabled={true} onClick={this._tryAnswer}>Responder</button>
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
		}

		return (
			<div className="ProblemView">
				{GenHeader()}

				<div className="Body">
					{
						doc.image &&
						<div className="image"><img src={doc.image} /></div>
					}
					<div className="body" dangerouslySetInnerHTML={{__html: window.Utils.renderMarkdown(doc.body)}}></div>
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

module.exports = ProblemContent;
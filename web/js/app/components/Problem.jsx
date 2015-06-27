
var $ = require('jquery')
var _ = require('lodash')
var React = require('react')

var SideBtns = require('./sideButtons.jsx')
var Dialog = require('../lib/dialogs.jsx')

var userIsEditor = window.user.flags && window.user.flags.editor;

var ProblemContent = React.createBackboneClass({

	getInitialState: function() {
		return {
			selectedChoice: null,
		};
	},

	componentDidMount: function () {
		window.Utils.refreshLatex();
	},

	componentDidUpdate: function () {
		window.Utils.refreshLatex();
	},

	_tryAnswer: function (value) {
		this.getModel().try({ value: value });
	},

	render: function () {
		var doc = this.getModel().attributes;

		var events = {
			onClickEdit: () => {
				window.location.href = this.getModel().get('path')+'/editar';
			},

			onClickShare: () => {
				if (this.props.pset) {
					var pset = this.props.pset.attributes;
					var url = 'http://www.qilabs.org'+pset.path+'/'+this.props.nav.getIndex();
					var title = 'Problema '+this.getModel().get('originalIndex')+' da '+pset.fullName;
					console.log(url)
					Dialog.FacebookShare({
						message: "Compartilhe esse problema",
						title: title,
						url: url,
					});
				} else {
					Dialog.FacebookShare({
						message: "Compartilhe esse problema",
						title: this.getModel().get('title'),
						url: 'http://www.qilabs.org'+this.getModel().get('path'),
					});
				}
			},
		};

		var GenHeader = () => {
			return (
				<div className="Header">
					{
						(window.user && window.user.flags.editor || this.getModel().userIsAuthor)?
						<div className="sideButtons">
							<SideBtns.Like
								cb={function () {}}
								active={true}
								text={doc.counts.likes} />
							<SideBtns.Edit cb={events.onClickEdit} />
							<SideBtns.FacebookShare cb={events.onClickShare} />
						</div>
						:<div className="sideButtons">
							<SideBtns.Like
								cb={this.getModel().toggleVote.bind(this.props.model)}
								active={this.getModel().liked}
								text={doc.counts.likes} />
							<SideBtns.FacebookShare cb={events.onClickShare} />
							<SideBtns.Flag cb={events.onClickShare} />
						</div>
					}
					<div className="title">
						{this.getModel().get('title')}
					</div>
				</div>
			)
		}

		var GenAnswerInput = () => {

			var m = this.props.model;
			var inputEnabled;

			var genInfoCol = () => {
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

				// var SeeSolutionBtn = (
				// 	<button className="see-solutions">
				// 		Ver solução
				// 	</button>
				// );
				var SeeSolutionBtn = null;

				if (userIsEditor) { // 0
					console.log(0)
					inputEnabled = false;
					return (
						<div className="infoCol">
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
					inputEnabled = false;
					return (
						<div className="infoCol">
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
					inputEnabled = true;
					return (
						<div className="infoCol">
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
					inputEnabled = false;
					return (
						<div className="infoCol">
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
					inputEnabled = true;
					return (
						<div className="infoCol">
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
					inputEnabled = false;
					return (
						<div className="infoCol">
							<div className="info">
								<div className="main">Você não respondeu esse problema.</div>
								{SeeSolutionBtn}
							</div>
						</div>
					)
				} else {
					throw new Error("WTF");
				}
			};

			var genAnswerInputCol = () => {

				var tryAnswer = (e) => {
					if (this.getModel().get('isMultipleChoice')) {
						var options = this.getModel().get('mcOptions');
						this._tryAnswer(options[this.state.selectedChoice]);
					} else {
						this._tryAnswer(this.refs.answerInput.getDOMNode().value);
					}
				}

				if (doc.isMultipleChoice) {
					var lis = _.map(doc.mcOptions, (option, index) => {

						var onClick = () => {
							if (!inputEnabled) {
								return;
							}
							if (this.state.selectedChoice === index) {
								this.setState({ selectedChoice: null });
							} else {
								this.setState({ selectedChoice: index });
							}
						}

						var selected = index === this.state.selectedChoice;

						return (
							<li key={index}>
								<div className={"fakeButton "+(inputEnabled?'':(index==0?"right-choice":"wrong-choice"))}
									onClick={onClick} disabled={!inputEnabled}
									data-index={index} data-value={option}>
									{
										selected?
										<i className="icon-radio_button_checked"></i>
										:<i className="icon-radio_button_unchecked"></i>
									}
									<div className="text">
										{option}
									</div>
								</div>
							</li>
						)
					});

					if (inputEnabled) {
						return (
							<div className="inputCol">
								<div className="multiple-choices">
								{lis}
								</div>
								{
									(this.state.selectedChoice !== null)?
									<button className="send-answer" onClick={tryAnswer}>
										Enviar Resposta
									</button>
									:<button className="send-answer disabled" disabled={true}>
										Enviar Resposta
									</button>
								}
							</div>
						);
					} else {
						return (
							<div className="inputCol disabled">
								<div className="multiple-choices disabled">
								{lis}
								</div>
							</div>
						);
					}
				} else {
					if (inputEnabled) {
						return (
							<div className="inputCol">
								<div className="answer-input">
									<input ref="answerInput" defaultValue={ _.unescape(doc.answer.value) } placeholder="Resultado" />
									<button className="try-answer" onClick={tryAnswer}>Responder</button>
								</div>
							</div>
						);
					} else {
						return (
							<div className="inputCol">
							</div>
						);
						// <div className="answer-input disabled">
						// 	<input ref="answerInput" disabled={true} defaultValue={ _.unescape(doc.answer.value) } placeholder="Resultado" />
						// 	<button className="try-answer" disabled={true} onClick={this._tryAnswer}>Responder</button>
						// </div>
					}
				}
			};

			window.m = m;
			console.log(m)

			var classSolved = m.userSolved && "solved" || null;
			var classFailed = !m.userSolved && m.userTriesLeft===0 && !userIsEditor || null;

			return (
				<div className={"inputWrapper "+(classSolved?"solved":"")+" "+(classFailed?"failed":"")}>
					{genInfoCol()}
					{genAnswerInputCol()}
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

				{GenAnswerInput()}

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

			</div>
		);
	},
});

module.exports = ProblemContent;
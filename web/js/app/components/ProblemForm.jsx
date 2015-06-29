
var $ = require('jquery')
var _ = require('lodash')
var React = require('react')
var selectize = require('selectize')
require('react.backbone')

var MarkdownEditor = require('./MarkdownEditor.jsx')
var LineInput = require('./LineInput.jsx')

var models = require('../lib/models.js')
var SideBtns = require('./sideButtons.jsx')
var Dialog = require('../lib/dialogs.jsx')

var ProblemEdit = React.createBackboneClass({
	getInitialState: function () {
		return {
			answerIsMC: this.props.model.get('isMultipleChoice'),
			subject: this.props.model.get('subject'),
		};
	},

	componentDidMount: function () {
		// Set state on subject change, so that topics are changed accordingly.
		$(this.refs.subjectSelect.getDOMNode()).on('change', (e) => {
			this.setState({ subject: this.refs.subjectSelect.getDOMNode().value })
		})
	},

	send: function () {
		var data = {
			name: this.refs.nameInput.getValue(),
			topic: this.refs.topicSelect.getDOMNode().value,
			level: parseInt(this.refs.levelSelect.getDOMNode().value),
			subject: this.refs.subjectSelect.getDOMNode().value,
			originalIndex: this.refs.originalIndexInput.getDOMNode().value,
			source: this.refs.sourceInput.getDOMNode().value,
			body: this.refs.mdEditor.getValue(),
			isOriginalAuthor: this.refs.checkIsOriginalAuthor.getDOMNode().checked,
		}

		if (data.source && !data.originalIndex) {
			Utils.flash.alert('O índice local é necessário para problemas com fonte definida.');
			return;
		}

		if (this.props.model.get('topic') === 'false') {
			data.topic = null;
		}

		if (this.state.answerIsMC) {
			var options = [];
			$(this.refs.mcPool.getDOMNode()).find('input').each(function () {
				options.push(this.value);
			});
			data.isMultipleChoice = true;
			data.answer = {
				options: options,
			};
		} else {
			data.isMultipleChoice = false;
			data.answer = {
				value: this.refs['right-ans'].getDOMNode().value,
			};
		}

		this.props.model.save(data, {
			url: this.props.model.url() || '/api/problems',
			success: function (model) {
				window.location.href = model.get('path');
				Utils.flash.info("Problema salvo.");
			},
			error: function (model, xhr, options) {
				var data = xhr.responseJSON;
				if (data && data.message) {
					Utils.flash.alert(data.message);
				} else {
					Utils.flash.alert('Friedman... Milton Friedman.');
				}
			}
		});
	},

	tryClose: function (cb) {
		if (this.props.isNew) {
			var msg = 'Tem certeza que deseja descartar esse problema?';
		} else {
			var msg = 'Tem certeza que deseja descartar alterações a esse problema?';
		}
		if (confirm(msg)) {
			cb();
		}
	},

	render: function () {
		var doc = this.props.model.attributes;

		var events = {
			clickTrash: (e) => {
				if (this.props.isNew) {
					this.tryClose(() => this.props.page.destroy())
				} else {
					if (confirm('Tem certeza que deseja excluir esse problema?')) {
						this.props.model.destroy();
						this.props.page.destroy();
					}
				}
			},
			clickMultipleChoice: () => {
				var selection = this.refs.multipleChoiceSelection.getDOMNode();
				var selected = $(selection).find('label.btn.active')[0];
				if (selected.dataset.value === 'yes') {
					this.setState({ answerIsMC: true });
				} else {
					this.setState({ answerIsMC: false });
				}
			},
			clickPreview: () => {
				var md = this.refs.mdEditor.getValue();
				var html = window.Utils.renderMarkdown(md);
				var Preview = React.createClass({
					render: function () {
						return (
							<div>
								<h1>Seu texto vai ficar assim:</h1>
								<span className="content" dangerouslySetInnerHTML={{__html: html }}></span>
								<small>
									(clique fora da caixa para sair)
								</small>
							</div>
						)
					}
				});
				Dialog(<Preview />, "preview", function () {
					window.Utils.refreshLatex();
				});
			},
		};

		var genSubjectSelect = () => {
			var subjectOptions = _.map(_.map(_.filter(pageMap, function (obj, key) {
				return obj.hasProblems;
			}), function (obj, key) {
				return {
					id: obj.id,
					name: obj.name,
					detail: obj.detail,
				};
			}), function (a, b) {
					return (
						<option value={a.id} key={a.id}>{a.name}</option>
					);
				});

			return (
				<div className="input-Select lab-select">
					<i className="icon-group_work"
						data-toggle={this.props.isNew?"tooltip":null}
						data-placement="left" data-container="body"
						title="Selecione um laboratório.">
					</i>
					<select ref="subjectSelect"
						defaultValue={ _.unescape(doc.subject) }
						onChange={this.onChangeLab}>
						<option value="false">Matéria</option>
						{subjectOptions}
					</select>
				</div>
			)
		}

		var genLevelSelect = () => {
			return (
				<div className="input-Select level-select"
					disabled={!this.props.isNew}>
					<select ref="levelSelect" defaultValue={ _.unescape(doc.level) }>
						<option value="false">Dificuldade</option>
						<option value="1">Nível 1</option>
						<option value="2">Nível 2</option>
						<option value="3">Nível 3</option>
						<option value="4">Nível 4</option>
						<option value="5">Nível 5</option>
					</select>
				</div>
			)
		}

		var genTopicSelect = () => {
			if (this.state.subject && this.state.subject in pageMap) {
				if (!pageMap[this.state.subject].hasProblems || !pageMap[this.state.subject].topics)
					console.warn("WTF, não tem tópico nenhum aqui.");
				var TopicOptions = _.map(pageMap[this.state.subject].topics, function (obj) {
					return (
						<option value={obj.id}>{obj.name}</option>
					)
				});
			}

			return (
				<div className="input-Select topic-select" disabled={!this.props.isNew}>
					<select ref="topicSelect" disabled={!this.state.subject} defaultValue={doc.topic}>
						<option value="false">Tópico</option>
						{TopicOptions}
					</select>
				</div>
			)
		}


		return (
			<div className="ProblemForm">
				<div className="form-wrapper">
					<ul className="inputs">
						<li>
							<LineInput ref="nameInput"
								className="input-title"
								placeholder="Título para o seu problema (opcional)"
								defaultValue={this.getModel().get('name')} />
						</li>

						<li>
							<div className="row">
								<div className="col-md-4">
									{genSubjectSelect()}
								</div>
								<div className="col-md-4">
									{genTopicSelect()}
								</div>
								<div className="col-md-4">
									{genLevelSelect()}
								</div>
							</div>
						</li>

						<li>
							<div className="row">
								<div className="col-md-8">
									<input type="text" ref="sourceInput"
										name="post_source"
										className="source"
										placeholder="Cite a fonte desse problema"
										defaultValue={ _.unescape(doc.source) }/>
								</div>
								<div className="col-md-4">
									<input ref="originalIndexInput"
										type="number"
										min="1"
										max="100"
										className=""
										placeholder="Índice Local (opcional)"
										defaultValue={this.getModel().get('originalIndex')} />
								</div>
							</div>
						</li>

						<li>
							<input type="checkbox" defaultChecked={false} ref="checkIsOriginalAuthor" />
							&nbsp;Sou o autor original desse problema.
						</li>

						<div>
							<MarkdownEditor ref="mdEditor"
								placeholder="Descreva o problema usando markdown e latex."
								value={this.getModel().get('body')}
								converter={window.Utils.renderMarkdown} />
						</div>
					</ul>

					<section className="answerInput">
						<div className="left">
						</div>
						<div className="right">
							<div className="group check-btns">
								<label>Múltipla Escolha</label>
								<div className="btn-group" data-toggle="buttons" ref="multipleChoiceSelection">
									<label
										className={"btn btn-primary "+(this.state.answerIsMC?"active":"")}
										data-value="yes"
										onClick={events.clickMultipleChoice}>
										<input type="radio" name="options" onChange={function(){}} checked /> Sim
									</label>
									<label
										className={"btn btn-primary "+(this.state.answerIsMC?"":"active")}
										data-value="no"
										onClick={events.clickMultipleChoice}>
										<input type="radio" name="options" onChange={function(){}} /> Não
									</label>
								</div>
							</div>
							<div className="tab" style={ (this.state.answerIsMC)?{ display: "none" }:{} }>
								<div className="group answer-input">
									<input className="single-ans" ref="right-ans" type="text"
										defaultValue={ _.unescape(doc.answer.value)}
										placeholder="A resposta certa" />
									<select ref="unitySelect" defaultValue={ _.unescape(doc.answer.unity)}>
										<option value="false">Unidade</option>
										<option value="g">Gramas</option>
										<option value="N">Newton</option>
										<option value="kg">Quilo-gramas</option>
									</select>
								</div>
							</div>
							<div className="tab" style={ (this.state.answerIsMC)?{}:{ display: "none" } }>
								<div className="group answer-input" ref="mcPool">
									<ul>
										{
											_.map(doc.answer.mcOptions || ['','','','',''], function (value, index) {
												if (index === 0)
													return (
														<input className="right-ans" type="text"
															defaultValue={ _.unescape(value) }
															placeholder="A resposta certa" />
													)
												else
													return (
														<input className="wrong-ans" type="text"
															defaultValue={ _.unescape(value) }
															placeholder="Uma opção incorreta" />
													)
											})
										}
									</ul>
								</div>
							</div>
						</div>
					</section>

					<footer>
						<ul className="right">
							{
								this.props.isNew?
								<button className="submit" onClick={this.send}>
									Enviar
								</button>
								:<button className="submit" onClick={this.send}>
									Salvar
								</button>
							}
						</ul>
						<ul className="">
							{
								this.props.isNew?
								<button className="cancel" onClick={events.clickTrash}>
									Sair
								</button>
								:<button className="remove" onClick={events.clickTrash}>
									Remover
								</button>
							}
						</ul>
					</footer>

				</div>
			</div>
		);
	},
});

module.exports = ProblemEdit;

module.exports.Create = function (data) {
	var postModel = new models.Problem({
		author: window.user,
		isMultipleChoice: true,
		answer: {
		},
		name: '',
		body: '',
	});
	return (
		<ProblemEdit model={postModel} page={data.page} isNew={true} />
	)
};
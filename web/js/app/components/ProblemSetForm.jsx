
var $ = require('jquery')
var _ = require('lodash')
var React = require('react')

require('react.backbone')

var Models = require('../lib/models.js')
var SideBtns = require('./sideButtons.jsx')

var MarkdownEditor = require('./MarkdownEditor.jsx')
var LineInput = require('./LineInput.jsx')
var Selector = require('./Selector.jsx')

var ProblemSet = React.createBackboneClass({
	displayName: 'ProblemSet',

	componentWillMount: function() {
	},

	save: function() {
		var pids = _.filter(
			_.map(this.refs.pidList.getDOMNode().value.split(','),
			function(p) {
				return p.replace(/^\s+|\s+$/,'')
			}), function(p) {
				return p.match(/[a-z0-9]{24}/);
			});

		var data = {
			name: this.refs.competitionInput.getDOMNode().value,
			year: this.refs.yearInput.getDOMNode().value,
			level: this.refs.levelInput.getValue(),
			round: this.refs.roundInput.getValue(),
			subject: this.refs.subjectInput.getValue(),

			description: this.refs.mdEditor.getValue(),

			problemIds: pids,
			source: this.refs.postSource.getValue(),
		}

		console.log(data)

		this.getModel().save(data, {
			url: this.getModel().url(),
			success: function(model) {
				window.location.href = model.get('path');
				Utils.flash.info("Coleção salva.");
			},
			error: function(model, xhr, options) {
				var data = xhr.responseJSON;
				if (data && data.message) {
					Utils.flash.alert(data.message);
				} else {
					Utils.flash.alert('Friedman... Milton Friedman.');
				}
			}
		});
	},

	tryClose: function(cb) {
		if (this.props.isNew) {
			var msg = 'Tem certeza que deseja descartar essa coleção?';
		} else {
			var msg = 'Tem certeza que deseja descartar alterações a essa coleção?';
		}
		if (confirm(msg)) {
			cb();
		}
	},

	render: function() {
		var genSideBtns = () => {
			return (
				<div className="sideButtons">
					<SideBtns.Send cb={events.clickSend} />
					<SideBtns.Preview cb={this.preview} />
					{
						this.props.isNew?
						<SideBtns.CancelPost cb={events.clickTrash} />
						:<SideBtns.Remove cb={events.clickTrash} />
					}
					<SideBtns.Help />
				</div>
			)
		};

		var genSubjectSelect = () => {
			var subjectOptions = _.map(_.map(_.filter(pageMap, function(obj, key) {
				return obj.hasProblems;
			}), function(obj, key) {
				return {
					id: obj.id,
					name: obj.name,
					detail: obj.detail,
				};
			}), function(a, b) {
					return (
						<option value={a.id} key={a.id}>{a.name}</option>
					);
				});

			return <Selector
				ref="subjectInput"
				className="lab-select" icon="icon-group_work"
				title="Selecione um laboratório"
				label="Matéria"
				options={subjectOptions}
				defaultValue={ _.unescape(this.getModel().get('subject')) } />
		}

		var events = {
			clickSend: (e) => {
				this.save();
			},
			clickTrash: (e) => {
				if (this.props.isNew) {
					this.tryClose(() => this.props.page.destroy())
				} else {
					if (confirm('Tem certeza que deseja excluir essa coleção?')) {
						this.props.model.destroy();
						this.props.page.destroy();
					}
				}
			},
		};

		var levelOptions = _.map([
			['Nível 1', 'level-1'],
			['Nível 2', 'level-2'],
			['Nível 3', 'level-3'],
			['Nível 4', 'level-4'],
			['Nível 5', 'level-5'],
		], (array) => {
			return <option key={array[1]} value={array[1]}>{array[0]}</option>
		});

		var roundOptions = _.map([
			['Fase 1', 'round-1'],
			['Fase 2', 'round-2'],
			['Fase 3', 'round-3'],
			['Fase 4', 'round-4'],
			['Fase 5', 'round-5'],
		], (array) => {
			return <option key={array[1]} value={array[1]}>{array[0]}</option>
		});

		return (
			<div className="ProblemSetForm">
				<div className="form-wrapper">

					<ul className="inputs">
						<li>
							<div className="row">
								<div className="col-md-3">
									<input type="text" ref="competitionInput"
										className="input-h3"
										placeholder="Olimpíada"
										defaultValue={this.getModel().get('name')} />
								</div>
								<div className="col-md-3">
									<input type="text" ref="yearInput"
										className="input-h3"
										placeholder="Ano"
										defaultValue={this.getModel().get('year')} />
								</div>
								<div className="col-md-3">
									<Selector ref="levelInput"
										className="select level-select"
										options={levelOptions}
										defaultValue={this.getModel().get('level')} />
								</div>
								<div className="col-md-3">
									<Selector ref="roundInput"
										className="select round-select"
										placeholder="Ano"
										options={roundOptions}
										defaultValue={this.getModel().get('round')} />
								</div>
							</div>
						</li>

						<li>
							<div className="row">
								<div className="col-md-5">
									{genSubjectSelect()}
								</div>
							</div>
						</li>

						<li>
							<LineInput ref="postSource"
								className=""
								placeholder="A url fonte desse problema"
								defaultValue={ _.unescape(this.getModel().get('source')) } />
						</li>

						<li>
							<MarkdownEditor ref="mdEditor"
								placeholder="Descreva a coleção."
								value={this.getModel().get('description')}
								converter={window.Utils.renderMarkdown} />
						</li>
						<li>
							<input ref="pidList"
								type="text" defaultValue={this.getModel().get('problemIds')}
								placeholder="Ids dos problemas, separados por vírgulas"
							/>
						</li>
					</ul>

					<ul className="Ainputs Aproblems-input">
					</ul>

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

module.exports = ProblemSet;

module.exports.Create = function(data) {
	var model = new Models.ProblemSet({
		author: window.user,
	});
	return (
		<ProblemSet model={model} page={data.page} isNew={true} />
	)
};
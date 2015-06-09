
var $ = require('jquery')
var _ = require('lodash')
var React = require('react')

require('react.backbone')

var Models = require('../lib/models.js')
var SideBtns = require('./sideButtons.jsx')

var MarkdownEditor = require('./MarkdownEditor.jsx')
var LineInput = require('./LineInput.jsx')

var ProblemSet = React.createBackboneClass({
	displayName: 'ProblemSet',

	save: function() {
		var pids = _.filter(
			_.map(this.refs.pidList.getDOMNode().value.split(','),
			function(p) {
				return p.replace(/^\s+|\s+$/,'')
			}), function(p) {
				return p.match(/[a-z0-9]{24}/);
			});

		var data = {
			subject: this.refs.subjectSelect.getDOMNode().value,
			name: this.refs.postTitle.getValue(),
			description: this.refs.mdEditor.getValue(),
			problem_ids: pids,
			source: this.refs.postSource.getDOMNode().value,
			slug: this.refs.postSlug.getDOMNode().value,
		}

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

	tryClose: function (cb) {
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

			return (
				<div className="input-Select lab-select">
					<i className="icon-group_work"
					data-toggle={this.props.isNew?"tooltip":null} data-placement="left" data-container="body"
					title="Selecione um laboratório."></i>
					<select ref="subjectSelect"
						defaultValue={ _.unescape(this.getModel().get('subject')) }
						onChange={this.onChangeLab}>
						<option value="false">Matéria</option>
						{subjectOptions}
					</select>
				</div>
			)
		}

		var events = {
			clickSend: (e) => {
				this.save();
			},
			clickTrash: (e) => {
				if (this.props.isNew) {
					this._close();
				} else {
					if (confirm('Tem certeza que deseja excluir essa coleção?')) {
						// Signal to the wall that the post with this ID must be removed.
						// This isn't automatic (as in deleting comments) because the models
						// on the wall aren't the same as those on post FullPostView.
						app.streamItems.remove({ id: this.props.model.get('id') })
						this.props.page.destroy();
					}
				}
			},
		};

		return (
			<div className="ProblemSetForm">
				<div className="form-wrapper">
					{genSideBtns()}

					<header>
						<div className="label">
							Criar Nova Coleção de Problemas
						</div>
					</header>

					<ul className="inputs">
						<li>
							<LineInput ref="postTitle"
								className="input-title"
								placeholder="Título para a coleção"
								value={this.getModel().get('name')} />
						</li>

						<li>
							<input ref="postSlug"
								type="text"
								placeholder="Slug para o seu post"
								defaultValue={this.getModel().get('slug')} />
						</li>

						<li>
							<div className="row">
								<div className="col-md-5">
									{genSubjectSelect()}
								</div>
							</div>
						</li>

						<li>
							<MarkdownEditor ref="mdEditor"
								placeholder="Descreva a coleção."
								value={this.getModel().get('description')}
								converter={window.Utils.renderMarkdown} />
						</li>

						<li>
							<input type="text" ref="postSource" name="post_source"
								placeholder="Cite a fonte desse problema (opcional)"
								defaultValue={ _.unescape(this.getModel().get('source')) }/>
						</li>
					</ul>

					<ul className="inputs problems-input">
						<li>
							<input ref="pidList"
								type="text" defaultValue={this.getModel().get('problem_ids')}
								placeholder="Ids dos problemas, separados por vírgulas"
							/>
						</li>
					</ul>
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
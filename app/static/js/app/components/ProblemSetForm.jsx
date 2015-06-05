
var $ = require('jquery')
var _ = require('lodash')
var React = require('react')

require('react.backbone')

var Models = require('../lib/models.js')
var ActionBtns = require('./actionButtons.jsx')

var MarkdownEditor = require('./MarkdownEditor.jsx')
var LineInput = require('./LineInput.jsx')

var ProblemSet = React.createBackboneClass({
	displayName: 'ProblemSet',

	propTypes: {
		model: React.PropTypes.any.isRequired,
		page: React.PropTypes.any.isRequired,
	},

	componentDidMount: function() {
		// Close when user clicks directly on element (meaning the faded black background)
		$(this.getDOMNode().parentElement).on('click', function onClickOut (e) {
			// console.log('oooo', e.target, this.getDOMNode().parentElement)
			if (e.target === this.getDOMNode().parentElement) {
				if (confirm("Deseja descartar permanentemente as suas alterações?")) {
					this._close();
					$(this).unbind('click', onClickOut);
				}
			}
		}.bind(this));
	},

	_save: function() {
		var pids = this.refs.pidList.getDOMNode().value.split(',');

		var pids = _.filter(_.map(pids, function(p) {
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

	_close: function() {
		this.props.page.destroy();
	},

	render: function() {
		var doc = this.getModel().attributes;

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

		var events = {
			clickSend: function() {
					this._save();
				}.bind(this),
			clickTrash: function() {
					if (this.props.isNew) {
						if (confirm('Tem certeza que deseja descartar esse problema?')) {
							this.getModel().destroy(); // Won't touch API, backbone knows better
							this._close();
						}
					} else {
						if (confirm('Tem certeza que deseja excluir esse problema?')) {
							this.getModel().destroy();
							this._close();
							// Signal to the wall that the post with this ID must be removed.
							// This isn't automatic (as in deleting comments) because the models on
							// the wall aren't the same as those on post FullPostView.
							console.log('id being removed:',this.getModel().get('id'))
							app.streamItems.remove({id:this.getModel().get('id')})
						}
					}
				}.bind(this),
		};

		return (
			<div className="ProblemSetForm">
				<div className="form-wrapper">
					<div className="sideBtns">
						<ActionBtns.Send cb={events.clickSend} />
						<ActionBtns.Preview cb={this.preview} />
						{
							this.props.isNew?
							<ActionBtns.CancelPost cb={events.clickTrash} />
							:<ActionBtns.Remove cb={events.clickTrash} />
						}
						<ActionBtns.Help />
					</div>

					<header>
						<div className="label">
							Criar Nova Coleção de Problemas
						</div>
					</header>

					<ul className="inputs">
						<li className="title">
							<LineInput ref="postTitle"
								placeholder="Título para a coleção"
								value={doc.name}
							/>
						</li>

						<li className="title">
							<input ref="postSlug"
								type="text"
								placeholder="Slug para o seu post"
								defaultValue={doc.slug}
							/>
						</li>

						<li className="selects">
							<div className="select-wrapper lab-select-wrapper ">
								<i className="icon-group_work"
								data-toggle={this.props.isNew?"tooltip":null} data-placement="left" data-container="body"
								title="Selecione um laboratório."></i>
								<select ref="subjectSelect"
									defaultValue={ _.unescape(doc.subject) }
									onChange={this.onChangeLab}>
									<option value="false">Matéria</option>
									{subjectOptions}
								</select>
							</div>
						</li>

						<li className="body">
							<MarkdownEditor ref="mdEditor"
								placeholder="Descreva o problema usando markdown e latex com ` x+3 `."
								value={doc.description}
								converter={window.Utils.renderMarkdown}
							/>
						</li>

						<li className="source">
							<input type="text" ref="postSource" name="post_source"
								placeholder="Cite a fonte desse problema (opcional)"
								defaultValue={ _.unescape(doc.source) }/>
						</li>
					</ul>

					<ul className="inputs problems-input">
						<li>
							<input ref="pidList"
								type="text" defaultValue={doc.problem_ids}
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
	var model = new Models.ProblemSet;
	return (
		<ProblemSet model={model} page={data.page} isNew={true} />
	)
};
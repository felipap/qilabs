
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

	propTypes: {
		model: React.PropTypes.any.isRequired,
		page: React.PropTypes.any.isRequired,
	},

	save: function() {
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

		var events = {
			clickSend: (e) => {
					this.save();
				},
			clickTrash: (e) => {
					if (this.props.isNew) {
						if (confirm('Tem certeza que deseja descartar essa coleção?')) {
							this.getModel().destroy(); // Won't touch API, backbone knows better
							this._close();
						}
					} else {
						if (confirm('Tem certeza que deseja excluir essa coleção?')) {
							this.getModel().destroy();
							this._close();
							// Signal to the wall that the post with this ID must be removed.
							// This isn't automatic (as in deleting comments) because the models on
							// the wall aren't the same as those on post FullPostView.
							console.log('id being removed:',this.getModel().get('id'))
							app.streamItems.remove({id:this.getModel().get('id')})
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
								value={doc.name} />
						</li>

						<li>
							<input ref="postSlug"
								type="text"
								placeholder="Slug para o seu post"
								defaultValue={doc.slug} />
						</li>

						<li>
							<div className="row">
								<div className="col-md-5">
									<div className="input-Select lab-select">
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
								</div>
							</div>
						</li>

						<li>
							<MarkdownEditor ref="mdEditor"
								placeholder="Descreva o problema usando markdown e latex com ` x+3 `."
								value={doc.description}
								converter={window.Utils.renderMarkdown} />
						</li>

						<li>
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
	var model = new Models.ProblemSet({
		author: window.user,
	});
	return (
		<ProblemSet model={model} page={data.page} isNew={true} />
	)
};
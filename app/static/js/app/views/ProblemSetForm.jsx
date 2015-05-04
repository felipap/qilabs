
var $ = require('jquery')
var _ = require('lodash')
var React = require('react')

var models = require('../components/models.js')
var Toolbar = require('./parts/toolbar.jsx')

var MarkdownEditor = require('./parts/MarkdownEditor.jsx')
var LineInput = require('./parts/LineInput.jsx')

module.exports = React.createClass({

	propTypes: {
		model: React.PropTypes.any.isRequired,
		page: React.PropTypes.any.isRequired,
	},

	getInitialState: function () {
		return {
		};
	},

	componentDidMount: function () {
		// Close when user clicks directly on element (meaning the faded black background)
		$(this.getDOMNode().parentElement).on('click', function onClickOut (e) {
			// console.log('oooo', e.target, this.getDOMNode().parentElement)
			if (e.target === this.getDOMNode().parentElement) {
				if (confirm("Deseja descartar permanentemente as suas alterações?")) {
					this.close();
					$(this).unbind('click', onClickOut);
				}
			}
		}.bind(this));
	},

	_save: function () {
		var pids = this.refs.pidList.getDOMNode().value.split(',');
		if (!(pids.length === 1 && pids[0] === '')) {
			for (var i=0; i<pids.length; ++i) {
				pids[i] = pids[i].replace(/^\s+|\s+$/, '')
				if (!pids[i].match(/[a-z0-9]{24}/)) {
					Utils.flash.alert("Errado! mano. corrige aí")
					return;
				}
			}
		}

		var data = {
			subject: this.refs.subjectSelect.getDOMNode().value,
			name: this.refs.postTitle.getValue(),
			description: this.refs.mdEditor.getValue(),
			problems: pids,
			source: this.refs.postSource.getDOMNode().value,
			slug: this.refs.postSlug.getDOMNode().value,
		}

		this.props.model.save(data, {
			url: this.props.model.url(),
			success: function (model) {
				window.location.href = model.get('path');
				Utils.flash.info("Coleção salva.");
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

	_close: function () {
		this.props.page.destroy();
	},

	render: function () {
		var doc = this.props.model.attributes;

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

		var events = {
			clickSend: function () {
					this._save();
				}.bind(this),
			clickTrash: function () {
					if (this.props.isNew) {
						if (confirm('Tem certeza que deseja descartar esse problema?')) {
							this.props.model.destroy(); // Won't touch API, backbone knows better
							this._close();
						}
					} else {
						if (confirm('Tem certeza que deseja excluir esse problema?')) {
							this.props.model.destroy();
							this._close();
							// Signal to the wall that the post with this ID must be removed.
							// This isn't automatic (as in deleting comments) because the models on
							// the wall aren't the same as those on post FullPostView.
							console.log('id being removed:',this.props.model.get('id'))
							app.streamItems.remove({id:this.props.model.get('id')})
						}
					}
				}.bind(this),
		};

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
			<div className="qi-box">
				<i className="close-btn icon-clear" data-action="close-page" onClick={this.close}></i>

				<div className="form-wrapper">
					<div className="sideBtns">
						<Toolbar.SendBtn cb={events.clickSend} />
						<Toolbar.PreviewBtn cb={this.preview} />
						{
							this.props.isNew?
							<Toolbar.CancelPostBtn cb={events.clickTrash} />
							:<Toolbar.RemoveBtn cb={events.clickTrash} />
						}
						<Toolbar.HelpBtn />
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
								<i className="icon-group-work"
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
								type="text" defaultValue={doc.problems}
								placeholder="Ids dos problemas, separados por vírgulas"
							/>
						</li>
					</ul>
				</div>
			</div>
		);
	},
});

module.exports.Create = function (data) {
	var postModel = new models.ProblemSet;
	return (
		<ProblemSetEdit model={postModel} page={data.page} isNew={true} />
	)
};
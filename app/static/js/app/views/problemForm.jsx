
var $ = require('jquery')
var _ = require('lodash')
var React = require('react')
var selectize = require('selectize')

var models = require('../components/models.js')
var Toolbar = require('./parts/toolbar.jsx')
var Modal = require('../components/dialog.jsx')
// var Mixins = require('./parts/mixins.js')

//

var ProblemEdit = React.createClass({
	propTypes: {
		model: React.PropTypes.any.isRequired,
		page: React.PropTypes.any.isRequired,
	},
	//
	getInitialState: function () {
		return {
			answerIsMC: this.props.model.get('answer').is_mc,
			subject: this.props.model.get('subject'),
		};
	},
	//
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

		// Prevent newlines in title
		$(this.refs.postTitle.getDOMNode()).on('input keyup keypress', function (e) {
			if ((e.keyCode || e.charCode) == 13) {
				e.preventDefault();
				e.stopPropagation();
				return;
			}
		}.bind(this));

		var converter = {
			makeHtml: function (txt) {
				return app.utils.renderMarkdown(txt);
			}
		}

		// Set state on subject change, so that topics are changed accordingly.
		$(this.refs.subjectSelect.getDOMNode()).on('change', function (e) {
			this.setState({ subject: this.refs.subjectSelect.getDOMNode().value })
		}.bind(this))

		this.pdeditor = new Markdown.Editor(converter);
		this.pdeditor.run();

		// Let textareas autoadjust
		_.defer(function () {
			app.utils.refreshLatex();
			$(this.refs.postTitle.getDOMNode()).autosize();
			$(this.refs.postBody.getDOMNode()).autosize();
		}.bind(this));
		//
		$('body').addClass('crop');
	},
	componentWillUnmount: function () {
		$(this.refs.postTitle.getDOMNode()).trigger('autosize.destroy');
		$('body').removeClass('crop');
		$('.tooltip').remove(); // fuckin bug
	},
	//
	onClickSend: function () {
		this.send();
	},
	onClickTrash: function () {
		if (this.props.isNew) {
			if (confirm('Tem certeza que deseja descartar esse problema?')) {
				this.props.model.destroy(); // Won't touch API, backbone knows better
				this.close();
			}
		} else {
			if (confirm('Tem certeza que deseja excluir esse postagem?')) {
				this.props.model.destroy();
				this.close();
				// Signal to the wall that the post with this ID must be removed.
				// This isn't automatic (as in deleting comments) because the models on
				// the wall aren't the same as those on post FullPostView.
				console.log('id being removed:',this.props.model.get('id'))
				app.postList.remove({id:this.props.model.get('id')})
			}
		}
	},
	//
	onClickMCChoice: function () {
		var selection = this.refs.multipleChoiceSelection.getDOMNode();
		var selected = $(selection).find('label.btn.active')[0];
		if (selected.dataset.value == 'yes') {
			this.setState({ answerIsMC: true });
		} else {
			this.setState({ answerIsMC: false });
		}
	},
	preview: function () {
	// Show a preview of the rendered markdown text.
		var html = app.utils.renderMarkdown(this.refs.postBody.getDOMNode().value)
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
		Modal(<Preview />, "preview", function () {
			app.utils.refreshLatex();
		});
	},
	send: function () {
		this.props.model.attributes.content.body = this.refs.postBody.getDOMNode().value;
		this.props.model.attributes.content.source = this.refs.postSource.getDOMNode().value;
		this.props.model.attributes.content.title = this.refs.postTitle.getDOMNode().value;
		this.props.model.attributes.topic = this.refs.topicSelect.getDOMNode().value;
		this.props.model.attributes.level = parseInt(this.refs.levelSelect.getDOMNode().value);
		this.props.model.attributes.subject = this.refs.subjectSelect.getDOMNode().value;

		if (this.props.model.get('topic') === 'false')
			this.props.model.attributes.topic = null;

		if (this.state.answerIsMC) {
			var options = [];
			$(this.refs.mcPool.getDOMNode()).find('input').each(function () {
				options.push(this.value);
			});
			this.props.model.attributes.answer = {
				is_mc: true,
				options: options,
			};
		} else {
			this.props.model.attributes.answer = {
				is_mc: false,
				value: this.refs['right-ans'].getDOMNode().value,
			};
		}

		this.props.model.save(undefined, {
			url: this.props.model.url() || '/api/problems',
			success: function (model) {
				window.location.href = model.get('path');
				app.flash.info("Problema salvo.");
			},
			error: function (model, xhr, options) {
				var data = xhr.responseJSON;
				if (data && data.message) {
					app.flash.alert(data.message);
				} else {
					app.flash.alert('Friedman... Milton Friedman.');
				}
			}
		});
	},
	close: function () {
		this.props.page.destroy();
	},
	//
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
						<Toolbar.SendBtn cb={this.onClickSend} />
						<Toolbar.PreviewBtn cb={this.preview} />
						{
							this.props.isNew?
							<Toolbar.CancelPostBtn cb={this.onClickTrash} />
							:<Toolbar.RemoveBtn cb={this.onClickTrash} />
						}
						<Toolbar.HelpBtn />
					</div>

					<header>
						<div className="icon">
							<i className="icon-extension"></i>
						</div>
						<div className="label">
							Criar Novo Problema
						</div>
					</header>

					<ul className="inputs">
						<li className="title">
							<textarea ref="postTitle" name="post_title"
								placeholder="Título para o seu problema"
								defaultValue={doc.content.title}>
							</textarea>
						</li>

						<li className="selects">
							<div className="select-wrapper lab-select-wrapper ">
								<i className="icon-group-work"
								data-toggle={this.props.isNew?"tooltip":null} data-placement="left" data-container="body"
								title="Selecione um laboratório."></i>
								<select ref="subjectSelect"
									defaultValue={doc.subject}
									onChange={this.onChangeLab}>
									<option value="false">Matéria</option>
									{subjectOptions}
								</select>
							</div>
							<div className="select-wrapper level-select-wrapper " disabled={!this.props.isNew}>
								<select ref="levelSelect" defaultValue={doc.level}>
									<option value="false">Dificuldade</option>
									<option value="1">Nível 1</option>
									<option value="2">Nível 2</option>
									<option value="3">Nível 3</option>
									<option value="4">Nível 4</option>
									<option value="5">Nível 5</option>
								</select>
							</div>
							<div className="select-wrapper topic-select-wrapper " disabled={!this.props.isNew}>
								<select ref="topicSelect" disabled={!this.state.subject} defaultvalue={doc.topic}>
									<option value="false">Subtópico</option>
									{TopicOptions}
								</select>
							</div>
						</li>

						<li className="source">
							<input type="text" ref="postSource" name="post_source"
								placeholder="Cite a fonte desse problema (opcional)"
								defaultValue={doc.content.source}/>
						</li>

						<li className="body">
							<div className="pagedown-button-bar" id="wmd-button-bar"></div>
							<textarea ref="postBody" id="wmd-input"
								placeholder="Descreva o problema usando markdown e latex com ` x+3 `."
								data-placeholder="Escreva o seu problema aqui."
								defaultValue={ doc.content.body }></textarea>
						</li>
					</ul>

					<section className="options">
						<div className="left">
						</div>
						<div className="right">
							<div className="group check-btns">
								<label>Múltipla Escolha</label>
								<div className="btn-group" data-toggle="buttons" ref="multipleChoiceSelection">
									<label
										className={"btn btn-primary "+(this.state.answerIsMC?"active":"")}
										data-value="yes"
										onClick={this.onClickMCChoice}>
										<input type="radio" name="options" onChange={function(){}} checked /> Sim
									</label>
									<label
										className={"btn btn-primary "+(this.state.answerIsMC?"":"active")}
										data-value="no"
										onClick={this.onClickMCChoice}>
										<input type="radio" name="options" onChange={function(){}} /> Não
									</label>
								</div>
							</div>
							<div className="tab" style={ (this.state.answerIsMC)?{ display: "none" }:{} }>
								<div className="group answer-input">
									<input className="single-ans" ref="right-ans" type="text"
										defaultValue={doc.answer.value}
										placeholder="A resposta certa" />
									<select ref="unitySelect" defaultValue={doc.answer.unity}>
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
											_.map(doc.answer.mc_options || ['','','','',''], function (value, index) {
												if (index == 0)
													return (
														<input className="right-ans" type="text"
															defaultValue={value}
															placeholder="A resposta certa" />
													)
												else
													return (
														<input className="wrong-ans" type="text"
															defaultValue={value}
															placeholder="Uma opção incorreta" />
													)
											})
										}
									</ul>
								</div>
							</div>
						</div>
					</section>
				</div>
			</div>
		);
	},
});

var ProblemCreate = function (data) {
	var postModel = new models.Problem({
		author: window.user,
		answer: {
			is_mc: true,
		},
		content: {
			title: '',
			body: '',
		},
	});
	return (
		<ProblemEdit model={postModel} page={data.page} isNew={true} />
	)
};

module.exports = {
	create: ProblemCreate,
	edit: ProblemEdit,
};
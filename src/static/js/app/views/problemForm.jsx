/** @jsx React.DOM */

var $ = require('jquery')
var _ = require('lodash')
var React = require('react')
var selectize = require('selectize')

var models = require('../components/models.js')
var toolbar = require('./parts/toolbar.jsx')
var Modal = require('./parts/dialog.jsx')
var marked = require('marked');
var TagBox = require('./parts/tagBox.jsx')

var renderer = new marked.Renderer();
renderer.codespan = function (html) { // Ignore codespans in md (they're actually 'latex')
	return '`'+html+'`';
}

function refreshLatex () {
	setTimeout(function () {
		if (window.MathJax)
			MathJax.Hub.Queue(["Typeset",MathJax.Hub]);
		else
			console.warn("MathJax object not found.");
	}, 10);
}

marked.setOptions({
	renderer: renderer,
	gfm: false,
	tables: false,
	breaks: false,
	pedantic: false,
	sanitize: true,
	smartLists: true,
	smartypants: true,
})

//

var ProblemEdit = React.createClass({
	propTypes: {
		model: React.PropTypes.any.isRequired,
		page: React.PropTypes.any.isRequired,
	},
	//
	getInitialState: function () {
		console.log(this.props.model.attributes)
		return {
			answerIsMC: this.props.model.get('answer').is_mc
		};
	},
	//
	componentDidMount: function () {
		// Close when user clicks directly on element (meaning the faded black background)
		$(this.getDOMNode().parentElement).on('click', function onClickOut (e) {
			if (e.target === this || e.target === this.getDOMNode()) {
				if (confirm("Deseja descartar permanentemente as suas alterações?")) {
					this.close();
				}
				$(this).unbind('click', onClickOut);
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
				return marked(txt);
			}
		}

		this.pdeditor = new Markdown.Editor(converter);
		this.pdeditor.run();

		// Let textareas autoadjust
		_.defer(function () {
			refreshLatex();
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
		var html = marked(this.refs.postBody.getDOMNode().value)
		var Preview = React.createClass({
			render: function () {
				return (
					<div>
						<span className="content" dangerouslySetInnerHTML={{__html: html }}></span>
						<small>
							(clique fora da caixa para sair)
						</small>
					</div>
				)
			}
		});
		Modal(<Preview />, "preview", function () {
			refreshLatex();
		});
	},
	send: function () {
		this.props.model.attributes.content.body = this.refs.postBody.getDOMNode().value;
		this.props.model.attributes.content.source = this.refs.postSource.getDOMNode().value;
		this.props.model.attributes.content.title = this.refs.postTitle.getDOMNode().value;
		this.props.model.attributes.topic = this.refs.topicSelect.getDOMNode().value;
		this.props.model.attributes.level = parseInt(this.refs.levelSelect.getDOMNode().value);

		if (this.state.answerIsMC) {
			this.props.model.attributes.answer = {
				is_mc: true,
				options: [
					parseInt(this.refs['right-option'].getDOMNode().value),
					parseInt(this.refs['wrong-option1'].getDOMNode().value),
					parseInt(this.refs['wrong-option2'].getDOMNode().value),
					parseInt(this.refs['wrong-option3'].getDOMNode().value),
					parseInt(this.refs['wrong-option4'].getDOMNode().value),
				]
			};
		} else {
			this.props.model.attributes.answer = {
				is_mc: false,
				value: parseInt(this.refs['right-ans'].getDOMNode().value),
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

		var problemsMap = _.filter(pageMap, function (obj, key) {
			return obj.hasProblems;
		})

		var labOptions = _.map(_.map(problemsMap, function (obj, key) {
			return {
				id: key,
				name: obj.name,
				detail: obj.detail,
			};
		}), function (a, b) {
				return (
					<option value={a.id} key={a.id}>{a.name}</option>
				);
			});

		return (
			<div className="qi-box">
				<i className="close-btn icon-clear" data-action="close-page" onClick={this.close}></i>

				<div className="form-wrapper">
					<div className="sideBtns">
						{toolbar.SendBtn({cb: this.onClickSend}) }
						{toolbar.PreviewBtn({cb: this.preview}) }
						{
							this.props.isNew?
							toolbar.CancelPostBtn({cb: this.onClickTrash })
							:toolbar.RemoveBtn({cb: this.onClickTrash })
						}
						{toolbar.HelpBtn({}) }
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
							<div className="select-wrapper lab-select-wrapper " disabled={!this.props.isNew}>
								<i className="icon-group-work"
								data-toggle={this.props.isNew?"tooltip":null} data-placement="left" data-container="body"
								title="Selecione um laboratório."></i>
								<select ref="labSelect"
									defaultValue={doc.lab}
									disabled={!this.props.isNew}
									onChange={this.onChangeLab}>
									{labOptions}
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
								<select ref="topicSelect" defaultvalue={doc.topic}>
									<option value="false">Tópico</option>
									<option value="algebra">Algebra</option>
									<option value="combinatorics">combinatória</option>
									<option value="geometry">geometria</option>
									<option value="number-theory">teoria dos números</option>
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
								data-placeholder="Escreva o seu texto aqui. Selecione partes dele para formatar."
								defaultValue={ doc.content.body }></textarea>
						</li>

						<div id="wmd-preview" className="wmd-panel wmd-preview"></div>
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
								</div>
							</div>
							<div className="tab" style={ (this.state.answerIsMC)?{}:{ display: "none" } }>
								<div className="group answer-input">
									<ul>
										<input className="right-ans" ref="right-option" type="text"
											defaultValue={doc.answer.options && doc.answer.options[0]}
											placeholder="A resposta certa" />
										<input className="wrong-ans" ref="wrong-option1" type="text"
											defaultValue={doc.answer.options && doc.answer.options[1]}
											placeholder="Uma opção incorreta" />
										<input className="wrong-ans" ref="wrong-option2" type="text"
											defaultValue={doc.answer.options && doc.answer.options[2]}
											placeholder="Uma opção incorreta" />
										<input className="wrong-ans" ref="wrong-option3" type="text"
											defaultValue={doc.answer.options && doc.answer.options[3]}
											placeholder="Uma opção incorreta" />
										<input className="wrong-ans" ref="wrong-option4" type="text"
											defaultValue={doc.answer.options && doc.answer.options[4]}
											placeholder="Uma opção incorreta" />
									</ul>
								</div>
							</div>
						</div>
					</section>
				</div>
			</div>
		);
							// <div className="group">
							// 	<label>Tópico</label>
							// 	<select ref="topic" classname="form-control topic" defaultvalue={doc.topic}>
							// 		<option value="algebra">álgebra</option>
							// 		<option value="combinatorics">combinatória</option>
							// 		<option value="geometry">geometria</option>
							// 		<option value="number-theory">teoria dos números</option>
							// 	</select>
							// </div>
							// <div className="group">
							// 	<label>Dificuldade</label>
							// </div>
	},
});

var ProblemCreate = function (data) {
	var postModel = new models.problemItem({
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
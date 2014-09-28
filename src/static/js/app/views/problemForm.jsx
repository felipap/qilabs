/** @jsx React.DOM */

var $ = require('jquery')
var _ = require('lodash')
var React = require('react')
var selectize = require('selectize')

var models = require('../components/models.js')
var toolbar = require('./parts/toolbar.js')
var modal = require('./parts/modal.js')
var marked = require('marked');

var renderer = new marked.Renderer();
renderer.codespan = function (html) { // Ignore codespans in md (they're actually 'latex')
	return '`'+html+'`';
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

		// Let textareas autoadjust
		_.defer(function () {
			MathJax.Hub.Queue(["Typeset",MathJax.Hub]);
			$(this.refs.postTitle.getDOMNode()).autosize();
			$(this.refs.postBody.getDOMNode()).autosize();
		}.bind(this));
		//
		$('body').addClass('crop');
	},
	componentWillUnmount: function () {
		$(this.refs.postTitle.getDOMNode()).trigger('autosize.destroy');
		$('body').removeClass('crop');
	},
	//
	onClickSend: function () {
		this.send();
	},
	onClickTrash: function () {
		console.log("onCLickTrash")
		if (confirm('Tem certeza que deseja excluir essa postagem?')) {
			this.props.model.destroy();
			this.close();
			// Signal to the wall that the post with this ID must be removed.
			// This isn't automatic (as in deleting comments) because the models on
			// the wall aren't the same as those on post FullPostView.
			console.log('id being removed:',this.props.model.get('id'))
			app.postList.remove({id:this.props.model.get('id')})
			$('.tooltip').remove(); // fuckin bug
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
		modal(<Preview />, "preview", function () {
			MathJax.Hub.Queue(["Typeset",MathJax.Hub]);
		});
	},
	send: function () {
		this.props.model.attributes.content.body = this.refs.postBody.getDOMNode().value;
		this.props.model.attributes.content.source = this.refs.postSource.getDOMNode().value;
		this.props.model.attributes.content.title = this.refs.postTitle.getDOMNode().value;
		this.props.model.attributes.topic = this.refs.topic.getDOMNode().value;
		this.props.model.attributes.level = parseInt(this.refs.levelSelect.getDOMNode().value);

		if (this.state.answerIsMC) {
			this.props.model.attributes.answer = {
				is_mc: true,
				options: [
					this.refs['right-option'].getDOMNode().value,
					this.refs['wrong-option1'].getDOMNode().value,
					this.refs['wrong-option2'].getDOMNode().value,
					this.refs['wrong-option3'].getDOMNode().value,
					this.refs['wrong-option4'].getDOMNode().value,
				]
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
		return (
			<div className="postBox">
				<i className="close-btn" data-action="close-page" onClick={this.close}></i>
				<div className="form-wrapper">
					<div className="form-side-btns">
						{toolbar.SendBtn({cb: this.onClickSend}) }
						{toolbar.PreviewBtn({cb: this.preview}) }
						{toolbar.RemoveBtn({cb: this.onClickTrash}) }
						{toolbar.HelpBtn({}) }
					</div>

					<header>
						<div className="icon">
							<i className="icon-measure"></i>
						</div>
						<div className="label">
							Criar Novo Problema
						</div>
					</header>

					<section className="textInputs">
						<textarea ref="postTitle" className="title" name="post_title"
							placeholder="Título para o seu problema"
							defaultValue={doc.content.title}>
						</textarea>
						<div className="bodyWrapper" ref="postBodyWrapper">
							<textarea className="body" ref="postBody"
								placeholder="Descreva o problema usando markdown e latex com ` x+3 `."
								defaultValue={ doc.content.body }></textarea>
						</div>
						<input type="text" ref="postSource" className="source" name="post_source"
							placeholder="Cite a fonte desse problema (opcional)"
							defaultValue={doc.content.source}/>
					</section>

					<section className="options">
						<div className="left">
							<div className="group">
								<label>Tópico</label>
								<select ref="topic" className="form-control topic" defaultValue={doc.topic}>
									<option value="algebra">Álgebra</option>
									<option value="combinatorics">Combinatória</option>
									<option value="geometry">Geometria</option>
									<option value="number-theory">Teoria dos Números</option>
								</select>
							</div>
							<div className="group">
								<label>Dificuldade</label>
								<select ref="levelSelect" className="form-control levelSelect" defaultValue={doc.level}>
									<option value="1">Nível 1</option>
									<option value="2">Nível 2</option>
									<option value="3">Nível 3</option>
								</select>
							</div>
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
	},
});

var ProblemCreate = React.createClass({
	render: function () {
		this.postModel = new models.problemItem({
			author: window.user,
			content: {
				title: '',
				body: '',
			},
		});
		return <ProblemEdit ref="postForm" model={this.postModel} page={this.props.page} />
	},
});


module.exports = {
	create: ProblemCreate,
	edit: ProblemEdit,
};
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

var ProblemEdit = React.createClass({displayName: 'ProblemEdit',
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
		var Preview = React.createClass({displayName: 'Preview',
			render: function () {
				return (
					React.DOM.div(null, 
						React.DOM.span( {className:"content", dangerouslySetInnerHTML:{__html: html }}),
						React.DOM.small(null, 
							"(clique fora da caixa para sair)"
						)
					)
				)
			}
		});
		modal(Preview(null ), "preview", function () {
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
			React.DOM.div( {className:"postBox"}, 
				React.DOM.i( {className:"close-btn", 'data-action':"close-page", onClick:this.close}),
				React.DOM.div( {className:"form-wrapper"}, 
					React.DOM.div( {className:"form-side-btns"}, 
						toolbar.SendBtn({cb: this.onClickSend}), 
						toolbar.PreviewBtn({cb: this.preview}), 
						toolbar.RemoveBtn({cb: this.onClickTrash}), 
						toolbar.HelpBtn({}) 
					),

					React.DOM.header(null, 
						React.DOM.div( {className:"icon"}, 
							React.DOM.i( {className:"icon-measure"})
						),
						React.DOM.div( {className:"label"}, 
							"Criar Novo Problema"
						)
					),

					React.DOM.section( {className:"textInputs"}, 
						React.DOM.textarea( {ref:"postTitle", className:"title", name:"post_title",
							placeholder:"Título para o seu problema",
							defaultValue:doc.content.title}
						),
						React.DOM.div( {className:"bodyWrapper", ref:"postBodyWrapper"}, 
							React.DOM.textarea( {className:"body", ref:"postBody",
								placeholder:"Descreva o problema usando markdown e latex com ` x+3 `.",
								defaultValue: doc.content.body })
						),
						React.DOM.input( {type:"text", ref:"postSource", className:"source", name:"post_source",
							placeholder:"Cite a fonte desse problema (opcional)",
							defaultValue:doc.content.source})
					),

					React.DOM.section( {className:"options"}, 
						React.DOM.div( {className:"left"}, 
							React.DOM.div( {className:"group"}, 
								React.DOM.label(null, "Tópico"),
								React.DOM.select( {ref:"topic", className:"form-control topic", defaultValue:doc.topic}, 
									React.DOM.option( {value:"algebra"}, "Álgebra"),
									React.DOM.option( {value:"combinatorics"}, "Combinatória"),
									React.DOM.option( {value:"geometry"}, "Geometria"),
									React.DOM.option( {value:"number-theory"}, "Teoria dos Números")
								)
							),
							React.DOM.div( {className:"group"}, 
								React.DOM.label(null, "Dificuldade"),
								React.DOM.select( {ref:"levelSelect", className:"form-control levelSelect", defaultValue:doc.level}, 
									React.DOM.option( {value:"1"}, "Nível 1"),
									React.DOM.option( {value:"2"}, "Nível 2"),
									React.DOM.option( {value:"3"}, "Nível 3")
								)
							)
						),
						React.DOM.div( {className:"right"}, 
							React.DOM.div( {className:"group check-btns"}, 
								React.DOM.label(null, "Múltipla Escolha"),
								React.DOM.div( {className:"btn-group", 'data-toggle':"buttons", ref:"multipleChoiceSelection"}, 
									React.DOM.label(
										{className:"btn btn-primary "+(this.state.answerIsMC?"active":""),
										'data-value':"yes",
										onClick:this.onClickMCChoice}, 
										React.DOM.input( {type:"radio", name:"options", onChange:function(){}, checked:true} ), " Sim"
									),
									React.DOM.label(
										{className:"btn btn-primary "+(this.state.answerIsMC?"":"active"),
										'data-value':"no",
										onClick:this.onClickMCChoice}, 
										React.DOM.input( {type:"radio", name:"options", onChange:function(){}} ), " Não"
									)
								)
							),
							React.DOM.div( {className:"tab", style: (this.state.answerIsMC)?{ display: "none" }:{} }, 
								React.DOM.div( {className:"group answer-input"}, 
									React.DOM.input( {className:"single-ans", ref:"right-ans", type:"text",
										defaultValue:doc.answer.value,
										placeholder:"A resposta certa"} )
								)
							),
							React.DOM.div( {className:"tab", style: (this.state.answerIsMC)?{}:{ display: "none" } }, 
								React.DOM.div( {className:"group answer-input"}, 
									React.DOM.ul(null, 
										React.DOM.input( {className:"right-ans", ref:"right-option", type:"text",
											defaultValue:doc.answer.options && doc.answer.options[0],
											placeholder:"A resposta certa"} ),
										React.DOM.input( {className:"wrong-ans", ref:"wrong-option1", type:"text",
											defaultValue:doc.answer.options && doc.answer.options[1],
											placeholder:"Uma opção incorreta"} ),
										React.DOM.input( {className:"wrong-ans", ref:"wrong-option2", type:"text",
											defaultValue:doc.answer.options && doc.answer.options[2],
											placeholder:"Uma opção incorreta"} ),
										React.DOM.input( {className:"wrong-ans", ref:"wrong-option3", type:"text",
											defaultValue:doc.answer.options && doc.answer.options[3],
											placeholder:"Uma opção incorreta"} ),
										React.DOM.input( {className:"wrong-ans", ref:"wrong-option4", type:"text",
											defaultValue:doc.answer.options && doc.answer.options[4],
											placeholder:"Uma opção incorreta"} )
									)
								)
							)
						)
					)
				)
			)
		);
	},
});

var ProblemCreate = React.createClass({displayName: 'ProblemCreate',
	render: function () {
		this.postModel = new models.problemItem({
			author: window.user,
			content: {
				title: '',
				body: '',
			},
		});
		return ProblemEdit( {ref:"postForm", model:this.postModel, page:this.props.page} )
	},
});


module.exports = {
	create: ProblemCreate,
	edit: ProblemEdit,
};
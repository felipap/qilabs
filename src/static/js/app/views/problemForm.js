/** @jsx React.DOM */

var $ = require('jquery')
var _ = require('lodash')
var React = require('react')
var selectize = require('selectize')

var models = require('../components/models.js')
var marked = require('marked');

var renderer = new marked.Renderer();
renderer.codespan = function (html) {
	// Don't consider codespans in markdown (they're actually 'latex')
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
	},
	getInitialState: function () {
		return { answerIsMC: true };
	},
	componentDidMount: function () {
		_.defer(function () {
			$(this.refs.sendBtn.getDOMNode()).tooltip('show');
			setTimeout(function () {
				$(this.refs.sendBtn.getDOMNode()).tooltip('hide');
			}.bind(this), 2000);
		}.bind(this));

		// Close when user clicks directly on element (meaning the faded black background)
		$(this.getDOMNode().parentElement).on('click', function onClickOut (e) {
			if (e.target === this || e.target === this.getDOMNode()) {
				this.close();
				$(this).unbind('click', onClickOut);
			}
		}.bind(this));

		var postTitle = this.refs.postTitle.getDOMNode();
		// Don't allow newlines
		$(postTitle).on('input keyup keypress', function (e) {
			if ((e.keyCode || e.charCode) == 13) {
				e.preventDefault();
				e.stopPropagation();
				return;
			}
		}.bind(this));
		// Let postTitle autoadjust
		_.defer(function () {
			$(postTitle).autosize();
		});
	},

	//
	componentWillMount: function () {
		$('body').addClass('crop');
	},
	componentWillUnmount: function () {
		$(this.refs.postTitle.getDOMNode()).trigger('autosize.destroy');
		$('body').removeClass('crop');
	},

	//
	onClickSend: function () {
		this.props.model.attributes.content.body = this.refs.postBody.getDOMNode().value;
		this.props.model.attributes.content.source = this.refs.postSource.getDOMNode().value;
		this.props.model.attributes.content.title = this.refs.postTitle.getDOMNode().value;

		if (this.state.answerIsMC) {
			this.props.model.attributes.answer = {
				is_mc: true,
				options: [
					this.refs['right-ans'].getDOMNode().value,
					this.refs['wrong-ans1'].getDOMNode().value,
					this.refs['wrong-ans2'].getDOMNode().value,
					this.refs['wrong-ans3'].getDOMNode().value,
					this.refs['wrong-ans4'].getDOMNode().value,
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
				app.flash.info("Publicação salva! :)");
			},
			error: function (model, xhr, options) {
				var data = xhr.responseJSON;
				if (data && data.message) {
					app.flash.alert(data.message);
				} else {
					app.flash.alert('Milton Friedman.');
				}
			}
		});
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
	},
	close: function () {
		// This check is ugly.
		if ($(this.refs.postBody).text()) {
			if (!confirm("Deseja descartar permanentemente as suas alterações?"))
				return;
		}
		this.props.page.destroy();
	},

	//
	render: function () {
		return (
			React.DOM.div( {className:"postBox"}, 
				React.DOM.i( {className:"close-btn", 'data-action':"close-page", onClick:this.close}),
				React.DOM.div( {className:"form-wrapper"}, 
					React.DOM.div( {className:"form-side-btns"}, 
						React.DOM.div( {className:"item send", ref:"sendBtn", onClick:this.onClickSend, 'data-toggle':"tooltip", title:"Enviar Problema", 'data-placement':"right"}, 
							React.DOM.i( {className:"icon-paper-plane"})
						),
						React.DOM.div( {className:"item preview", 'data-toggle':"tooltip", title:"Visualizar", onClick:this.preview, 'data-placement':"right"}, 
							React.DOM.i( {className:"icon-eye2"})
						),
						React.DOM.div( {className:"item help", 'data-toggle':"tooltip", title:"Ajuda?", onClick:function () { $('#srry').fadeIn()},  'data-placement':"right"}, 
							React.DOM.i( {className:"icon-question"})
						)
					),

					React.DOM.header(null, 
						React.DOM.div( {className:"icon"}, 
							React.DOM.i( {className:"icon-measure"})
						),
						React.DOM.div( {className:"label"}, 
							"Novo Problema"
						),
						React.DOM.ul( {className:"right"})
					),

					React.DOM.section( {className:"textInputs"}, 
						React.DOM.textarea( {ref:"postTitle", className:"title", name:"post_title", placeholder:"Título para o seu problema", defaultValue:this.props.model.get('content').title}
						),
						React.DOM.div( {className:"bodyWrapper", ref:"postBodyWrapper"}, 
							React.DOM.textarea( {className:"body", ref:"postBody",
								placeholder:"Descreva o problema usando markdown e latex com ` x+3 `.",
								defaultValue: this.props.model.get('content').body })
						),
						React.DOM.input( {type:"text", ref:"postSource", className:"source", name:"post_source", placeholder:"Cite a fonte desse problema (opcional)", defaultValue:this.props.model.get('content').source})
					),

					React.DOM.section( {className:"options"}, 
						React.DOM.div( {className:"left"}, 
							React.DOM.div( {className:"group"}, 
								React.DOM.label(null, "Tópico"),
								React.DOM.select( {ref:"typeSelect", className:"form-control typeSelect"}, 
									React.DOM.option( {value:"algebra"}, "Álgebra"),
									React.DOM.option( {value:"combinatorics"}, "Combinatória"),
									React.DOM.option( {value:"geometry"}, "Geometria"),
									React.DOM.option( {value:"number-theory"}, "Teoria dos Números")
								)
							),
							React.DOM.div( {className:"group"}, 
								React.DOM.label(null, "Dificuldade"),
								React.DOM.select( {ref:"typeSelect", className:"form-control typeSelect"}, 
									React.DOM.option( {value:"n-1"}, "Nível 1"),
									React.DOM.option( {value:"n-2"}, "Nível 2"),
									React.DOM.option( {value:"n-3"}, "Nível 3")
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
									React.DOM.input( {className:"single-ans", ref:"right-ans", type:"text", placeholder:"A resposta certa"} )
								)
							),
							React.DOM.div( {className:"tab", style: (this.state.answerIsMC)?{}:{ display: "none" } }, 
								React.DOM.div( {className:"group answer-input"}, 
									React.DOM.ul(null, 
										React.DOM.input( {className:"right-ans", ref:"right-ans", type:"text", placeholder:"A resposta certa"} ),
										React.DOM.input( {className:"wrong-ans", ref:"wrong-ans1", type:"text", placeholder:"Uma opção incorreta"} ),
										React.DOM.input( {className:"wrong-ans", ref:"wrong-ans2", type:"text", placeholder:"Uma opção incorreta"} ),
										React.DOM.input( {className:"wrong-ans", ref:"wrong-ans3", type:"text", placeholder:"Uma opção incorreta"} ),
										React.DOM.input( {className:"wrong-ans", ref:"wrong-ans4", type:"text", placeholder:"Uma opção incorreta"} )
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
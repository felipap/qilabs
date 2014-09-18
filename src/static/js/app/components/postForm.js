/** @jsx React.DOM */

/*
** postForms.jsx
** Copyright QiLabs.org
** BSD License
*/

var $ = require('jquery')
var Backbone = require('backbone')
var _ = require('lodash')
var models = require('./models.js')
var React = require('react')
var MediumEditor = require('medium-editor')
require('typeahead-bundle')

var mediumEditorPostOpts = {
	firstHeader: 'h1',
	secondHeader: 'h2',
	buttons: ['bold', 'italic', 'underline', 'header1', 'header2', 'quote', 'anchor', 'orderedlist'],
	buttonLabels: {
		quote: '<i class="icon-quote-left"></i>',
		orderedlist: '<i class="icon-list"></i>',
		anchor: '<i class="icon-link"></i>'
	}
};

var TagBox = React.createClass({displayName: 'TagBox',
	getInitialState: function () {
		return { selectedTagsIds: this.props.children || [] };
	},

	//////////////////////////////////////////////////////////////////////////////////////////////////////////
	//////////////////////////////////////////////////////////////////////////////////////////////////////////

	addTag: function (id) {
		if (this.state.selectedTagsIds.indexOf(id) === -1)
			this.setState({ selectedTagsIds: this.state.selectedTagsIds.concat(id) });
		if (this.props.onChangeTags)
			this.props.onChangeTags();
	},

	removeTag: function (id) {
		var index = this.state.selectedTagsIds.indexOf(id);
		if (index !== -1) {
			var selected = this.state.selectedTagsIds;
			selected.splice(index, 1);
			this.setState({ selectedTagsIds: selected });
		}
		if (this.props.onChangeTags)
			this.props.onChangeTags();
	},

	popTag: function (id) {
		var selected = this.state.selectedTagsIds;
		if (selected.length) {
			selected.pop();
			this.setState({ selectedTagsIds: selected });
		}
		if (this.props.onChangeTags)
			this.props.onChangeTags();
	},

	getSelectedTagsIds: function () {
		return this.state.selectedTagsIds;
	},

	//////////////////////////////////////////////////////////////////////////////////////////////////////////
	//////////////////////////////////////////////////////////////////////////////////////////////////////////

	componentWillMount: function () {
		var subject = this.props.subject;
		if (pageMap[subject]) {
			var tags = pageMap[subject].children || {};
			for (var child in tags) if (tags.hasOwnProperty(child))
				tags[child].id = child;
		}
		this.props.data = _.toArray(tags);
	},

	setTagStates: function () {
		console.log(this.props.data)
		var tagStates = new Bloodhound({
			datumTokenizer: Bloodhound.tokenizers.obj.whitespace('name'),
			queryTokenizer: Bloodhound.tokenizers.whitespace,
			local: this.props.data,
		});

		tagStates.initialize();
		$(this.refs.input.getDOMNode()).typeahead({
			highlight: true,
			hint: true,
		}, {
			name: 'tag',
			source: tagStates.ttAdapter(),
			templates: {
				empty: [
					'<div class="empty-message">Tag não encontrada</div>'
				].join('\n'),
				suggestion: _.template('<div><label><%= name %></label><div class="detail"></div></div>'),
			}
		});
	},

	componentDidUpdate: function () {
		var subject = this.props.subject;
		if (pageMap[subject]) {
			var tags = pageMap[subject].children || {};
			for (var child in tags) if (tags.hasOwnProperty(child))
				tags[child].id = child;
		}
		this.props.data = _.toArray(tags);
		$(this.refs.input.getDOMNode()).typeahead('destroy');
		console.log('update')
		this.setTagStates();
	},

	componentDidMount: function () {
		this.setTagStates();
		var self = this;
		$(this.getDOMNode()).on('click focusin focus', function () {
			$(self.getDOMNode()).addClass('focused');
			$('#tagInput').focus();
			$(self.getDOMNode()).find(".placeholder").hide();
		});
		$(this.refs.input.getDOMNode())
			.on('focusout', function () {
				$('#tagSelectionBox').removeClass('focused');
				_.defer(function () {
					$(self.refs.input.getDOMNode()).val(''); // .prop('placeholder','Tags');
				});
			})
			.on('keydown', function (e) {
				var key = e.keyCode || e.charCode;
				if (key == 8 && e.target.value.match(/^\s*$/)) { // delete on backspace
					self.popTag();
				}
			});
		var self = this;
		$(this.refs.input.getDOMNode()).on('typeahead:selected', function (evt, obj) {
			self.addTag(obj.id);
		});
	},
	render: function () {
		var self = this;

		var tags = _.map(this.state.selectedTagsIds, function (tagId) {
			var found = _.findWhere(this.props.data, { id: tagId });
			if (!found)
				return null;
			return (
				React.DOM.li( {className:"tag", key:tagId}, 
					React.DOM.span(null, 
						found.name
					),
					React.DOM.span( {onClick:function(){self.removeTag(tagId)}}, React.DOM.i( {className:"close-btn"}))
				)
			);
		}.bind(this));
		return (
			React.DOM.div( {className:tags.length?'':' empty ', id:"tagSelectionBox"}, 
				React.DOM.i( {className:"etiqueta icon-tags"}),
				React.DOM.ul(null, 
					tags.length?
					tags
					:(
						React.DOM.div( {className:"placeholder"},  this.props.placeholder )
					)
				),
				React.DOM.input( {ref:"input", type:"text", id:"tagInput"} )
			)
		);
	},
});

//////////////////////////////////////////////////////////////////////////////////////////////////////////////
//////////////////////////////////////////////////////////////////////////////////////////////////////////////

var PostEdit = React.createClass({displayName: 'PostEdit',
	getInitialState: function () {
		return {
			placeholder: '',
			is_new: !this.props.model.get('id'),
			subjected: !!this.props.model.get('subject')
		};
	},
	componentDidMount: function () {
		var self = this;
		// Close when user clicks directly on element (meaning the faded black background)
		$(this.getDOMNode().parentElement).on('click', function onClickOut (e) {
			if (e.target === this || e.target === self.getDOMNode()) {
				self.close();
				$(this).unbind('click', onClickOut);
			}
		});
		$('body').addClass('crop');

		var postBody = this.refs.postBody.getDOMNode(),
			postTitle = this.refs.postTitle.getDOMNode();

		// Medium Editor
		// console.log('opts', mediumEditorPostOpts[this.props.model.get('type').toLowerCase()])
		this.editor = new MediumEditor(postBody, mediumEditorPostOpts);
		window.e = this.editor;
		$(postBody).mediumInsert({
			editor: this.editor,
			addons: {
				images: { // imagesUploadScript: "http://notrelative.com", formatData: function (data) {}
				}
			},
		});

		$(self.refs.postBodyWrapper.getDOMNode()).on('click', function (e) {
			if (e.target == self.refs.postBodyWrapper.getDOMNode()) {
				$(self.refs.postBody.getDOMNode()).focus();
			}
		});

		$(postTitle).on('input keyup keypress', function (e) {
			if ((e.keyCode || e.charCode) == 13) {
				e.preventDefault();
				e.stopPropagation();
				return;
			}
			var title = this.refs.postTitle.getDOMNode().value;
			this.props.model.get('content').title = title;
		}.bind(this));

		if (this.state.is_new) {
			$(this.refs.subjectSelect.getDOMNode()).on('change', function () {
				console.log(this.value)
				if (this.value == 'Discussion')
					this.setState({placeholder:'O que você quer discutir?'})
				else if (this.value == 'Note')
					this.setState({placeholder:'O que você quer contar?'})
			});
		}
		
		_.defer(function () {
			$(postTitle).autosize();
		});
	},

	componentWillUnmount: function () {
		// Destroy this.editor and unbind autosize.
		this.editor.deactivate();
		$(this.editor.anchorPreview).remove();
		$(this.editor.toolbar).remove();
		$(this.refs.postTitle.getDOMNode()).trigger('autosize.destroy');
		$('body').removeClass('crop');
	},
	onClickSend: function () {
		if (this.state.is_new) {
			this.props.model.set('type', this.refs.typeSelect.getDOMNode().value);
			this.props.model.set('subject', this.refs.subjectSelect.getDOMNode().value);
		}
		this.props.model.set('tags', this.refs.tagBox.getSelectedTagsIds());
		this.props.model.attributes.content.body = this.editor.serialize().postBody.value;

		this.props.model.save(undefined, {
			url: this.props.model.url() || '/api/posts',
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
	close: function () {
		// This check is ugly.
		if ($(this.refs.postBody.getDOMNode()).text() !== '+Img') {
			if (!confirm("Deseja descartar permanentemente as suas alterações?"))
				return;
		}
		this.props.page.destroy();
	},
	onChangeLab: function () {
		this.props.model.set('subject', this.refs.subjectSelect.getDOMNode().value);
		this.refs.tagBox.props.subject = this.refs.subjectSelect.getDOMNode().value;
		this.refs.tagBox.forceUpdate();
	},
	render: function () {
		var pageData = _.map(pageMap, function (obj, key) {
			return {
				id: key,
				name: obj.name,
				detail: obj.detail,
			};
		});

		var pagesOptions = _.map(pageData, function (a, b) {
			return (
				React.DOM.option( {value:a.id, key:a.id}, a.name)
			);
		});

		// <div className="item save" onClick="" data-toggle="tooltip" title="Salvar rascunho" data-placement="right" onClick={function () { $('#srry').fadeIn()} }>
		// 	<i className="icon-save"></i>
		// </div>

		console.log('isnew', this.state, this.props.model.get('id'))
		return (
			React.DOM.div( {className:"postBox"}, 
				React.DOM.i( {className:"close-btn", 'data-action':"close-page", onClick:this.close}),
				React.DOM.div( {className:"formWrapper"}, 
					React.DOM.div( {className:"flatBtnBox"}, 
						React.DOM.div( {className:"item send", onClick:this.onClickSend, 'data-toggle':"tooltip", title:"Enviar", 'data-placement':"right"}, 
							React.DOM.i( {className:"icon-paper-plane"})
						),
						React.DOM.div( {className:"item help", onClick:"", 'data-toggle':"tooltip", title:"Ajuda?", 'data-placement':"right", onClick:function () { $('#srry').fadeIn()} }, 
							React.DOM.i( {className:"icon-question"})
						)
					),
					React.DOM.div( {id:"formCreatePost"}, 
						React.DOM.div( {className:"selects "+(this.state.is_new?'':'disabled')}, 
							React.DOM.div( {className:""}, 
								React.DOM.span(null, "Postar uma " ),
								React.DOM.select( {disabled:this.state.is_new?false:true, ref:"typeSelect", className:"form-control typeSelect"}, 
									React.DOM.option( {value:"Discussion"}, "Discussão"),
									React.DOM.option( {value:"Note"}, "Nota")
								),
								React.DOM.span(null, "na página de"),
								React.DOM.select( {onChange:this.onChangeLab, disabled:this.state.is_new?false:true, ref:"subjectSelect", className:"form-control subjectSelect"}, 
									pagesOptions
								)
							)
						),
						
						React.DOM.textarea( {ref:"postTitle", className:"title", name:"post_title", placeholder:this.state.placeholder || "Sobre o que você quer falar?", defaultValue:this.props.model.get('content').title}
						),
						React.DOM.div( {className:"bodyWrapper", ref:"postBodyWrapper"}, 
							React.DOM.div( {id:"postBody", ref:"postBody",
								'data-placeholder':"Escreva o seu texto",
								dangerouslySetInnerHTML:{__html: (this.props.model.get('content')||{body:''}).body }})
						),
						TagBox( {ref:"tagBox", subject:this.props.model.get('subject'), placeholder:"Tags relacionadas a essa publicação"}, 
							this.props.model.get('tags')
						)
					)
				)
			)
		);
	},
});

var PostCreationView = React.createClass({displayName: 'PostCreationView',
	render: function () {
		this.postModel = new models.postItem({
			author: window.user,
			content: {
				title: '',
				body: '',
			},
		});
		return PostEdit( {ref:"postForm", model:this.postModel, page:this.props.page} )
	},
});

var ProblemEdit = React.createClass({displayName: 'ProblemEdit',
	componentDidMount: function () {
		var self = this;

		_.defer(function () {
			$(this.refs.sendBtn.getDOMNode()).tooltip('show');
			setTimeout(function () {
				$(this.refs.sendBtn.getDOMNode()).tooltip('hide');
			}.bind(this), 2000);
		}.bind(this));

		// Close when user clicks directly on element (meaning the faded black background)
		$(this.getDOMNode().parentElement).on('click', function onClickOut (e) {
			if (e.target === this || e.target === self.getDOMNode()) {
				self.close();
				$(this).unbind('click', onClickOut);
			}
		});

		$('body').addClass('crop');

		var postBody = this.refs.postBody.getDOMNode(),
			postTitle = this.refs.postTitle.getDOMNode()

		// Medium Editor
		// console.log('opts', mediumEditorPostOpts[this.props.model.get('type').toLowerCase()])
		this.editor = new MediumEditor(postBody, mediumEditorPostOpts);
		$(postBody).mediumInsert({ editor: this.editor, addons: {} });

		$(postTitle).on('input keyup keypress', function (e) {
			if ((e.keyCode || e.charCode) == 13) {
				e.preventDefault();
				e.stopPropagation();
				return;
			}
		}.bind(this));
		
		_.defer(function () {
			$(postTitle).autosize();
		});
	},

	componentWillUnmount: function () {
		// Destroy this.editor and unbind autosize.
		this.editor.deactivate();
		$(this.editor.anchorPreview).remove();
		$(this.editor.toolbar).remove();
		$(this.refs.postTitle.getDOMNode()).trigger('autosize.destroy');
		$('body').removeClass('crop');
	},
	onChangeTags: function () {
		this.props.model.set('tags', this.refs.tagSelectionBox.getSelectedTagsIds());
	},
	onClickSend: function () {
		this.props.model.attributes.content.body = this.editor.serialize().postBody.value;
		this.props.model.attributes.content.source = this.refs.postSource.getDOMNode().value;
		this.props.model.attributes.content.title = this.refs.postTitle.getDOMNode().value;
		this.props.model.attributes.content.answer = {
			is_mc: true,
			options: [
				this.refs['right-ans'].getDOMNode().value,
				this.refs['wrong-ans1'].getDOMNode().value,
				this.refs['wrong-ans2'].getDOMNode().value,
				this.refs['wrong-ans3'].getDOMNode().value,
				this.refs['wrong-ans4'].getDOMNode().value,
			]
		};

		// console.log(this.props.model.attributes.content.body)
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
	close: function () {
		// This check is ugly.
		if ($(this.refs.postBody.getDOMNode()).text() !== '+Img') {
			if (!confirm("Deseja descartar permanentemente as suas alterações?"))
				return;
		}
		this.props.page.destroy();
	},
	render: function () {
		return (
			React.DOM.div( {className:"postBox"}, 
				React.DOM.i( {className:"close-btn", 'data-action':"close-page", onClick:this.close}),

				React.DOM.div( {className:"form-wrapper"}, 
					React.DOM.div( {className:"form-side-btns"}, 
						React.DOM.div( {className:"item send", ref:"sendBtn", onClick:this.onClickSend, 'data-toggle':"tooltip", title:"Enviar Problema", 'data-placement':"right"}, 
							React.DOM.i( {className:"icon-paper-plane"})
						),
						React.DOM.div( {className:"item save", onClick:"", 'data-toggle':"tooltip", title:"Salvar rascunho", onClick:function () { $('#srry').fadeIn()},  'data-placement':"right"}, 
							React.DOM.i( {className:"icon-save"})
						),
						React.DOM.div( {className:"item help", onClick:"", 'data-toggle':"tooltip", title:"Ajuda?", onClick:function () { $('#srry').fadeIn()},  'data-placement':"right"}, 
							React.DOM.i( {className:"icon-question"})
						)
					),

					React.DOM.header(null, 
						React.DOM.i( {className:"icon-measure"}),
						React.DOM.label(null, 
							"Compartilhe um problema"
						),
						React.DOM.ul( {className:"right"})
					),
					React.DOM.section( {className:"textInputs"}, 
						React.DOM.textarea( {ref:"postTitle", className:"title", name:"post_title", placeholder:"Dê um título legal para o seu problema", defaultValue:this.props.model.get('content').title}
						),
						React.DOM.div( {className:"bodyWrapper", ref:"postBodyWrapper"}, 
							React.DOM.div( {id:"postBody", ref:"postBody",
								'data-placeholder':"Descreva um problema interessante para os seus seguidores.",
								dangerouslySetInnerHTML:{__html: (this.props.model.get('content')||{body:''}).body }})
						),
						React.DOM.div( {className:"image-dropin"}, 
							React.DOM.label(null, "Adicione uma imagem ao seu problema")
						),
						React.DOM.input( {type:"text", ref:"postSource", className:"source", name:"post_source", placeholder:"Cite a fonte desse problema (opcional)", defaultValue:this.props.model.get('content').source})
					),
					React.DOM.section( {className:"selectOptions"}, 
						React.DOM.div( {className:"left"}
						),
						React.DOM.div( {className:"right"}, 
							React.DOM.div( {className:"answer-input"}, 
								React.DOM.ul( {className:"answer-input-list"}, 
									React.DOM.input( {className:"right-ans", ref:"right-ans", type:"text", placeholder:"A resposta certa"} ),
									React.DOM.input( {className:"wrong-ans", ref:"wrong-ans1", type:"text", placeholder:"Uma opção incorreta"} ),
									React.DOM.input( {className:"wrong-ans", ref:"wrong-ans2", type:"text", placeholder:"Uma opção incorreta"} ),
									React.DOM.input( {className:"wrong-ans", ref:"wrong-ans3", type:"text", placeholder:"Uma opção incorreta"} ),
									React.DOM.input( {className:"wrong-ans", ref:"wrong-ans4", type:"text", placeholder:"Uma opção incorreta"} )
								)
							)
						)
					),
					React.DOM.footer(null, 
						TagBox( {ref:"tagSelectionBox", placeholder:"Assuntos", onChangeTags:this.onChangeTags, data:_.indexBy(tagData,'id')}, 
							this.props.model.get('tags')
						)
					)
				)
			)
		);
	},
});

module.exports = {
	create: PostCreationView,
	edit: PostEdit,
	problem: ProblemEdit,
};
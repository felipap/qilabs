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
var selectize = require('selectize')

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


var TagBox = React.createClass({
	getInitialState: function () {
		if (this.props.subject) {
			if (this.props.subject in pageMap) {
				return {
					disabled: false,
					placeholder: "Tags relacionadas a "+pageMap[this.props.subject].name,
				};
			} else {
				console.warn("Invalid subject "+this.props.subject);
			}
		}
		return {
			disabled: true,
			placeholder: "Selecione primeiro uma página para postar.",
		};
	},

	getValue: function () {
		return this.refs.select.getDOMNode().selectize.getValue();
	},

	changeSubject: function (subject) {
		this.props.subject = subject;
		var selectize = this.refs.select.getDOMNode().selectize;
		selectize.clearOptions();
		var tags;
		if ((tags = this.getSubtags()) && tags.length) {
			for (var i=0; i<tags.length; ++i) {
				selectize.addOption(tags[i]);
			}
		}
		selectize.clear();
		selectize.refreshOptions(true);
		$(this.getDOMNode()).find('.selectize-input input').attr('placeholder', 
			"Tags relacionadas a "+pageMap[subject].name );
	},

	getSubtags: function () {
		var subject = this.props.subject;
		if (subject && pageMap[subject]) {
			var tags = _.clone(pageMap[subject].children || {});
			for (var child in tags)
			if (tags.hasOwnProperty(child)) {
				tags[child].value = child;
			}
			return _.toArray(tags);
		}
		return null;
	},

	componentDidMount: function () {
		var options = this.getSubtags();

		if (options === null) {
			this.setState({ disabled: true });
			options = [];
		}

		$(this.refs.select.getDOMNode()).selectize({
			maxItems: 5,
			multiple: true,
			labelField: 'name',
			searchField: 'name',
			options: options,
			items: this.props.children || [],
		});
	},

	render: function () {
		var options = _.map(this.props.data, function (val, index) {
			return (
				<option value={val.id}>
					{val.name}
				</option>
			);
		});

		return (
			<div className="tagSelectionBox">
				<i className="etiqueta icon-tags"></i>
				<select ref="select" disabled={this.state.disabled} name="state[]" multiple>
					<option ref="Placeholder" value="">{this.state.placeholder}</option>
					{options}
				</select>
			</div>
		);
	},
});

//////////////////////////////////////////////////////////////////////////////////////////////////////////////
//////////////////////////////////////////////////////////////////////////////////////////////////////////////

var PostEdit = React.createClass({
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
		this.props.model.set('tags', this.refs.tagBox.getValue());
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
		this.refs.tagBox.changeSubject(this.refs.subjectSelect.getDOMNode().value);
	},
	render: function () {
		var doc = this.props.model.attributes;
		var isNew = !doc.id;

		var pagesOptions = _.map(_.map(pageMap, function (obj, key) {
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

		var _types = {
			'Discussion': 'Discussão',
			'Note': 'Nota',
		};

		// <div className="item save" onClick="" data-toggle="tooltip" title="Salvar rascunho" data-placement="right" onClick={function () { $('#srry').fadeIn()} }>
		// 	<i className="icon-save"></i>
		// </div>

		return (
			<div className="postBox">
				<i className="close-btn" data-action="close-page" onClick={this.close}></i>
				<div className="formWrapper">
					<div className="flatBtnBox">
						<div className="item send" onClick={this.onClickSend} data-toggle="tooltip" title="Enviar" data-placement="right">
							<i className="icon-paper-plane"></i>
						</div>
						<div className="item help" onClick="" data-toggle="tooltip" title="Ajuda?" data-placement="right" onClick={function () { $('#srry').fadeIn()} }>
							<i className="icon-question"></i>
						</div>
					</div>
					<div id="formCreatePost">
						<div className={"selects "+(this.state.is_new?'':'disabled')}>
							{
								isNew?
								<div className="">
									<span>Postar uma </span>
									<select disabled={this.state.is_new?false:true} defaultValue={doc.type} ref="typeSelect" className="form-control typeSelect">
										<option value="Discussion">Discussão</option>
										<option value="Note">Nota</option>
									</select>
									<span>na página de</span>
									<select onChange={this.onChangeLab} defaultValue={doc.subject} disabled={this.state.is_new?false:true} ref="subjectSelect" className="form-control subjectSelect">
										{pagesOptions}
									</select>
								</div>								
								:<div className="">
									<strong>{_types[doc.type].toUpperCase()}</strong>postada em<strong>{pageMap[doc.subject].name.toUpperCase()}</strong>
								</div>
							}
						</div>
						
						<textarea ref="postTitle" className="title" name="post_title" placeholder={this.state.placeholder || "Sobre o que você quer falar?"} defaultValue={doc.content.title}>
						</textarea>
						<TagBox ref="tagBox" subject={doc.subject}>
							{doc.tags}
						</TagBox>
						<div className="bodyWrapper" ref="postBodyWrapper">
							<div id="postBody" ref="postBody"
								data-placeholder="Escreva o seu texto"
								dangerouslySetInnerHTML={{__html: (doc.content||{body:''}).body }}></div>
						</div>
					</div>
				</div>
			</div>
		);
	},
});

var PostCreationView = React.createClass({
	render: function () {
		this.postModel = new models.postItem({
			author: window.user,
			subject: 'application',
			type: 'Discussion',
			content: {
				title: '',
				body: '',
			},
		});
		return <PostEdit ref="postForm" model={this.postModel} page={this.props.page} />
	},
});

var ProblemEdit = React.createClass({
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
			<div className="postBox">
				<i className="close-btn" data-action="close-page" onClick={this.close}></i>

				<div className="form-wrapper">
					<div className="form-side-btns">
						<div className="item send" ref="sendBtn" onClick={this.onClickSend} data-toggle="tooltip" title="Enviar Problema" data-placement="right">
							<i className="icon-paper-plane"></i>
						</div>
						<div className="item save" onClick="" data-toggle="tooltip" title="Salvar rascunho" onClick={function () { $('#srry').fadeIn()} } data-placement="right">
							<i className="icon-save"></i>
						</div>
						<div className="item help" onClick="" data-toggle="tooltip" title="Ajuda?" onClick={function () { $('#srry').fadeIn()} } data-placement="right">
							<i className="icon-question"></i>
						</div>
					</div>

					<header>
						<i className="icon-measure"></i>
						<label>
							Compartilhe um problema
						</label>
						<ul className="right"></ul>
					</header>
					<section className="textInputs">
						<textarea ref="postTitle" className="title" name="post_title" placeholder="Dê um título legal para o seu problema" defaultValue={this.props.model.get('content').title}>
						</textarea>
						<div className="bodyWrapper" ref="postBodyWrapper">
							<div id="postBody" ref="postBody"
								data-placeholder="Descreva um problema interessante para os seus seguidores."
								dangerouslySetInnerHTML={{__html: (this.props.model.get('content')||{body:''}).body }}></div>
						</div>
						<div className="image-dropin">
							<label>Adicione uma imagem ao seu problema</label>
						</div>
						<input type="text" ref="postSource" className="source" name="post_source" placeholder="Cite a fonte desse problema (opcional)" defaultValue={this.props.model.get('content').source}/>
					</section>
					<section className="selectOptions">
						<div className="left">
						</div>
						<div className="right">
							<div className="answer-input">
								<ul className="answer-input-list">
									<input className="right-ans" ref="right-ans" type="text" placeholder="A resposta certa" />
									<input className="wrong-ans" ref="wrong-ans1" type="text" placeholder="Uma opção incorreta" />
									<input className="wrong-ans" ref="wrong-ans2" type="text" placeholder="Uma opção incorreta" />
									<input className="wrong-ans" ref="wrong-ans3" type="text" placeholder="Uma opção incorreta" />
									<input className="wrong-ans" ref="wrong-ans4" type="text" placeholder="Uma opção incorreta" />
								</ul>
							</div>
						</div>
					</section>
					<footer>
						<TagBox ref="tagSelectionBox" placeholder="Assuntos" onChangeTags={this.onChangeTags} data={_.indexBy(tagData,'id')}>
							{this.props.model.get('tags')}
						</TagBox>
					</footer>
				</div>
			</div>
		);
	},
});

module.exports = {
	create: PostCreationView,
	edit: PostEdit,
	problem: ProblemEdit,
};
/** @jsx React.DOM */

/*
** postForms.jsx
** Copyright QiLabs.org
** BSD License
*/

var $ = require('jquery')
var Backbone = require('backbone')
var _ = require('underscore')
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

var pageData = _.map(pageMap, function (obj, key) {
	return {
		id: key,
		name: obj.name,
		detail: obj.detail,
	};
});


var TagSelectionBox = React.createClass({
	getInitialState: function () {
		console.log(this.props.children)
		return {selectedTagsIds:this.props.children || []};
	},
	addTag: function (id) {
		if (this.state.selectedTagsIds.indexOf(id) === -1)
			this.setState({ selectedTagsIds: this.state.selectedTagsIds.concat(id) });
		this.props.onChangeTags();
	},
	removeTag: function (id) {
		var index = this.state.selectedTagsIds.indexOf(id);
		if (index !== -1) {
			var selected = this.state.selectedTagsIds;
			selected.splice(index, 1);
			this.setState({ selectedTagsIds: selected });
		}
		this.props.onChangeTags();
	},
	popTag: function (id) {
		var selected = this.state.selectedTagsIds;
		if (selected.length) {
			selected.pop();
			console.log('new', selected)
			this.setState({ selectedTagsIds: selected });
		}
		this.props.onChangeTags();
	},
	getSelectedTagsIds: function () {
		return this.state.selectedTagsIds;
	},
	componentDidMount: function () {
		var tagStates = new Bloodhound({
			datumTokenizer: Bloodhound.tokenizers.obj.whitespace('name'),
			queryTokenizer: Bloodhound.tokenizers.whitespace,
			local: tagData,
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
					'<div class="empty-message">Assunto não encontrado</div>'
				].join('\n'),
				suggestion: _.template('<div><label><%= name %></label><div class="detail"><%= detail %></div></div>'),
			}
		});
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
					$(self.refs.input.getDOMNode()).val(''); // .prop('placeholder','Tópicos relacionados');
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
			if (!this.props.data[tagId])
				return null;
			return (
				<li className="tag" key={tagId}>
					<span>
						{this.props.data[tagId].name}
					</span>
					<span onClick={function(){self.removeTag(tagId)}}><i className="close-btn"></i></span>
				</li>
			);
		}.bind(this));
		return (
			<div className={tags.length?'':' empty '} id="tagSelectionBox">
				<i className="iconThumbnail iconThumbnailSmall icon-tags"></i>
				<ul>{
					tags.length?
					tags
					:(
						<div className="placeholder">{ this.props.placeholder }</div>
					)
				}</ul>
				<input ref="input" type="text" id="tagInput" />
			</div>
		);
	},
});

var PostEdit = React.createClass({
	getInitialState: function () {
		return {placeholder:''};
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

		$(this.refs.subjectSelect.getDOMNode()).on('change', function () {
			console.log(this.value)
			if (this.value == 'Discussion')
				this.setState({placeholder:'O que você quer discutir?'})
			else if (this.value == 'Note')
				this.setState({placeholder:'O que você quer contar?'})
		});
		
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
		this.props.model.set('type', this.refs.typeSelect.getDOMNode().value);
		this.props.model.set('subject', this.refs.subjectSelect.getDOMNode().value);
		this.props.model.attributes.content.body = this.editor.serialize().postBody.value;
		// console.log(this.editor.serialize().postBody.value)
		// console.log(this.props.model.attributes.content.body)

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
	render: function () {
		var pagesOptions = _.map(pageData, function (a, b) {
			return (
				<option value={a.id} key={a.id}>{a.name}</option>
			);
		});
		return (
			<div className="postBox">
				<i className="close-btn" data-action="close-page" onClick={this.close}></i>
				<div className="formWrapper">
					<div className="flatBtnBox">
						<div className="item send" onClick={this.onClickSend} data-toggle="tooltip" title="Enviar" data-placement="right">
							<i className="icon-paper-plane"></i>
						</div>
						<div className="item save" onClick="" data-toggle="tooltip" title="Salvar rascunho" data-placement="right" onClick={function () { $('#srry').fadeIn()} }>
							<i className="icon-save"></i>
						</div>
						<div className="item help" onClick="" data-toggle="tooltip" title="Ajuda?" data-placement="right" onClick={function () { $('#srry').fadeIn()} }>
							<i className="icon-question"></i>
						</div>
					</div>
					<div id="formCreatePost">
						<div className="selects">
							<div className="">
								<span>Postar uma </span>
								<select ref="typeSelect" className="form-control typeSelect">
									<option value="Discussion">Discussão</option>
									<option value="Note">Nota</option>
								</select>
								<span>na página de</span>
								<select ref="subjectSelect" className="form-control subjectSelect">
									{pagesOptions}
								</select>
							</div>
						</div>
						
						<textarea ref="postTitle" className="title" name="post_title" placeholder={this.state.placeholder || "Sobre o que você quer falar?"} defaultValue={this.props.model.get('content').title}>
						</textarea>
						<div className="bodyWrapper" ref="postBodyWrapper">
							<div id="postBody" ref="postBody"
								data-placeholder=""
								dangerouslySetInnerHTML={{__html: (this.props.model.get('content')||{body:''}).body }}></div>
						</div>
					</div>
				</div>
			</div>
		);
						// <TagSelectionBox ref="tagSelectionBox" placeholder="Tópicos Relacionados" onChangeTags={this.onChangeTags} data={_.indexBy(,'id')}>
						// 	{this.props.model.get('tags')}
						// </TagSelectionBox>
	},
});

var PostCreationView = React.createClass({
	render: function () {
		this.postModel = new models.postItem({
			author: window.user,
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
						<TagSelectionBox ref="tagSelectionBox" placeholder="Assuntos" onChangeTags={this.onChangeTags} data={_.indexBy(tagData,'id')}>
							{this.props.model.get('tags')}
						</TagSelectionBox>
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
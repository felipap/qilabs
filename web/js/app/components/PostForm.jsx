
var $ = require('jquery')
var _ = require('lodash')
var React = require('react')
require('autosize');

var models = require('../lib/models.js')
var TagSelector = require('./TagSelector.jsx')
var TagSelector2 = require('./TagSelector2.jsx')
var SideBtns = require('./sideButtons.jsx')
var Dialog = require('../lib/dialogs.jsx')

var LineInput = require('./LineInput.jsx')
var MarkdownEditor = require('./MarkdownEditor.jsx')

// Wait for the user to upload the file before calling this!
function setupLeaveWarning(message) {
	if (!window.onbeforeunload) {
		window.onbeforeunload = function() {
			return message;
		}
	}
}

function undoLeaveWarning() {
	if (window.onbeforeunload) {
		$(window).unbind();
	}
}

var PostEdit = React.createBackboneClass({
	displayName: 'PostEdit',

	componentWillMount: function () {
		if (this.props.isNew) {
			this.props.page.title = 'Editando novo post';
		} else {
			this.props.page.title = 'Editando '+this.props.model.get('content').title;
		}
	},

	send: function () {
		var data = {
			tags: this.refs.tagSelector.getValue().slice(1),
			lab: this.refs.tagSelector.getValue()[0],
			content: {
				body: this.refs.mdEditor.getValue(),
				title: this.refs.titleInput.getValue(),
				images: this.state.uploaded,
			}
		}

		this.props.model.save(data, {
			url: this.props.model.url() || '/api/posts',
			success: function (model, response) {
				Utils.flash.info("Publicação salva :)");
				window.location.href = model.get('path');
			},
			error: function (model, xhr, options) {
				var data = xhr.responseJSON;
				if (data && data.message) {
					Utils.flash.alert(data.message);
				} else {
					Utils.flash.alert('Milton Friedman.');
				}
			}
		});
	},

	tryClose: function (cb) {
		if (this.props.isNew) {
			var msg = 'Tem certeza que deseja descartar esse texto?';
		} else {
			var msg = 'Tem certeza que deseja descartar alterações a esse texto?';
		}
		if (confirm(msg)) {
			cb();
		}
	},

	//
	updateUploaded: function (urls) {
		this.setState({ uploaded: urls });
	},

	render: function () {
		var doc = this.props.model.attributes;

		var events = {
			clickTrash: (e) => {
				if (this.props.isNew) {
					this.tryClose(() => this.props.page.destroy())
				} else {
					if (confirm('Tem certeza que deseja excluir esse texto?')) {
						this.props.model.destroy();
						// Signal to the wall that the post with this ID must be removed.
						// This isn't automatic (as in deleting comments) because the models
						// on the wall aren't the same as those on post FullPostView.
						app.FeedWall.getCollection().remove({id:this.props.model.get('id')});
						this.props.page.destroy();
					}
				}
			},
			clickPreview: () => {
				var md = this.refs.mdEditor.getValue();
				var html = window.Utils.renderMarkdown(md);
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
				Dialog(<Preview />, "preview", function () {
					window.Utils.refreshLatex();
				});
			},
			clickHelp: (e) => {
				Dialog.PostEditHelp({});
			},
		}

		return (
			<div className="PostForm">
				<div className="form-wrapper">
					<ul className="inputs">
						<li>
							<LineInput ref="titleInput"
								multiline={true}
								className="input-title"
								placeholder="Título para a sua publicação"
								defaultValue={this.getModel().get('content').title} />
						</li>

						<div>
							<MarkdownEditor ref="mdEditor"
								placeholder="O que você quer ensinar hoje?"
								images={this.props.model.get('content').images}
								enableImages={true}
								value={this.getModel().get('content').body}
								converter={window.Utils.renderMarkdown} />
						</div>

						<div className="selects unpad">
							<TagSelector2 ref="tagSelector"
								mayChangeLab={this.props.isNew}
								lab={doc.lab} pool={pageMap} tags={doc.tags}
							/>
						</div>
					</ul>
				</div>

				<div className="form-drag-aim">
					<div className="message">
						<div className="icons">
							<i className="icon-description"></i>
						</div>
						<div className="text">
							Arraste uma imagem aqui para enviar.
						</div>
					</div>
				</div>

				<footer>
					<ul className="right">
						<a className="button guidelines" target="__blank" href="/links/guidelines">
							Guidelines
						</a>
						{
							this.props.isNew?
							<button className="submit" onClick={this.send}>
								Enviar
							</button>
							:<button className="submit" onClick={this.send}>
								Salvar
							</button>
						}
					</ul>
					<ul className="">
						{
							this.props.isNew?
							<button className="cancel" onClick={events.clickTrash}>
								Sair
							</button>
							:<button className="remove" onClick={events.clickTrash}>
								Remover
							</button>
						}
					</ul>
				</footer>
			</div>
		);
	},
});

function isValidUrl(url) {
	if (!url) {
		return false;
	}

	return !!url.match(/\b(https?|ftp|file):\/\/[\-A-Za-z0-9+&@#\/%?=~_|!:,.;]*[\-A-Za-z0-9+&@#\/%=~_|‌​]/);
}

var PostLinkEdit = React.createBackboneClass({
	displayName: 'PostEdit',

	getInitialState: function () {
		return {
			link: 'https://www.tumblr.com/new/link',
			linkPreview: null,
		};
	},

	componentWillMount: function () {
		if (this.props.isNew) {
			this.props.page.title = 'Editando novo post';
		} else {
			this.props.page.title = 'Editando '+this.props.model.get('content').title;
		}
	},

	send: function () {
		var data = {
			tags: this.refs.tagSelector.getValue(),
			content: {
				body: this.refs.mdEditor.getValue(),
				title: this.refs.titleInput.getValue(),
				images: this.state.uploaded,
			}
		}
		if (this.props.isNew) {
			data.lab = this.refs.labSelect.getDOMNode().value;
			data.content.link = this.state.link;
		}

		this.props.model.save(data, {
			url: this.props.model.url() || '/api/posts',
			success: function (model, response) {
				Utils.flash.info("Publicação salva :)");
				window.location.href = model.get('path');
			},
			error: function (model, xhr, options) {
				var data = xhr.responseJSON;
				if (data && data.message) {
					Utils.flash.alert(data.message);
				} else {
					Utils.flash.alert('Milton Friedman.');
				}
			}
		});
	},

	tryClose: function (cb) {
		if (!this.linkPreview) {
			return cb();
		}

		var msg = 'Tem certeza que deseja descartar esse texto?';
		if (confirm(msg)) {
			cb();
		}
	},

	removeLink: function () {
		this.setState({ link: null, linkPreview: null });
	},

	_bindLinkChange: function () {

		var getUrl = () => {
			return this.refs.linkInput.getDOMNode().value;
		}

		// Prevent looking up url on every keyUp
		var throttle = (fn) => {
			var lastCalled;

			return function () {
				if (lastCalled && Date.now() - lastCalled < 1000) {
					return;
				}
				lastCalled = Date.now();

				fn.apply(this, arguments)
			}
		}

		var lastLink = '';

		var onChangeLink = () => {
			var link = getUrl();
			console.log('changed!!', link, lastLink)
			if (link === lastLink) {
				return;
			}
			lastLink = link;

			if (!link) {
				return;
			}

			if (!isValidUrl(link)) {
				this.setState({ status: "<i class='icon-error'></i>" });
				return;
			}

			this.setState({ linkPreview: null, status: '' });
			$(this.refs.linkLoader.getDOMNode()).removeClass('is-hidden');

			$.getJSON('/api/posts/meta?link='+link)
				.done((data) => {
					if (!data) {
						this.setState({ linkPreview: false });
						return
					}
					if (data.error) {
						Utils.flash.warn(data.message || "Problemas ao buscar essa url.");
						return;
					}

					if (link !== getUrl()) {
						onChangeLink();
						return;
					}

					if (data && !('is_scrapped' in data)) {
						this.setState({ linkPreview: data });
					}
				}).fail(() => {
				}).always(() => {
					if (this.refs.linkLoader) {
						$(this.refs.linkLoader.getDOMNode()).addClass('is-hidden');
					}
				})
		}

		$(this.refs.linkInput.getDOMNode()).on('keyup', throttle(onChangeLink))
	},

	componentDidMount: function() {
		this._bindLinkChange();
	},

	render: function () {
		var doc = this.props.model.attributes;

		var events = {
			clickTrash: (e) => {
				this.tryClose(() => this.props.page.destroy())
			},
			clickHelp: (e) => {
				Dialog.PostEditHelp({});
			},
			clickGoBack: (e) => {
				this.setState({ linkPreview: false });
			}
		}

		if (!this.state.linkPreview) {
			var sendLink = () => {
				this.setState({ link: this.refs.linkInput.getValue() });
			}

			return (
				<div className="PostForm PostLinkForm">
					<div className="form-wrapper">
						<ul className="inputs">
							<div className="linkInputWrapper">
								<label>
									Você tem um link interessante para compartilhar?
								</label>

								<LineInput ref="linkInput"
									multiline={true}
									className="input-link unpad"
									placeholder="Escreva ou cole seu link aqui"
									defaultValue={this.state.link} />

								{
									this.state.status?
									<div className="linkStatus">
										<span dangerouslySetInnerHTML={{ __html: this.state.status }} />
									</div>
									:null
								}
							</div>
						</ul>

						<footer>
							<ul className="right">
								<div ref="linkLoader" className="circleLoader is-hidden">
									<div />
									<div />
								</div>
								<button className="submit" onClick={sendLink} disabled={!isValidUrl(this.state.link)}>
									Continuar
								</button>
							</ul>
							<ul className="">
								<button className="cancel" onClick={events.clickTrash}>
									Sair
								</button>
							</ul>
						</footer>
					</div>
				</div>
			);
		}

		function getHostName(url) {
			if (URL) {
				return _.unescape(new URL(url).hostname.replace(/^www\./,''));
			}
			return '';
		}

		return (
			<div className="PostForm PostLinkForm">
				<div className="form-wrapper">
					<ul className="inputs">
						<li className="linkEditPreview unpad">
							<div className="close-button" onClick={this.removeLink}>
								<i className="icon-close" />
							</div>

							{
								this.state.linkPreview.image && this.state.linkPreview.image.url?
								<div className="mediaPreview">
									<div className="thumbnail" style={{backgroundImage:'url('+this.state.linkPreview.image.url+')'}}>
										<div className="blackout"></div>
										<i className="icon-link"></i>
									</div>
								</div>
								:null
							}

							<div>
								<div className="host">
									{getHostName(this.state.linkPreview.url)}
								</div>
							</div>

							<div>
								<LineInput ref="titleInput"
									className="input-title"
									placeholder="Escreva um título"
									defaultValue={ _.unescape(this.state.linkPreview.title) } />
							</div>

							<div>
								<LineInput ref="titleInput"
									multiline={true}
									className="description"
									placeholder="Descreva o seu link"
									defaultValue={ _.unescape(this.state.linkPreview.description) } />
							</div>
						</li>

						<li>
							<MarkdownEditor ref="mdEditor"
								placeholder="Escreva sobre o seu link."
								value={this.getModel().get('content').body}
								converter={window.Utils.renderMarkdown} />
						</li>

						<li className="selects">
							<div className="selects unpad">
								<TagSelector2 ref="tagSelector"
									mayChangeLab={this.props.isNew}
									lab={doc.lab} pool={pageMap} tags={doc.tags}
								/>
							</div>
						</li>
					</ul>

					<footer>
						<ul className="right">
							<a className="button guidelines" target="__blank" href="/links/guidelines">
								Guidelines
							</a>
							<button className="go-back" onClick={events.clickGoBack}>
								Voltar
							</button>
							<button className="submit" onClick={this.send}>
								Enviar
							</button>
						</ul>
						<ul className="">
							<button className="cancel" onClick={events.clickTrash}>
								Sair
							</button>
						</ul>
					</footer>
				</div>
			</div>
		);
	},
});

module.exports = PostEdit;

module.exports.Create = function (data) {
	if (!window.user) {
		return;
	}
	var postModel = new models.Post({
		author: window.user,
		lab: 'application',
		content: {
			title: '',
			body: '',
		},
	});
	return <PostEdit model={postModel} page={data.page} isNew={true} />
};

module.exports.CreateLink = function (data) {
	if (!window.user) {
		return;
	}
	var postModel = new models.Post({
		author: window.user,
		lab: 'application',
		content: {
			title: '',
			body: '',
		},
	});
	return <PostLinkEdit model={postModel} page={data.page} isNew={true} />
};
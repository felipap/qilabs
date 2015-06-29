
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

var S3Upload = (function() {

	S3Upload.prototype.s3_object_name = 'default_name';
	S3Upload.prototype.s3_sign_put_url = '/signS3put';
	S3Upload.prototype.file_dom_selector = 'file_upload';

	S3Upload.prototype.onFinishS3Put = function(public_url) {
		return console.log('base.onFinishS3Put()', public_url);
	};

	S3Upload.prototype.onProgress = function(percent, status) {
		return console.log('base.onProgress()', percent, status);
	};

	S3Upload.prototype.onError = function(status) {
		return console.log('base.onError()', status);
	};

	function S3Upload(files, options) {
		if (options === null) options = {};
		for (option in options) {
			this[option] = options[option];
		}
		// this.handleFileSelect(document.getElementById(this.file_dom_selector));
		this.handleFileSelect(files);
	}

	S3Upload.prototype.handleFileSelect = function(files) {
		var f, files, output, _i, _len, _results;
		this.onProgress(0, 'Upload started.');
		// files = file_element.files;
		output = [];
		_results = [];
		for (_i = 0, _len = files.length; _i < _len; _i++) {
			f = files[_i];
			_results.push(this.uploadFile(f));
		}
		return _results;
	};

	S3Upload.prototype.createCORSRequest = function(method, url) {
		var xhr;
		xhr = new XMLHttpRequest();
		if (xhr.withCredentials != null) {
			xhr.open(method, url, true);
		} else if (typeof XDomainRequest !== "undefined") {
			xhr = new XDomainRequest();
			xhr.open(method, url);
		} else {
			xhr = null;
		}
		return xhr;
	};

	S3Upload.prototype.executeOnSignedUrl = function(file, callback) {
		var this_s3upload, xhr;
		this_s3upload = this;
		xhr = new XMLHttpRequest();
		xhr.open('GET', this.s3_sign_put_url + '?s3_object_type=' + file.type + '&s3_object_name=' + this.s3_object_name, true);
		xhr.overrideMimeType('text/plain; charset=x-user-defined');
		xhr.onreadystatechange = function(e) {
			var result;
			if (this.readyState === 4 && this.status === 200) {
				try {
					result = JSON.parse(this.responseText);
				} catch (error) {
					this_s3upload.onError('Signing server returned some ugly/empty JSON: "' + this.responseText + '"');
					return false;
				}
				return callback(decodeURIComponent(result.signed_request), result.url);
			} else if (this.readyState === 4 && this.status !== 200) {
				return this_s3upload.onError('Could not contact request signing server. Status = ' + this.status);
			}
		};
		return xhr.send();
	};

	S3Upload.prototype.uploadToS3 = function(file, url, public_url) {
		var this_s3upload, xhr;
		this_s3upload = this;
		console.log('you say', arguments)
		xhr = this.createCORSRequest('PUT', url);
		if (!xhr) {
			this.onError('CORS not supported');
		} else {
			xhr.onload = function() {
				if (xhr.status === 200) {
					this_s3upload.onProgress(100, 'Upload completed.');
					return this_s3upload.onFinishS3Put(public_url);
				} else {
					return this_s3upload.onError('Upload error: ' + xhr.status);
				}
			};
			xhr.onerror = function() {
				return this_s3upload.onError('XHR error.');
			};
			xhr.upload.onprogress = function(e) {
				var percentLoaded;
				if (e.lengthComputable) {
					percentLoaded = Math.round((e.loaded / e.total) * 100);
					return this_s3upload.onProgress(percentLoaded, percentLoaded === 100 ? 'Finalizing.' : 'Uploading.');
				}
			};
		}
		xhr.setRequestHeader('Content-Type', file.type);
		xhr.setRequestHeader('x-amz-acl', 'public-read');
		return xhr.send(file);
	};

	S3Upload.prototype.uploadFile = function(file) {
		var this_s3upload;
		this_s3upload = this;
		return this.executeOnSignedUrl(file, function(signedURL, publicURL) {
			return this_s3upload.uploadToS3(file, signedURL, publicURL);
		});
	};

	return S3Upload;
})();

//

var ImagesDisplay = React.createClass({
	render: function () {
		var images = _.map(this.props.children, (url) => {
			var removeImage = () => {
				if (confirm('Deseja remover essa imagem da publicação?')) {
					var all = this.props.children.slice();
					all.splice(all.indexOf(url),1);
					this.props.update(all);
				}
			}

			var openImage = function (e) {
				if (e.target.localName !== 'i') {
					console.log(arguments)
					window.open(url);
				}
			}

			return (
				<li key={url} onClick={openImage}>
					<div className="background" style={{backgroundImage: 'url('+url+')'}}>
					</div>
					<div className="backdrop"></div>
					<i className="close-btn icon-clear" onClick={removeImage}></i>
				</li>
			);
		});

		return (
			<div className="images-display">
				{images}
			</div>
		);
	}
});

var PostEdit = React.createBackboneClass({
	displayName: 'PostEdit',

	getInitialState: function () {
		return {
			preview: null,
			showHelpNote: false,
			uploaded: this.props.model.get('content').images || [],
		};
	},

	componentWillMount: function () {
		if (this.props.isNew) {
			this.props.page.title = 'Editando novo post';
		} else {
			this.props.page.title = 'Editando '+this.props.model.get('content').title;
		}
	},

	_setupDragNDrop: function () {
		var me = this.getDOMNode()
		function undrag () {
			// $(this.getDOMNode()).removeClass('dragging');
		}

		function dragnothing (e) {
			// $(this.getDOMNode()).addClass('dragging');
			e.stopPropagation();
		  e.preventDefault();
		}

		var self = this;

		function drop(e) {
		  e.stopPropagation();
		  e.preventDefault();

		  if (self.state.uploaded.length >= 3)
		  	return;

		  var dt = e.dataTransfer;
		  var files = dt.files;
		  console.log('files', files)
			var s3upload = new S3Upload(files, {
				file_dom_selector: 'files',
				s3_sign_put_url: '/api/posts/sign_img_s3',
				onProgress: function(percent, message) {
					Utils.flash.info('Upload progress: ' + percent + '% ' + message);
				},
				onFinishS3Put: function(public_url) {
					Utils.flash.info('Upload completed. Uploaded to: '+ public_url);
					// url_elem.value = public_url;
					// preview_elem.innerHTML = '<img src="'+public_url+'" style="width:300px;" />';
					// self.setState({ uploaded: self.state.uploaded.concat(public_url) })
					var $textarea = $(self.refs.mdEditor.getDOMNode());
					var pos = $textarea.prop('selectionStart'),
							v = $textarea.val(),
							before = v.substring(0, pos),
							after = v.substring(pos, v.length);
					$textarea.val(before + "\n![]("+public_url+")\n" + after);
				},
				onError: function(status) {
					Utils.flash.info('Upload error: ' + status);
				}
			});
		}

		me.addEventListener("dragenter", dragnothing.bind(this), false);
		me.addEventListener("dragover", dragnothing.bind(this), false);
		me.addEventListener("dragleave", undrag.bind(this), false);
		me.addEventListener("drop", drop.bind(this), false);
	},

	componentDidMount: function () {
		this._setupDragNDrop();
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
			data.content.link = this.state.preview && this.state.preview.url;
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
			var msg = 'Tem certeza que deseja descartar essa publicação?';
		} else {
			var msg = 'Tem certeza que deseja descartar alterações a essa publicação?';
		}
		if (confirm(msg)) {
			cb();
		}
	},

	//
	updateUploaded: function (urls) {
		this.setState({ uploaded: urls });
	},

	onChangeLab: function () {
		this.props.model.set('lab', this.refs.labSelect.getDOMNode().value);
		this.refs.tagSelector.changeLab(this.refs.labSelect.getDOMNode().value);
	},

	render: function () {
		var doc = this.props.model.attributes;

		var events = {
			clickTrash: (e) => {
				if (this.props.isNew) {
					this.tryClose(() => this.props.page.destroy())
				} else {
					if (confirm('Tem certeza que deseja excluir essa publicação?')) {
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

		var genLabSelect = () => {
			var pagesOptions = _.map(_.map(pageMap,
				function (obj, key) {
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
				<div className="input-Select lab-select" disabled={!this.props.isNew}>
					<i className="icon-group_work"
						data-toggle={this.props.isNew?"tooltip":null}
						data-placement="left"
						data-container="body"
						title="Selecione um laboratório."></i>
					<select ref="labSelect"
						defaultValue={ _.unescape(doc.lab) }
						disabled={!this.props.isNew}
						onChange={this.onChangeLab}>
						<option value="false">Matéria</option>
						{pagesOptions}
					</select>
				</div>
			)
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
								value={this.getModel().get('content').body}
								converter={window.Utils.renderMarkdown} />
						</div>

						<ImagesDisplay ref="images" maxSize={1} update={this.updateUploaded}>
							{this.state.uploaded}
						</ImagesDisplay>

						<div className="selects unpad">
							<TagSelector2 ref="tagSelector" lab={doc.lab} pool={pageMap} tags={doc.tags} />
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
					// <div className="post-form-note">
					// 	<a href="/links/guidelines" target="__blank">
					// 		Esteja atento às guidelines da nossa comunidade!
					// 	</a>
					// </div>
	},
});

var PostLinkEdit = React.createBackboneClass({
	displayName: 'PostEdit',

	getInitialState: function () {
		return {
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
			data.content.link = this.state.preview && this.state.preview.url;
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
			var msg = 'Tem certeza que deseja descartar essa publicação?';
		} else {
			var msg = 'Tem certeza que deseja descartar alterações a essa publicação?';
		}
		if (confirm(msg)) {
			cb();
		}
	},

	//
	updateUploaded: function (urls) {
		this.setState({ uploaded: urls });
	},

	onChangeLink: function () {
		var link = this.refs.postLink.getDOMNode().value;
		var c = 0;

		function isValidUrl (url) {
			return !!url.match(
				/\b(https?|ftp|file):\/\/[\-A-Za-z0-9+&@#\/%?=~_|!:,.;]*[\-A-Za-z0-9+&@#\/%=~_|‌​]/
			);
		}

		if (!isValidUrl(link)) {
			this.refs.loadingLinks.getDOMNode().innerHTML = "<i class='icon-exclamation-circle'></i>"
			return;
		}

		this.setState({ preview: null });
		var interval = setInterval(function () {
			var e = this.refs.loadingLinks.getDOMNode();
			var ic;
			if (c === 2) ic = "<i class='icon-ellipsis'></i>"
			else if (c === 1) ic = "<i class='icon-dots-three-horizontal'></i>"
			else if (c === 0) ic = "<i class='icon-dot-single'></i>"
			else ic = ""
			e.innerHTML = ic;
			c = (c+1)%3;
		}.bind(this), 700);
		$.getJSON('/api/posts/meta?link='+link)
			.done(function (data) {
				if (!data) {
					this.setState({ preview: false });
				}	else if (data.error) {
					Utils.flash.warn(data.message || "Problemas ao buscar essa url.");
					return;
				} if (data && !('is_scrapped' in data)) {
					this.setState({ preview: data });
					if (data.title) {
						this.refs.titleInput.setValue(data.title);
					}
				}
			}.bind(this))
			.fail(function () {
			})
			.always(function () {
				clearInterval(interval);
				this.refs.loadingLinks.getDOMNode().innerHTML = '';
			}.bind(this))
	},

	onChangeLab: function () {
		this.props.model.set('lab', this.refs.labSelect.getDOMNode().value);
		this.refs.tagSelector.changeLab(this.refs.labSelect.getDOMNode().value);
	},

	removeLink: function () {
		this.setState({ preview: null });
		this.refs.postLink.getDOMNode().value = '';
	},

	render: function () {
		var doc = this.props.model.attributes;

		var pagesOptions = _.map(_.map(pageMap,
			function (obj, key) {
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

		var events = {
			clickTrash: (e) => {
				if (this.props.isNew) {
					this.tryClose(() => this.props.page.destroy())
				} else {
					if (confirm('Tem certeza que deseja excluir essa publicação?')) {
						this.props.model.destroy();
						// Signal to the wall that the post with this ID must be removed.
						// This isn't automatic (as in deleting comments) because the models
						// on the wall aren't the same as those on post FullPostView.
						app.FeedWall.getCollection().remove({id:this.props.model.get('id')});
						this.props.page.destroy();
					}
				}
			},
			clickHelp: (e) => {
				Dialog.PostEditHelp({});
			},
		}

		return (
			<div className="PostForm">
				<div className="form-wrapper">
					<div className="sideButtons">
						<SideBtns.Send cb={this.send} />
						<SideBtns.Preview cb={events.clickPreview} />
						{
							this.props.isNew?
							<SideBtns.CancelPost cb={events.clickTrash} />
							:<SideBtns.Remove cb={events.clickTrash} />
						}
						<SideBtns.Help cb={events.clickHelp} />
					</div>

					<ul className="inputs">
						<li>
							<LineInput ref="titleInput"
								multiline={true}
								className="input-title"
								placeholder="Título para a sua publicação"
								defaultValue={this.getModel().get('content').title} />
						</li>
						{
							this.props.isNew || doc.content.link?
							<li className="link">
								<input ref="postLink"
									disabled={!this.props.isNew}
									className="link" name="post_link"
									defaultValue={ _.unescape(doc.content.link) }
									onChange={_.throttle(this.onChangeLink, 2000)}
									placeholder="OPCIONAL: um link para compartilhar aqui" />
								<div ref="loadingLinks" className="loading">
								</div>
							</li>
							:null
						}
						{
							this.state.preview?
							<li className="link-preview">
								<i className='icon-close' onClick={this.removeLink}></i>
								{
									this.state.preview.image && this.state.preview.image.url?
									<div className="thumbnail" style={{backgroundImage:'url('+this.state.preview.image.url+')'}}>
										<div className="blackout"></div>
										<i className="icon-link"></i>
									</div>
									:null
								}
								<div className="right">
									{
										this.state.preview.title?
										<div className="title">
											<a href={this.state.preview.url}>
												{this.state.preview.title}
											</a>
										</div>
										:<div className="">
											<a href={this.state.preview.url}>
												{this.state.preview.url}
											</a>
										</div>
									}
									<div className="description">
										{this.state.preview.description}
									</div>
									<div className="hostname">
										<a href={this.state.preview.url}>
											{URL && new URL(this.state.preview.url).hostname}
										</a>
									</div>
								</div>
							</li>
							:(
								this.state.preview === false?
								<li className="link-preview">
									<div className="preview messaging">
										<div className="message">
											Link não encontrado. <i className="icon-sad"></i>
										</div>
									</div>
								</li>
								:null
							)
						}

						<li className="selects">
							<div className="select-wrapper lab-select-wrapper " disabled={!this.props.isNew}>
								<i className="icon-group_work"
								data-toggle={this.props.isNew?"tooltip":null} data-placement="left" data-container="body"
								title="Selecione um laboratório."></i>
								<select ref="labSelect"
									defaultValue={ _.unescape(doc.lab) }
									disabled={!this.props.isNew}
									onChange={this.onChangeLab}>
									{pagesOptions}
								</select>
							</div>
							<TagSelector ref="tagSelector" lab={doc.lab} pool={pageMap}>
								{doc.tags}
							</TagSelector>
						</li>

						<li>
							<MarkdownEditor ref="mdEditor"
								placeholder="O que você quer comentar hoje?"
								value={this.getModel().get('content').body}
								converter={window.Utils.renderMarkdown} />
						</li>
					</ul>
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
/** @jsx React.DOM */

var $ = require('jquery')
var _ = require('lodash')
var React = require('react')
require('jquery-textcomplete')
require('jquery-overlay')
require('jquery-linkify')

var Models = require('../../components/models.js')
var Dialog = require('../../components/dialog.jsx')

var CommentInput = React.createClass({

	getInitialState: function () {
		return { hasFocus: false };
	},

	componentDidMount: function () {
		var self = this;
		_.defer(function () {
			this.refs.input && $(this.refs.input.getDOMNode()).autosize({ append: false });
		}.bind(this));
		var mentions = _.filter(_.map(this.props.post.get('participations'), function (a) {
			return a.user.username;
		}), function (i) {
			return !!i && i !== window.user.username;
		});
		$(this.refs.input.getDOMNode()).textcomplete([{
				mentions: mentions,
				match: /\B@(\w*)$/,
				search: function (term, callback) {
						callback($.map(this.mentions, function (mention) {
								return mention.indexOf(term) === 0 ? mention : null;
						}));
				},
				index: 1,
				replace: function (mention) {
						return '@' + mention + ' ';
				}
		}
		], { appendTo: 'body' }).overlay([
				{
						match: /\B@\w+/g,
						css: {
								'background-color': '#d8dfea'
						}
				}
		]);
	},

	componentDidUpdate: function () {
		var self = this;
		$(this.refs.input.getDOMNode()).keyup(function(e) {
			if (e.keyCode == 27) { // ESC
				self.setState({ hasFocus: false });
				$(self.refs.input.getDOMNode()).blur();
				e.preventDefault();
			}
		});

		if (this.state.hasFocus) {
			setTimeout(function() {
				// console.log($(self.refs.input.getDOMNode()).css('background', '#eee'))
			}, 1000)
		}
	},

	handleSubmit: function (evt) {
		evt.preventDefault();

		var bodyEl = $(this.refs.input.getDOMNode());
		var self = this;

		var comment = new Models.Comment({
			author: window.user,
			content: { body: bodyEl.val() },
			replies_to: this.props.replies_to && this.props.replies_to.get('id'),
		})

		comment.save(undefined, {
			url: this.props.post.get('apiPath')+'/comments',
			// timeout: 8000,
			success: function (model, response) {
				app.flash.info("Comentário salvo :)");
				self.setState({ hasFocus: false });
				bodyEl.val('');
				var item = new Models.Comment(response.data);
				self.props.post.comments.add(item);
				if (self.props.on_reply)
					self.props.on_reply(item);
			},
			error: function (model, xhr, options) {
				var data = xhr.responseJSON;
				if (data && data.message) {
					app.flash.alert(data.message);
				// DO: check for timeout here, somehow
				// } else if (textStatus === 'timeout') {
				// 	app.flash.alert("Falha de comunicação com o servidor.");
				} else {
					app.flash.alert('Milton Friedman.');
				}
			}
		});
	},

	showMarkdownHelp: function () {
		Dialog.MarkdownDialog({
		});
	},

	focus: function () {
		this.setState({ hasFocus: true});
	},

	handleCancel: function() {
		if (this.props.replies_to) {
			this.props.cancel();
		} else {
			this.setState({ hasFocus: false });
		}
	},

	render: function () {
		var placeholder = "Participe da discussão escrevendo um comentário.";
		if (this.props.replies_to) {
			placeholder = "Uma mensagem para "+this.props.replies_to.get('author').name+'...';
		}

		var text = '';
		if (this.props.nested) {
			text = '@'+this.props.replies_to.get('author').username+' ';
		} else {
			text = '';
		}

		return (
			<div className="comment-input">
				<div className="comment-wrapper">
					<div className="avatar-col">
						<div className="user-avatar">
							<div className="avatar" style={{background: 'url('+window.user.avatarUrl+')'}}>
							</div>
						</div>
					</div>
					<div className="content-col input">
						<textarea style={{height: (this.props.replies_to?'61px':'42px')}} defaultValue={text} onFocus={this.focus} required="required" ref="input" type="text"
							placeholder={placeholder}></textarea>
						{(this.state.hasFocus || this.props.replies_to)?(
							<div className="toolbar-editing">
								<div className="tip">
									Você pode formatar o seu texto. <a href="#" tabIndex="-1" onClick={this.showMarkdownHelp}>Saiba como aqui.</a>
								</div>
								<ul className="right">
									<li>
										<button className="undo" onClick={this.handleCancel}>Cancelar</button>
									</li>
									<li>
										<button className="save" onClick={this.handleSubmit}>Enviar</button>
									</li>
								</ul>
							</div>
						):null}
					</div>
				</div>
			</div>
		);
	},
});

var Comment = React.createClass({
	getInitialState: function () {
		return { replying: false, editing: false, hideChildren: false };
	},

	componentWillMount: function () {
		var update = function () {
			this.forceUpdate(function(){});
		}
		this.props.model.on('add reset remove change', update.bind(this));
	},

	componentDidMount: function () {
		$(this.getDOMNode()).linkify();
		if (window.user && this.props.model.get('author').id === window.user.id) {
		} else {
			this.editor = null;
		}
	},

	componentWillUnmount: function () {
	},

	componentDidUpdate: function () {
		if (!this.state.isEditing) {
		} else {
		}
	},

	toggleShowChildren: function () {
		this.setState({ hideChildren: !this.state.hideChildren });
	},

	// Replying

	reply: function () {
		if (!window.user) {
			app.utils.pleaseLogin("responder esse comentário");
			return;
		}
		this.setState({ replying: true, hideChildren: false }, function () {
			// Make reply box visible if necessary
			var $el = $(this.refs.reply.getDOMNode()),
					pcontainer = app.pages.getActive().target;
			// Element is below viewport
			if ($(pcontainer).height() < $el.offset().top) {
				$(pcontainer).scrollTop($el.scrollTop()+$el.offset().top+$el.height()-$(pcontainer).height())
			}
		}.bind(this));
	},

	onReplied: function () {
		this.setState({ replying: false });
	},

	// Editing

	edit: function () {
		$('.tooltip').remove();
		this.setState({ editing: true }, function () {
			$(this.refs.textarea.getDOMNode()).autosize({ append: false });
		}.bind(this));
	},

	onClickSave: function () {
		if (!this.state.editing || !this.refs)
			return;

		var self = this;

		this.props.model.save({
			content: {
				body: this.refs.textarea.getDOMNode().value,
			},
		}, {
			success: function () {
				self.setState({ editing: false });
				self.forceUpdate();
			}
		});
	},

	onCancelEdit: function () {
		if (!this.editor)
			return;
		this.setState({ editing: false });
	},

	onClickTrash: function () {
		if (confirm('Quer excluir permanentemente esse comentário?')) {
			this.props.model.destroy({
				success: function (model, response, options) {
				},
				error: function (model, response, options) {
					// if (xhr.responseJSON && xhr.responseJSON.message)
					// 	app.flash.alert(xhr.responseJSON.message);
					if (response.responseJSON && response.responseJSON.message) {
						app.flash.alert(response.responseJSON.message);
					} else {
						if (response.textStatus === 'timeout')
							app.flash.alert("Falha de comunicação com o servidor.");
						else if (response.status === 429)
							app.flash.alert("Excesso de requisições. Espere alguns segundos.")
						else
							app.flash.alert("Erro.");
					}
				}
			});
		}
	},

	//

	render: function () {
		var doc = this.props.model.attributes;
		var authorIsDiscussionAuthor = this.props.post.get('author').id === doc.author.id;
		var childrenCount = this.props.children && this.props.children.length || 0;

		if (this.state.editing) {
			var Line = (
				<div className="comment-wrapper">
					<div className="avatar-col" title={doc.author.username}>
					<a href={doc.author.path}>
						<div className="user-avatar">
							<div className="avatar" style={{background: 'url('+doc.author.avatarUrl+')'}}>
							</div>
						</div>
					</a>
					</div>
					<div className="content-col input">
						<textarea ref="textarea" defaultValue={ doc.content.body } />
						<div className="toolbar-editing">
							<ul className="right">
								<li>
									<button className="save" onClick={this.onClickSave}>
										Salvar
									</button>
								</li>
								<li>
									<button className="delete" onClick={this.onClickTrash}>
										Excluir
									</button>
								</li>
							</ul>
						</div>
					</div>
				</div>
			);
		} else {
			var Line = (
				<div className="comment-wrapper">
					<div className="avatar-col" title={doc.author.username}>
						<a href={doc.author.path}>
							<div className="user-avatar">
								<div className="avatar" style={{background: 'url('+doc.author.avatarUrl+')'}}>
								</div>
							</div>
						</a>
					</div>
					<div className="content-col">
						<span className="top">
							<a className="name" href={doc.author.path}>
								{doc.author.name}
							</a>
							{authorIsDiscussionAuthor?(<span className="label">autor</span>):null}
							<time data-short="false" data-time-count={1*new Date(doc.created_at)} title={formatFullDate(new Date(doc.created_at))}>
								{window.calcTimeFrom(doc.created_at, false)}
							</time>
						</span>
						<div className="body">
						{
							doc.deleted?
							<span className="deleted">comentário excluído</span>
							:<span dangerouslySetInnerHTML={{__html: doc.content.body }}></span>
						}
						</div>
						<div className="toolbar">
							<li className="votes">
								<span className="count" title="Votos">
									{doc.counts.votes}
								</span>
								<button className="up"
								onClick={this.props.model.toggleVote.bind(this.props.model)}
								data-voted={this.props.model.liked?"true":""}
								disabled={this.props.model.userIsAuthor || doc.deleted}
								title="Votar">
									<i className="icon-thumb-up"></i>
								</button>
							</li>
							<li className="separator">
								<i className="icon-dot"></i>
							</li>
							<li className="reply">
								<button onClick={this.reply} title="Responder" disabled={doc.deleted}>
									Responder
								</button>
							</li>
							{
								this.props.model.userIsAuthor?
								<li className="separator">
									<i className="icon-dot"></i>
								</li>
								:null
							}
							{
								this.props.model.userIsAuthor?
								<li className="edit">
									<button className="edit" title="Editar" onClick={this.edit} disabled={doc.deleted}>
										Editar
									</button>
								</li>
								:null
							}
						</div>
					</div>
				</div>
			)
		}

		if (this.state.replying && window.user) {
			var self = this;
			var commentInput = (
				<CommentInput
					ref="reply"
					nested={this.props.nested}
					post={this.props.post}
					replies_to={this.props.model}
					cancel={function () { self.setState( { replying: false }) }}
					on_reply={this.onReplied} />
			);
		}

		if (childrenCount) {
			// var faces = _.map(this.props.children,
			// 	function (i) { return i.attributes.author.avatarUrl });
			// var ufaces = _.unique(faces);
			// var avatars = _.map(ufaces.slice(0,4), function (img) {
			// 		return (
			// 			<div className="user-avatar" key={img}>
			// 				<div className="avatar" style={{ backgroundImage: 'url('+img+')'}}>
			// 				</div>
			// 			</div>
			// 		);
			// 	}.bind(this));
							// <div className="right">
							// 	<i className="icon-ellipsis"></i> {avatars}
							// </div>
			if (this.state.hideChildren) {
				var Children = (
					<div className={"children "+(this.state.hideChildren?"show":null)}>
						<div className="children-info" onClick={this.toggleShowChildren}>
							<div className="detail">
								Mostrar {childrenCount} resposta{childrenCount==1?'':'s'} <i className="icon-keyboard-arrow-down"></i>
							</div>
						</div>
						<ul className="nodes"></ul>
						{commentInput}
					</div>
				);
			} else {
				var childrenNotes = _.map(this.props.children || [], function (comment) {
					return (
						<Comment model={comment} nested={true} key={comment.id} post={this.props.post}></Comment>
					);
				}.bind(this));
				var Children = (
					<ul className="children">
						<div className="children-info" onClick={this.toggleShowChildren}>
							<div className="detail">
								Esconder {childrenCount} resposta{childrenCount==1?'':'s'}. <i className="icon-keyboard-arrow-up"></i>
							</div>
						</div>
						{childrenNotes}
						{commentInput}
					</ul>
				);
			}
		} else if (this.state.replying) {
			var Children = (
				<div className="children">
					{commentInput}
				</div>
			);
		}

		return (
			<div className={"exchange "+(this.state.editing?" editing":"")}>
				{Line}
				{Children}
			</div>
		);
	},
});

module.exports = React.createClass({
	getInitialState: function () {
		return { replying: false }
	},

	componentWillMount: function () {
		var update = function () {
			this.forceUpdate(function(){});
		}
		this.props.collection.on('add reset change remove', update.bind(this));
	},
	componentDidMount: function () {
		this.props.collection.trigger('mount');
		app.utils.refreshLatex();
		this.props.post.on('change:_meta', function () {
			console.log('meta changed')
			if (this.props.post.hasChanged('_meta')) {
				// Watching may have changed. Update.
				this.forceUpdate();
			}
		}.bind(this));
	},

	componentDidUpdate: function () {
		this.props.collection.trigger('update');
		app.utils.refreshLatex();
	},

	onClickReply: function () {
		this.setState({ replying: true })
	},

	toggleWatching: function () {
		this.props.post.toggleWatching();
	},

	render: function () {
		var levels = this.props.collection.groupBy(function (e) {
			return e.get('thread_root') || null;
		});

		var countHidden = 0;

		// Get nodes that have no thread_roots.
		var exchangeNodes = _.map(levels[null], function (comment) {
			if (comment.get('deleted') && !levels[comment.id]) {
				countHidden += 1;
				return null;
			}
			return (
				<Comment model={comment} key={comment.id} post={this.props.post} nested={false}>
					{levels[comment.id]}
				</Comment>
			);
		}.bind(this));
		var ccount = this.props.collection.models.length - countHidden;

		return (
			<div className="comment-section">
				<div className="comment-section-header">
					<label>
						{ccount} Comentário{ccount>1?"s":""}
					</label>
					<ul>
						{
							this.props.post.watching?
							<button className="follow active" onClick={this.toggleWatching}
								data-toggle="tooltip" data-placement="bottom" data-container="body"
								title="Receber notificações quando essa discussão por atualizada.">
								<i className="icon-notifications-on"></i> Seguindo
							</button>
							:<button className="follow" onClick={this.toggleWatching}
								data-toggle="tooltip" data-placement="bottom" data-container="body"
								title="Receber notificações quando essa discussão por atualizada.">
								<i className="icon-notifications-off"></i> Seguir
							</button>
						}
					</ul>
				</div>
				<div className="comment-section-list">
					{exchangeNodes}
				</div>
				{
					window.user?
					<CommentInput post={this.props.post} />
					:null
				}
			</div>
		);
		// <button className="reply" onClick={this.onClickReply}
		// 	data-toggle="tooltip" data-placement="bottom" data-container="body"
		// 	title="Participar dessa discussão.">
		// 	<i className="icon-arrow-back-outline"></i> Responder
		// </button>
	},
});
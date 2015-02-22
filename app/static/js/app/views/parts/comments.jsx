
var $ = require('jquery')
var _ = require('lodash')
var React = require('react')
require('jquery-textcomplete')
require('jquery-overlay')
require('jquery-linkify')
require('autosize');

var Models = require('../../components/models.js')

var CommentInputAnon = React.createClass({
	render: function() {
		function gotoLogin () {
			window.location = '/entrar';
		}

		return (
			<div className="comment-input">
				<div className="comment-wrapper">
					<div className="avatar-col">
						<div className="anon-user-avatar">
							<i className="icon-person"></i>
						</div>
					</div>
					<div className="content-col input">
						<div className="anon-message" onClick={gotoLogin}>
							Entre para participar da discussão.
						</div>
					</div>
				</div>
			</div>
		);
	}
});

var CommentInput = React.createClass({

	propTypes: {
		post: function (props, propName, componentName) {
			if (!(props[propName] instanceof Models.Post)) {
				return new Error('props.post should be a Models.PostItem.');
			}
		},
		threadRootId: function (props, propName, componentName) {
			var id = props[propName];
			if (id) {
				// If passed, make sure the comment it refers to exists.
				if (!(props.post.comments.get(id))) {
					return new Error('props.threadRootId should be the id of a comment '+
						'in the props.post.comments.');
				}
			}
		},
		// optional: to be called when user is done (posting a comment or canceling)
		onDone: React.PropTypes.func,
	},

	getInitialState: function () {
		return { hasFocus: false };
	},

	/**
	 * Suggest usernames when user starts typing one.
	 * Requires the textcomplete and overlay jquery plugins.
	 */
	setupTextcomplete: function () {
		// Suggest usernames from the post participations object.
		var mentions = _.filter(
			_.map(
				this.props.post.get('participations'),
				function (a) {
					return a.user.username;
				}
			),
			function (i) {
				return i && i !== window.user.username;
			}
		);

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
		}], { appendTo: 'body' }).overlay([
				{
						match: /\B@\w+/g,
						css: {
								'background-color': '#d8dfea'
						}
				}
		]);
	},

	componentDidMount: function () {
		_.defer(function () {
			if (this.isMounted()) {
				$(this.getDOMNode()).find('.autosize').autosize({ append: false });
			}
		}.bind(this));

		this.setupTextcomplete();
	},

	componentDidUpdate: function () {
		// ESC key when editing a comment removes focus.
		$(this.refs.input.getDOMNode()).keyup(function(e) {
			if (e.keyCode === 27) { // ESC
				e.preventDefault();
				this.setState({ hasFocus: false });
				$(this.refs.input.getDOMNode()).blur();

			}
		}.bind(this));
	},

	render: function () {
		function focus () {
			this.setState({ hasFocus: true });
		}

		function handleCancel () {
			this.setState({ hasFocus: false });
			if (this.props.onDone) {
				this.props.onDone();
			}
		}

		function handleSubmit (event) {
			event.preventDefault();

			var comment = new Models.Comment({
				author: window.user,
				content: { body: this.refs.input.getDOMNode().value },
				threadRoot: this.props.threadRootId,
			});

			comment.save(null, {
				url: this.props.post.get('apiPath')+'/comments',
				// timeout: 8000,
				success: function (model, response) {
					app.flash.info("Comentário salvo :)");
					this.setState({ hasFocus: false });
					this.refs.input.getDOMNode().value = '';
					comment.set(response.data);
					this.props.post.comments.add(comment);
					if (this.props.onDone) {
						this.props.onDone(comment);
					}
				}.bind(this),
				error: function (model, xhr, options) {
					app.flash.alert(xhr.responseJSON.message || 'Milton Friedman.');
				}.bind(this),
			});
		}

		var placeholder = "Participe da discussão escrevendo um comentário.";

		return (
			<div className="comment-input">
				<div className="comment-wrapper">
					<div className="avatar-col">
						<div className="user-avatar">
							<div
								className="avatar"
								style={{ background: 'url('+window.user.avatarUrl+')' }}>
							</div>
						</div>
					</div>
					<div className="content-col input">
						<textarea required="required" ref="input" className='autosize'
							onFocus={focus.bind(this)}
							style={{ height: '42px' }}
							placeholder={placeholder}>
						</textarea>
						{
							(this.state.hasFocus || this.props.threadRootId) &&
							<div className="toolbar-editing">
								<div className="tip">
									Mostre o seu melhor português.
								</div>
								<ul className="right">
									<li>
										<button className="undo" onClick={handleCancel.bind(this)}>
											Cancelar
										</button>
									</li>
									<li>
										<button className="save" onClick={handleSubmit.bind(this)}>
											Enviar
										</button>
									</li>
								</ul>
							</div>
						}
					</div>
				</div>
			</div>
		);
	},
});

var Comment = React.createClass({

	propTypes: {
		model: function (props, propName, componentName) {
			if (!(props[propName] instanceof Models.Comment)) {
				return new Error('props.model should be a Models.Comment.');
			}
		},
		threadRootId: function (props, propName, componentName) {
			var id = props[propName];
			if (id) {
				// If passed, make sure the comment it refers to exists.
				if (!(props.post.comments.get(id))) {
					return new Error('props.threadRootId should be the id of a comment '+
						'in the props.post.comments.');
				}
			}
		},
		post: function (props, propName, componentName) {
			if (!(props[propName] instanceof Models.Post)) {
				return new Error('props.post should be a Models.PostItem.');
			}
		},
		// optional: call to trigger replying on root of this replyTree
		replyThreadRoot: React.PropTypes.func,
	},

	getInitialState: function () {
		return {
			replying: false,
			editing: false,
			showChildren: true,
		};
	},

	componentDidUpdate: function () {
		app.utils.refreshLatex();
	},

	componentWillMount: function () {
		var update = function () {
			this.forceUpdate(function(){});
		}.bind(this);
		this.props.model.on('add reset change', update);
	},

	componentDidMount: function () {
		// Turn urls in the text into links.
		$(this.getDOMNode()).linkify();
		app.utils.refreshLatex();
	},

	render: function () {
		var comment = this.props.model.attributes;
		var authorIsDiscussionAuthor = this.props.post.get('author').id === comment.author.id;
		var countNested = this.props.children && this.props.children.length || 0;

		function toggleShowChildren () {
			this.setState({
				showChildren: !this.state.showChildren,
			});
		}

		function reply () {
			if (!window.user) {
				app.utils.pleaseLoginTo("responder esse comentário");
				return;
			}

			if (this.props.threadRootId) {
				// If we're nested, trigger replying on the root of our reply tree.
				this.props.replyThreadRoot();
			} else if (window.user) {
				this.setState({ replying: true, showChildren: true }, function () {
					// Make reply box visible if necessary
					var $el = $(this.refs.reply.getDOMNode()),
							pcontainer = app.pages.getActive().target;
					// Element is below viewport
					if ($(pcontainer).height() < $el.offset().top) {
						console.log('below viewport', $(pcontainer).height(), $el.offset().top)
						$(pcontainer).scrollTop($el.scrollTop()+$el.offset().top+$el.height()-$(pcontainer).height())
					}
				}.bind(this));
			}
		}

		// How should the comment text be displayed?
		// As text? As a textarea the user can edit? This is decided here.
		var TextBlock;
		if (this.state.editing) {
			function onClickSave () {
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
			}

			function onCancelEdit () {
				this.setState({ editing: false });
			}

			function onClickTrash () {
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
			}

			var TextBlock = (
				<div className="comment-wrapper">
					<div className="avatar-col" title={comment.author.username}>
					<a href={comment.author.path}>
						<div className="user-avatar">
							<div className="avatar"
								style={{background: 'url('+comment.author.avatarUrl+')'}}></div>
						</div>
					</a>
					</div>
					<div className="content-col input">
						<textarea ref="textarea"
							defaultValue={ _.unescape(comment.content.body) }
						/>
						<div className="toolbar-editing">
							<div className="tip">
								Mostre o seu melhor português.
							</div>
							<ul className="right">
								<li>
									<button className="cancel" onClick={onCancelEdit.bind(this)}>
										Cancelar
									</button>
								</li>
								<li>
									<button className="delete" onClick={onClickTrash.bind(this)}>
										Excluir
									</button>
								</li>
								<li>
									<button className="save" onClick={onClickSave.bind(this)}>
										Salvar
									</button>
								</li>
							</ul>
						</div>
					</div>
				</div>
			);
		} else {
			function edit () {
				$('.tooltip').remove();
				this.setState({ editing: true }, function () {
					$(this.refs.textarea.getDOMNode()).autosize({ append: false });
				}.bind(this));
			}

			var TextBlock = (
				<div className="comment-wrapper">
					<div className="avatar-col" title={comment.author.username}>
						<a href={comment.author.path}>
							<div className="user-avatar">
								<div className="avatar" style={{background: 'url('+comment.author.avatarUrl+')'}}>
								</div>
							</div>
						</a>
					</div>
					<div className="content-col">
						<span className="top">
							<a className="name" href={comment.author.path}>
								{comment.author.name}
							</a>
							{authorIsDiscussionAuthor?(<span className="label">autor</span>):null}
							<time data-short="false" data-time-count={1*new Date(comment.created_at)} title={formatFullDate(new Date(comment.created_at))}>
								{window.calcTimeFrom(comment.created_at, false)}
							</time>
						</span>
						<div className="body">
						{
							comment.deleted?
							<span className="deleted">comentário excluído</span>
							:comment.content.body
						}
						</div>
						<div className="toolbar">
							<li className="votes">
								<span className="count" title="Votos">
									{comment.counts.votes}
								</span>
								<button className="up"
								onClick={this.props.model.toggleVote.bind(this.props.model)}
								data-voted={this.props.model.liked?"true":""}
								disabled={this.props.model.userIsAuthor || comment.deleted}
								title="Votar">
									<i className="icon-thumb-up"></i>
								</button>
							</li>
							<li className="separator">
								<i className="icon-dot"></i>
							</li>
							<li className="reply">
								<button onClick={reply.bind(this)} title="Responder" disabled={comment.deleted}>
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
									<button className="edit"
										title="Editar"
										onClick={edit.bind(this)}
										disabled={comment.deleted}>
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

		var replyBox;
		if (this.state.replying) {
			var replyBox = (
				<CommentInput ref="reply"
					threadRootId={comment.id}
					post={this.props.post}
					onDone={function () {
						this.setState({ replying: false });
					}.bind(this) } />
			);
		}

		// Here we show nested comments and the reply box.
		var NotTheTextBlock;
		if (countNested > 0) {
			if (this.state.showChildren) {
				var childrenNotes = _.map(this.props.children || [],
					function (comment) {
						return (
							<Comment key={comment.id}
								model={comment}
								threadRootId={this.props.model.get('id')}
								replyThreadRoot={reply.bind(this)}
								post={this.props.post}>
							</Comment>
						);
					}.bind(this)
				);
				var NotTheTextBlock = (
					<ul className="children">
						<div className="children-info"
							onClick={toggleShowChildren.bind(this)}>
							<div className="detail">
								Esconder {countNested} resposta{countNested==1?'':'s'}.
								<i className="icon-keyboard-arrow-up"></i>
							</div>
						</div>
						{childrenNotes}
						{replyBox}
					</ul>
				);
			} else {
				var NotTheTextBlock = (
					<div className="children">
						<div className="children-info"
							onClick={toggleShowChildren.bind(this)}>
							<div className="detail">
								Mostrar {countNested} resposta{countNested==1?'':'s'}
								<i className="icon-keyboard-arrow-down"></i>
							</div>
						</div>
						<ul className="nodes"></ul>
						{replyBox}
					</div>
				);
			}
		} else if (this.state.replying) {
			var NotTheTextBlock = (
				<div className="children">
					{replyBox}
				</div>
			);
		}

		return (
			<div className={"exchange "+(this.state.editing?" editing":"")}>
				{TextBlock}
				{NotTheTextBlock}
			</div>
		);
	},
});

module.exports = React.createClass({

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
				<Comment key={comment.id}
					model={comment}
					post={this.props.post}>
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
					:<CommentInputAnon post={this.props.post} />
				}
			</div>
		);
	},
});
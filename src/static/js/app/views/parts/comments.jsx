/** @jsx React.DOM */

var $ = require('jquery')
var Backbone = require('backbone')
var _ = require('lodash')
var React = require('react')

var textcomplete = require('jquery-textcomplete')
var jqueryOverlay = require('jquery-overlay')
var models = require('../../components/models.js')
var Modal = require('./modal.js')

function refreshLatex () {
	setTimeout(function () {
		if (window.MathJax)
			MathJax.Hub.Queue(["Typeset",MathJax.Hub]);
		else
			console.warn("MathJax object not found.");
	}, 10);
}

var backboneCollection = {
	componentWillMount: function () {
		var update = function () {
			this.forceUpdate(function(){});
		}
		this.props.collection.on('add reset change remove', update.bind(this));
	},
};

var backboneModel = {
	componentWillMount: function () {
		var update = function () {
			this.forceUpdate(function(){});
		}
		this.props.model.on('add reset remove change', update.bind(this));
	},
};

// marked = require('marked');
// var renderer = new marked.Renderer();
// renderer.codespan = function (html) {
// 	// Don't consider codespans in markdown (they're actually 'latex')
// 	return '`'+html+'`';
// }

// marked.setOptions({
// 	renderer: renderer,
// 	gfm: false,
// 	tables: false,
// 	breaks: false,
// 	pedantic: false,
// 	sanitize: true,
// 	smartLists: true,
// 	smartypants: true,
// })

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

		var data = {
			content: { body: bodyEl.val() },
			replies_to: this.props.replies_to && this.props.replies_to.get('id')
		}

		$.ajax({
			type: 'post',
			dataType: 'json',
			url: this.props.post.get('apiPath')+'/comments',
			timeout: 8000,
			data: data
		}).done(function (response) {
			if (response.error) {
				app.flash.alert(response.message || 'Erro!');
			} else {
				self.setState({ hasFocus: false });
				bodyEl.val('');
				var item = new models.commentItem(response.data);
				self.props.post.comments.add(item);
				if (self.props.on_reply)
					self.props.on_reply(item);
			}
		}).fail(function (xhr, textStatus) {
			if (xhr.responseJSON && xhr.responseJSON.message)
				app.flash.alert(xhr.responseJSON.message);
			else if (textStatus === 'timeout')
				app.flash.alert("Falha de comunicação com o servidor.");
			else
				app.flash.alert("Erro.");
		});
	},

	showMarkdownHelp: function () {
		Modal.MarkdownDialog({
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
		var placeholder = "Participar da discussão.";
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
				<div className="left">
					<div className="user-avatar">
						<div className="avatar" style={{background: 'url('+window.user.avatarUrl+')'}}></div>
					</div>
				</div>
				<div className="right">
					<textarea style={{height: (this.props.replies_to?'31px':'42px')}} defaultValue={text} onFocus={this.focus} required="required" ref="input" type="text"
						placeholder={placeholder}></textarea>
					{(this.state.hasFocus || this.props.replies_to)?(
						<div className="toolbar">
							<div className="detail">
								Você pode formatar o seu texto. <a href="#" tabIndex="-1" onClick={this.showMarkdownHelp}>Saiba como aqui.</a>
							</div>
							<div className="toolbar-right">
								<button className="undo" onClick={this.handleCancel}>Cancelar</button>
								<button className="send" onClick={this.handleSubmit}>Enviar</button>
							</div>
						</div>
					):null}
				</div>
			</div>
		);
	},
});

var Comment = React.createClass({
	mixins: [backboneModel],

	getInitialState: function () {
		return { replying: false, editing: false, hideChildren: false };
	},

	componentDidMount: function () {
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

	onClickReply: function () {
		this.setState({ replying: true, hideChildren: false });
	},

	onReplied: function () {
		this.setState({ replying: false });
	},

	// Editing

	onClickEdit: function () {
		$('.tooltip').remove();
		this.setState({ editing: true });
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
		if (confirm('Tem certeza que quer excluir permanentemente essa publicação?')) {
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
				<div className="line">
					<div className="line-user" title={doc.author.username}>
					<a href={doc.author.path}>
						<div className="user-avatar">
							<div className="avatar" style={{background: 'url('+doc.author.avatarUrl+')'}}>
							</div>
						</div>
					</a>
					</div>
					<div className="line-msg">
						<textarea ref="textarea" defaultValue={ doc.content.body } />
					</div>
					<div className="toolbar-editing">
						<button className="control save" onClick={this.onClickSave}>
							Salvar
						</button>
						<button className="control delete" onClick={this.onClickTrash}>
							Excluir
						</button>
					</div>
				</div>
			);
		} else {
			var Line = (
				<div className="line">
					<div className="line-user" title={doc.author.username}>
					<a href={doc.author.path}>
						<div className="user-avatar">
							<div className="avatar" style={{background: 'url('+doc.author.avatarUrl+')'}}>
							</div>
						</div>
					</a>
					</div>
					<div className="line-msg">
						<span className="authoring">
							<a className="name" href={doc.author.path}>
								{doc.author.name}
							</a>
							{authorIsDiscussionAuthor?(<span className="label">autor</span>):null}
							<time data-short="false" data-time-count={1*new Date(doc.created_at)} title={formatFullDate(new Date(doc.created_at))}>
								{window.calcTimeFrom(doc.created_at, false)}
							</time>
						</span>
						<span className="line-msg-body"
							dangerouslySetInnerHTML={{__html: doc.content.body }}></span>
					</div>
					{
						this.props.model.userIsAuthor?
						<div className="toolbar">
							<button className="control thumbsup"
							data-toggle="tooltip" data-placement="right" title="Votos"
							disabled>
								<span className="count">
									{doc.counts.votes}
								</span>
								<i className="icon-thumbs-up3"></i>
							</button>
							<button className="control edit"
							data-toggle="tooltip" data-placement="right" title="Editar"
							onClick={this.onClickEdit}>
								<i className="icon-pencil2"></i>
							</button>
						</div>
						:
						<div className="toolbar">
							<button className="control thumbsup"
							data-toggle="tooltip" data-placement="right"
							title={this.props.model.liked?"Desfazer voto":"Votar"}
							onClick={this.props.model.toggleVote.bind(this.props.model)} data-voted={this.props.model.liked?"true":""}>
								<span className="count">
									{doc.counts.votes}
								</span>
								<i className={"icon-thumbs-"+(this.props.model.liked?"up":"up")+"3"}></i>
							</button>
							<button className="control reply"
							data-toggle="tooltip" data-placement="right" title="Responder"
							onClick={this.onClickReply}>
								<i className="icon-reply"></i>
								<span className="count">
									{childrenCount}
								</span>
							</button>
						</div>
					}
				</div>
			)
		}

		if (this.state.replying && window.user) {
			var self = this;
			var commentInput = (
				<CommentInput
					nested={this.props.nested}
					post={this.props.post}
					replies_to={this.props.model}
					cancel={function () { self.setState( { replying: false }) }}
					on_reply={this.onReplied} />
			);
		}

		if (childrenCount) {
			var faces = _.map(this.props.children,
				function (i) { return i.attributes.author.avatarUrl });
			var ufaces = _.unique(faces);
			var avatars = _.map(ufaces.slice(0,4), function (img) {
					return (
						<div className="user-avatar" key={img}>
							<div className="avatar" style={{ backgroundImage: 'url('+img+')'}}>
							</div>
						</div>
					);
				}.bind(this));
			if (this.state.hideChildren) {
				var Children = (
					<div className="children">
						<div className="children-info" onClick={this.toggleShowChildren}>
							<div className="detail">
								{childrenCount} comentário{childrenCount==1?'':'s'} escondido{childrenCount==1?'':'s'} [clique para mostrar]
							</div>
							<div className="right">
								<i className="icon-ellipsis"></i> {avatars}
							</div>
						</div>
						{commentInput}
						<ul className="nodes">
						</ul>
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
								Mostrando {childrenCount} comentário{childrenCount==1?'':'s'}. [clique para esconder]
							</div>
						</div>
						{commentInput}
						{childrenNotes}
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
	mixins: [backboneCollection],

	getInitialState: function () {
		return { replying: false }
	},

	componentDidMount: function () {
		this.props.collection.trigger('mount');
		refreshLatex();
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
		refreshLatex();
	},

	onClickReply: function () {
		this.setState({ replying: true })
	},

	render: function () {
		var levels = this.props.collection.groupBy(function (e) {
			return e.get('thread_root') || null;
		});

		// Get nodes that have no thread_roots.
		var exchangeNodes = _.map(levels[null], function (comment) {
			return (
				<Comment model={comment} key={comment.id} post={this.props.post} nested={false}>
					{levels[comment.id]}
				</Comment>
			);
		}.bind(this));

		return (
			<div className="comment-section">
				<div className="comment-section-list">
					<div className="comment-section-info">
						<label>
							{this.props.collection.models.length} Comentário{this.props.collection.models.length>1?"s":""}
						</label>
						<ul>
							{
								this.props.post.watching?
								<button className="follow active" onClick={this.props.post.toggleWatching}
									data-toggle="tooltip" data-placement="bottom" data-container="bodY"
									title="Receber notificações quando essa discussão por atualizada.">
									<i className="icon-sound"></i> Seguindo
								</button>
								:<button className="follow" onClick={this.toggleWatch}
									data-toggle="tooltip" data-placement="bottom" data-container="bodY"
									title="Receber notificações quando essa discussão por atualizada.">
									<i className="icon-soundoff"></i> Seguir
								</button>
							}
						</ul>
					</div>
					{
						window.user?
						<CommentInput post={this.props.post} />
						:null
					}
					{exchangeNodes}
				</div>
			</div>
		);
		// <button className="reply" onClick={this.onClickReply}
		// 	data-toggle="tooltip" data-placement="bottom" data-container="bodY"
		// 	title="Participar dessa discussão.">
		// 	<i className="icon-arrow-back-outline"></i> Responder
		// </button>
	},
});
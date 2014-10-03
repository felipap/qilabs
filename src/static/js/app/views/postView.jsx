/** @jsx React.DOM */

var $ = require('jquery')
var Backbone = require('backbone')
var _ = require('lodash')
var React = require('react')
var MediumEditor = require('medium-editor')

var models = require('../components/models.js')
var toolbar = require('./parts/toolbar.js')
var Modal = require('./parts/modal.js')

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

var EditablePost = {
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
};

marked = require('marked');
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

/////////////////


var PostHeader = React.createClass({
	mixins: [EditablePost],

	onClickShare: function () {
		Modal.ShareDialog({
			message: 'Compartilhe essa '+this.props.model.get('translatedType'),
			title: this.props.model.get('content').title,
			url: 'http://www.qilabs.org'+this.props.model.get('path'),
		});
	},

	render: function () {
		var post = this.props.model.attributes;
		var userIsAuthor = window.user && post.author.id===window.user.id;

		var FollowBtn = null;
		if (window.user) {
			if (!userIsAuthor && post._meta && typeof post._meta.authorFollowed !== 'undefined') {
				if (post._meta.authorFollowed) {
					FollowBtn = (
						<button className="btn-follow" data-action="unfollow" data-user={post.author.id}></button>
					)
				} else {
					FollowBtn = (
						<button className="btn-follow" data-action="follow" data-user={post.author.id}></button>
					)
				}
			}
		}

		var pageObj;
		var tagNames = [];
		var subtagsUniverse = {};
		if (post.subject && post.subject in pageMap) {
			pageObj = pageMap[post.subject];

			if (post.subject && pageMap[post.subject] && pageMap[post.subject].children)
				subtagsUniverse = pageMap[post.subject].children;

			if (pageObj) {
				tagNames.push(pageObj);
				_.each(post.tags, function (id) {
					if (id in subtagsUniverse)
						tagNames.push({
							name: subtagsUniverse[id].name,
							path: pageMap[post.subject].path+'?tag='+id
						});
				});
			}
		}

		var views;
		if (post._meta.views && post._meta.views > 1) {
			var count = Math.ceil(post._meta.views/10)*10;
			// change this
			views = (
				<span className="views">
					<i className="icon-circle"></i> {count} VISUALIZAÇÕES
				</span>
			);
		}

		return (
			<div className="postHeader">
				<div className="type">
					{post.translatedType}
				</div>
				<div className="tags">
					{_.map(tagNames, function (obj) {
						if (obj.path)
							return (
								<a className="tag" href={obj.path} key={obj.name}>
									#{obj.name}
								</a>
							);
						return (
							<div className="tag" key={obj.name}>
								#{obj.name}
							</div>
						);
					})}
				</div>
				<div className="postTitle">
					{post.content.title}
				</div>
				<time>
					&nbsp;publicado&nbsp;
					<span data-time-count={1*new Date(post.created_at)}>
						{window.calcTimeFrom(post.created_at)}
					</span>
					{(post.updated_at && 1*new Date(post.updated_at) > 1*new Date(post.created_at))?
						(<span>
							,&nbsp;<span data-toggle="tooltip" title={window.calcTimeFrom(post.updated_at)}>editado</span>
						</span>
						)
						:null
					}
					{views}
				</time>

				<div className="authorInfo">
					por&nbsp;&nbsp;
					<a href={post.author.path} className="username">
						<div className="avatarWrapper">
							<div className="avatar" style={ { background: 'url('+post.author.avatarUrl+')' } }></div>
						</div>
						{post.author.name}
					</a>
					{FollowBtn}
				</div>

				{
					(userIsAuthor)?
					<div className="flatBtnBox">
						{toolbar.LikeBtn({
							cb: function () {},
							active: true,
							text: post.counts.votes
						})}
						{toolbar.EditBtn({cb: this.props.parent.onClickEdit}) }
						{toolbar.ShareBtn({cb: this.onClickShare}) }
					</div>
					:<div className="flatBtnBox">
						{toolbar.LikeBtn({
							cb: this.props.parent.toggleVote,
							active: window.user && post.votes.indexOf(window.user.id) != -1,
							text: post.counts.votes
						})}
						{toolbar.ShareBtn({cb: this.onClickShare})}
						{toolbar.FlagBtn({cb: this.onClickFlag})}
					</div>
				}
			</div>
		);
	}
});

var Comment = {
	View: React.createClass({
		mixins: [EditablePost],
		render: function () {
			var comment = this.props.model.attributes;
			var self = this;

			function smallify (url) {
				return url;
				if (url.length > 50)
				// src = /((https?:(?:\/\/)?)(?:www\.)?[A-Za-z0-9\.\-]+).{20}/.exec(url)[0]
				// '...'+src.slice(src.length-30)
					return '...'+/https?:(?:\/\/)?[A-Za-z0-9][A-Za-z0-9\-]*([A-Za-z0-9\-]{2}\.[A-Za-z0-9\.\-]+(\/.{0,20})?)/.exec(url)[1]+'...'
				else return url;
			}

			function urllify (text) {
				var urlRegex = /(((https?:(?:\/\/)?)(?:www\.)?[A-Za-z0-9\.\-]+)((?:\/[\+~%\/\.\w\-_]*)?\??(?:[\-\+=&;%@\.\w_]*)#?(?:[\.\!\/\\\w]*))?)/
				return text.replace(urlRegex, function (url) {
					return "<a href=\""+url+"\">"+smallify(url)+"</a>"
				});
			}

			var escaped = urllify(comment.content.body);

			return (
				<div className="commentWrapper">
					<div className='msgBody'>
						<div className="arrow"></div>
						<span dangerouslySetInnerHTML={{__html: escaped }}></span>
					</div>
					<div className="infoBar">
						<a className="userLink author" href={comment.author.path}>
							<div className="avatarWrapper">
								<div className="avatar" style={{ background: 'url('+comment.author.avatarUrl+')' }} title={comment.author.username}>
								</div>
							</div>
							<span className="name">
								{comment.author.name}
							</span>
						</a>&nbsp;·&nbsp;

						<time data-time-count={1*new Date(comment.meta.created_at)}>
							{window.calcTimeFrom(comment.meta.created_at)}
						</time>

						{(window.user && window.user.id === comment.author.id)?
							<div className="optionBtns">
								<button data-action="remove-post" onClick={this.onClickTrash}>
									<i className="icon-trash-o"></i>
								</button>
							</div>
						:undefined}
					</div>
				</div>
			);
		},
	}),
	InputForm: React.createClass({

		getInitialState: function () {
			return {showInput:false};
		},

		componentDidUpdate: function () {
			var self = this;
			// This only works because showInput starts out as false.
			if (this.refs && this.refs.input) {
				this.refs.input.getDOMNode().focus();
				$(this.refs.input.getDOMNode()).autosize();
				if (this.props.small) {
					$(this.refs.input.getDOMNode()).keyup(function (e) {
						// Prevent newlines in comments.
						if (e.keyCode == 13) { // enter
							e.preventDefault();
						} else if (e.keyCode == 27) { // esc
							// Hide box if the content is "empty".
							if (self.refs.input.getDOMNode().value.match(/^\s*$/))
								self.setState({showInput:false});
						}
					});
				}
				$(this.refs.input.getDOMNode()).keyup(function (e) {
					if (!self.refs.input) return;
					var count = self.refs.input.getDOMNode().value.length,
						node = self.refs.count.getDOMNode();
					node.innerHTML = count;
					if (!count)
						$(node).addClass('empty').removeClass('ilegal');
					else if (count < 1000)
						$(node).removeClass('empty ilegal');
					else
						$(node).addClass('ilegal');
				});
			}
		},

		showInput: function () {
			this.setState({showInput:true});
		},

		handleSubmit: function (evt) {
			evt.preventDefault();
			var self = this;

			// Prevent double submission
			this.refs.sendBtn.getDOMNode().disabled = true;

			var c = new models.commentItem({
				author: window.user,
				content: {
					body: this.refs.input.getDOMNode().value,
				},
			});

			var val = c.save(undefined, {
				url: this.props.model.get('apiPath')+'/comments',
				success: function (model, response) {
					app.flash.info("Comentário enviado.");
					self.refs.sendBtn.getDOMNode().disabled = false;
					if (response.error) {
						app.flash.alert(response.message || 'Erro!');
					} else {
						this.refs.input.getDOMNode().value = '';
						self.setState({showInput:false});
						self.props.model.children.add(new models.commentItem(response.data));
					}
				}.bind(this),
				error: function (model, xhr, options) {
					var data = xhr.responseJSON;
					if (data && data.message) {
						app.flash.alert(data.message);
					} else {
						app.flash.alert('Milton Friedman.');
					}
					self.refs.sendBtn.getDOMNode().disabled = false;
				}.bind(this)
			});
			if (!val) { // Validation failed. Restore button.
				self.refs.sendBtn.getDOMNode().disabled = false;
			}
		},

		render: function () {
			if (!window.user)
				return (<div></div>);
			var mediaUserAvatarStyle = {
				background: 'url('+window.user.avatarUrl+')',
			};

			return (
				<div>
					{
						this.state.showInput?(
							<div className={"commentInputSection "+(this.props.small?"small":'')}>
								<form className="formPostComment" onSubmit={this.handleSubmit}>
									<textarea required="required" ref="input" type="text" placeholder="Seu comentário aqui..."></textarea>
									<button ref="sendBtn" data-action="send-comment" onClick={this.handleSubmit}>Enviar</button>
									<span className="count" ref="count">0</span>
								</form>
							</div>
						):(
							<div className="showInput" onClick={this.showInput}>
								Fazer comentário.
							</div>
						)
					}
				</div>
			);
		},
	}),
	ListView: React.createClass({
		mixins: [backboneCollection],

		render: function () {
			var commentNodes = this.props.collection.map(function (comment) {
				return (
					<CommentView model={comment} key={comment.id} />
				);
			});

			return (
				<div className="commentList">
					{
						this.props.small?
						null
						:<label>{this.props.collection.models.length} Comentário{this.props.collection.models.length>1?"s":""}</label>
					}

					{commentNodes}
				</div>
			);
		},
	}),
	SectionView: React.createClass({
		mixins: [backboneCollection],

		render: function () {
			if (!this.props.collection)
				return <div></div>;
			return (
				<div className={"commentSection "+(this.props.small?' small ':'')}>
					<CommentListView placeholder={this.props.placeholder} collection={this.props.collection} />
					<CommentInputForm model={this.props.postModel} />
				</div>
			);
		},
	}),
};

//////////////////////////////////////////////////////////////////////////////////////////
//////////////////////////////////////////////////////////////////////////////////////////

var DiscussionInput = React.createClass({

	getInitialState: function () {
		return { hasFocus: false };
	},

	componentDidMount: function () {
		var self = this;
		_.defer(function () {
			$(this.refs.input.getDOMNode()).autosize({ append: false });
		}.bind(this));
	},

	focus: function () {
		this.setState({ hasFocus: true});
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
			url: this.props.parent.get('apiPath')+'/comments',
			timeout: 8000,
			data: data
		}).done(function (response) {
			if (response.error) {
				app.flash.alert(response.message || 'Erro!');
			} else {
				self.setState({ hasFocus: false });
				bodyEl.val('');
				var item = new models.commentItem(response.data);
				self.props.parent.children.add(item);
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

	render: function () {
		var placeholder = "Participar da discussão.";
		if (this.props.replies_to) {
			placeholder = "Responder à "+this.props.replies_to.get('author').name+'.';
		}

		var text = '';
		if (this.props.replies_to) {
			text = '@'+this.props.replies_to.get('author').username+' ';
		}

		return (
			<div className="exchange-input">
				<div className="left">
					<div className="user-avatar">
						<div className="avatar" style={{background: 'url('+window.user.avatarUrl+')'}}></div>
					</div>
				</div>
				<div className="right">
					<textarea style={{height: (this.props.replies_to?'31px':'42px')}} defaultValue={text} onClick={this.focus} required="required" ref="input" type="text"
						placeholder={placeholder}></textarea>
					{(this.state.hasFocus || this.props.replies_to)?(
						<div className="toolbar">
              <div className="detail">
                Formate o seu texto usando markdown. <a href="#" onClick={this.showMarkdownHelp}>Saiba como aqui.</a>
              </div>
							<div className="toolbar-right">
								<button data-action="send-comment" onClick={this.handleSubmit}>Enviar</button>
							</div>
						</div>
					):null}
				</div>
			</div>
		);
	},
});

var Exchange = React.createClass({
	mixins: [backboneModel, EditablePost],

	getInitialState: function () {
		return { replying: false, editing: false, hideChildren: true };
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

	// Voting

	toggleVote: function () {
		this.props.model.handleToggleVote();
	},

	// Replying

	onClickReply: function () {
		this.setState({ replying: true });
	},

	onReplied: function () {
		this.setState({ replying: false });
	},

	// Editing

	onClickEdit: function () {
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

	//

	render: function () {
		var doc = this.props.model.attributes;
		var userHasVoted, userIsAuthor;
		var authorIsDiscussionAuthor = this.props.parent.get('author').id === doc.author.id;
    var childrenCount = this.props.children && this.props.children.length || 0;

		if (window.user) {
			userHasVoted = doc.votes.indexOf(window.user.id) != -1;
			userIsAuthor = doc.author.id===window.user.id;
		}

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
            <time data-short="true" data-time-count={1*new Date(doc.meta.created_at)}>
              {window.calcTimeFrom(doc.meta.created_at, true)}
            </time>
            <span className="name">
              <a href={doc.author.path}>
                {doc.author.name}
              </a>
              {authorIsDiscussionAuthor?(<span className="label">autor</span>):null}
            </span>
            <span className="line-msg-body"
              dangerouslySetInnerHTML={{__html: marked(doc.content.body) }}></span>
          </div>
          {
            userIsAuthor?
            <div className="toolbar">
              <button disabled className="control thumbsup">
                <i className="icon-thumbsup"></i> {doc.counts.votes}
              </button>
              <button className="control edit" onClick={this.onClickEdit}>
                <i className="icon-pencil"></i>
              </button>
            </div>
            :
            <div className="toolbar">
              <button className="control thumbsup"
              data-toggle="tooltip" data-placement="right"
              title={userHasVoted?"Desfazer voto":"Votar"}
              onClick={this.toggleVote} data-voted={userHasVoted?"true":""}>
                <i className="icon-thumbsup"></i>
                <span className="count">
                  {doc.counts.votes}
                </span>
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

    if (childrenCount) {
      var faces = _.map(this.props.children,
        function (i) { return i.attributes.author.avatarUrl });
      var ufaces = _.unique(faces);
      console.log(faces, ufaces)
      var avatars = _.map(ufaces.slice(0,4), function (img) {
          return (
            <div className="user-avatar">
              <div className="avatar" style={{ backgroundImage: 'url('+img+')'}}>
              </div>
            </div>
          );
        }.bind(this));
      if (this.state.hideChildren) {
        var Children = (
          <ul className="children">
            <div className="children-info" onClick={this.toggleShowChildren}>
              <div className="detail">
                {childrenCount} comentários escondidos
              </div>
              <div className="right">
                <i className="icon-ellipsis"></i> {avatars}
              </div>
            </div>
          </ul>
        );
      } else {
        var childrenNotes = _.map(this.props.children || [], function (comment) {
          return (
            <Exchange model={comment} key={comment.id} parent={this.props.parent}></Exchange>
          );
        }.bind(this));
        var Children = (
          <ul className="children">
            <div className="children-info" onClick={this.toggleShowChildren}>
              <div className="detail">
                {childrenCount} comentários. clique para esconder
              </div>
              <div className="right">
                <i className="icon-ellipsis"></i> {avatars}
              </div>
            </div>
            {
              this.state.replying?
              <DiscussionInput
                parent={this.props.parent}
                replies_to={this.props.model}
                on_reply={this.onReplied} />
              :null
            }
            {childrenNotes}
          </ul>
        );
      }
    }

		return (
			<div className="exchange">
        {Line}
        {Children}
			</div>
		);
	},
});

var ExchangeSectionView = React.createClass({
	mixins: [backboneCollection],

	componentDidMount: function () {
		this.props.collection.trigger('mount');
		refreshLatex();
	},

	componentDidUpdate: function () {
		this.props.collection.trigger('update');
		refreshLatex();
	},

	render: function () {
		var levels = this.props.collection.groupBy(function (e) {
			return e.get('thread_root') || null;
		});

		// Get nodes that have no thread_roots.
		var exchangeNodes = _.map(levels[null], function (comment) {
			return (
				<Exchange model={comment} key={comment.id} parent={this.props.parent}>
					{levels[comment.id]}
				</Exchange>
			);
		}.bind(this));

		return (
			<div className="discussionSection">
				<div className="exchanges">
					<div className="exchanges-info">
						<label>
							{this.props.collection.models.length} Comentário{this.props.collection.models.length>1?"s":""}
						</label>
					</div>
					{
						window.user?
						<DiscussionInput parent={this.props.parent} />
						:null
					}
					{exchangeNodes}
				</div>
			</div>
		);
	},
});

//////////////////////////////////////////////////////////////////////////////////////////
//////////////////////////////////////////////////////////////////////////////////////////

var CommentSectionView = Comment.SectionView;
var CommentListView = Comment.ListView;
var CommentInputForm = Comment.InputForm;
var CommentView = Comment.View;

//

module.exports = React.createClass({
	mixins: [EditablePost, backboneModel],

	render: function () {
		var post = this.props.model.attributes;
		var body = this.props.model.get('content').body;
		// var body = marked(this.props.model.get('content').body);

		return (
			<div className='postCol'>
				<PostHeader model={this.props.model} parent={this.props.parent} />

				<div className="postBody" dangerouslySetInnerHTML={{__html: body}}>
				</div>

				<div className="postInfobar">
					<ul className="left"></ul>
				</div>

				<div className="postFooter">
				{
					this.props.model.get('type') === 'Note'?
					(
						<CommentSectionView collection={this.props.model.children} postModel={this.props.model} />
					):(
						<ExchangeSectionView collection={this.props.model.children} parent={this.props.model} />
					)
				}
				</div>
			</div>
		);
	},
});
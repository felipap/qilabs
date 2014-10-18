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


var PostHeader = React.createClass({displayName: 'PostHeader',
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

		var FollowBtn = null;
		if (window.user) {
			if (!this.props.model.userIsAuthor && post._meta && typeof post._meta.authorFollowed !== 'undefined') {
				if (post._meta.authorFollowed) {
					FollowBtn = (
						React.DOM.button( {className:"btn-follow", 'data-action':"unfollow", 'data-user':post.author.id})
					)
				} else {
					FollowBtn = (
						React.DOM.button( {className:"btn-follow", 'data-action':"follow", 'data-user':post.author.id})
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
				tagNames.push(_.extend(pageObj, { id: post.subject }));
				_.each(post.tags, function (id) {
					if (id in subtagsUniverse)
						tagNames.push({
							id: id,
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
				React.DOM.span( {className:"views"}, 
					React.DOM.i( {className:"icon-circle"}), " ", count, " VISUALIZAÇÕES"
				)
			);
		}

				// <div className="type">
				// 	{post.translatedType}
				// </div>
		return (
			React.DOM.div( {className:"postHeader"}, 
				React.DOM.div( {className:"tags"}, 
					_.map(tagNames, function (obj) {
						if (obj.path)
							return (
								React.DOM.a( {className:"tag tag-bg", 'data-tag':obj.id, href:obj.path, key:obj.name}, 
									"#",obj.name
								)
							);
						return (
							React.DOM.div( {className:"tag tag-bg", 'data-tag':obj.id, key:obj.name}, 
								"#",obj.name
							)
						);
					})
				),
				React.DOM.div( {className:"postTitle"}, 
					post.content.title
				),
				React.DOM.time(null, 
					" publicado ",
					React.DOM.span( {'data-time-count':1*new Date(post.created_at)}, 
						window.calcTimeFrom(post.created_at)
					),
					(post.updated_at && 1*new Date(post.updated_at) > 1*new Date(post.created_at))?
						(React.DOM.span(null, 
							", ",React.DOM.span( {'data-toggle':"tooltip", title:window.calcTimeFrom(post.updated_at)}, "editado")
						)
						)
						:null,
					
					views
				),

				React.DOM.div( {className:"authorInfo"}, 
					React.DOM.a( {href:post.author.path, className:"username"}, 
						React.DOM.div( {className:"user-avatar"}, 
							React.DOM.div( {className:"avatar", style: { background: 'url('+post.author.avatarUrl+')' } })
						),
						post.author.name
					),
					FollowBtn
				),

				
					(this.props.model.userIsAuthor)?
					React.DOM.div( {className:"flatBtnBox"}, 
						toolbar.LikeBtn({
							cb: function () {},
							active: true,
							text: post.counts.votes
						}),
						toolbar.EditBtn({cb: this.props.parent.onClickEdit}), 
						toolbar.ShareBtn({cb: this.onClickShare}) 
					)
					:React.DOM.div( {className:"flatBtnBox"}, 
						toolbar.LikeBtn({
							cb: this.props.parent.toggleVote,
							active: this.props.model.liked,
							text: post.counts.votes
						}),
						toolbar.ShareBtn({cb: this.onClickShare}),
						toolbar.FlagBtn({cb: this.onClickFlag})
					)
				
			)
		);
	}
});

var Comment = {
	View: React.createClass({displayName: 'View',
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
				React.DOM.div( {className:"commentWrapper"}, 
					React.DOM.div( {className:"msgBody"}, 
						React.DOM.div( {className:"arrow"}),
						React.DOM.span( {dangerouslySetInnerHTML:{__html: escaped }})
					),
					React.DOM.div( {className:"infoBar"}, 
						React.DOM.a( {className:"userLink author", href:comment.author.path}, 
							React.DOM.div( {className:"user-avatar"}, 
								React.DOM.div( {className:"avatar", style:{ background: 'url('+comment.author.avatarUrl+')' }, title:comment.author.username}
								)
							),
							React.DOM.span( {className:"name"}, 
								comment.author.name
							)
						)," · ",

						React.DOM.time( {'data-time-count':1*new Date(comment.created_at)}, 
							window.calcTimeFrom(comment.created_at)
						),

						(window.user && window.user.id === comment.author.id)?
							React.DOM.div( {className:"optionBtns"}, 
								React.DOM.button( {'data-action':"remove-post", onClick:this.onClickTrash}, 
									React.DOM.i( {className:"icon-trash-o"})
								)
							)
						:undefined
					)
				)
			);
		},
	}),
	InputForm: React.createClass({displayName: 'InputForm',

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
				return (React.DOM.div(null));
			var mediaUserAvatarStyle = {
				background: 'url('+window.user.avatarUrl+')',
			};

			return (
				React.DOM.div(null, 
					
						this.state.showInput?(
							React.DOM.div( {className:"commentInputSection "+(this.props.small?"small":'')}, 
								React.DOM.form( {className:"formPostComment", onSubmit:this.handleSubmit}, 
									React.DOM.textarea( {required:"required", ref:"input", type:"text", placeholder:"Seu comentário aqui..."}),
									React.DOM.button( {ref:"sendBtn", 'data-action':"send-comment", onClick:this.handleSubmit}, "Enviar"),
									React.DOM.span( {className:"count", ref:"count"}, "0")
								)
							)
						):(
							React.DOM.div( {className:"showInput", onClick:this.showInput}, 
								"Fazer comentário."
							)
						)
					
				)
			);
		},
	}),
	ListView: React.createClass({displayName: 'ListView',
		mixins: [backboneCollection],

		render: function () {
			var commentNodes = this.props.collection.map(function (comment) {
				return (
					CommentView( {model:comment, key:comment.id} )
				);
			});

			return (
				React.DOM.div( {className:"commentList"}, 
					
						this.props.small?
						null
						:React.DOM.label(null, this.props.collection.models.length, " Comentário",this.props.collection.models.length>1?"s":""),
					

					commentNodes
				)
			);
		},
	}),
	SectionView: React.createClass({displayName: 'SectionView',
		mixins: [backboneCollection],

		render: function () {
			if (!this.props.collection)
				return React.DOM.div(null);
			return (
				React.DOM.div( {className:"commentSection "+(this.props.small?' small ':'')}, 
					CommentListView( {placeholder:this.props.placeholder, collection:this.props.collection} ),
					CommentInputForm( {model:this.props.postModel} )
				)
			);
		},
	}),
};

var CommentSectionView = Comment.SectionView;
var CommentListView = Comment.ListView;
var CommentInputForm = Comment.InputForm;
var CommentView = Comment.View;

//////////////////////////////////////////////////////////////////////////////////////////
//////////////////////////////////////////////////////////////////////////////////////////

var DiscussionInput = React.createClass({displayName: 'DiscussionInput',

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
			React.DOM.div( {className:"exchange-input"}, 
				React.DOM.div( {className:"left"}, 
					React.DOM.div( {className:"user-avatar"}, 
						React.DOM.div( {className:"avatar", style:{background: 'url('+window.user.avatarUrl+')'}})
					)
				),
				React.DOM.div( {className:"right"}, 
					React.DOM.textarea( {style:{height: (this.props.replies_to?'31px':'42px')}, defaultValue:text, onClick:this.focus, required:"required", ref:"input", type:"text",
						placeholder:placeholder}),
					(this.state.hasFocus || this.props.replies_to)?(
						React.DOM.div( {className:"toolbar"}, 
              React.DOM.div( {className:"detail"}, 
                "Formate o seu texto usando markdown. ", React.DOM.a( {href:"#", tabIndex:"-1", onClick:this.showMarkdownHelp}, "Saiba como aqui.")
              ),
							React.DOM.div( {className:"toolbar-right"}, 
								React.DOM.button( {'data-action':"send-comment", onClick:this.handleSubmit}, "Enviar")
							)
						)
					):null
				)
			)
		);
	},
});

var Exchange = React.createClass({displayName: 'Exchange',
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

	//

	render: function () {
		var doc = this.props.model.attributes;
		var userHasVoted;
		var authorIsDiscussionAuthor = this.props.parent.get('author').id === doc.author.id;
    var childrenCount = this.props.children && this.props.children.length || 0;

		if (window.user) {
			userHasVoted = doc.votes.indexOf(window.user.id) != -1;
		}

    if (this.state.editing) {
      var Line = (
        React.DOM.div( {className:"line"}, 
          React.DOM.div( {className:"line-user", title:doc.author.username}, 
          React.DOM.a( {href:doc.author.path}, 
            React.DOM.div( {className:"user-avatar"}, 
              React.DOM.div( {className:"avatar", style:{background: 'url('+doc.author.avatarUrl+')'}}
              )
            )
          )
          ),
          React.DOM.div( {className:"line-msg"}, 
            React.DOM.textarea( {ref:"textarea", defaultValue: doc.content.body } )
          ),
          React.DOM.div( {className:"toolbar-editing"}, 
						React.DOM.button( {className:"control save", onClick:this.onClickSave}, 
							"Salvar"
						),
						React.DOM.button( {className:"control delete", onClick:this.onClickTrash}, 
							"Excluir"
						)
					)
				)
			);
		} else {
      var Line = (
        React.DOM.div( {className:"line"}, 
          React.DOM.div( {className:"line-user", title:doc.author.username}, 
          React.DOM.a( {href:doc.author.path}, 
            React.DOM.div( {className:"user-avatar"}, 
              React.DOM.div( {className:"avatar", style:{background: 'url('+doc.author.avatarUrl+')'}}
              )
            )
          )
          ),
          React.DOM.div( {className:"line-msg"}, 
            React.DOM.time( {'data-short':"true", 'data-time-count':1*new Date(doc.created_at)}, 
              window.calcTimeFrom(doc.created_at, true)
            ),
            React.DOM.span( {className:"name"}, 
              React.DOM.a( {href:doc.author.path}, 
                doc.author.name
              ),
              authorIsDiscussionAuthor?(React.DOM.span( {className:"label"}, "autor")):null
            ),
            React.DOM.span( {className:"line-msg-body",
              dangerouslySetInnerHTML:{__html: marked(doc.content.body) }})
          ),
          
            this.props.model.userIsAuthor?
            React.DOM.div( {className:"toolbar"}, 
              React.DOM.button( {className:"control thumbsup",
              'data-toggle':"tooltip", 'data-placement':"right", title:"Votos",
            	disabled:true}, 
                React.DOM.i( {className:"icon-thumbsup"}), " ", doc.counts.votes
              ),
              React.DOM.button( {className:"control edit",
              'data-toggle':"tooltip", 'data-placement':"right", title:"Editar",
              onClick:this.onClickEdit}, 
                React.DOM.i( {className:"icon-pencil"})
              )
            )
            :
            React.DOM.div( {className:"toolbar"}, 
              React.DOM.button( {className:"control thumbsup",
              'data-toggle':"tooltip", 'data-placement':"right",
              title:userHasVoted?"Desfazer voto":"Votar",
              onClick:this.toggleVote, 'data-voted':userHasVoted?"true":""}, 
                React.DOM.i( {className:"icon-thumbsup"}),
                React.DOM.span( {className:"count"}, 
                  doc.counts.votes
                )
              ),
              React.DOM.button( {className:"control reply",
              'data-toggle':"tooltip", 'data-placement':"right", title:"Responder",
              onClick:this.onClickReply}, 
                React.DOM.i( {className:"icon-reply"}),
                React.DOM.span( {className:"count"}, 
                  childrenCount
                )
              )
            )
          
        )
      )
    }

    if (childrenCount) {
      var faces = _.map(this.props.children,
        function (i) { return i.attributes.author.avatarUrl });
      var ufaces = _.unique(faces);
      var avatars = _.map(ufaces.slice(0,4), function (img) {
          return (
            React.DOM.div( {className:"user-avatar"}, 
              React.DOM.div( {className:"avatar", style:{ backgroundImage: 'url('+img+')'}}
              )
            )
          );
        }.bind(this));
      if (this.state.hideChildren) {
        var Children = (
          React.DOM.div( {className:"children"}, 
            React.DOM.div( {className:"children-info", onClick:this.toggleShowChildren}, 
              React.DOM.div( {className:"detail"}, 
                childrenCount, " comentários escondidos"
              ),
              React.DOM.div( {className:"right"}, 
                React.DOM.i( {className:"icon-ellipsis"}), " ", avatars
              )
            ),
            
              this.state.replying?
              DiscussionInput(
                {parent:this.props.parent,
                replies_to:this.props.model,
                on_reply:this.onReplied} )
              :null,
            
            React.DOM.ul( {className:"nodes"}, 
            childrenNotes
            )
          )
        );
      } else {
        var childrenNotes = _.map(this.props.children || [], function (comment) {
          return (
            Exchange( {model:comment, key:comment.id, parent:this.props.parent})
          );
        }.bind(this));
        var Children = (
          React.DOM.ul( {className:"children"}, 
            React.DOM.div( {className:"children-info", onClick:this.toggleShowChildren}, 
              React.DOM.div( {className:"detail"}, 
                childrenCount, " comentários. clique para esconder"
              ),
              React.DOM.div( {className:"right"}, 
                React.DOM.i( {className:"icon-ellipsis"}), " ", avatars
              )
            ),
            
              this.state.replying?
              DiscussionInput(
                {parent:this.props.parent,
                replies_to:this.props.model,
                on_reply:this.onReplied} )
              :null,
            
            childrenNotes
          )
        );
      }
    } else if (this.state.replying) {
    	var Children = (
    		React.DOM.div( {className:"children"}, 
          DiscussionInput(
            {parent:this.props.parent,
            replies_to:this.props.model,
            on_reply:this.onReplied} )
    		)
    	);
    }

		return (
			React.DOM.div( {className:"exchange "+(this.state.editing?" editing":"")}, 
        Line,
        Children
			)
		);
	},
});

var LinkPreview = React.createClass({displayName: 'LinkPreview',
	propTypes: {
		link: React.PropTypes.string.isRequired,
		data: React.PropTypes.object.isRequired,
	},

	open: function () {
		window.open(this.props.link, '_blank');
	},

	render: function () {

		var hostname = URL && new URL(this.props.link).hostname;

		return (
			React.DOM.div( {className:"linkDisplay"}, 
				
					this.props.data.link_image?
					React.DOM.a( {href:this.props.data.link_image}, 
					React.DOM.div( {className:"thumbnail",
					style:{backgroundImage:'url('+this.props.data.link_image+')'}}, 
						React.DOM.div( {className:"blackout"}),
						React.DOM.i( {className:"icon-link"})
					)
					)
					:null,
				
				React.DOM.div( {className:"right", onClick:this.open, tabIndex:1}, 
					React.DOM.div( {className:"title"}, 
						React.DOM.a( {href:this.props.link}, 
							this.props.data.link_title
						)
					),
					React.DOM.div( {className:"description"}, this.props.data.link_description),
					React.DOM.div( {className:"hostname"}, 
						React.DOM.a( {href:this.props.link}, 
							hostname
						)
					)
				)
			)
		);
	}
});

var ExchangeSectionView = React.createClass({displayName: 'ExchangeSectionView',
	mixins: [backboneCollection],

	getInitialState: function () {
		return { replying: false }
	},

	componentDidMount: function () {
		this.props.collection.trigger('mount');
		refreshLatex();
		this.props.parent.on('change:_meta', function () {
			console.log('meta changed')
			if (this.props.parent.hasChanged('_meta')) {
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

	toggleWatch: function () {
		this.props.parent.handleToggleWatching()
	},

	render: function () {
		var levels = this.props.collection.groupBy(function (e) {
			return e.get('thread_root') || null;
		});

		// Get nodes that have no thread_roots.
		var exchangeNodes = _.map(levels[null], function (comment) {
			return (
				Exchange( {model:comment, key:comment.id, parent:this.props.parent}, 
					levels[comment.id]
				)
			);
		}.bind(this));

		return (
			React.DOM.div( {className:"discussionSection"}, 
				React.DOM.div( {className:"exchanges"}, 
					React.DOM.div( {className:"exchanges-info"}, 
						React.DOM.label(null, 
							this.props.collection.models.length, " Comentário",this.props.collection.models.length>1?"s":""
						),
						React.DOM.ul(null, 
							
								this.props.parent.watching?
								React.DOM.button( {className:"follow active", onClick:this.toggleWatch,
									'data-toggle':"tooltip", 'data-placement':"bottom", 'data-container':"bodY",
									title:"Receber notificações quando essa discussão por atualizada."}, 
									React.DOM.i( {className:"icon-soundoff"}), " Seguindo"
								)
								:React.DOM.button( {className:"follow", onClick:this.toggleWatch,
									'data-toggle':"tooltip", 'data-placement':"bottom", 'data-container':"bodY",
									title:"Receber notificações quando essa discussão por atualizada."}, 
									React.DOM.i( {className:"icon-sound"}), " Seguir"
								)
							
						)
					),
					
						window.user?
						DiscussionInput( {parent:this.props.parent} )
						:null,
					
					exchangeNodes
				)
			)
		);
		// <button className="reply" onClick={this.onClickReply}
		// 	data-toggle="tooltip" data-placement="bottom" data-container="bodY"
		// 	title="Participar dessa discussão.">
		// 	<i className="icon-arrow-back-outline"></i> Responder
		// </button>
	},
});

//////////////////////////////////////////////////////////////////////////////////////////
//////////////////////////////////////////////////////////////////////////////////////////

module.exports = React.createClass({displayName: 'exports',
	mixins: [EditablePost, backboneModel],

	render: function () {
		var post = this.props.model.attributes;
		var body = this.props.model.get('content').body;
		// var body = marked(this.props.model.get('content').body);

		return (
			React.DOM.div( {className:"postCol"}, 
				PostHeader( {model:this.props.model, parent:this.props.parent} ),

				
					post.content.link?
					LinkPreview( {data:post.content, link:post.content.link} )
					:null,
				

				React.DOM.div( {className:"postBody", dangerouslySetInnerHTML:{__html: body}}
				),

				React.DOM.div( {className:"postInfobar"}, 
					React.DOM.ul( {className:"left"})
				),

				React.DOM.div( {className:"postFooter"}, 
				
					false && this.props.model.get('type') === 'Note'?
					(
						CommentSectionView( {collection:this.props.model.children, postModel:this.props.model} )
					):(
						ExchangeSectionView( {collection:this.props.model.children, parent:this.props.model} )
					)
				
				)
			)
		);
	},
});
/** @jsx React.DOM */

/*
** postViews.jsx
** Copyright QiLabs.org
** BSD License
*/

var $ = require('jquery')
var Backbone = require('backbone')
var _ = require('underscore')
var models = require('./models.js')
var React = require('react')
var MediumEditor = require('medium-editor')

var mediumEditorAnswerOpts = {
	firstHeader: 'h1',
	secondHeader: 'h2',
	buttons: ['bold', 'italic', 'quote', 'anchor', 'underline', 'orderedlist'],
	buttonLabels: {
		quote: '<i class="icon-quote"></i>',
		orderedlist: '<i class="icon-list"></i>',
		anchor: '<i class="icon-link"></i>'
	}
};

/* React.js views */

var EditablePost = {
	onClickTrash: function () {
		if (confirm('Tem certeza que quer excluir permanentemente essa publicação?')) {
			this.props.model.destroy();
		}
	},
};

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

var Comment = {
	View: React.createClass({displayName: 'View',
		mixins: [EditablePost],
		render: function () {
			var comment = this.props.model.attributes;
			var self = this;

			var mediaUserAvatarStyle = {
				background: 'url('+comment.author.avatarUrl+')',
			};

			function smallify (url) {
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
							React.DOM.div( {className:"avatarWrapper"}, 
								React.DOM.div( {className:"avatar", style:mediaUserAvatarStyle, title:comment.author.username}
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

			var bodyEl = $(this.refs.input.getDOMNode());
			var self = this;
			$.ajax({
				type: 'post',
				dataType: 'json',
				url: this.props.model.get('apiPath')+'/comments',
				data: { content: { body: bodyEl.val() } }
			}).done(function (response) {
				if (response.error) {
					app.flash.alert(response.message || 'Erro!');
				} else {
					self.setState({showInput:false});
					bodyEl.val('');
					self.props.model.children.add(new models.commentItem(response.data));
				}
			}).fail(function (xhr) {
				app.flash.alert(xhr.responseJSON.message || 'Erro!');
			});

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
									React.DOM.button( {'data-action':"send-comment", onClick:this.handleSubmit}, "Enviar"),
									React.DOM.span( {className:"count", ref:"count"}, "0")
								)
							)
						):(
							React.DOM.div( {className:"showInput", onClick:this.showInput}, 
								this.props.model.get('type') === "Answer"?
								"Adicionar comentário."
								:"Fazer comentário."
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
					CommentListView(  {small:this.props.small, placeholder:this.props.placeholder, collection:this.props.collection} ),
					CommentInputForm( {small:this.props.small, model:this.props.postModel} )
				)
			);
		},
	}),
};

var PostHeader = React.createClass({displayName: 'PostHeader',
	mixins: [EditablePost],
	render: function () {
		var post = this.props.model.attributes;
		var userIsAuthor = window.user && post.author.id===window.user.id;

		var FollowBtn = null;
		if (window.user) {
			if (!userIsAuthor && post._meta && typeof post._meta.authorFollowed !== 'undefined') {
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

		var subtagsUniverse = {};
		if (post.subject && pageMap[post.subject] && pageMap[post.subject].children)
			subtagsUniverse = pageMap[post.subject].children;

		return (
			React.DOM.div( {className:"postHeader"}, 
				React.DOM.div( {className:"type"}, 
					post.translatedType
				),
				React.DOM.div( {className:"tags"}, 
					_.map(post.tags, function (tagId) {
						if (tagId in subtagsUniverse) {
							console.log(subtagsUniverse, subtagsUniverse[tagId])
							var obj = subtagsUniverse[tagId];
							return (
								React.DOM.a( {href:obj.path, className:"tag", key:tagId}, 
									"#",obj.name
								)
							);
						}
						return null;
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
						:null
					
				),

				React.DOM.div( {className:"authorInfo"}, 
					"por  ",
					React.DOM.div( {className:"avatarWrapper"}, 
						React.DOM.div( {className:"avatar", style: { background: 'url('+post.author.avatarUrl+')' } })
					),
					React.DOM.a( {href:post.author.path, className:"username"}, 
						post.author.name
					),
					FollowBtn
				),

				
					(userIsAuthor)?
					React.DOM.div( {className:"flatBtnBox"}, 
						React.DOM.div( {className:"item edit", onClick:this.props.parent.onClickEdit}, 
							React.DOM.i( {className:"icon-pencil"})
						),
						React.DOM.div( {className:"item remove", onClick:this.props.parent.onClickTrash}, 
							React.DOM.i( {className:"icon-trash-o"})
						),
						React.DOM.div( {className:"item share", onClick:this.props.parent.onClickLink}, 
							React.DOM.i( {className:"icon-share-alt"})
						),
						React.DOM.div( {className:"item watch", onClick:this.props.parent.onClickWatch}, 
							React.DOM.i( {className:"icon-eye"})
						)
					)
					:React.DOM.div( {className:"flatBtnBox"}, 
						React.DOM.div( {className:"item like "+((window.user && post.votes.indexOf(window.user.id) != -1)?"liked":""),
							onClick:this.props.parent.toggleVote}, 
							React.DOM.i( {className:"icon-heart-o"}),React.DOM.span( {className:"count"}, post.counts.votes)
						),
						React.DOM.div( {className:"item share", onClick:this.props.parent.onClickLink}, 
							React.DOM.i( {className:"icon-share-alt"})
						),
						React.DOM.div( {className:"item watch", onClick:this.props.parent.onClickWatch}, 
							React.DOM.i( {className:"icon-eye"})
						),
						React.DOM.div( {className:"item flag", onClick:this.props.parent.onClickFlag}, 
							React.DOM.i( {className:"icon-flag"})
						)
					)
				
			)
		);
	}
});

var ExchangeInputForm = React.createClass({displayName: 'ExchangeInputForm',

	getInitialState: function () {
		return {hasFocus:false};
	},

	componentDidMount: function () {
		var self = this;
		// this.refs.input.getDOMNode().focus();
		_.defer(function () {
			$(this.refs.input.getDOMNode()).autosize({ append: false });
		}.bind(this));
		// $(this.refs.input.getDOMNode()).keyup(function (e) {
		// 	if (!self.refs.input) return;
		// 	var count = self.refs.input.getDOMNode().value.length,
		// 		node = self.refs.count.getDOMNode();
		// 	node.innerHTML = count;
		// 	if (!count)
		// 		$(node).addClass('empty').removeClass('ilegal');
		// 	else if (count < 1000)
		// 		$(node).removeClass('empty ilegal');
		// 	else
		// 		$(node).addClass('ilegal');
		// });
	},

	hasFocus: function () {
		this.setState({hasFocus:true});
	},

	handleSubmit: function (evt) {
		evt.preventDefault();

		var bodyEl = $(this.refs.input.getDOMNode());
		var self = this;
		$.ajax({
			type: 'post',
			dataType: 'json',
			url: this.props.model.get('apiPath')+'/comments',
			data: { content: { body: bodyEl.val() } }
		}).done(function (response) {
			if (response.error) {
				app.flash.alert(response.message || 'Erro!');
			} else {
				self.setState({hasFocus:false});
				bodyEl.val('');
				self.props.model.children.add(new models.commentItem(response.data));
			}
		}).fail(function (xhr) {
			app.flash.alert(xhr.responseJSON.message || 'Erro!');
		});
	},

	render: function () {
		if (!window.user)
			return (React.DOM.div(null));
		var mediaUserAvatarStyle = {
			background: 'url('+window.user.avatarUrl+')',
		};

		return (
			React.DOM.div( {className:"exchange-input"}, 
				React.DOM.div( {className:"left"}, 
					React.DOM.div( {className:"user-avatar"}, 
						React.DOM.div( {className:"avatar", style:{background: 'url('+window.user.avatarUrl+')'}})
					)
				),
				React.DOM.div( {className:"right"}, 
					React.DOM.textarea( {style:{height:'42px'}, onClick:this.hasFocus, required:"required", ref:"input", type:"text", placeholder:"Participar da discussão."}),
					this.state.hasFocus?(
						React.DOM.div( {className:"toolbar"}, 
							React.DOM.div( {className:"toolbar-left"}, 
								React.DOM.a( {href:"#", className:"aid"}, "Dicas de Formatação"),
								React.DOM.span( {className:"count", ref:"count"}, "0")
							),
							React.DOM.div( {className:"toolbar-right"}, 
								React.DOM.button( {'data-action':"preview-comment", onClick:this.preview}, "Visualizar"),
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
	mixins: [EditablePost],

	toggleVote: function () {
		this.props.model.handleToggleVote();
	},

	onCancelEdit: function () {
		if (!this.editor) return;
		this.setState({isEditing:false});
	},

	reply: function () {
	},
	
	render: function () {
		var comment = this.props.model.attributes;
		var userHasVoted = window.user && comment.votes.indexOf(window.user.id) != -1;
		var userIsAuthor = window.user && comment.author.id===window.user.id;
		var userIsDiscussionAuthor = this.props.parent.get('author').id === comment.author.id;

		function smallify (url) {
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
			React.DOM.div( {className:"exchange"}, 
				React.DOM.div( {className:"line"}, 
					React.DOM.div( {className:"line-user", title:comment.author.username}, 
						React.DOM.div( {className:"user-avatar"}, 
							React.DOM.div( {className:"avatar", style:{background: 'url('+comment.author.avatarUrl+')'}}
							)
						)
					),
					React.DOM.div( {className:"line-msg"}, 
						React.DOM.span( {className:"name"}, 
							comment.author.name,
							userIsDiscussionAuthor?(React.DOM.span( {className:"label"}, "autor")):null
						),
						React.DOM.time( {'data-time-count':1*new Date(comment.created_at)}, 
							window.calcTimeFrom(comment.created_at)
						),
						React.DOM.span( {className:"line-msg-body", dangerouslySetInnerHTML:{__html: escaped }})
					)
				),
				React.DOM.div( {className:"toolbar"}, 
					React.DOM.button( {className:"control", onClick:this.reply}, 
						React.DOM.i( {className:"icon-reply"}), " Responder"
					),
					(userIsAuthor)?
						React.DOM.div( {className:"control"}, 
							"Votos (",comment.counts.votes,")"
						)
						:(
						React.DOM.button( {className:"control", onClick:this.toggleVote, 'data-voted':userHasVoted?"true":""}, 
							React.DOM.i( {className:"icon-thumbsup"}), " Votar (",comment.counts.votes,")"
						)
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
});

//

var DiscussionComments = React.createClass({displayName: 'DiscussionComments',
	mixins: [backboneCollection],

	render: function () {
		var exchangeNodes = this.props.collection.map(function (comment) {
			return (
				Exchange( {model:comment, key:comment.id, parent:this.props.postModel} )
			);
		}.bind(this));

		return (
			React.DOM.div( {className:"discussionSection"}, 
				ExchangeInputForm( {model:this.props.postModel} ),
				React.DOM.div( {className:"exchanges"}, 
					React.DOM.div( {className:"exchanges-info"}, 
						React.DOM.label(null, this.props.collection.models.length, " Comentário",this.props.collection.models.length>1?"s":"")
					),
					exchangeNodes
				)
			)
		);
	},
});


var CommentSectionView = Comment.SectionView;
var CommentListView = Comment.ListView;
var CommentInputForm = Comment.InputForm;
var CommentView = Comment.View;
// var AnswerSectionView = Answer.SectionView;
// var AnswerListView = Answer.ListView;
// var AnswerInputForm = Answer.InputForm;
// var AnswerView = Answer.View;

//

module.exports = {
	'Discussion': React.createClass({
		mixins: [EditablePost, backboneModel],

		render: function () {
			var post = this.props.model.attributes;
			var userIsAuthor = window.user && post.author.id===window.user.id;

			return (
				React.DOM.div( {className:"postCol"}, 
					PostHeader( {model:this.props.model, parent:this.props.parent} ),

					React.DOM.div( {className:"postBody", dangerouslySetInnerHTML:{__html: this.props.model.get('content').body}}
					),
					React.DOM.div( {className:"postInfobar"}, 
						React.DOM.ul( {className:"left"}
						)
					),
					React.DOM.div( {className:"postFooter"}, 
						DiscussionComments( {collection:this.props.model.children, postModel:this.props.model} )
					)
				)
			);
		},
	}),
	'Problem': React.createClass({
		mixins: [EditablePost, backboneModel],

		tryAnswer: function (e) {
			var index = parseInt(e.target.dataset.index);

			console.log("User clicked", index, this.props.model.get('apiPath')+'/try')

			$.ajax({
				type: 'post',
				dataType: 'json',
				url: this.props.model.get('apiPath')+'/try',
				data: { test: index }
			}).done(function (response) {
				if (response.error) {
					app.flash.alert(response.message || 'Erro!');
				} else {
					if (response.result) {
						app.flash.info("Because you know me so well.");
					} else {
						app.flash.info("WROOOOOOOOOONNNG, YOU IMBECILE!");
					}
				}
			}).fail(function (xhr) {
				app.flash.alert(xhr.responseJSON && xhr.responseJSON.message || 'Erro!');
			});
		},

		render: function () {
			var post = this.props.model.attributes;
			var userIsAuthor = window.user && post.author.id===window.user.id;

			// if window.user.id in this.props.model.get('hasSeenAnswer'), show answers
			console.log(post.content.answer);
			var source = post.content.source;
			var isAdaptado = source && (!!source.match(/(^\[adaptado\])|(adaptado)/));

			var rightCol;
			if (userIsAuthor) {
				rightCol = (
					React.DOM.div( {className:"rightCol alternative"}, 
						React.DOM.h3(null, "Você criou esse problema.")
					)
				)
			} else if (post._meta && post._meta.userAnswered) {
				rightCol = (
					React.DOM.div( {className:"rightCol alternative"}, 
						React.DOM.h3(null, "Você respondeu essa pergunta.")
					)
				);
			} else {
				rightCol = (
					React.DOM.div( {className:"rightCol"}, 
						React.DOM.div( {className:"answer-col-mc"}, 
							React.DOM.ul(null, 
								React.DOM.li(null, 
									React.DOM.button( {onClick:this.tryAnswer, 'data-index':"0", className:"right-ans"}, post.content.answer.options[0])
								),
								React.DOM.li(null, 
									React.DOM.button( {onClick:this.tryAnswer, 'data-index':"1", className:"wrong-ans"}, post.content.answer.options[1])
								),
								React.DOM.li(null, 
									React.DOM.button( {onClick:this.tryAnswer, 'data-index':"2", className:"wrong-ans"}, post.content.answer.options[2])
								),
								React.DOM.li(null, 
									React.DOM.button( {onClick:this.tryAnswer, 'data-index':"3", className:"wrong-ans"}, post.content.answer.options[3])
								),
								React.DOM.li(null, 
									React.DOM.button( {onClick:this.tryAnswer, 'data-index':"4", className:"wrong-ans"}, post.content.answer.options[4])
								)
							)
						)
					)
				);
			}

							// <time>
							// 	&nbsp;publicado&nbsp;
							// 	<span data-time-count={1*new Date(post.created_at)}>
							// 		{window.calcTimeFrom(post.created_at)}
							// 	</span>
							// 	{(post.updated_at && 1*new Date(post.updated_at) > 1*new Date(post.created_at))?
							// 		(<span>
							// 			,&nbsp;<span data-toggle="tooltip" title={window.calcTimeFrom(post.updated_at)}>editado</span>
							// 		</span>
							// 		)
							// 		:null
							// 	}
							// </time>

			return (
				React.DOM.div( {className:"postCol question"}, 
					React.DOM.div( {className:"contentCol"}, 
						React.DOM.div( {className:"body-window"}, 
							React.DOM.div( {className:"breadcrumbs"}
							),
							React.DOM.div( {className:"body-window-content"}, 
								React.DOM.div( {className:"title"}, 
									post.content.title
								),
								React.DOM.div( {className:"postBody", dangerouslySetInnerHTML:{__html: this.props.model.get('content').body}})
							),
							React.DOM.div( {className:"sauce"}, 
								isAdaptado?React.DOM.span( {className:"detail"}, "adaptado"):null,
								source?source:null
							)
						),
						React.DOM.div( {className:"fixed-footer"}, 
							React.DOM.div( {className:"user-avatar"}, 
								React.DOM.div( {className:"avatar", style: { background: 'url('+post.author.avatarUrl+')' } })
							),
							React.DOM.div( {className:"info"}, 
								"Por ", React.DOM.a( {href:post.author.path}, post.author.name),", 14 anos, Brazil"
							),
							React.DOM.div( {className:"actions"}, 
								React.DOM.button( {className:""}, React.DOM.i( {className:"icon-thumbsup"}), " 23"),
								React.DOM.button( {className:""}, React.DOM.i( {className:"icon-retweet2"}), " 5")
							)
						)
					),
					rightCol
				)
			);
		},
	}),
	'Note': React.createClass({
		mixins: [EditablePost, backboneModel],

		render: function () {
			var post = this.props.model.attributes;
			return (
				React.DOM.div( {className:"postCol"}, 
					React.DOM.div(null, 
						PostHeader( {model:this.props.model, parent:this.props.parent} ),

						React.DOM.div( {className:"postBody", dangerouslySetInnerHTML:{__html: this.props.model.get('content').body}}
						),

						React.DOM.div( {className:"postInfobar"}, 
							React.DOM.ul( {className:"left"}
							)
						),
						React.DOM.div( {className:"postFooter"}, 
							CommentSectionView( {collection:this.props.model.children, postModel:this.props.model} )
						)
					)
				)
			);
		},
	}),
};
/** @jsx React.DOM */

/*
** postViews.jsx
** Copyright QiLabs.org
** BSD License
*/

var $ = require('jquery')
var Backbone = require('backbone')
var _ = require('lodash')
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


var PostHeader = React.createClass({
	mixins: [EditablePost],

	onClickShare: function () {
		var url = 'http://qilabs.org'+this.props.model.get('path'),
			title = this.props.model.get('content').title;

		var facebookUrl = 'http://www.facebook.com/sharer.php?u='+encodeURIComponent(url)+'&ref=fbshare&t='+encodeURIComponent(title);
		var gplusUrl = 'https://plus.google.com/share?url='+encodeURIComponent(url);
		var twitterUrl = 'http://twitter.com/share?url='+encodeURIComponent(url)+'&ref=twitbtn&text='+encodeURIComponent(title);

		function genOnClick(url) {
			return 'window.open(\"'+url+'\","mywindow","menubar=1,resizable=1,width=500,height=500");'
		}

		var html = '<div class="dialog share-dialog">\
			<div class="box-blackout" onClick="$(this.parentElement).fadeOut();" data-action="close-dialog"></div>\
			<div class="box">\
				<label>Compartilhe essa '+this.props.model.get('translatedType')+'</label>\
				<input type="text" name="url" value="'+url+'">\
				<div class="share-icons">\
					<button class="share-gp" onClick=\''+genOnClick(gplusUrl)+'\'  title="share link to this question on Google+" data-svc="1"><i class="icon-google-plus-square"></i> Google</button>\
					<button class="share-fb" onClick=\''+genOnClick(facebookUrl)+'\' title="share link to this question on Facebook" data-svc="2"><i class="icon-facebook-square"></i> Facebook</button>\
					<button class="share-tw" onClick=\''+genOnClick(twitterUrl)+'\'  title="share link to this question on Twitter" data-svc="3"><i class="icon-twitter-square"></i> Twitter</button>\
				</div>\
			</div>\
			</div>\
		';
		var obj = $(html);

		setTimeout(function () { obj.find('input').select(); }, 50);
		obj.appendTo('body').fadeIn(function () {
			obj.focus();
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
		console.log('post', post._meta)
		if (post._meta.views && post._meta.views > 1) {
			var count = post._meta.views;
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
						<div className="item edit" onClick={this.props.parent.onClickEdit}>
							<i className="icon-pencil"></i>
						</div>
						<div className="item remove" onClick={this.props.parent.onClickTrash}>
							<i className="icon-trash-o"></i>
						</div>
						<div className="item watch" onClick={function () { $('#srry').fadeIn()} }>
							<i className="icon-eye"></i>
						</div>
						<div className="item share" onClick={this.onClickShare}
							data-toggle="tooltip" title="Compartilhar" data-placement="right"
							>
							<i className="icon-share-alt"></i>
						</div>
					</div>
					:<div className="flatBtnBox">
						<div className={"item like "+((window.user && post.votes.indexOf(window.user.id) != -1)?"liked":"")}
							onClick={this.props.parent.toggleVote}>
							<i className="icon-heart-o"></i><span className="count">{post.counts.votes}</span>
						</div>
						<div className="item share" onClick={this.onClickShare}
							data-toggle="tooltip" title="Compartilhar" data-placement="right"
							>
							<i className="icon-share-alt"></i>
						</div>
						<div className="item flag" onClick={function () { $('#srry').fadeIn()} }
							data-toggle="tooltip" title="Sinalizar post" data-placement="right"
							>
							<i className="icon-flag"></i>
						</div>
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

			console.log(comment)

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
			var bodyEl = $(this.refs.input.getDOMNode());
			this.refs.sendBtn.getDOMNode().disabled = true;

			$.ajax({
				type: 'post',
				dataType: 'json',
				url: this.props.model.get('apiPath')+'/comments',
				data: { content: { body: bodyEl.val() } }
			}).done(function (response) {
				self.refs.sendBtn.getDOMNode().disabled = false;
				if (response.error) {
					app.flash.alert(response.message || 'Erro!');
				} else {
					self.setState({showInput:false});
					bodyEl.val('');
					self.props.model.children.add(new models.commentItem(response.data));
				}
			}).fail(function (xhr) {
				app.flash.alert(xhr.responseJSON.message || 'Erro!');
				self.refs.sendBtn.getDOMNode().disabled = false;
			});

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
					<CommentListView  small={this.props.small} placeholder={this.props.placeholder} collection={this.props.collection} />
					<CommentInputForm small={this.props.small} model={this.props.postModel} />
				</div>
			);
		},
	}),
};

var ExchangeInputForm = React.createClass({

	getInitialState: function () {
		return { hasFocus: false };
	},

	componentDidMount: function () {
		var self = this;
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

	render: function () {
		if (!window.user)
			return (<div></div>);

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
							<div className="toolbar-right">
								<button data-action="send-comment" onClick={this.handleSubmit}>Enviar</button>
							</div>
						</div>
					):null}
				</div>
			</div>
		);
		// <div className="toolbar-left">
		// 	<a href="#" className="aid">Dicas de Formatação</a>
		// 	<span className="count" ref="count">0</span>
		// </div>
		// 	<button data-action="preview-comment" onClick={this.preview}>Visualizar</button>
	},
});

var Exchange = React.createClass({
	mixins: [backboneModel, EditablePost],

	getInitialState: function () {
		return { replying: false, editing: false };
	},

	//

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

		if (window.user) {
			userHasVoted = doc.votes.indexOf(window.user.id) != -1;
			userIsAuthor = doc.author.id===window.user.id;
		}

		var childrenNotes = _.map(this.props.children || [], function (comment) {
			return (
				<Exchange model={comment} key={comment.id} parent={this.props.parent}></Exchange>
			);
		}.bind(this));

		return (
			<div className="exchange">
				<div className="line">
					<div className="line-user" title={doc.author.username}>
					<a href={doc.author.path}>
						<div className="user-avatar">
							<div className="avatar" style={{background: 'url('+doc.author.avatarUrl+')'}}>
							</div>
						</div>
					</a>
					</div>
					{
						this.state.editing?
						<div className="line-msg">
							<textarea ref="textarea" defaultValue={ doc.content.body } />
						</div>
						:<div className="line-msg">
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
					}
					{
						this.state.editing?(
						<div className="toolbar">
							<button className="control save" onClick={this.onClickSave}>
								Salvar
							</button>
						</div>
						):(
							userIsAuthor?(
							<div className="toolbar">
								<button disabled className="control thumbsup">
									<i className="icon-thumbsup"></i> {doc.counts.votes}
								</button>
								<div className="group">
									<button className="control edit" onClick={this.onClickEdit}>
										<i className="icon-pencil"></i>
									</button>
									<button className="control delete" onClick={this.onClickTrash}>
										<i className="icon-trash-o"></i>
									</button>
								</div>
							</div>
							):(
							<div className="toolbar">
								<button className="control thumbsup" onClick={this.toggleVote} data-voted={userHasVoted?"true":""}>
									<i className="icon-thumbsup"></i> {doc.counts.votes}
								</button>
								<button className="control reply" onClick={this.onClickReply}>
									<i className="icon-reply"></i> {this.props.children && this.props.children.length}
								</button>
							</div>
							)
						)
					}
				</div>
				<ul className="children">
					{
						this.state.replying?
						<ExchangeInputForm
							parent={this.props.parent}
							replies_to={this.props.model}
							on_reply={this.onReplied} />
						:null
					}
					{childrenNotes}
				</ul>
			</div>
		);
	},
});

//

var DiscussionComments = React.createClass({
	mixins: [backboneCollection],

	componentDidMount: function () {
		this.props.collection.trigger('mount');
		MathJax.Hub.Queue(["Typeset",MathJax.Hub]);
	},

	componentDidUpdate: function () {
		this.props.collection.trigger('update');
		MathJax.Hub.Queue(["Typeset",MathJax.Hub]);
	},

	render: function () {
		var levels = this.props.collection.groupBy(function (e) {
			return e.get('thread_root') || null;
		});

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
						<label>{this.props.collection.models.length} Comentário{this.props.collection.models.length>1?"s":""}</label>
					</div>
					<ExchangeInputForm parent={this.props.parent} />
					{exchangeNodes}
				</div>
			</div>
		);
	},
});


var CommentSectionView = Comment.SectionView;
var CommentListView = Comment.ListView;
var CommentInputForm = Comment.InputForm;
var CommentView = Comment.View;

//

module.exports = {
	'Discussion': React.createClass({
		mixins: [EditablePost, backboneModel],

		render: function () {
			var post = this.props.model.attributes;
			var userIsAuthor = window.user && post.author.id===window.user.id;

			return (
				<div className='postCol'>
					<PostHeader model={this.props.model} parent={this.props.parent} />

					<div className="postBody" dangerouslySetInnerHTML={{__html: this.props.model.get('content').body}}>
					</div>
					<div className="postInfobar">
						<ul className="left">
						</ul>
					</div>
					<div className="postFooter">
						<DiscussionComments collection={this.props.model.children} parent={this.props.model} />
					</div>
				</div>
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
					<div className="rightCol alternative">
						<h3>Você criou esse problema.</h3>
					</div>
				)
			} else if (post._meta && post._meta.userAnswered) {
				rightCol = (
					<div className="rightCol alternative">
						<h3>Você respondeu essa pergunta.</h3>
					</div>
				);
			} else {
				rightCol = (
					<div className="rightCol">
						<div className="answer-col-mc">
							<ul>
								<li>
									<button onClick={this.tryAnswer} data-index="0" className="right-ans">{post.content.answer.options[0]}</button>
								</li>
								<li>
									<button onClick={this.tryAnswer} data-index="1" className="wrong-ans">{post.content.answer.options[1]}</button>
								</li>
								<li>
									<button onClick={this.tryAnswer} data-index="2" className="wrong-ans">{post.content.answer.options[2]}</button>
								</li>
								<li>
									<button onClick={this.tryAnswer} data-index="3" className="wrong-ans">{post.content.answer.options[3]}</button>
								</li>
								<li>
									<button onClick={this.tryAnswer} data-index="4" className="wrong-ans">{post.content.answer.options[4]}</button>
								</li>
							</ul>
						</div>
					</div>
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
				<div className="postCol question">
					<div className="contentCol">
						<div className="body-window">
							<div className="breadcrumbs">
							</div>
							<div className="body-window-content">
								<div className="title">
									{post.content.title}
								</div>
								<div className="postBody" dangerouslySetInnerHTML={{__html: this.props.model.get('content').body}}></div>
							</div>
							<div className="sauce">
								{isAdaptado?<span className="detail">adaptado</span>:null}
								{source?source:null}
							</div>
						</div>
						<div className="fixed-footer">
							<div className="user-avatar">
								<div className="avatar" style={ { background: 'url('+post.author.avatarUrl+')' } }></div>
							</div>
							<div className="info">
								Por <a href={post.author.path}>{post.author.name}</a>, 14 anos, Brazil
							</div>
							<div className="actions">
								<button className=""><i className="icon-thumbsup"></i> 23</button>
								<button className=""><i className="icon-retweet2"></i> 5</button>
							</div>
						</div>
					</div>
					{rightCol}
				</div>
			);
		},
	}),
	'Note': React.createClass({
		mixins: [EditablePost, backboneModel],

		render: function () {
			var post = this.props.model.attributes;
			return (
				<div className='postCol'>
					<div>
						<PostHeader model={this.props.model} parent={this.props.parent} />

						<div className="postBody" dangerouslySetInnerHTML={{__html: this.props.model.get('content').body}}>
						</div>

						<div className="postInfobar">
							<ul className="left">
							</ul>
						</div>
						<div className="postFooter">
							<CommentSectionView collection={this.props.model.children} postModel={this.props.model} />
						</div>
					</div>
				</div>
			);
		},
	}),
};
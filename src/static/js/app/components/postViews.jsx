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

var PostHeader = React.createClass({
	mixins: [EditablePost],
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
		if (post.subject && post.subject in pageMap) {
			pageObj = pageMap[post.subject];
		}

		var subtagsUniverse = {};
		if (post.subject && pageMap[post.subject] && pageMap[post.subject].children)
			subtagsUniverse = pageMap[post.subject].children;

		var tagNames = [];
		if (pageObj) {
			tagNames.push(pageObj);
			_.each(post.tags, function (id) {
				if (id in subtagsUniverse)
					tagNames.push({name: subtagsUniverse[id].name });
			});
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
				</time>

				<div className="authorInfo">
					por&nbsp;&nbsp;
					<div className="avatarWrapper">
						<div className="avatar" style={ { background: 'url('+post.author.avatarUrl+')' } }></div>
					</div>
					<a href={post.author.path} className="username">
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
						<div className="item share" onClick={function () { $('#srry').fadeIn()} }>
							<i className="icon-share-alt"></i>
						</div>
						<div className="item watch" onClick={function () { $('#srry').fadeIn()} }>
							<i className="icon-eye"></i>
						</div>
					</div>
					:<div className="flatBtnBox">
						<div className={"item like "+((window.user && post.votes.indexOf(window.user.id) != -1)?"liked":"")}
							onClick={this.props.parent.toggleVote}>
							<i className="icon-heart-o"></i><span className="count">{post.counts.votes}</span>
						</div>
						<div className="item share" onClick={function () { $('#srry').fadeIn()} }>
							<i className="icon-share-alt"></i>
						</div>
						<div className="item flag" onClick={function () { $('#srry').fadeIn()} }>
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
		return {hasFocus:false};
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

	hasFocus: function () {
		this.setState({hasFocus:true});
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

		return (
			<div className="exchange-input">
				<div className="left">
					<div className="user-avatar">
						<div className="avatar" style={{background: 'url('+window.user.avatarUrl+')'}}></div>
					</div>
				</div>
				<div className="right">
					<textarea style={{height:'42px'}} onClick={this.hasFocus} required="required" ref="input" type="text"
						placeholder={placeholder}></textarea>
					{this.state.hasFocus?(
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
	mixins: [EditablePost],

	getInitialState: function () {
		return { replying: false };
	},

	toggleVote: function () {
		this.props.model.handleToggleVote();
	},

	onCancelEdit: function () {
		if (!this.editor) return;
		this.setState({ isEditing: false });
	},

	clickReply: function () {
		this.setState({ replying: true });
	},

	onReply: function () {
		this.setState({ replying: false });
	},
	
	render: function () {
		var doc = this.props.model.attributes;
		var userHasVoted, userIsAuthor;
		var authorIsDiscussionAuthor = this.props.parent.get('author').id === doc.author.id;

		if (window.user) {
			userHasVoted = doc.votes.indexOf(window.user.id) != -1;
			userIsAuthor = doc.author.id===window.user.id;
		}

		function urllify (text) {
			var urlRegex = /(((https?:(?:\/\/)?)(?:www\.)?[A-Za-z0-9\.\-]+)((?:\/[\+~%\/\.\w\-_]*)?\??(?:[\-\+=&;%@\.\w_]*)#?(?:[\.\!\/\\\w]*))?)/
			return text.replace(urlRegex, function (url) {
				return "<a href=\""+url+"\">"+url+"</a>"
			});
		}

		var childrenNotes = _.map(this.props.children || [], function (comment) {
			return (
				<Exchange model={comment} key={comment.id} parent={this.props.parent}>
				</Exchange>
			);
		}.bind(this));

		return (
			<div className="exchange">
				<div className="line">
					<div className="line-user" title={doc.author.username}>
						<div className="user-avatar">
							<div className="avatar" style={{background: 'url('+doc.author.avatarUrl+')'}}>
							</div>
						</div>
					</div>
					<div className="line-msg">
						<span className="name">
							{doc.author.name}
							{authorIsDiscussionAuthor?(<span className="label">autor</span>):null}
						</span>
						<time data-time-count={1*new Date(doc.meta.created_at)}>
							{window.calcTimeFrom(doc.meta.created_at)}
						</time>
						<span className="line-msg-body"
							dangerouslySetInnerHTML={{__html: urllify(doc.content.body) }}></span>
					</div>
				</div>
				{
					userIsAuthor?(
					<div className="toolbar">
						<button className="control" onClick={this.clickReply}>
							<i className="icon-reply"></i> Responder
						</button>
						<div className="control">
							Votos ({doc.counts.votes})
						</div>
						<button data-action="remove-post" onClick={this.onClickTrash}>
							<i className="icon-trash-o"></i>
						</button>
					</div>
					):(
					<div className="toolbar">
						<button className="control" onClick={this.clickReply}>
							<i className="icon-reply"></i> Responder
						</button>
						<button className="control" onClick={this.toggleVote} data-voted={userHasVoted?"true":""}>
							<i className="icon-thumbsup"></i> Votar ({doc.counts.votes})
						</button>
					</div>
					)
				}
				{
					this.state.replying?
					<ExchangeInputForm
						parent={this.props.parent}
						replies_to={this.props.model}
						on_reply={this.onReply} />
					:null
				}
				<ul className="children">
					{childrenNotes}
				</ul>
			</div>
		);
	},
});

//

var DiscussionComments = React.createClass({
	mixins: [backboneCollection],

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
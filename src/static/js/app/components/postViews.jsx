/** @jsx React.DOM */

/*
** postViews.js
** Copyright QILabs.org
** BSD License
** by @f03lipe
*/

define(['jquery', 'backbone', 'underscore', 'components.postModels', 'react', 'medium-editor',],
	function ($, Backbone, _, postModels, React) {

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
			if (confirm('Tem certeza que quer excluir essa postagem?')) {
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

	//

	var Comment = {
		View: React.createClass({
			mixins: [EditablePost],
			render: function () {
				var comment = this.props.model.attributes;
				var self = this;

				var mediaUserAvatarStyle = {
					background: 'url('+comment.author.avatarUrl+')',
				};

				return (
					<div className="commentWrapper">
						<div className='msgBody'>
							<div className="arrow"></div>
							<span dangerouslySetInnerHTML={{__html: comment.content.escapedBody }}></span>
						</div>
						<div className="infoBar">
							<a className="userLink author" href={comment.author.path}>
								<div className="avatarWrapper">
									<div className="avatar" style={mediaUserAvatarStyle} title={comment.author.username}>
									</div>
								</div>
								<span className="name">
									{comment.author.name}
								</span>
							</a>&nbsp;·&nbsp;

							<time data-time-count={1*new Date(comment.published)}>
								{window.calcTimeFrom(comment.published)}
							</time>

							{(window.user && window.user.id === comment.author.id)?
								<div className="optionBtns">
									<button data-action="remove-post" onClick={this.onClickTrash}>
										<i className="icon-trash"></i>
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

				var bodyEl = $(this.refs.input.getDOMNode());
				var self = this;
				$.ajax({
					type: 'post',
					dataType: 'json',
					url: this.props.model.get('apiPath')+'/comments',
					data: { content: { body: bodyEl.val() } }
				}).done(function (response) {
					if (response.error) {
						app.alert(response.message || 'Erro!', 'error');
					} else {
						self.setState({showInput:false});
						bodyEl.val('');
						self.props.model.children.Comment.add(new postModels.commentItem(response.data));
					}
				}).fail(function (xhr) {
					app.alert(xhr.responseJSON.message || 'Erro!', 'error');
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
										<button data-action="send-comment" onClick={this.handleSubmit}>Enviar</button>
										<span className="count" ref="count">0</span>
									</form>
								</div>
							):(
								<div className="showInput" onClick={this.showInput}>{
									this.props.model.get('type') === "Answer"?
									"Adicionar comentário."
									:"Fazer comentário.."
								}</div>
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

	//

	var Answer = {
		View: React.createClass({
			mixins: [backboneModel, EditablePost],

			getInitialState: function () {
				return {isEditing:false};
			},

			onClickEdit: function () {
				if (!this.editor) return;

				this.setState({isEditing:true});
				this.editor.activate();
			},

			componentDidMount: function () {
				if (window.user && this.props.model.get('author').id === window.user.id) {
					this.editor = new MediumEditor(this.refs.answerBody.getDOMNode(), mediumEditorAnswerOpts); 
					// No addons.
					$(this.refs.answerBody.getDOMNode()).mediumInsert({
						editor: this.editor,
						addons: {}
					});
					this.editor.deactivate();
				} else {
					this.editor = null;
				}
			},
			
			onClickSave: function () {
				if (!this.editor) return;

				var self = this;

				this.props.model.save({
					content: {
						body: this.editor.serialize()['element-0'].value,
					},
				}, {
					success: function () {
						self.setState({isEditing:false});
						self.forceUpdate();
					}
				});
			},

			componentWillUnmount: function () {
				if (this.editor) {
					this.editor.deactivate();
					$(this.editor.anchorPreview).remove();
					$(this.editor.toolbar).remove();
				}
			},

			componentDidUpdate: function () {
				if (this.editor) {
					if (!this.state.isEditing) {
						this.editor.deactivate(); // just to make sure
						$(this.refs.answerBody.getDOMNode()).html($(this.props.model.get('content').body));
					} else {
						this.editor.activate();
					}
				}
			},

			toggleVote: function () {
				this.props.model.handleToggleVote();
			},

			onCancelEdit: function () {
				if (!this.editor) return;
				this.setState({isEditing:false});
			},
			
			render: function () {
				var answer = this.props.model.attributes;
				var self = this;

				// <button className="control"><i className="icon-caret-up"></i></button>
				// <div className="voteResult">5</div>
				// <button className="control"><i className="icon-caret-down"></i></button>
				var userHasVoted = window.user && answer.votes.indexOf(window.user.id) != -1;
				var userIsAuthor = window.user && answer.author.id===window.user.id;

				var voteControl = (
					<div className={" voteControl "+(userHasVoted?"voted":"")}>
						<button className="thumbs" onClick={this.toggleVote} disabled={userIsAuthor?"disabled":""}
						title={userIsAuthor?"Você não pode votar na sua própria resposta.":""}>
							<i className="icon-tup"></i>
						</button>
						<div className="count">
							{answer.voteSum}
						</div>
					</div>
				);

				return (
					<div className="answerViewWrapper">
						<div className={" answerView "+(this.state.isEditing?" editing ":"")} ref="answerView">
							<div className="left">
								{voteControl}
							</div>
							<div className="right">
								<div className="answerBodyWrapper" ref="answerBodyWrapper">
									<div className='answerBody' ref="answerBody" dangerouslySetInnerHTML={{__html: answer.content.body }}>
									</div>
								</div>
								<div className="infobar">
									<div className="toolbar">
										{userIsAuthor?
										(
											<div className="item save" data-action="save-post" onClick={this.onClickSave} data-toggle="tooltip" data-placement="bottom" title="Salvar">
												<i className="icon-save"></i>
											</div>
										):null}
										{userIsAuthor?
										(
											<div className="item cancel" onClick={this.onCancelEdit} data-toggle="tooltip" data-placement="bottom" title="Cancelar">
												<i className="icon-times"></i>
											</div>
										):null}
										{userIsAuthor?
										(
											<div className="item edit" onClick={this.onClickEdit} data-toggle="tooltip" data-placement="bottom" title="Editar">
												<i className="icon-pencil"></i>
											</div>
										):null}
										{userIsAuthor?
										(
											<div className="item remove" data-action="remove-post" onClick={this.onClickTrash}  data-toggle="tooltip" data-placement="bottom" title="Remover">
												<i className="icon-trash"></i>
											</div>
										):null}
										<div className="item link" data-toggle="tooltip" data-placement="bottom" title="Link">
											<i className="icon-link"></i>
										</div>
										<div className="item flag"  data-toggle="tooltip" data-placement="bottom" title="Sinalizar conteúdo">
											<i className="icon-flag"></i>
										</div>
									</div>
									<div className="answerAuthor">
										<div className="avatarWrapper">
											<a href={answer.author.path}>
												<div className="avatar" style={ { background: 'url('+answer.author.avatarUrl+')' } } title={answer.author.username}>
												</div>
											</a>
										</div>
										<div className="info">
											<a href={answer.author.path} className="username">
												{answer.author.name}
											</a> <time data-time-count={1*new Date(answer.published)}>
												{window.calcTimeFrom(answer.published)}
											</time>
										</div>
										<div className="answerSidebar" ref="sidebar">
											<div className="box authorInfo">
												<div className="identification">
													<div className="avatarWrapper">
														<div className="avatar" style={ { background: 'url('+answer.author.avatarUrl+')' } }></div>
													</div>
													<a href={answer.path} className="username">
														{answer.author.name}
													</a>
													{
													userIsAuthor?null:<button className="btn-follow btn-follow" data-action="unfollow" data-user="{{ profile.id }}"></button>
													}
												</div>
												<div className="bio">
													{
														(answer.author.profile.bio.split(" ").length>20)?
														answer.author.profile.bio.split(" ").slice(0,20).join(" ")+"..."
														:answer.author.profile.bio
													}
												</div>
											</div>
										</div>
									</div>
								</div>
							</div>
							<CommentSectionView small={true} collection={this.props.model.children.Comment} postModel={this.props.model} />
						</div>
					</div>
				);
			},
		}),
		ListView: React.createClass({
			componentWillMount: function () {
				var update = function () {
					this.forceUpdate(function(){});
				}
				this.props.collection.on('add reset remove', update.bind(this));
			},

			render: function () {
				var answerNodes = this.props.collection.map(function (answer) {
					return (
						<AnswerView model={answer} key={answer.id}/>
					);
				});

				return (
					<div className="answerList">
						{answerNodes}
					</div>
				);
			},
		}),
		SectionView: React.createClass({
			mixins: [backboneCollection],
			getInitialState: function () {
				return {sortingType:'votes'};
			},
			onSortSelected: function (e) {
				var type = e.target.dataset.sort;
				console.log(e, type)

				var comp = this.props.collection.comparators[type];
				this.props.collection.comparator = comp;
				this.props.collection.sort();
				this.setState({sortingType: type});
			},
			render: function () {
				var self = this;

				var sortTypes = {
					'votes': 'Votos',
					'older': '+ Antigo',
					'younger': '+ Novo',
					'updated': 'Atividade',
				};

				var otherOpts = _.map(_.filter(_.keys(sortTypes), function (i) {
					return i != self.state.sortingType;
				}), function (type) {
					return (
						<li data-sort={type} onClick={self.onSortSelected}>{sortTypes[type]}</li>
					);
				});

				var menu = (
					<div className="menu">
						<span className="selected" data-sort={this.state.sortingType}>
							{sortTypes[this.state.sortingType]}
							<i className="icon-adown"></i>
						</span>
						<div className="dropdown">
							{otherOpts}
						</div>
					</div>
				);

				return (
					<div className="answerSection">
						{
							(this.props.collection.length)?
							<div className="sectionHeader">
								<label>{ this.props.collection.length } Resposta{ this.props.collection.length==1?"":"s" }</label>
								<div className="sortingMenu">
									<label>ordenar por</label>
									{menu}
								</div>
							</div>
							:<div className="sectionHeader">
								<label>0 respostas</label>
							</div>
						}
						<AnswerListView collection={this.props.collection} />
						<AnswerInputForm model={this.props.postModel} placeholder="Adicionar comentário."/>
					</div>
				);
			},
		}),
		InputForm: React.createClass({
			componentDidUpdate: function () {
				if (this.refs && this.refs.input) {
					this.editor = new MediumEditor(this.refs.input.getDOMNode(), mediumEditorAnswerOpts);
				}
			},

			getInitialState: function () {
				return {showInput:false};
			},

			handleSubmit: function (evt) {
				evt.preventDefault();

				if (!this.editor) return alert("WTF"); // WTF

				var body = this.editor.serialize()['element-0'].value;
				var self = this;
				$.ajax({
					type: 'post',
					dataType: 'json',
					url: this.props.model.get('apiPath')+'/answers',
					data: { content: { body: body } }
				}).done(function(response) {
					self.editor.innerHTML = "";
					self.setState({showInput:false});
					console.log('response', response);
					self.props.model.children.Answer.add(new postModels.answerItem(response));
				}).fail(function(response) {
					if (response.message) {
						app.alert(response.message,'error');
					} else
						app.alert('Erro!', 'error');
				});
			},

			showInput: function () {
				if (this.props.model.children.Answer.all(function (answer) {
					return answer.get('author').id != window.user.id;
				})) {
					this.setState({showInput:true});
				} else {
					app.alert('Você não pode responder à mesma pergunta mais de uma vez. Edite a sua resposta antiga se quiser adicionar mais informações.', 'danger');
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
							<div className={"answerInputSection "+(this.props.small?"small":'')}>
								<form className="formPostAnswer" onSubmit={this.handleSubmit}>
								{
									this.props.small?
									null
									:<label>Responder à pergunta "{this.props.model.get('content').title}"</label>
								}
									<div className="editorWrapper">
										<div className="editor answerBody" ref="input" name="teste" data-placeholder="Resposta da pergunta aqui..."></div>
									</div>
									<button data-action="send-answer" onClick={this.handleSubmit}>Enviar</button>
								</form>
							</div>
						):(
							<div className="showInput" onClick={this.showInput}>
								Responder pergunta.
							</div>
						)
					}
					</div>
				);
			},
		}),
	};

	var PostHeader = React.createClass({
		mixins: [EditablePost],
		render: function () {
			var post = this.props.model.attributes;
			var userIsAuthor = window.user && post.author.id===window.user.id;

			return (
				<div className="postHeader">
					<div className="type">
						{post.translatedType}
					</div>
					<div className="tags">
						<TagList tags={post.tags} />
					</div>
					<div className="postTitle">
						{post.content.title}
					</div>
					<time>
						&nbsp;publicado&nbsp;
						<span data-time-count={1*new Date(post.published)}>
							{window.calcTimeFrom(post.published)}
						</span>
						{(post.updated && 1*new Date(post.updated) > 1*new Date(post.published))?
							(<span>
								,&nbsp;<span data-toggle="tooltip" title={window.calcTimeFrom(post.updated)}>editado</span>
							</span>
							)
							:null
						}
					</time>

					<div className="authorInfo">
						por&nbsp;&nbsp;
						<div className="avatarWrapper">
							<div className="avatar" style={ { background: 'url('+post.author.avatarUrl+')' } }></div>
							<div className="avatarPopup">
								<div className="popupUserInfo">
									<div className="popupAvatarWrapper">
										<div className="avatar" style={ { background: 'url('+post.author.avatarUrl+')' } }></div>
									</div>
									<a href={post.author.path} className="popupUsername">
										{post.author.name}
									</a>
								</div>
								<div className="popupBio">
									{post.author.profile.bio}
								</div>
							</div>
						</div>
						<a href={post.author.path} className="username">
							{post.author.name}
						</a>
						{
							userIsAuthor?
							null
							:(
								post.meta.followed?
								<button className="btn-follow" data-action="unfollow" data-user={post.author.id}></button>
								:<button className="btn-follow" data-action="follow" data-user={post.author.id}></button>
							)
						}
					</div>

					{
						(userIsAuthor)?
						<div className="flatBtnBox">
							<div className="item edit" onClick={this.props.parent.onClickEdit}>
								<i className="icon-edit"></i>
							</div>
							<div className="item remove" onClick={this.props.parent.onClickTrash}>
								<i className="icon-trash"></i>
							</div>
							<div className="item link" onClick={this.props.parent.onClickLink}>
								<i className="icon-link"></i>
							</div>
						</div>
						:<div className="flatBtnBox">
							<div className={"item like "+((window.user && post.votes.indexOf(window.user.id) != -1)?"liked":"")}
								onClick={this.props.parent.toggleVote}>
								<i className="icon-heart-o"></i><span className="count">{post.voteSum}</span>
							</div>
							<div className="item link" onClick={this.props.parent.onClickLink}>
								<i className="icon-link"></i>
							</div>
							<div className="item flag" onClick={this.props.parent.onClickFlag}>
								<i className="icon-flag"></i>
							</div>
						</div>
					}
				</div>
			);
		}
	});

	//

	var CommentSectionView = Comment.SectionView;
	var CommentListView = Comment.ListView;
	var CommentInputForm = Comment.InputForm;
	var CommentView = Comment.View;
	var AnswerSectionView = Answer.SectionView;
	var AnswerListView = Answer.ListView;
	var AnswerInputForm = Answer.InputForm;
	var AnswerView = Answer.View;

	//

	var TagList = React.createClass({
		render: function () {
			var tags = _.map(this.props.tags, function (tagId) {
				return (
					<div className="tag" key={tagId}>
						#{tagMap[tagId].label}
					</div>
				);
			});
			return (
				<div className="tags">
					{tags}
				</div>
			);
		}
	});

	return {
		FeedItemView: React.createClass({
			mixins: [backboneModel],
			componentDidMount: function () {},
			render: function () {
				function gotoPost () {
					app.navigate('/posts/'+post.id, {trigger:true});
				}
				var post = this.props.model.attributes;
				var mediaUserStyle = {
					background: 'url('+post.author.avatarUrl+')',
				};

				return (
					<div className="cardView" onClick={gotoPost}>
						<div className="cardHeader">
							<span className="cardType">
								{post.translatedType}
							</span>
							<div className="iconStats">
								<div onClick={this.props.model.handleToggleVote.bind(this.props.model)}>
									{this.props.model.liked?<i className="icon-heart icon-red"></i>:<i className="icon-heart"></i>}
									&nbsp;
									{post.voteSum}
								</div>
								{post.type === "Question"?
									<div>
										<i className="icon-bulb"></i>&nbsp;
										{this.props.model.get('childrenCount').Answer}
									</div>
									:<div>
										<i className="icon-comment-o"></i>&nbsp;
										{this.props.model.get('childrenCount').Comment}
									</div>
								}
							</div>
						</div>

						<div className="cardBody">
							<span ref="cardBodySpan">{post.content.title}</span>
						</div>

						<div className="cardFoot">
							<div className="authorship">
								<div className="avatarWrapper">
									<a href={post.author.path}>
										<div className="avatar" style={mediaUserStyle}></div>
									</a>
								</div>
								<a href={post.author.path} className="username">
									{post.author.name}
								</a>
							</div>,
							<time data-time-count={1*new Date(post.published)}>
								{window.calcTimeFrom(post.published)}
							</time>
							<i className="icon-circle"></i>
							<TagList tags={post.tags} />
						</div>
					</div>
				);
			}
		}),
		'Question': React.createClass({
			mixins: [EditablePost, backboneModel],

			render: function () {
				var post = this.props.model.attributes;
				var userIsAuthor = window.user && post.author.id===window.user.id;

				return (
					<div>
						<PostHeader model={this.props.model} parent={this.props.parent} />

						<div className="postBody" dangerouslySetInnerHTML={{__html: this.props.model.get('content').body}}>
						</div>
						<div className="postInfobar">
							<ul className="left">
							</ul>
						</div>
						<div className="postFooter">
							<CommentSectionView collection={this.props.model.children.Comment} postModel={this.props.model} small={true} />
							<AnswerSectionView collection={this.props.model.children.Answer} postModel={this.props.model} />
						</div>
					</div>
				);
			},
		}),
		'Experience': React.createClass({
			mixins: [EditablePost, backboneModel],

			render: function () {
				var post = this.props.model.attributes;
				return (
					<div>
						<PostHeader model={this.props.model} parent={this.props.parent} />

						<div className="postBody" dangerouslySetInnerHTML={{__html: this.props.model.get('content').body}}>
						</div>

						<div className="postInfobar">
							<ul className="left">
							</ul>
						</div>
						<div className="postFooter">
							<CommentSectionView collection={this.props.model.children.Comment} postModel={this.props.model} />
						</div>
					</div>
				);
			},
		}),
		'Tip': React.createClass({
			mixins: [EditablePost, backboneModel],

			render: function () {
				var post = this.props.model.attributes;
				return (
					<div>
						<PostHeader model={this.props.model} parent={this.props.parent} />

						<div className="postBody" dangerouslySetInnerHTML={{__html: this.props.model.get('content').body}}>
						</div>

						<div className="postInfobar">
							<ul className="left">
							</ul>
						</div>
						<div className="postFooter">
							<CommentSectionView collection={this.props.model.children.Comment} postModel={this.props.model} />
						</div>
					</div>
				);
			},
		}),

	};
});


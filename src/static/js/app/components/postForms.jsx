/** @jsx React.DOM */

define(['common', 'react', 'components.postModels', 'medium-editor', 'typeahead-bundle'],
	function (common, React, postModels) {

	var mediumEditorPostOpts = {
		firstHeader: 'h1',
		secondHeader: 'h2',
		buttons: ['bold', 'italic', 'underline', 'header1', 'header2', 'quote', 'anchor', 'orderedlist'],
		buttonLabels: {
			quote: '<i class="icon-quote"></i>',
			orderedlist: '<i class="icon-list"></i>',
			anchor: '<i class="icon-link"></i>'
		}
	}

	var tagStates = new Bloodhound({
		datumTokenizer: Bloodhound.tokenizers.obj.whitespace('name'),
		queryTokenizer: Bloodhound.tokenizers.whitespace,
		local: tagData,
	});

	tagStates.initialize();

	var TagSelectionBox = React.createClass({
		getInitialState: function () {
			return {selectedTagsIds:this.props.children || []};
		},
		addTag: function (id) {
			if (this.state.selectedTagsIds.indexOf(id) === -1)
				this.setState({ selectedTagsIds: this.state.selectedTagsIds.concat(id) });
			this.props.onChangeTags();
		},
		removeTag: function (id) {
			var index = this.state.selectedTagsIds.indexOf(id);
			if (index !== -1) {
				var selected = this.state.selectedTagsIds;
				selected.splice(index, 1);
				this.setState({ selectedTagsIds: selected });
			}
			this.props.onChangeTags();
		},
		popTag: function (id) {
			var selected = this.state.selectedTagsIds;
			if (selected.length) {
				selected.pop();
				console.log('new', selected)
				this.setState({ selectedTagsIds: selected });
			}
			this.props.onChangeTags();
		},
		getSelectedTagsIds: function () {
			return this.state.selectedTagsIds;
		},
		componentDidMount: function () {
			$(this.refs.input.getDOMNode()).typeahead({
				highlight: true,
				hint: true,
			}, {
				name: 'tag',
				source: tagStates.ttAdapter(),
				templates: {
					empty: [
						'<div class="empty-message">Assunto não encontrado</div>'
					].join('\n'),
					suggestion: _.template('<div><label><%= name %></label><div class="detail">Lorem Ipsum Dolor Sit Amet</div></div>'),
				}
			});
			var self = this;
			$(this.getDOMNode()).on('click focusin focus', function () {
				$(self.getDOMNode()).addClass('focused');
				$('#tagInput').focus();
				$(self.getDOMNode()).find(".placeholder").hide();
			});
			$(this.refs.input.getDOMNode())
				.on('focusout', function () {
					$('#tagSelectionBox').removeClass('focused');
					_.defer(function () {
						$(self.refs.input.getDOMNode()).val(''); // .prop('placeholder','Tópicos relacionados');
					});
				})
				.on('keydown', function (e) {
					var key = e.keyCode || e.charCode;
					if (key == 8 && e.target.value.match(/^\s*$/)) { // delete on backspace
						self.popTag();
					}
				});
			var self = this;
			$(this.refs.input.getDOMNode()).on('typeahead:selected', function (evt, obj) {
				self.addTag(obj.id);
			});
		},
		render: function () {
			var self = this;
			var tags = _.map(this.state.selectedTagsIds, function (tagId) {
				return (
					<li className="tag" key={tagId}>
						<span>
							{this.props.data[tagId].name}
						</span>
						<span onClick={function(){self.removeTag(tagId)}}><i className="close-btn"></i></span>
					</li>
				);
			}.bind(this));
			return (
				<div className={tags.length?'':' empty '} id="tagSelectionBox">
					<i className="iconThumbnail iconThumbnailSmall icon-tags"></i>
					<ul>{
						tags.length?
						tags
						:(
							<div className="placeholder">Tópicos relacionados</div>
						)
					}</ul>
					<input ref="input" type="text" id="tagInput" />
				</div>
			);
		},
	});

	var TypeData = {
		'Question': {
			label: 'Pergunta',
			iconClass: 'icon-question'
		},
		'Tip': {
			label: 'Dica',
			iconClass: 'icon-bulb',
		},
		'Experience': {
			label: 'Experiência',
			iconClass: 'icon-trophy'
		}
	};

	var FakeCard = React.createClass({
		getInitialState: function () {
			return {title:this.props.children};
		},
		setData: function (data) {
			this.setState(data);
		},
		render: function () {
			return (
				<div className="cardView" >
					<div className="cardHeader">
						<span className="cardType">
							{
								this.props.type?
								TypeData[this.props.type].label
								:null
							}
						</span>
						<div className="iconStats">
							<div>
								<i className="icon-heart-o"></i>&nbsp;0
							</div>
							{
								this.props.type === "Question"?
								<div><i className="icon-bulb"></i>&nbsp;0</div>
								:<div><i className="icon-comment-o"></i>&nbsp;0</div>
							}
						</div>
					</div>

					<div className="cardBody">
						{this.state.title}
					</div>

					<div className="cardFoot">
						<div className="authorship">
							<span className="username">
								{this.props.author.name}
							</span>
							<div className="avatarWrapper">
								<span>
									<div className="avatar" style={ { 'background': 'url('+this.props.author.avatarUrl+')' } }></div>
								</span>
							</div>
						</div>

						<time>agora</time>
					</div>
				</div>
			);
		}
	});

	var Navbar = React.createClass({
		render: function () {
			return (
				<nav className="bar">
					<div className="navcontent">
						<span className="center">
							<a className="brand" href="/" tabIndex="-1">QI <i className="icon-bulb"></i> Labs</a>
						</span>
						{this.props.children}
					</div>
				</nav>
			);
		},
	});

	var PostEdit = React.createClass({
		componentDidMount: function () {
			var postBody = this.refs.postBody.getDOMNode(),
				postTitle = this.refs.postTitle.getDOMNode();

			var self = this;

			// Medium Editor
			// console.log('opts', mediumEditorPostOpts[this.props.model.get('type').toLowerCase()])
			this.editor = new MediumEditor(postBody, mediumEditorPostOpts);
			window.e = this.editor;
			$(postBody).mediumInsert({
				editor: this.editor,
				addons: {
					images: { // imagesUploadScript: "http://notrelative.com", formatData: function (data) {}
					}
				},
			});

			$(self.refs.postBodyWrapper.getDOMNode()).on('click', function (e) {
				if (e.target == self.refs.postBodyWrapper.getDOMNode()) {
					$(self.refs.postBody.getDOMNode()).focus();
				}
			});

			$(postTitle).on('input keyup keypress', function (e) {
				if ((e.keyCode || e.charCode) == 13) {
					e.preventDefault();
					e.stopPropagation();
					return;
				}
				var title = this.refs.postTitle.getDOMNode().value;
				this.props.model.get('content').title = title;
			}.bind(this));
			
			setTimeout(function () {
				$(postTitle).autosize();
			}, 1);

			function countWords (s){
				var ocs = s.slice(0,s.length-4).replace(/(^\s*)|(\s*$)/gi,"")
					.replace(/[ ]{2,}/gi," ")
					.replace(/\n /,"\n")
					.split(' ');
				return ocs[0]===''?(ocs.length-1):ocs.length;
			}

			var count = countWords($(postBody).text());
			// $(this.refs.wordCount.getDOMNode()).html(count+" palavra"+(count==1?"":"s"));

			$(postBody).on('input keyup', function () {
				function countWords (s){
					var ocs = s.slice(0,s.length-4).replace(/(^\s*)|(\s*$)/gi,"")
						.replace(/[ ]{2,}/gi," ")
						.replace(/\n /,"\n")
						.split(' ');
					return ocs[0]===''?(ocs.length-1):ocs.length;
				}
				var count = countWords($(this.refs.postBody.getDOMNode()).text());
				// $(this.refs.wordCount.getDOMNode()).html(count==1?count+" palavra":count+" palavras");
			}.bind(this));
		},
		componentWillUnmount: function () {
			// Destroy this.editor and unbind autosize.
			this.editor.deactivate();
			$(this.editor.anchorPreview).remove();
			$(this.editor.toolbar).remove();
			$(this.refs.postTitle.getDOMNode()).trigger('autosize.destroy');
		},
		onChangeTags: function () {
			this.props.model.set('tags', this.refs.tagSelectionBox.getSelectedTagsIds());
		},
		onClickSend: function () {
			this.props.model.set('type', this.refs.typeSelect.getDOMNode().value);
			this.props.model.attributes.content.body = this.editor.serialize().postBody.value;
			console.log(this.editor.serialize().postBody.value)
			console.log(this.props.model.attributes.content.body)
			this.props.model.save(undefined, {
				url: this.props.model.url() || '/api/posts',
				success: function (model) {
					window.location.href = model.get('path');
					app.alert("Publicação salva! :)");
				},
				error: function (model, xhr, options) {
					var data = xhr.responseJSON;
					if (data && data.message) {
						app.alert(data.message, 'danger');
					} else {
						app.alert('Erro', 'danger');
					}
				}
			});
		},
		close: function () {
			this.props.page.destroy();
		},
		render: function () {
			return (
				<div className="formBox">
					<i className="close-btn" data-action="close-page" onClick={this.close}></i>
					<div className="formWrapper">
						<div className="flatBtnBox">
							<div className="item send" onClick={this.onClickSend} data-toggle="tooltip" title="Enviar" data-placement="right">
								<i className="icon-send"></i>
							</div>
							<div className="item save" onClick="" data-toggle="tooltip" title="Salvar rascunho" data-placement="right">
								<i className="icon-save"></i>
							</div>
							<div className="item help" onClick="" data-toggle="tooltip" title="Ajuda?" data-placement="right">
								<i className="icon-question"></i>
							</div>
						</div>
						<div id="formCreatePost">
							<select ref="typeSelect" className="form-control">
								<option value="Experience">Experiência</option>
								<option value="Tip">Dica</option>
								<option value="Question">Pergunta</option>
							</select>
							
							<table><tr><td>

							</td>
							<td>
							<TagSelectionBox ref="tagSelectionBox" onChangeTags={this.onChangeTags} data={_.indexBy(tagData,'id')}>
								{this.props.model.get('tags')}
							</TagSelectionBox>
							</td></tr></table>
							<textarea ref="postTitle" className="title" name="post_title" placeholder="O que você quer contar?" defaultValue={this.props.model.get('content').title}>
							</textarea>
							<div className="bodyWrapper" ref="postBodyWrapper">
								<div id="postBody" ref="postBody"
									data-placeholder="O"
									dangerouslySetInnerHTML={{__html: (this.props.model.get('content')||{body:''}).body }}></div>
							</div>
						</div>
					</div>
				</div>
			);
		},
	});

	var PostCreationView = React.createClass({
		getInitialState: function () {
			return {};
		},
		selectFormType: function (type) {
			this.setState({chosenForm:type});
		},
		render: function () {
			this.postModel = new postModels.postItem({
				author: window.user,
				content: {
					title: '',
					body: '',
				},
			});
			return <PostEdit ref="postForm" model={this.postModel} page={this.props.page} />
		},
	});

	return {
		create: PostCreationView,
		edit: PostEdit, 
	};
});
/** @jsx React.DOM */

define(['common', 'react', 'components.postModels', 'medium-editor', 'typeahead-bundle'],
	function (common, React, postModels) {
	
	var mediumEditorPostOpts = {
		'question': {
			buttons: ['bold', 'italic', 'quote', 'anchor', 'underline', 'orderedlist'],
			buttonLabels: {
				quote: '<i class="icon-quote"></i>',
				orderedlist: '<i class="icon-list"></i>',
				anchor: '<i class="icon-link"></i>'
			}
		},
		'tip': {
			firstHeader: 'h1',
			secondHeader: 'h2',
			buttons: ['bold', 'italic', 'header1', 'header2', 'quote', 'anchor', 'underline', 'orderedlist'],
			buttonLabels: {
				quote: '<i class="icon-quote"></i>',
				orderedlist: '<i class="icon-list"></i>',
				anchor: '<i class="icon-link"></i>'
			}
		},
		'experience': {
			firstHeader: 'h1',
			secondHeader: 'h2',
			buttons: ['bold', 'italic', 'header1', 'header2', 'quote', 'anchor', 'underline', 'orderedlist'],
			buttonLabels: {
				quote: '<i class="icon-quote"></i>',
				orderedlist: '<i class="icon-list"></i>',
				anchor: '<i class="icon-link"></i>'
			}
		},
	};

	var tagStates = new Bloodhound({
		datumTokenizer: Bloodhound.tokenizers.obj.whitespace('name'),
		queryTokenizer: Bloodhound.tokenizers.whitespace,
		local: tagData,
	});

	tagStates.initialize();

	var TagSelectionBox = React.createClass({displayName: 'TagSelectionBox',
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
					React.DOM.li( {className:"tag", key:tagId}, 
						React.DOM.span(null, 
							this.props.data[tagId].name
						),
						React.DOM.span( {onClick:function(){self.removeTag(tagId)}}, React.DOM.i( {className:"close-btn"}))
					)
				);
			}.bind(this));
			return (
				React.DOM.div( {className:tags.length?'':' empty ', id:"tagSelectionBox"}, 
					React.DOM.i( {className:"iconThumbnail iconThumbnailSmall icon-tags"}),
					React.DOM.ul(null, 
						tags.length?
						tags
						:(
							React.DOM.div( {className:"placeholder"}, "Tópicos relacionados")
						)
					),
					React.DOM.input( {ref:"input", type:"text", id:"tagInput"} )
				)
			);
		},
	});

	var PageSelectPostType = React.createClass({displayName: 'PageSelectPostType',
		render: function () {
			var optionEls = _.map(_(TypeData).pairs(), function (pair) {
				var self = this;
				return (
					React.DOM.div( {className:"postOption", key:pair[0], onClick:function(){self.props.onClickOption(pair[0])}}, 
						React.DOM.div( {className:"card"}, 
							React.DOM.i( {className:pair[1].iconClass})
						),
						React.DOM.div( {className:"info"}, React.DOM.label(null, pair[1].label))
					)
				);
			}.bind(this));
			return (
				React.DOM.div( {className:""}, 
					Navbar(null, 
						React.DOM.ul( {className:"right padding"}, 
							React.DOM.li(null, 
								React.DOM.a( {className:"button plain-btn", href:"/"}, "Voltar")
							)
						)
					),
					React.DOM.div( {className:"cContainer"}, 
						React.DOM.div( {id:"postTypeSelection"}, 
							React.DOM.label(null, "Que tipo de publicação você quer fazer?"),
							React.DOM.div( {className:"optionsWrapper"}, optionEls)
						)
					)
				)
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

	var FakeCard = React.createClass({displayName: 'FakeCard',
		getInitialState: function () {
			return {title:this.props.children};
		},
		setData: function (data) {
			this.setState(data);
		},
		render: function () {
			return (
				React.DOM.div( {className:"cardView"} , 
					React.DOM.div( {className:"cardHeader"}, 
						React.DOM.span( {className:"cardType"}, 
							TypeData[this.props.type].label
						),
						React.DOM.div( {className:"iconStats"}, 
							React.DOM.div(null, 
								React.DOM.i( {className:"icon-heart-o"})," 0"
							),
							this.props.type === "Question"?
								React.DOM.div(null, React.DOM.i( {className:"icon-bulb"})," 0")
								:React.DOM.div(null, React.DOM.i( {className:"icon-comment-o"})," 0")
							
						)
					),

					React.DOM.div( {className:"cardBody"}, 
						this.state.title
					),

					React.DOM.div( {className:"cardFoot"}, 
						React.DOM.div( {className:"authorship"}, 
							React.DOM.span( {className:"username"}, 
								this.props.author.name
							),
							React.DOM.div( {className:"avatarWrapper"}, 
								React.DOM.span(null, 
									React.DOM.div( {className:"avatar", style: { 'background': 'url('+this.props.author.avatarUrl+')' } })
								)
							)
						),

						React.DOM.time(null, "agora")
					)
				)
			);
		}
	});

	var Navbar = React.createClass({displayName: 'Navbar',
		render: function () {
			return (
				React.DOM.nav( {className:"bar"}, 
					React.DOM.div( {className:"navcontent"}, 
						React.DOM.span( {className:"center"}, 
							React.DOM.a( {className:"brand", href:"/", tabIndex:"-1"}, "QI ", React.DOM.i( {className:"icon-bulb"}), " Labs")
						),
						this.props.children
					)
				)
			);
		},
	});

	var PostEdit = React.createClass({displayName: 'PostEdit',
		componentDidMount: function () {
			var postBody = this.refs.postBody.getDOMNode(),
				postTitle = this.refs.postTitle.getDOMNode();

			// Medium Editor
			console.log('opts', mediumEditorPostOpts[this.props.model.get('type').toLowerCase()])
			this.editor = new MediumEditor(postBody, mediumEditorPostOpts[this.props.model.get('type').toLowerCase()]);
			window.e = this.editor;
			$(postBody).mediumInsert({
				editor: this.editor,
				addons: {
					images: {
						// imagesUploadScript: "http://notrelative.com",
						// formatData: function (data) {
						// 	console.log(arguments);
						// }
					}
				},
			});

			$(postTitle).on('input keyup keypress', function (e) {
				if ((e.keyCode || e.charCode) == 13) {
					e.preventDefault();
					e.stopPropagation();
					return;
				}
				var title = this.refs.postTitle.getDOMNode().value;
				this.refs.cardDemo.setData({
					title: title,
				});
				this.props.model.get('content').title = title;
			}.bind(this));
			
			setTimeout(function () {
				$(postTitle).autosize();
			}, 1);

			$(postBody).on('input keyup', function () {
				function countWords (s){
					var ocs = s.slice(0,s.length-4).replace(/(^\s*)|(\s*$)/gi,"")
						.replace(/[ ]{2,}/gi," ")
						.replace(/\n /,"\n")
						.split(' ');
					return ocs[0]===''?(ocs.length-1):ocs.length;
				}
				var count = countWords($(this.refs.postBody.getDOMNode()).text());
				$(this.refs.wordCount.getDOMNode()).html(count?(count==1?count+" palavra":count+" palavras"):'');
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
		render: function () {
			var defaultTitle = "Título da "+TypeData[this.props.model.get('type')].label;
			return (
				React.DOM.div(null, 
					Navbar(null, 
						React.DOM.ul( {className:"right padding"}, 
							React.DOM.li(null, 
								React.DOM.a( {href:"#", className:"button plain-btn", 'data-action':"discart-post"}, "Cancelar")
							),
							React.DOM.li(null, 
								React.DOM.button( {onClick:this.onClickSend, 'data-action':"send-post"}, "Publicar")
							)
						)
					),

					React.DOM.div( {className:"cContainer"}, 

						React.DOM.div( {className:"formWrapper"}, 
							React.DOM.div( {id:"formCreatePost"}, 
								React.DOM.div( {className:"cardDemo wall grid"}, 
									FakeCard( {ref:"cardDemo", type:this.props.model.get('type'), author:this.props.model.get('author')}, 
										this.props.model.get('content').title
									)
								),
								React.DOM.textarea( {ref:"postTitle", className:"title", name:"post_title", placeholder:defaultTitle, defaultValue:this.props.model.get('content').title}
								),
								TagSelectionBox( {ref:"tagSelectionBox", onChangeTags:this.onChangeTags, data:_.indexBy(tagData,'id')}, 
									this.props.model.get('tags')
								),
								React.DOM.div( {className:"bodyWrapper"}, 
									React.DOM.div( {id:"postBody", ref:"postBody",
										'data-placeholder':"Conte a sua experiência aqui. Mínimo de 100 palavras.",
										dangerouslySetInnerHTML:{__html: (this.props.model.get('content')||{body:''}).body }})
								)
							)
						),
						
						React.DOM.div( {ref:"wordCount", className:"wordCounter"})
					)
				)
			);
		},
	});

	var PostCreationView = React.createClass({displayName: 'PostCreationView',
		getInitialState: function () {
			return {};
		},
		selectFormType: function (type) {
			this.setState({chosenForm:type});
		},
		render: function () {
			if (this.state.chosenForm) {
				this.postModel = new postModels.postItem({
					type: this.state.chosenForm,
					author: window.user,
					content: {
						title: '',
						body: '',
					},
				});
				return PostEdit( {ref:"postForm", model:this.postModel} )
			} else
				return PageSelectPostType( {onClickOption:this.selectFormType} )
		},
	});

	return {
		create: PostCreationView,
		edit: PostEdit, 
	};
});
/** @jsx React.DOM */

define(['common', 'react', 'components.postModels', 'medium-editor', 'typeahead-bundle'],
	function (common, React, postModels) {

	var mediumEditorPostOpts = {
		firstHeader: 'h1',
		secondHeader: 'h2',
		buttons: ['bold', 'italic', 'underline', 'header1', 'header2', 'quote', 'anchor', 'orderedlist'],
		buttonLabels: {
			quote: '<i class="icon-quote-left"></i>',
			orderedlist: '<i class="icon-list"></i>',
			anchor: '<i class="icon-link"></i>'
		}
	};

	var tagData = _.map(tagMap, function (obj, key) {
		return {
			id: key,
			name: obj.name,
			detail: obj.detail,
		};
	});

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
					suggestion: _.template('<div><label><%= name %></label><div class="detail"><%= detail %></div></div>'),
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

			var self = this;

			// Close when user clicks directly on element (meaning the faded black background)
			$(this.getDOMNode().parentElement).on('click', function onClickOut (e) {
				if (e.target === this || e.target === self.getDOMNode()) {
					self.close();
					$(this).unbind('click', onClickOut);
				}
			});
			$('body').addClass('crop');
			var postBody = this.refs.postBody.getDOMNode(),
				postTitle = this.refs.postTitle.getDOMNode();

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
			$('body').removeClass('crop');
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
			// This check is ugly.
			if ($(this.refs.postBody.getDOMNode()).text() !== '+Img') {
				if (!confirm("Deseja descartar permanentemente as suas alterações?"))
					return;
			}
			this.props.page.destroy();
		},
		render: function () {
			return (
				React.DOM.div( {className:"postBox"}, 
					React.DOM.i( {className:"close-btn", 'data-action':"close-page", onClick:this.close}),
					React.DOM.div( {className:"formWrapper"}, 
						React.DOM.div( {className:"flatBtnBox"}, 
							React.DOM.div( {className:"item send", onClick:this.onClickSend, 'data-toggle':"tooltip", title:"Enviar", 'data-placement':"right"}, 
								React.DOM.i( {className:"icon-paper-plane"})
							),
							React.DOM.div( {className:"item save", onClick:"", 'data-toggle':"tooltip", title:"Salvar rascunho", 'data-placement':"right"}, 
								React.DOM.i( {className:"icon-save"})
							),
							React.DOM.div( {className:"item help", onClick:"", 'data-toggle':"tooltip", title:"Ajuda?", 'data-placement':"right"}, 
								React.DOM.i( {className:"icon-question"})
							)
						),
						React.DOM.div( {id:"formCreatePost"}, 
							React.DOM.div( {className:"category-select-wrap"}, 
								React.DOM.span(null, "Essa publicação é uma " ),
								React.DOM.select( {ref:"typeSelect", className:"form-control"}, 
									React.DOM.option( {value:"Experience"}, "Experiência"),
									React.DOM.option( {value:"Tip"}, "Dica"),
									React.DOM.option( {value:"Question"}, "Pergunta")
								)
							),
							
							TagSelectionBox( {ref:"tagSelectionBox", onChangeTags:this.onChangeTags, data:_.indexBy(tagData,'id')}, 
								this.props.model.get('tags')
							),
							React.DOM.textarea( {ref:"postTitle", className:"title", name:"post_title", placeholder:"Sobre o que você quer falar?", defaultValue:this.props.model.get('content').title}
							),
							React.DOM.div( {className:"bodyWrapper", ref:"postBodyWrapper"}, 
								React.DOM.div( {id:"postBody", ref:"postBody",
									'data-placeholder':"",
									dangerouslySetInnerHTML:{__html: (this.props.model.get('content')||{body:''}).body }})
							)
						)
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
			this.postModel = new postModels.postItem({
				author: window.user,
				content: {
					title: '',
					body: '',
				},
			});
			return PostEdit( {ref:"postForm", model:this.postModel, page:this.props.page} )
		},
	});

	return {
		create: PostCreationView,
		edit: PostEdit, 
	};
});
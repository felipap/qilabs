/** @jsx React.DOM */

var $ = require('jquery')
var Backbone = require('backbone')
var _ = require('lodash')
var React = require('react')

var models = require('../components/models.js')
var MediumEditor = require('medium-editor')
var toolbar = require('./parts/toolbar.js')
var Modal = require('./parts/modal.js')

function refreshLatex () {
	setTimeout(function () {
		if (window.MathJax)
			MathJax.Hub.Queue(["Typeset",MathJax.Hub]);
		else
			console.warn("MathJax object not found.")
	}, 100);
}

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

var Header = React.createClass({displayName: 'Header',
	mixins: [EditablePost],

	onClickShare: function () {
		Modal.ShareDialog({
			message: "Compartilhe esse problema",
			title: this.props.model.get('content').title,
			url: 'http://www.qilabs.org'+this.props.model.get('path'),
		});
	},

	render: function () {
		var doc = this.props.model.attributes;
		var userIsAuthor = window.user && doc.author.id===window.user.id;

		var FollowBtn = null;
		if (window.user) {
			if (!userIsAuthor && doc._meta && typeof doc._meta.authorFollowed !== 'undefined') {
				if (doc._meta.authorFollowed) {
					FollowBtn = (
						React.DOM.button( {className:"btn-follow", 'data-action':"unfollow", 'data-user':doc.author.id})
					)
				} else {
					FollowBtn = (
						React.DOM.button( {className:"btn-follow", 'data-action':"follow", 'data-user':doc.author.id})
					)
				}
			}
		}

		var pageObj;
		var tagNames = [];
		var subtagsUniverse = {};
		if (doc.subject && doc.subject in pageMap) {
			pageObj = pageMap[doc.subject];

			if (doc.subject && pageMap[doc.subject] && pageMap[doc.subject].children)
				subtagsUniverse = pageMap[doc.subject].children;

			if (pageObj) {
				tagNames.push(pageObj);
				_.each(doc.tags, function (id) {
					if (id in subtagsUniverse)
						tagNames.push({
							name: subtagsUniverse[id].name,
							path: pageMap[doc.subject].path+'?tag='+id
						});
				});
			}
		}

		var views;
		if (doc._meta.views && doc._meta.views > 1) {
			var count = Math.ceil(doc._meta.views/10)*10;
			// change this
			views = (
				React.DOM.span( {className:"views"}, 
					React.DOM.i( {className:"icon-dot"}), " ", count, " VISUALIZAÇÕES"
				)
			);
		}

		return (
			React.DOM.div( {className:"postHeader"}, 
				React.DOM.div( {className:"tags"}, 
					_.map(tagNames, function (obj) {
						if (obj.path)
							return (
								React.DOM.a( {className:"tag", href:obj.path, key:obj.name}, 
									"#",obj.name
								)
							);
						return (
							React.DOM.div( {className:"tag", key:obj.name}, 
								"#",obj.name
							)
						);
					})
				),
				React.DOM.div( {className:"postTitle"}, 
					doc.content.title
				),
				React.DOM.time(null, 
					React.DOM.span( {'data-time-count':1*new Date(doc.created_at), 'data-short':"false", title:formatFullDate(new Date(doc.created_at))}, 
						window.calcTimeFrom(doc.created_at, false)
					),
					views
				),

				React.DOM.div( {className:"authorInfo"}, 
					React.DOM.a( {href:doc.author.path, className:"username"}, 
						React.DOM.div( {className:"user-avatar"}, 
							React.DOM.div( {className:"avatar", style: { background: 'url('+doc.author.avatarUrl+')' } })
						),
						doc.author.name
					),
					FollowBtn
				),

				
					(userIsAuthor)?
					React.DOM.div( {className:"flatBtnBox"}, 
						toolbar.EditBtn({cb: this.props.parent.onClickEdit}), 
						toolbar.ShareBtn({cb: this.onClickShare}) 
					)
					:React.DOM.div( {className:"flatBtnBox"}, 
						toolbar.LikeBtn({
							cb: this.props.parent.toggleVote,
							active: window.user && doc.votes.indexOf(window.user.id) != -1,
							text: doc.counts.votes
						}),
						toolbar.ShareBtn({cb: this.onClickShare}),
						toolbar.FlagBtn({cb: this.onClickShare})
					)
				
			)
		);
	}
});

//

module.exports = React.createClass({displayName: 'exports',
	mixins: [EditablePost, backboneModel],

	componentDidMount: function () {
		refreshLatex();
	},

	componentDidUpdate: function () {
		refreshLatex();
	},

	tryAnswer: function (e) {
		if (this.props.model.get('answer').is_mc) {
			// var data = { index: parseInt(e.target.dataset.index) };
			var data = { value: e.target.dataset.value };
		} else {
			var data = { value: this.refs.answerInput.getDOMNode().value };
		}
		this.props.model.try(data);
	},

	render: function () {
		var doc = this.props.model.attributes;
		var userIsAuthor = window.user && doc.author.id===window.user.id;

		// if window.user.id in this.props.model.get('hasSeenAnswer'), show answers
		console.log(doc);
		var source = doc.content.source;
		var isAdaptado = source && (!!source.match(/(^\[adaptado\])|(adaptado)/));

		// Make right column
		console.log(this.props.model)
		var MAXTRIES = 3;
		var rightCol;
		if (userIsAuthor) {
			rightCol = (
				React.DOM.div( {className:"answer-col alternative"}, 
					React.DOM.div( {className:"message"}, 
						React.DOM.h3(null, "Você criou esse problema.")
					)
				)
			)
		} else if (this.props.model.solved) {
			rightCol = (
				React.DOM.div( {className:"answer-col alternative"}, 
					React.DOM.div( {className:"message"}, 
						React.DOM.h3(null, "Você já respondeu essa pergunta.")
					)
				)
			);
		} else if (this.props.model.tries === MAXTRIES) {
			rightCol = (
				React.DOM.div( {className:"answer-col alternative"}, 
					React.DOM.div( {className:"message"}, 
						React.DOM.h3(null, "Limite de tentativas excedido.")
					)
				)
			);
		} else {
			if (doc.answer.is_mc) {
				var mc_options = doc.answer.mc_options;
				rightCol = (
					React.DOM.div( {className:"answer-col"}, 
						React.DOM.div( {className:"answer-col-mc"}, 
							React.DOM.ul(null, 
								React.DOM.li(null, React.DOM.button( {onClick:this.tryAnswer, className:"right-ans",
									'data-index':"0", 'data-value':mc_options[0]}, mc_options[0])),
								React.DOM.li(null, React.DOM.button( {onClick:this.tryAnswer, className:"wrong-ans",
									'data-index':"1", 'data-value':mc_options[1]}, mc_options[1])),
								React.DOM.li(null, React.DOM.button( {onClick:this.tryAnswer, className:"wrong-ans",
									'data-index':"2", 'data-value':mc_options[2]}, mc_options[2])),
								React.DOM.li(null, React.DOM.button( {onClick:this.tryAnswer, className:"wrong-ans",
									'data-index':"3", 'data-value':mc_options[3]}, mc_options[3])),
								React.DOM.li(null, React.DOM.button( {onClick:this.tryAnswer, className:"wrong-ans",
									'data-index':"4", 'data-value':mc_options[4]}, mc_options[4]))
							)
						)
					)
				);
			} else {
				rightCol = (
					React.DOM.div( {className:"answer-col"}, 
						React.DOM.div( {className:"answer-col-value"}, 
							React.DOM.label(null, "Qual é a resposta para a essa pergunta?"),
							React.DOM.input( {ref:"answerInput", defaultValue:doc.answer.value, placeholder:"Resultado"} ),
							React.DOM.button( {className:"try-answer", onClick:this.tryAnswer}, "Responder"),
							
								this.props.model.tries?
								React.DOM.div( {className:"tries-left"}, "Você tem ", MAXTRIES-this.props.model.tries, " chances restantes.")
								:null
							
						)
					)
				);
			}
		}

		return (
			React.DOM.div( {className:"postCol question"}, 
				React.DOM.div( {className:"content-col"}, 
					Header( {model:this.props.model, parent:this.props.parent} ),

					React.DOM.div( {className:"content-col-window"}, 
						React.DOM.div( {className:"content"}, 
							React.DOM.div( {className:"postBody", dangerouslySetInnerHTML:{__html: marked(doc.content.body)}})
						),
						
							source?
							React.DOM.div( {className:"sauce"}, source)
							:null
						
					),

					React.DOM.div( {className:"fixed-footer"}, 
						React.DOM.div( {className:"info"}, 
							React.DOM.span( {className:"label-info"}, doc.translatedTopic),
							React.DOM.span( {className:"label-default"}, "Nível ", doc.level)
						),
						React.DOM.div( {className:"actions"}, 
							doc.counts.solved || 0, " resolveram"
						)
					)
				),
				rightCol
			)
		);
	},
})
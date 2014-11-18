/** @jsx React.DOM */

var $ = require('jquery')
var Backbone = require('backbone')
var _ = require('lodash')
var React = require('react')

var models = require('../components/models.js')
var MediumEditor = require('medium-editor')
var toolbar = require('./parts/toolbar.jsx')
var Modal = require('./parts/dialog.jsx')

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

var Header = React.createClass({
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
						<button className="btn-follow" data-action="unfollow" data-user={doc.author.id}></button>
					)
				} else {
					FollowBtn = (
						<button className="btn-follow" data-action="follow" data-user={doc.author.id}></button>
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
				<span className="views">
					<i className="icon-dot"></i> {count} VISUALIZAÇÕES
				</span>
			);
		}

		return (
			<div className="postHeader">
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
					{doc.content.title}
				</div>
				<time>
					<span data-time-count={1*new Date(doc.created_at)} data-short="false" title={formatFullDate(new Date(doc.created_at))}>
						{window.calcTimeFrom(doc.created_at, false)}
					</span>
					{views}
				</time>

				<div className="authorInfo">
					<a href={doc.author.path} className="username">
						<div className="user-avatar">
							<div className="avatar" style={ { background: 'url('+doc.author.avatarUrl+')' } }></div>
						</div>
						{doc.author.name}
					</a>
					{FollowBtn}
				</div>

				{
					(userIsAuthor)?
					<div className="sideBtns">
						{toolbar.EditBtn({cb: this.props.parent.onClickEdit}) }
						{toolbar.ShareBtn({cb: this.onClickShare}) }
					</div>
					:<div className="sideBtns">
						{toolbar.LikeBtn({
							cb: this.props.parent.toggleVote,
							active: window.user && doc.votes.indexOf(window.user.id) != -1,
							text: doc.counts.votes
						})}
						{toolbar.ShareBtn({cb: this.onClickShare})}
						{toolbar.FlagBtn({cb: this.onClickShare})}
					</div>
				}
			</div>
		);
	}
});

//

module.exports = React.createClass({
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
		if (false && userIsAuthor) {
			rightCol = (
				<div className="answer-col alternative">
					<div className="message">
						<h3>Você criou esse problema.</h3>
					</div>
				</div>
			)
		} else if (this.props.model.solved) {
			rightCol = (
				<div className="answer-col alternative">
					<div className="message">
						<h3>Você já respondeu essa pergunta.</h3>
					</div>
				</div>
			);
		} else if (this.props.model.tries === MAXTRIES) {
			rightCol = (
				<div className="answer-col alternative">
					<div className="message">
						<h3>Limite de tentativas excedido.</h3>
					</div>
				</div>
			);
		} else {
			if (doc.answer.is_mc) {
				var mc_options = doc.answer.mc_options;
				rightCol = (
					<div className="answer-col">
						<div className="answer-col-mc">
							<ul>
								<li><button onClick={this.tryAnswer} className="right-ans"
									data-index="0" data-value={mc_options[0]}>{mc_options[0]}</button></li>
								<li><button onClick={this.tryAnswer} className="wrong-ans"
									data-index="1" data-value={mc_options[1]}>{mc_options[1]}</button></li>
								<li><button onClick={this.tryAnswer} className="wrong-ans"
									data-index="2" data-value={mc_options[2]}>{mc_options[2]}</button></li>
								<li><button onClick={this.tryAnswer} className="wrong-ans"
									data-index="3" data-value={mc_options[3]}>{mc_options[3]}</button></li>
								<li><button onClick={this.tryAnswer} className="wrong-ans"
									data-index="4" data-value={mc_options[4]}>{mc_options[4]}</button></li>
							</ul>
						</div>
					</div>
				);
			} else {
				rightCol = (
					<div className="answer-col">
						<div className="answer-col-value">
							<label>Qual é a resposta para a essa pergunta?</label>
							<input ref="answerInput" defaultValue={doc.answer.value} placeholder="Resultado" />
							<button className="try-answer" onClick={this.tryAnswer}>Responder</button>
							{
								this.props.model.tries?
								<div className="tries-left">Você tem {MAXTRIES-this.props.model.tries} chances restantes.</div>
								:null
							}
						</div>
					</div>
				);
			}
		}

		return (
			<div className="postCol question">
				<div className="content-col">
					<Header model={this.props.model} parent={this.props.parent} />

					<div className="content-col-window">
						<div className="content">
							<div className="postBody" dangerouslySetInnerHTML={{__html: marked(doc.content.body)}}></div>
						</div>
						{
							source?
							<div className="sauce">{source}</div>
							:null
						}
					</div>

					<div className="fixed-footer">
						<div className="info">
							<span className="label-info">{doc.translatedTopic}</span>
							<span className="label-default">Nível {doc.level}</span>
						</div>
						<div className="actions">
							{doc.counts.solved || 0} resolveram
						</div>
					</div>
				</div>
				{rightCol}
			</div>
		);
	},
})
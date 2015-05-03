
var $ = require('jquery')
var _ = require('lodash')
var React = require('react')
var selectize = require('selectize')

var models = require('../components/models.js')
var Toolbar = require('./parts/toolbar.jsx')
var Modal = require('../components/modal.jsx')
// var Mixins = require('./parts/mixins.js')

//

var CollectionEdit = React.createClass({
	propTypes: {
		model: React.PropTypes.any.isRequired,
		page: React.PropTypes.any.isRequired,
	},
	//
	getInitialState: function () {
		var problemIds = this.props.model.get('problemIds') || [];
		problemIds.push('');
		return {
			// answerIsMC: this.props.model.get('answer').is_mc,
			// subject: this.props.model.get('subject'),
			problemIds: problemIds,
		};
	},
	//
	componentDidMount: function () {
		// Close when user clicks directly on element (meaning the faded black background)
		$(this.getDOMNode().parentElement).on('click', function onClickOut (e) {
			// console.log('oooo', e.target, this.getDOMNode().parentElement)
			if (e.target === this.getDOMNode().parentElement) {
				if (confirm("Deseja descartar permanentemente as suas alterações?")) {
					this.close();
					$(this).unbind('click', onClickOut);
				}
			}
		}.bind(this));

		// Prevent newlines in title
		$(this.refs.postTitle.getDOMNode()).on('input keyup keypress', function (e) {
			if ((e.keyCode || e.charCode) === 13) {
				e.preventDefault();
				e.stopPropagation();
				return;
			}
		}.bind(this));
	},
	componentWillUnmount: function () {
		$(this.refs.postTitle.getDOMNode()).trigger('autosize.destroy');
		$('.tooltip').remove(); // fuckin bug
	},
	//
	preview: function () {
		// Show a preview of the rendered markdown text.
		var html = app.utils.renderMarkdown(this.refs.postBody.getDOMNode().value)
		var Preview = React.createClass({
			render: function () {
				return (
					<div>
						<h1>Seu texto vai ficar assim:</h1>
						<span className="content" dangerouslySetInnerHTML={{__html: html }}></span>
						<small>
							(clique fora da caixa para sair)
						</small>
					</div>
				)
			}
		});
		Modal(<Preview />, "preview", function () {
			app.utils.refreshLatex();
		});
	},
	send: function () {
		// get description, title
		console.log('send')
		this.props.model.attributes.description = this.refs.postBody.getDOMNode().value;
		this.props.model.attributes.title = this.refs.postTitle.getDOMNode().value;

		var pids = [];
		var $problemIds = $(this.refs.problemIds.getDOMNode());
		$problemIds.find('>li>input').each(function (item) {
			pids.push(item.value);
		});

		// get problemIds
		this.props.model.attributes.problemIds = pids;

		this.props.model.save(undefined, {
			url: this.props.model.url() || '/api/psets',
			success: function (model) {
				window.location.href = model.get('path');
				app.flash.info("Pset salvo.");
			},
			error: function (model, xhr, options) {
				var data = xhr.responseJSON;
				if (data && data.message) {
					app.flash.alert(data.message);
				} else {
					app.flash.alert('Friedman... Milton Friedman.');
				}
			}
		});
	},
	close: function () {
		this.props.page.destroy();
	},
	//
	render: function () {
		var doc = this.props.model.attributes;

		var generateIdInputs = function () {
			var items = _.map(this.state.problemIds, function (pId, index) {
				return (
					<li>
						<span>{(index+1)}</span>
						<input type="text" defaultValue={pId} placeholder={''+(index+1)+'º item'} />
					</li>
				);
			});
			return (
				<div className="problem-ids" ref="problemIds">
					{items}
				</div>
			);
		}.bind(this)

		var onClickSend = function () {
			this.send();
		}.bind(this);

		var onClickTrash = function () {
			if (this.props.isNew) {
				if (confirm('Tem certeza que deseja descartar essa coleção?')) {
					this.props.model.destroy(); // Won't touch API, backbone knows better
					this.close();
				}
			} else {
				if (confirm('Tem certeza que deseja excluir essa coleção?')) {
					this.props.model.destroy();
					this.close();
					// Signal to the wall that the post with this ID must be removed.
					// This isn't automatic (as in deleting comments) because the models on
					// the wall aren't the same as those on post FullPostView.
					console.log('id being removed:',this.props.model.get('id'))
					app.streamItems.remove({id:this.props.model.get('id')})
				}
			}
		}.bind(this)

		return (
			<div className="qi-box">
				<i className="close-btn icon-clear" data-action="close-page" onClick={this.close}></i>

				<div className="form-wrapper">
					<div className="sideBtns">
						<Toolbar.SendBtn cb={onClickSend} />
						<Toolbar.PreviewBtn cb={this.preview} />
						{
							this.props.isNew?
							<Toolbar.CancelPostBtn cb={onClickTrash} />
							:<Toolbar.RemoveBtn cb={onClickTrash} />
						}
						<Toolbar.HelpBtn />
					</div>

					<header>
						<div className="label">
							Criar Nova Coleção
						</div>
					</header>

					<ul className="inputs">
						<li className="title">
							<textarea ref="postTitle" name="post_title"
								placeholder="Título para a sua coleção"
								defaultValue={doc.title}>
							</textarea>
						</li>

						<li className="body">
							<div className="pagedown-button-bar" id="wmd-button-bar"></div>
							<textarea ref="postBody" id="wmd-input"
								placeholder="Descreva a sua coleção em plaintext."
								data-placeholder="Descreva a sua coleção em plaintext."
								defaultValue={ doc.description }></textarea>
						</li>

						{generateIdInputs()}
					</ul>
				</div>
			</div>
		);
	},
});

var CollectionCreate = function (data) {
	var psetModel = new models.Collection({
		author: window.user,
		title: '',
		description: '',
	});
	return (
		<CollectionEdit model={psetModel} page={data.page} isNew={true} />
	)
};

module.exports = {
	create: CollectionCreate,
	edit: CollectionEdit,
};
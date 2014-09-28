/** @jsx React.DOM */

var React = require('react')

function GenerateBtn (className, icon, title, activable) {
	return React.createClass({
		onClick: function () {
			if (this.props.cb) {
				this.props.cb()
			} else {
				$('#srry').fadeIn()
			}
		},
		render: function () {
			return (
				<div className={'item '+className+(this.props.active?' active ':'')} onClick={this.onClick}
					data-toggle='tooltip' title={title} data-placement='right'>
					<i className={icon}></i><span className="text">{this.props.text}</span>
				</div>
			)
		}
	});
}

module.exports = {
	EditBtn: GenerateBtn('edit', 'icon-pencil', 'Editar'),
	FlagBtn: GenerateBtn('flag', 'icon-flag', 'Sinalizar publicação'),
	LikeBtn: GenerateBtn('like', 'icon-heart-o', '', true),
	HelpBtn: GenerateBtn('help', 'icon-question', 'Ajuda?'),
	SendBtn: GenerateBtn('send', 'icon-paper-plane', 'Salvar'),
	ShareBtn: GenerateBtn('share', 'icon-share-alt', 'Compartilhar'),
	RemoveBtn: GenerateBtn('remove', 'icon-trash-o', 'Excluir'),
	PreviewBtn: GenerateBtn('preview', 'icon-zoom', 'Preview'),
}
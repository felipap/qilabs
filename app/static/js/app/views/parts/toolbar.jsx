
var React = require('react')

function GenerateBtn (className, icon, title) {
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
	EditBtn: GenerateBtn('edit', 'icon-edit', 'Editar'),
	FlagBtn: GenerateBtn('flag', 'icon-flag', 'Sinalizar publicação'),
	LikeBtn: GenerateBtn('like', 'icon-favorite', ''),
	HelpBtn: GenerateBtn('help', 'icon-help', 'Ajuda?'),
	SendBtn: GenerateBtn('send', 'icon-send', 'Salvar'),
	ShareBtn: GenerateBtn('share', 'icon-share', 'Compartilhar'),
	RemoveBtn: GenerateBtn('remove', 'icon-delete', 'Excluir'),
	CancelPostBtn: GenerateBtn('cancel-post', 'icon-undo', 'Cancelar'),
	PreviewBtn: GenerateBtn('preview', 'icon-search', 'Visualizar'),
}

var React = require('react')

function GenerateBtn (className, icon, title) {
	return React.createClass({
		onClick: function () {
			if (this.props.cb) {
				this.props.cb();
			} else {
				$('#srry').fadeIn();
			}
		},
		render: function () {
			return (
				<div
					className={'item '+className+(this.props.active?' active ':'')}
					title={title}
					onClick={this.onClick}
					data-toggle='tooltip' data-placement='right'>
					<i className={icon}></i><span className="text">{this.props.text}</span>
				</div>
			)
		}
	});
}

class NullElement extends React.Component {
	render() {
		return null;
	}
}

module.exports = {
	Edit: GenerateBtn('edit', 'icon-edit', 'Editar'),
	Flag: NullElement, // GenerateBtn('flag', 'icon-flag', 'Sinalizar publicação'),
	Like: GenerateBtn('like', 'icon-favorite', ''),
	Help: GenerateBtn('help', 'icon-help', 'Ajuda?'),
	Send: GenerateBtn('send', 'icon-send', 'Salvar'),
	Share: GenerateBtn('share', 'icon-share', 'Compartilhar'),
	FacebookShare: GenerateBtn('facebook', 'icon-facebook', 'Compartilhar'),
	Remove: GenerateBtn('remove', 'icon-delete', 'Excluir'),
	CancelPost: GenerateBtn('cancel-post', 'icon-undo', 'Cancelar'),
	Preview: GenerateBtn('preview', 'icon-search', 'Visualizar'),
};
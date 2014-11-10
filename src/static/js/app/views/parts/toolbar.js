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
				React.DOM.div( {className:'item '+className+(this.props.active?' active ':''), onClick:this.onClick,
					'data-toggle':"tooltip", title:title, 'data-placement':"right"}, 
					React.DOM.i( {className:icon}),React.DOM.span( {className:"text"}, this.props.text)
				)
			)
		}
	});
}

module.exports = {
	EditBtn: GenerateBtn('edit', 'icon-pencil', 'Editar'),
	FlagBtn: GenerateBtn('flag', 'icon-flag2', 'Sinalizar publicação'),
	LikeBtn: GenerateBtn('like', 'icon-heart-o', '', true),
	HelpBtn: GenerateBtn('help', 'icon-help', 'Ajuda?'),
	SendBtn: GenerateBtn('send', 'icon-send-o', 'Salvar'),
	ShareBtn: GenerateBtn('share', 'icon-share-alt', 'Compartilhar'),
	RemoveBtn: GenerateBtn('remove', 'icon-delete2', 'Excluir'),
	CancelPostBtn: GenerateBtn('cancel-post', 'icon-delete2', 'Cancelar'),
	PreviewBtn: GenerateBtn('preview', 'icon-zoom', 'Preview'),
}
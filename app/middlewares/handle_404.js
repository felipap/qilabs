module.exports = function(req, res) {
	res.render404({ msg: 'Não encontramos a página que você estava tentando visualizar...' });
}
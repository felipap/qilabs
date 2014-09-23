
var _ = require('lodash');

var all = {
	'problema': { name: "Problema", },
	'experiencia': { name: "Experiência", },
	'duvida': { name: "Dúvida", },
	'novidade': { name: 'Novidade', },
	'duvida': { name: 'Dúvida', },
	'essay': { name: 'Essay', },
	'aviso': { name: 'Aviso', auth: 1 },
	'ajuda': { name: 'Ajuda', },
	'conteudo': { name: 'Conteúdo', },
	'voluntariado': { name: 'Voluntariado', }
}

function genSubtags (str) {
	var obj = {};
	_.each(str.split(' '), function (i) {
		if (i in all)
			return obj[i] = all[i];
		throw new Error("PUTS. Tag "+i+" não encontrada.");
	});
	return obj;
}

module.exports = {
	data: {
		'application': {
			name: 'Application',
			path: 'application',
			icon: 'icon-globe3',
			guidePath: '/guias/application',
			children: genSubtags('experiencia duvida ajuda essay'),
		},
		'mathematics': {
			name: 'Matemática',
			path: 'matematica',
			icon: 'icon-pi-outline',
			guidePath: '/guias/olimpiadas-matematica',
			children: genSubtags('problema experiencia duvida aviso conteudo'),
		},
		'physics': {
			name: 'Física',
			icon: 'icon-rocket2',
			path: 'fisica',
			children: genSubtags('problema experiencia duvida aviso conteudo'),
		},
		'chemistry': {
			name: 'Química',
			path: 'quimica',
			icon: 'icon-lab',
			children: genSubtags('problema experiencia duvida aviso conteudo'),
		},
		'programming': {
			name: 'Programação',
			path: 'programacao',
			icon: 'icon-terminal',
			guidePath: '/guias/programacao',
			children: genSubtags('problema experiencia duvida aviso conteudo'),
		},
		'entrepreneurship': {
			name: 'Empreededorismo',
			path: 'empreendedorismo',
			icon: 'icon-group-outline',
			// guidePath: '/guias/programacao',
			children: genSubtags('experiencia duvida aviso voluntariado'),
		},
		'meta': {
			name: 'Qi Meta',
			icon: 'icon-lightbulb2',
			path: 'meta',
			children: genSubtags('novidade duvida ajuda'),
		},
	}
}

_ = require('lodash')

all = {
	'problema': { name: "Problema", },
	'experiencia': { name: "Experiência", },
	'duvida': { name: "Dúvida", },
	'novidade': { name: 'Novidade', description: 'Novidades sobre o QI Labs.' },
	'duvida': { name: 'Dúvida', description: 'Dúvidas sobre problemas.' },
	'essay': { name: 'Essay', description: '\'O' },
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
	'application': {
		name: 'Application',
		path: '/labs/application',
		icon: 'icon-globe3',
		guidePath: '/guias/application',
		background: 'http://i.imgur.com/pDi89os.jpg',
		bio: 'Application',
		children: genSubtags('experiencia duvida ajuda essay'),
	},
	'mathematics': {
		name: 'Matemática',
		path: '/labs/matematica',
		background: 'http://i.imgur.com/6xfvRcl.jpg',
		icon: 'icon-pi-outline',
		guidePath: '/guias/olimpiadas-matematica',
		children: genSubtags('problema experiencia duvida aviso conteudo'),
	},
	'physics': {
		name: 'Física',
		icon: 'icon-rocket2',
		background: 'http://i.imgur.com/rV40WF4.jpg',
		path: '/labs/fisica',
		children: genSubtags('problema experiencia duvida aviso conteudo'),
	},
	'chemistry': {
		name: 'Química',
		path: '/labs/quimica',
		icon: 'icon-lab',
		children: genSubtags('problema experiencia duvida aviso conteudo'),
	},
	'programming': {
		name: 'Programação',
		path: '/labs/programacao',
		icon: 'icon-terminal',
		guidePath: '/guias/programacao',
		children: genSubtags('problema experiencia duvida aviso conteudo'),
	},
	'entrepreneurship': {
		name: 'Empreendedorismo',
		path: '/labs/empreendedorismo',
		icon: 'icon-group-outline',
		// guidePath: '/guias/programacao',
		children: genSubtags('experiencia duvida aviso voluntariado'),
	},
	'meta': {
		name: 'Qi Meta',
		icon: 'icon-lightbulb2',
		path: '/labs/meta',
		children: genSubtags('novidade duvida ajuda'),
	},
}
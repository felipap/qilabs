
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
		description: 'Publicações sobre o processo de admissão em universidades estrangeiras.',
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
		description: 'Publicações sobre matemática: olimpíadas, problemas, dúvidas e curiosidades.',
		guidePath: '/guias/olimpiadas-matematica',
		children: genSubtags('problema experiencia duvida aviso conteudo'),
	},
	'physics': {
		name: 'Física',
		icon: 'icon-rocket2',
		description: 'Publicações sobre física: olimpíadas, problemas, curiosidades e aprendizados na área.',
		background: 'http://i.imgur.com/rV40WF4.jpg',
		path: '/labs/fisica',
		children: genSubtags('problema experiencia duvida aviso conteudo'),
	},
	'chemistry': {
		name: 'Química',
		path: '/labs/quimica',
		icon: 'icon-lab',
		description: 'Publicações sobre química: olimpíadas, problemas, curiosidades e aprendizados na área.',
		children: genSubtags('problema experiencia duvida aviso conteudo'),
	},
	'programming': {
		name: 'Programação',
		path: '/labs/programacao',
		icon: 'icon-terminal',
		description: 'publicações sobre desenvolvimento de software e ciência da computação.',
		guidePath: '/guias/programacao',
		children: genSubtags('problema experiencia duvida aviso conteudo'),
	},
	'entrepreneurship': {
		name: 'Empreendedorismo',
		path: '/labs/empreendedorismo',
		icon: 'icon-group-outline',
		description: 'Publicações sobre empreendedorismo, voluntariado e outras ações que mobilizam e promovem mudanças.',
		// guidePath: '/guias/programacao',
		children: genSubtags('experiencia duvida aviso voluntariado'),
	},
	'meta': {
		name: 'QI Meta',
		icon: 'icon-lightbulb2',
		path: '/labs/meta',
		description: 'Publicações sobre o QI Labs: como é o funcionamento, design, dúvidas a respeito da interface, curiosidades e avisos.',
		children: genSubtags('novidade duvida ajuda'),
	},
}
// publicações que não se encaixam em outra categoria existente, ou não precisam de categoria
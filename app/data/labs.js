
var _ = require('lodash')

var all = {
	'problema': { name: "Problema", },
	'experiencia': { name: "Experiência", description: 'Compartilhe suas experiências.' },
	'novidade': { name: 'Novidade', description: 'Novidades sobre o QI Labs.' },
	'duvida': { name: 'Dúvida', description: 'Dúvidas sobre problemas.' },
	'essay': { name: 'Essay', description: 'Compartilhe sua essay, peça alguém revisar, dê dicas e tire dúvidas a respeito.' },
	'dica': { name: 'Dica', description: 'Dar explicações e dicas sobre algo.' },
	'aviso': { name: 'Aviso', description: 'Avisar sobre alguma oportunidade, evento e outros.' },
	'recursos': { name: 'Recursos', description: 'Discussão a respeito de recursos do QI Labs: como funcionam, sugestões, etc.' },
	'problemas': { name: 'Problemas', description: 'Problemas de olimpíadas e desafios.' },
	'voluntariado': { name: 'Voluntariado', description: 'Publicações a respeito de trabalho voluntário.' },
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

var data = {
	'mathematics': {
		name: 'Matemática',
		hasProblems: true,
		path: '/labs/matematica',
		slug: 'matematica',
		background: 'http://i.imgur.com/6xfvRcl.jpg',
		icon: 'icon-pi-outline',
		description: 'Publicações sobre matemática: olimpíadas, problemas, dúvidas e curiosidades.',
		guidePath: '/guias/olimpiadas-matematica',
		children: genSubtags('problema experiencia aviso'), // duvida
		topics: [{
			name: 'Álgebra',
			id: 'algebra',
		}, {
			name: 'Combinatória',
			id: 'combinatorics',
		}, {
			name: 'Geometria',
			id: 'geometry',
		}, {
			name: 'Teoria dos Números',
			id: 'number-theory',
		}],
	},
	'physics': {
		name: 'Física',
		hasProblems: true,
		icon: 'icon-rocket2',
		description: 'Publicações sobre física: olimpíadas, problemas, curiosidades e aprendizados na área.',
		background: 'http://i.imgur.com/rV40WF4.jpg',
		path: '/labs/fisica',
		slug: 'fisica',
		children: genSubtags('problema experiencia aviso'), // duvida
		topics: [{
			name: 'Mecânica',
			id: 'mechanics',
		}, {
			name: 'Termodinâmica',
			id: 'thermodynamics',
		}, {
			name: 'Ótica',
			id: 'optics',
		}, {
			name: 'Eletromagnetismo',
			id: 'electromagnetism',
		}, {
			name: 'Moderna',
			id: 'modern-physics',
		}, {
			name: 'Ondas',
			id: 'waves',
		}]
	},
	'chemistry': {
		name: 'Química',
		hasProblems: true,
		path: '/labs/quimica',
		slug: 'quimica',
		icon: 'icon-lab',
		description: 'Publicações sobre química: olimpíadas, problemas, curiosidades e aprendizados na área.',
		children: genSubtags('problema experiencia aviso'), // duvida
	},
	'application': {
		name: 'Application',
		path: '/labs/application',
		slug: 'application',
		icon: 'icon-globe3',
		description: 'Publicações sobre o processo de admissão em universidades estrangeiras.',
		guidePath: '/guias/application',
		background: 'http://i.imgur.com/pDi89os.jpg',
		bio: 'Application',
		children: genSubtags('experiencia dica aviso essay'), // duvida
	},
	'programming': {
		name: 'Programação',
		path: '/labs/programacao',
		slug: 'programacao',
		icon: 'icon-terminal',
		description: 'publicações sobre desenvolvimento de software e ciência da computação.',
		guidePath: '/guias/programacao',
		children: genSubtags('problema experiencia aviso'), // duvida
	},
	'entrepreneurship': {
		name: 'Empreendedorismo',
		path: '/labs/empreendedorismo',
		slug: 'empreendedorismo',
		icon: 'icon-group-outline',
		description: 'Publicações sobre empreendedorismo, voluntariado e outras ações que mobilizam e promovem mudanças.',
		// guidePath: '/guias/programacao',
		children: genSubtags('experiencia aviso voluntariado'), // duvida
	},
	'meta': {
		name: 'QI Meta',
		icon: 'icon-lightbulb2',
		path: '/labs/meta',
		slug: 'meta',
		description: 'Publicações sobre o QI Labs: como é o funcionamento, design, dúvidas a respeito da interface, curiosidades e avisos.',
		children: genSubtags('novidade recursos'), // duvida
	},
	'vestibular': {
		name: 'Vestibular',
		path: '/labs/vestibular',
		slug: 'vestibular',
		background: 'http://i.imgur.com/RpK0Ngt.jpg',
		icon: '',
		description: 'Publicações sobre vestibular.',
		guidePath: '/guias/vestibular',
		children: genSubtags('problema experiencia aviso'), // duvida
	},
}

for (var i in data)
if (data.hasOwnProperty(i))
	data[i].id = i;

module.exports = data;
// publicações que não se encaixam em outra categoria existente, ou não precisam de categoria
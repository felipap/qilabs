
var data = {
	'mathematics': {
		name: 'Matemática',
		description: 'Publicações sobre matemática: olimpíadas, problemas, dúvidas e curiosidades.',
		icon: 'icon-pi-outline',
		path: '/labs/matematica',
		slug: 'matematica',
		children: {
			'experiencia': {
				name: 'Experiência',
				description: 'Experiências estudando matemática e participando de olimpíadas científicas.'
			},
			'dica': {
				name: 'Dica',
				description: 'Conteúdo e links relacionados a Matemática.',
			},
			'aviso': {
				name: 'Aviso',
				description: 'Avisos sobre oportunidades, competições, eventos, deadlines e outros acontecimentos relacionados à application.'
			},
		},
		topics: [
			{
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
			},
		],
		background: 'http://i.imgur.com/6xfvRcl.jpg',
		hasProblems: true,
	},
	'physics': {
		name: 'Física',
		description: 'Publicações sobre física: olimpíadas, problemas, curiosidades e aprendizados na área.',
		icon: 'icon-rocket2',
		path: '/labs/fisica',
		slug: 'fisica',
		children: {
			'experiencia': {
				name: 'Experiência',
				description: 'Experiências estudando física e participando de olimpíadas científicas.'
			},
			'dica': {
				name: 'Dica',
				description: 'Conteúdo e links relacionados a Física.',
			},
			'aviso': {
				name: 'Aviso',
				description: 'Avisos sobre oportunidades, competições, eventos, deadlines e outros acontecimentos relacionados à application.'
			},
		},
		topics: [
			{
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
			}
		],
		background: 'http://i.imgur.com/rV40WF4.jpg',
		hasProblems: true,
	},
	'chemistry': {
		name: 'Química',
		description: 'Publicações sobre química: olimpíadas, problemas, curiosidades e aprendizados na área.',
		icon: 'icon-lab',
		path: '/labs/quimica',
		slug: 'quimica',
		children: {
			'experiencia': {
				name: 'Experiência',
				description: 'Experiências estudando química e participando de olimpíadas científicas.'
			},
			'dica': {
				name: 'Dica',
				description: 'Conteúdo e links relacionados a Química.',
			},
			'aviso': {
				name: 'Aviso',
				description: 'Avisos sobre oportunidades, competições, eventos, deadlines e outros acontecimentos relacionados à application.'
			},
		},
	},
	'application': {
		name: 'Application',
		path: '/labs/application',
		slug: 'application',
		icon: 'icon-globe3',
		description: 'Publicações sobre o processo de admissão em universidades estrangeiras.',
		children: {
			'experiencia': {
				name: 'Experiência',
				description: 'Experiências com universidades, programas internacionais e application.'
			},
			'dica': {
				name: 'Dica',
				description: 'Dicas e recursos para ajudar alunos na applicationn.'
			},
			'aviso': {
				name: 'Aviso',
				description: 'Avisos sobre oportunidades, competições, eventos, deadlines e outros acontecimentos.'
			}
		},
		background: 'http://i.imgur.com/pDi89os.jpg',
	},
	'programming': {
		name: 'Programação',
		path: '/labs/programacao',
		slug: 'programacao',
		icon: 'icon-terminal',
		description: 'publicações sobre desenvolvimento de software e ciência da computação.',
		children: {},
	},
	'entrepreneurship': {
		name: 'Empreendedorismo',
		path: '/labs/empreendedorismo',
		slug: 'empreendedorismo',
		icon: 'icon-group-outline',
		description: 'Publicações sobre empreendedorismo, voluntariado e outras ações que mobilizam e promovem mudanças.',
		children: {
			'experiencia': {
				name: 'Experiência',
				description: 'Estórias sobre a construção de projetos de empreendedorismo e voluntariado.'
			},
			'voluntariado': {
				name: 'Voluntariado',
				description: 'Publicações sobre ações de voluntariado.'
			},
			'dica': {
				name: 'Dica',
				description: 'Recursos e links para ajudar quem tá começando. :)'
			},
			'aviso': {
				name: 'Aviso',
				description: 'Avisos sobre oportunidades, eventos e outros acontecimentos para empreendedores.'
			}
		}
	},
	'meta': {
		name: 'QI Meta',
		icon: 'icon-lightbulb2',
		path: '/labs/meta',
		slug: 'meta',
		description: 'Publicações sobre o site: como funciona, esclarecimento de dúvidas, discussão de recursos, e avisos.',
		children: {
			'aviso': {
				name: 'Aviso',
				description: 'Avisos relacionados ao QI Labs.'
			},
			'recursos': {
				name: 'Recursos',
				description: 'Discussão de recursos do site: como funcionam, problemas, sugestões, ...'
			},
			'novidade': {
				name: 'Novidade',
				description: 'Novidades sobre o QI Labs: ferramentas, design e novos recursos.'
			},
		}
	},
	'vestibular': {
		name: 'Vestibular',
		path: '/labs/vestibular',
		slug: 'vestibular',
		background: 'http://i.imgur.com/RpK0Ngt.jpg',
		icon: '',
		description: 'Publicações sobre vestibular.',
		children: {
			'experiencia': {
				name: 'Experiência',
				description: 'Experiências com estudo, cursinhos e universidades.'
			},
			'dica': {
				name: 'Dica',
				description: 'Dicas e recursos para ajudar alunos no vestibular.'
			},
			'aviso': {
				name: 'Aviso',
				description: 'Avisos sobre oportunidades, competições, eventos e deadlines.'
			}
		}
	},
}

for (var i in data)
if (data.hasOwnProperty(i))
	data[i].id = i;

module.exports = data;
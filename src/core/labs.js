
module.exports = {
	data: {
		'application': {
			name: 'Application',
			path: 'application',
			icon: 'icon-globe3', 
			guidePath: '/guias/application',
			children: {
				'experiencia': {
					name: "Experiência",
				},
				'duvida': {
					name: "Dúvida",
				},
			},
		}, 
		'mathematics': {
			name: 'Matemática',
			path: 'matematica',
			icon: 'icon-pi-outline',
			guidePath: '/guias/olimpiadas-matematica',
			children: {
				'problema': {
					name: "Problema",
				},
				'experiencia': {
					name: "Experiência",
				},
				'duvida': {
					name: "Dúvida",
				},
			},
		},
		'physics': {
			name: 'Física',
			icon: 'icon-rocket2',
			path: 'fisica',
			children: {
				'problema': {
					name: "Problema",
				},
				'experiencia': {
					name: "Experiência",
				},
				'duvida': {
					name: "Dúvida",
				},
			},
		},
		'chemistry': {
			name: 'Química',
			path: 'quimica',
			icon: 'icon-lab',
			children: {
				'problema': {
					name: "Problema",
				},
				'experiencia': {
					name: "Experiência",
				},
				'duvida': {
					name: "Dúvida",
				},
			},
		},
		'programming': {
			name: 'Programação',
			path: 'programacao',
			icon: 'icon-terminal',
			guidePath: '/guias/programacao',
			children: {
				'problema': {
					name: "Problema",
				},
				'experiencia': {
					name: "Experiência",
				},
				'duvida': {
					name: "Dúvida",
				},
			},
		}, 
		'meta': {
			name: 'Qi Meta',
			icon: 'icon-lightbulb2',
			path: 'meta',
			children: {
				'novidade': {
					name: 'Novidade',
				},
				'duvida': {
					name: 'Dúvida',
				},
				'ajuda': {
					name: 'Ajuda',
				},
			}
		},
	}
}
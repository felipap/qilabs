
$ = require('jquery')
_ = require('lodash')
require('bootstrap-tour')

defaultOpts = {
	steps: [
		{
			title: "Bem vindo ao QI Labs!",
			content: "A comunidade online para extra-curriculares. Nossa plataforma conecta jovens interessados nos mesmos assuntos.",
			placement: 'bottom',
			orphan: true,
			backdrop: true,
		},
		{
			title: "Habemus <strong>Notificações</strong>",
			content: "Aqui você pode ver as suas notificações.",
			element: '#tour-nav-bell',
			placement: 'bottom',
			// backdrop: true,
		},
		{
			title: "Habemus <strong>Pontos de Reputação</strong>",
			content: "Aqui você pode ver a sua reputação. Você ganha pontos de reputação quando usuários votam nas suas publicações.",
			element: '#tour-karma',
			placement: 'bottom',
			// backdrop: true,
		},
		{
			// title: "Menu dos laboratórios",
			content: "Nessa barra lateral você pode acessar nossas guias e laboratórios. Os laboratórios são grupos separados por assuntos.",
			element: '#sidebar',
			placement: 'right',
			// backdrop: true,
		},
	],
	template: "<div class='popover tour'>"+
		"<div class='arrow'></div>"+
		"<h3 class='popover-title'></h3>"+
		"<div class='popover-content'></div>"+
		"<div class='popover-navigation'>"+
				"<button class='btn btn-default' data-role='prev'>« Voltar</button>"+
				"<span data-role='separator'>|</span>"+
				"<button class='btn btn-default' data-role='next'>Cont »</button>"+
		"</div>"+
		"<button class='btn btn-default' data-role='end'>Terminar</button>"+
		"</nav>"+
	"</div>",
	debug: true,
}

module.exports = function (options) {
	return new Tour(_.extend(defaultOpts, options || {}));
};
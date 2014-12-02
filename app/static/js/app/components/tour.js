
$ = require('jquery')
_ = require('lodash')
require('bootstrap-tour')

defaultOpts = {
	steps: [
		{
			content: "<div class=''><div class='header'><i class='icon-bulb'></i><h1>Bem-vindo ao <strong>QI Labs</strong>!</i></div><p>Nós conectamos jovens interessados nas mesmas atividades (como <strong>Olimpíadas Científicas</strong>, <strong>Empreendedorismo</strong>, <strong>Vestibulares Militares</strong> etc), através de comunidades (que nós chamamos de <strong>laboratórios</strong>).</p><p>Clique nas bolinhas azuis pela interface para aprender como usar melhor o site. :)</p></div>",
			placement: 'bottom',
			orphan: true,
			backdrop: true,
		},
		// {
		// 	title: "Menu dos laboratórios",
		// 	content: "<h1>Notificações</h1><p>Nós notificamos você sobre respostas aos seus comentários e publicações, e sobre atualizações da plataforma.</p>",
		// 	element: '#tour-nav-bell',
		// 	placement: 'bottom',
		// 	// backdrop: true,
		// },
		// {
		// 	content: "<h1>Reputação</h1><p>No QI Labs você recebe pontos por votos nos seus posts. Mais = melhor.</p>",
		// 	element: '#tour-karma',
		// 	placement: 'bottom',
		// 	// backdrop: true,
		// },
		// {
		// 	// title: "Menu dos laboratórios",
		// 	content: "Nessa barra lateral você pode acessar nossas guias e laboratórios. Os laboratórios são grupos separados por assuntos.",
		// 	element: '#sidebar',
		// 	placement: 'right',
		// 	// backdrop: true,
		// },
	],
	template:
	"<div class='popover tour'>"+
		"<div class='arrow'></div>"+
		"<h3 class='popover-title'></h3>"+
		"<div class='popover-content'></div>"+
		"<div class='popover-navigation'>"+
				// "<button class='btn btn-default' data-role='prev'>« Voltar</button>"+
				// "<span data-role='separator'>|</span>"+
				"<button class='btn btn-default' data-role='next'>Próximo</button>"+
				"<button class='btn btn-default' data-role='end'>Fechar</button>"+
		"</div>"+
		"</nav>"+
	"</div>",
	debug: true,
}

var Tipit = new (function () {

	this.makeTip = function (target, data) {

		if (!$(target).length) {
			console.warn("Skipping tooltip to "+target+". Target not found.");
			return;
		}

		var html = '<div class="tip animate" data-id="1" data-target="menu">'+
			'<div class="tip-cta">'+
				'<span class="tip-center"></span>'+
				'<span class="tip-beacon"></span>'+
			'</div>'+
			'<div class="tip-box">'+
				'<div class="header">'+data.header+'</div>'+
				'<p>'+data.text+'</p>'+
				'<div class="footer">'+
					'<a href="#" class="button blue tip-done">Done</a>'+
				'</div>'+
			'</div>'+
		'</div>';

		var x = $(target).offset().left+$(target).outerWidth()/2,
				y = $(target).offset().top+$(target).outerHeight()/2;

		var el = $(html).css({ top: y, left: x }).appendTo('body');
		if (x > $(window).width()/2) {
			$(el).addClass('tip-right');
		}
		$(el).find('.tip-done').click(function () {
			console.log('done');
			$(el).fadeOut().remove();
		});

		$(el).one('click', function (e) {
			console.log('click', $(e.target).find('.tip-box'))
			$(this).find('.tip-box').addClass('open');
			// if ($(this).find('.tip-box').hasClass('open')) {
			// 	$(this).find('.tip-box').animate({'opacity': 0}).removeClass('open');
			// } else {
			// }
		})
	};

	this.init = function (tips, opts) {
		for (var i=0; i<tips.length; ++i) {
			this.makeTip(tips[i].el, tips[i]);
		}
	}
});

module.exports = function (options) {

	Tipit.init([{
		el: '#tip-bell',
		header: "<i class='icon-notifications'></i> Notificações",
		text: "Aqui você recebe respostas para as suas publicações, para os seus comentários etc.",
	}, {
		el: '#tip-karma',
		header: "<i class='icon-atom'></i> Pontos",
		text: "No QI Labs você ganha pontos quando usuários dão <i class='icon-thumbs-up3'></i> na sua publicação.",
	}, {
		el: '#tip-problems',
		header: "<i class='icon-extension'></i> Problemas",
		text: "Aqui você recebe respostas para as suas publicações, para os seus comentários etc.",
	}, {
		el: '#tip-labs',
		header: "<i class='icon-lab'></i> Laboratórios",
		text: "Clique aqui para entrar na página dos laboratórios.",
	}, {
		el: '#tip-guides',
		header: "<i class='icon-local-library'></i> Guias",
		text: "Aqui você pode acessar e colaborar com conteúdo sobre atividades extra-curriculares.",
	}, {
		el: '#tip-dd-menu',
		header: "<i class='icon-gear'></i> Menu",
		text: "Seu perfil, configurações, ajuda,... tá tudo aqui.",
	}, {
		el: '#tip-new-post',
		header: "<i class='icon-edit'></i> Nova Publicação",
		text: "Clique aqui para escrever um novo post.",
	}])

	// $(
	// 	"<div class='popover tour tour-tour-0'>"+
	// 	"<div class='popover-content'></div>"+
	// 	"<div class='popover-navigation'>"+
	// 			"<div class=''><div class='header'><i class='icon-bulb'></i><h1>Bem-vindo ao <strong>QI Labs</strong>!</i></div><p>Nós conectamos jovens interessados nas mesmas atividades (como <strong>Olimpíadas Científicas</strong>, <strong>Empreendedorismo</strong>, <strong>Vestibulares Militares</strong> etc), através de comunidades (que nós chamamos de <strong>laboratórios</strong>).</p><p>Continue o tour para aprender a usar o site.<br /> É rápidinho. :)</p></div>"+
	// 			"<button class='btn btn-default' data-role='next'>Continuar</button>"+
	// 	"</div>"+
	// 	"</nav>"+
	// "</div>"
	// ).appendTo('body').show();
	var tour = new Tour(_.extend(defaultOpts, options || {
		onEnd: function () {
			// console.log('tour ended')
			if (window.location.hash == '#tour') // if still tour. [why check?]
				window.location.hash = '';
		}
	}));
	// var tour = QTour({
	// })
	tour.init();
	setTimeout(function () {
	  tour.restart();
	}, 500)
	// window.t = tour;
	// Tour.start();

	// return
};
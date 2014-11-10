
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
	template:
	"<div class='popover tour'>"+
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

var Tipit = new (function () {

	this.makeTip = function (target, data) {

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
		el: '#nav-bell',
		header: "<i class='icon-notifications'></i> Notificações",
		text: "Aqui você recebe respostas para as suas publicações, para os seus comentários etc.",
	}, {
		el: '#nav-karma',
		header: "<i class='icon-whatshot'></i> Pontos",
		text: "No QI Labs você ganha pontos quando usuários <i class='icon-thumbs-up3'></i> a sua publicação.",
	}, {
		el: '#tip-problems',
		header: "<i class='icon-extension'></i> Problemas",
		text: "Aqui você recebe respostas para as suas publicações, para os seus comentários etc.",
	}])

	return new Tour(_.extend(defaultOpts, options || {}));
};
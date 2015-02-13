
$ = require('jquery')
_ = require('lodash')
// require('bootstrap-tour')
var Modal = require('./modal.jsx')

var Tipit = new (function () {

	this.makeTip = function (target, data) {

		if (!$(target).length) {
			console.warn("Skipping ttip to "+target+". Target not found.");
			return;
		}

		var html = '<div class="ttip animate" data-id="1" data-target="menu">'+
			'<div class="ttip-cta">'+
				'<span class="ttip-center"></span>'+
				'<span class="ttip-beacon"></span>'+
			'</div>'+
			'<div class="ttip-box">'+
				'<div class="header">'+data.header+'</div>'+
				'<p>'+data.text+'</p>'+
				'<div class="footer">'+
					'<a href="#" class="button blue ttip-done">Ok</a>'+
				'</div>'+
			'</div>'+
		'</div>';

		var x = $(target).offset().left+$(target).outerWidth()/2,
				y = $(target).offset().top+$(target).outerHeight()/2;

		var el = $(html).css({ top: y, left: x }).appendTo('body');
		if (x > $(window).width()/2) {
			$(el).addClass('ttip-right');
		}
		$(el).find('.ttip-done').click(function () {
			console.log('done');
			$(el).fadeOut().remove();
		});

		$(el).one('click', function (e) {
			console.log('click', $(e.target).find('.ttip-box'))
			$(this).find('.ttip-box').addClass('open');
			// if ($(this).find('.ttip-box').hasClass('open')) {
			// 	$(this).find('.ttip-box').animate({'opacity': 0}).removeClass('open');
			// } else {
			// }
		})
	};

	this.init = function (ttips, opts) {
		for (var i=0; i<ttips.length; ++i) {
			this.makeTip(ttips[i].el, ttips[i]);
		}
	}
});

module.exports = function (options) {

	Tipit.init([{
		el: '#ttip-bell',
		header: "<i class='icon-notifications'></i> Notificações",
		text: "Aqui você recebe respostas para as suas publicações, para os seus comentários etc.",
	}, {
		el: '#ttip-karma',
		header: "<i class='icon-atom'></i> Pontos",
		text: "No QI Labs você ganha pontos quando usuários dão <i class='icon-thumbs-up3'></i> na sua publicação.",
	}, {
		el: '#ttip-problems',
		header: "<i class='icon-extension'></i> Problemas",
		text: "Aqui você pode resolver questões de olimpíadas científicas brasileiras e treinar seus conhecimentos.",
	}, {
		el: '#ttip-labs',
		header: "<i class='icon-lab'></i> Laboratórios",
		text: "Clique aqui para entrar na página dos laboratórios.",
	}, {
		el: '#ttip-guides',
		header: "<i class='icon-local-library'></i> Guias",
		text: "Aqui você pode acessar e colaborar com conteúdo sobre atividades extra-curriculares.",
	}, {
		el: '#ttip-dd-menu',
		header: "<i class='icon-gear'></i> Menu",
		text: "Seu perfil, configurações, ajuda,... tá tudo aqui.",
	}, {
		el: '#ttip-new-post',
		header: "<i class='icon-edit'></i> Nova Publicação",
		text: "Clique aqui para escrever um novo post.",
	}])

	Modal.TourDialog({}, null, function onClose (el, component) {
		if (window.location.hash === '#tour') // if still tour. [why check?]
			window.location.hash = '';
	});

};
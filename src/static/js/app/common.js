
/*
** common.js
** Copyright QILabs.org
** BSD License
*/

// Present in all built javascript.

window.calcTimeFrom = function (arg) {
	var now = new Date(),
		then = new Date(arg),
		diff = now-then;

	if (diff < 1000*60) {
		return 'agora';
		var m = Math.floor(diff/1000);
		return 'há '+m+' segundo'+(m>1?'s':'');
	} else if (diff < 1000*60*60) {
		var m = Math.floor(diff/1000/60);
		return 'há '+m+' minuto'+(m>1?'s':'');
	} else if (diff < 1000*60*60*30) { // até 30 horas
		var m = Math.floor(diff/1000/60/60);
		return 'há '+m+' hora'+(m>1?'s':'');
	} else if (diff < 1000*60*60*24*14) {
		var m = Math.floor(diff/1000/60/60/24);
		return 'há '+m+' dia'+(m>1?'s':'');
	} else {
		var m = Math.floor(diff/1000/60/60/24/7);
		return 'há '+m+' semana'+(m>1?'s':'');
	}
};

define([
	'jquery',
	'underscore',
	'modernizr',
	'plugins',
	'bootstrap.dropdown',
	'bootstrap.tooltip',
	'components.bell',
	], function ($, _) {

	// $(document).on('click', '#openSidebar', function (e) {
	// 	$('body').toggleClass('sidebarOpen');
	// });

	// // Hide popover when mouse-click happens outside of it.
	// $(document).mouseup(function (e) {
	// 	var container = $('#sidebarPanel');
	// 	if ($('body').hasClass('sidebarOpen')) {
	// 		if (!container.is(e.target) && container.has(e.target).length === 0 && 
	// 			!$('#openSidebar').is(e.target) && $('#openSidebar').has(e.target).length === 0) {
	// 			$('body').removeClass('sidebarOpen');
	// 		}
	// 	}
	// });

	$('body').on("click", ".btn-follow", function (evt) {
		var self = this;

		if (this.dataset.action !== 'follow' && this.dataset.action !== 'unfollow')
			return console.error('damn');

		var neew = (this.dataset.action==='follow')?'unfollow':'follow';
		$.post('/api/users/'+this.dataset.user+'/'+this.dataset.action, function (data) {
			if (data.error) {
				alert(data.error);
			} else {
				self.dataset.action = neew;
			}
		});
	});

	$("body").tooltip({selector:'[data-toggle=tooltip]'});

	$("[data-toggle=dialog]").xdialog();

	(function setCSRFToken () {
		$.ajaxPrefilter(function(options, _, xhr) {
			if (!options.crossDomain) {
				xhr.setRequestHeader('X-CSRF-Token',
					$("meta[name='csrf-token']").attr('content'));
			}
		});
	})();

	// GOSTAVA TANTO DE NUTELLA
		
	$("a[data-ajax-post-href],button[data-ajax-post-href]").click(function () {
		var href = this.dataset['ajaxPostHref'],
			redirect = this.dataset['redirectHref'];
		$.post(href, function () {
			if (redirect)
				window.location.href = redirect;
			else
				window.location.reload();
		});
	});

	$("form[data-ajax-post-href]").on('submit', function (evt) {
		evt.preventDefault();
		var href = this.dataset['ajaxPostHref']+'?'+$(this).serialize();
		console.log(this.dataset, href);
		$.post(href, function () {
			window.location.reload();
		});
	});
});
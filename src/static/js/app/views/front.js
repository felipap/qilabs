define([
	'jquery',
	'modernizr',
	'bootstrap.tooltip',
	], function ($) {

	$("body").tooltip({selector:'[data-toggle=tooltip]'});

	(function setCSRFToken () {
		$.ajaxPrefilter(function(options, _, xhr) {
			if (!options.crossDomain) {
				xhr.setRequestHeader('X-CSRF-Token',
					$("meta[name='csrf-token']").attr('content'));
			}
		});
	})();

	$("[name=email], [name=name]").on('keypress keyup focusout change', function () {
		var email = document.querySelector('form [name=email]').value.replace(/^\s+|\s+$/g, ''),
			name = document.querySelector('form [name=name]').value.replace(/^\s+|\s+$/g, '');

		if (/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
			if (/\w{3,}/.test(name)) {
				document.querySelector("[data-action=send-form]").disabled = false;
			} else {
				document.querySelector("[data-action=send-form]").disabled = true;
			}
		} else {
			document.querySelector("[data-action=send-form]").disabled = true;
		}
	});

	$(".bubble, #bubbleMaster").click(function () {
		$(this).fadeOut();
	});

	$("[data-action=send-form]").click(function () {
		var email = document.querySelector('form [name=email]').value.replace(/^\s+|\s+$/g, ''),
			name = document.querySelector('form [name=name]').value.replace(/^\s+|\s+$/g, '');
		$.ajax({
			type: 'POST',
			url: '/waitlist',
			dataType: 'json',
			data: { email: email, name: name }
		}).done(function (response) {
			if (response.error == false) {
				$('form').slideUp(function () {
					$("#abientot").slideDown();
				});
			} else {
				if (response.field == 'email') {
					$("#emailBubble").html(response.message).fadeIn();
					$("[name=email]").addClass('invalid');
					$("[name=email]").one('keypress keyup', function () {
						$(this).removeClass('invalid');
					});
				} else if (response.field == 'name') {
					$("#nameBubble").html(response.message).fadeIn();
					$("[name=name]").addClass('invalid');
					$("[name=name]").one('keypress keyup', function () {
						$(this).removeClass('invalid');
					});
				} else if (response.message) {
					$("#bubbleMaster").html(response.message).fadeIn();
				}
			}
		}).fail(function () {
			$("#bubbleMaster").html("Ops! Erro no servidor.").fadeIn();	
		});
	});
});
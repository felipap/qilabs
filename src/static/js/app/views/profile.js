
require(['common', 'components.cards'], function (common, wall) {
	wall.initialize();

	$("[data-action=edit-profile]").click(function () {
		$(".profileWrapper").addClass('editing');
	});

	$('.autosize').autosize();

	$("[data-action=save-profile]").click(function () {
		var profile = {
			bio: $("[name=bio]").val(),
			nome: $("[name=name]").val(),
			home: $("[name=home]").val(),
			location: $("[name=location]").val(),
		};

		$.ajax({
			type: 'PUT',
			dataType: 'JSON',
			url: '/api/me/profile',
			data: {
				profile: profile
			}
		}).done(function (response) {
			if (response.error) {
				if (response.message)
					app.alert(response.message,'error');
				else
					console.warn('????',response);
			} else {
				$(".profileWrapper").removeClass('editing');
				$(".profileOutput.bio").html(profile.bio);
				$(".profileOutput.name").html(profile.name);
				$(".profileOutput.home").html(profile.home);
				$(".profileOutput.location").html(profile.location);
			}
		}).fail(function () {
		});
	})

});

require('bootstrap.tab');
require('autosize');

module.exports = function () {
  setTimeout(function () {
  	$('textarea').autosize();
  }, 100);

  $("[data-action=save-profile]").click(function (e) {
    e.preventDefault();
    var profile = {
      bio: $("[name=bio]").val(),
      name1: $("[name=name1]").val(),
      name2: $("[name=name2]").val(),
      home: $("[name=home]").val(),
      location: $("[name=location]").val(),
    };

    $.ajax({
      type: 'PUT',
      dataType: 'JSON',
      url: '/api/me/profile',
      data: profile
    }).done(function (response) {
      if (response.error) {
        if (response.message) {
          Utils.flash.alert(response.message);
        } else {
          console.warn('????',response);
        }
      } else if (response.data) {
        if (response.message)
          Utils.flash.info(response.message);
        var me = response.data;
        $(".profileWrapper").removeClass('editing');
        $(".profileOutput.bio").html(me.profile.bio);
        $(".profileOutput.name").html(me.name);
        $(".profileOutput.home").html(me.profile.home);
        $(".profileOutput.location").html(me.profile.location);
      } else {
        Utils.flash.alert("Um erro pode ter ocorrido.");
      }
    }).fail(function (xhr) {
      var message = xhr.responseJSON && xhr.responseJSON.message;
      if (message) {
        Utils.flash.alert(message);
      } else {
        Utils.flash.alert("Um erro inesperado ocorreu.");
      }
    });
  })

  $('[role=tab][href="#notifications"]').click(function (e) {
    e.preventDefault()
    $(this).tab('show')
  })
  $('[role=tab][href="#profile"]').click(function (e) {
    e.preventDefault()
    $(this).tab('show')
  })
  $('[role=tab][href="#extras"]').click(function (e) {
    e.preventDefault()
    $(this).tab('show')
  })

}
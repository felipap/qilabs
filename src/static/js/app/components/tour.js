
var $ = require('jquery')
var _ = require('underscore')
require('bootstrap-tour')

window.tour = new Tour({
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
  debug: true,
});

// tour.init();
setTimeout(function () {
  tour.restart();
}, 500)

module.exports = tour;
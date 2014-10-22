
var $ = require('jquery')
var _ = require('underscore')
require('bootstrap-tour')

window.tour = new Tour({
  steps: [
    {
      title: "Title of my step",
      content: "Content of my step",
      placement: 'bottom',
      orphan: true,
      backdrop: true,
    }
  ],
  debug: true,
});

// tour.init();
// setTimeout(function () {
//   tour.restart();
// }, 500)

module.exports = tour;
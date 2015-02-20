module.exports = {
  'jquery': { exports: "$" },
  'bootstrap.tooltip':  { depends: ['jquery'] },
  'bootstrap.dropdown':   { depends: ['jquery'] },
  'bootstrap.button':   { depends: ['jquery'] },
  'bootstrap.popover':  { depends: ['jquery', 'bootstrap.tooltip'] },
  'typeahead':      { depends: ['jquery'] },
  'typeahead-bundle':   { depends: ['jquery'] , exports: 'Modernizr', },
  'modernizr': { depends: ['jquery'] },
  'bootstrap' :       { depends: ['jquery'] },
  'backbone'  :       { exports: 'Backbone', depends: ['jquery', 'lodash']},
};

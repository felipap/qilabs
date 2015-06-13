
var ComponentStack = require('./componentStack.js');
var Backbone = require('backbone');

// TODO improve documentation

/**
 * Customized Backbone Router, supporting triggering of components.
 *
 * -
 */
var Router = Backbone.Router.extend({
  initialize: function () {
    this._bindComponentTriggers();
    this._bindComponentCalls();
    this._components = new ComponentStack({
      defaultClass: 'component-container',
      chop: true,
    });
  },

  _bindComponentTriggers: function () {
    $('body').on('click', '[data-trigger=component]', function (e) {
      e.preventDefault();
      // Call router method
      var dataset = this.dataset;
      // Too coupled. This should be implemented as callback, or smthng. Perhaps triggered on navigation.
      $('body').removeClass('sidebarOpen');
      if (dataset.route) {
        var href = $(this).data('href') || $(this).attr('href');
        if (href)
          console.warn('Component href attribute is set to '+href+'.');
        app.navigate(href, { trigger: true, replace: false });
      } else {
        if (typeof app === 'undefined' || !app.components) {
          if (dataset.href)
            window.location.href = dataset.href;
          else
            console.error('Can\'t trigger component '+dataset.component+' in unexistent app object.');
          return;
        }
        if (dataset.component in app.components) {
          var data = {};
          if (dataset.args) {
            try {
              data = JSON.parse(dataset.args);
            } catch (e) {
              console.error('Failed to parse data-args '+dataset.args+' as JSON object.');
              console.error(e.stack);
              return;
            }
          }
          // Pass parsed data and element that triggered.
          app.components[dataset.component].call(app, data, this);
        } else {
          console.warn('Router doesn\'t contain component '+dataset.component+'.')
        }
      }
    });
  },

  _bindComponentCalls: function () {
    function bindComponentCall (name, fn) {
      this.on(name, function () {
        this.closeComponents();
        fn.apply(this, arguments);
      }, this);
    }

    for (var c in this.components) {
      if (this.components.hasOwnProperty(c)) {
        bindComponentCall.call(this, c, this.components[c]);
      }
    }
  },

  getActiveComponent: function () {
    return this._components.getActive();
  },

  closeComponents: function () {
    this._components.closeAll();
  },

  pushComponent: function () {
    this._components.push.apply(this._components, arguments);
  },

  components: {},
});

module.exports = Router;
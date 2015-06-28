
'use strict';

var React = require('react')

var Stream = require('../components/Stream.jsx')

/**
 * Renders results in el.
 * - setup(collection model, react class for rendering)
 * - renderData(results)
 * - renderPath(url, query, callback)
 * - renderResultsOr(fallbackPath)
 */
function FeedWall (el) {

  var isSetup = false,
      coll = null,
      tmpl = null,
      stream = null;

  /*
   * Setup stream collection and template.
   * This MUST be called before rending.
   */
  this.setup = function (_Coll, _tmpl) {
    // TODO improve comment
    // Component routes can be called multiple times within the lifespan of a
    // single page load, so we have to prevent setup() from being called
    // multiple times too. Otherwise, the feed would reset everytime a component
    // call is made.
    if (isSetup) {
      console.log('ignoring another setup() call.');
      return;
    }

    // _Coll must be a Backbone collection, and _tmpl a React class.
    coll = new _Coll([]);
    tmpl = React.createFactory(_tmpl);
    isSetup = true;
    stream = React.render(
      <Stream
        wall={conf.isWall}
        collection={coll}
        template={tmpl} />,
      el);
    stream.setCollection(coll);
    stream.setTemplate(tmpl);
  }

  this.getCollection = function () {
    return coll;
  }

  /*
   * Update results wall with data in feed object.
   * (usually data bootstraped into page)
   */
  this.renderData = function (results) {
    // Reset wall with results bootstraped into the page
    if (!isSetup) {
      throw new Error('Call FeedWall.setup() before FeedWall.renderData().');
    }

    if (!results) {
      throw new Error('No data passed to FeedWall.renderData().');
    }

    coll.url = results.url || window.conf.postsRoot;
    coll.reset(results.docs);
    coll.initialized = true;
    coll.minDate = 1*new Date(results.minDate);

    if (results.eof) {
      coll.trigger('eof');
    }

    return this;
  };

  /*
   * Render wall with results from a REST resource, using a certain querystring.
   */
  this.renderPath = function (url, query, cb) {
    console.log('called renderPath')
    if (!isSetup) {
      throw 'Call setup() before rendering data.';
    }

    // (string, fn) → (url, cb)
    if (!cb && typeof query === 'function') {
      cb = query;
      query = undefined;
    }

    if (coll.initialized && !query && (!url || coll.url === url)) {
      // Trying to render wall as it was already rendered (app.navigate was
      // used and the route is calling app.renderWall() again). Blocked!
      // TODO: find a better way of handling this?
      console.log('Wall already rendered. ok.');
      return;
    }

    coll.initialized = true;
    coll.url = url || coll.url || (window.conf && window.conf.postsRoot);
    coll.reset();
    if (cb) {
      coll.once('reset', cb);
    }
    coll.fetch({ reset: true, data: query || {} });

    return this;
  };

  /*
   * ???
   */
  this.renderResultsOr = function (fallbackPath) {
    console.log('called renderResultsOr')
    if (!isSetup) {
      throw 'Call setup() before rendering data.';
    }

    if (window.conf.results) {
      this.renderData(window.conf.results);
    } else {
      this.renderPath(fallbackPath);
    }

    return this;
  }.bind(this);
};

module.exports = FeedWall;

var React = require('react')

function extend (a, b) {
  for (var key in b) {
    if (b.hasOwnProperty(key)) {
      a[key] = b[key];
    }
  }
  return a;
}

/*
 * Organizes the allocatin and disposal of pages on the screen.
 */
var ComponentStack = function (defaultOptions) {
  var pages = []
  var chopCounter = 0

  function chop() {
    // Remove body scrollbar.
    if (chopCounter === 0) {
      $('body').addClass('chop')
    }
    ++chopCounter
  }

  function unchop() {
    // Show body scrollbar?
    --chopCounter
    if (chopCounter === 0) {
      $('body').removeClass('chop')
    }
  }

  class Page {
    constructor(component, opts) {
      var opts = extend(extend({}, defaultOptions), opts)

      var makeContainer = (opts) => {
        var el = document.createElement('div')
        el.classList.add(opts.defaultClass)
        if (opts.defaultClass) {
          el.classList.add(opts.defaultClass)
        }
        if (opts.class) {
          el.classList.add(opts.class)
        }
        if (opts.pageTag) {
          el.dataset.page = opts.pageTag
        }
        return el
      }

      this.onClose = opts.onClose

      this.el = makeContainer(opts)
      this.destroyed = false
      this.component = React.cloneElement(component, { page: this })
      this.el.style.opacity = '0%'

      // I don't like this
      if (opts.container) {
        opts.container.appendChild(this.el)
      } else {
        document.body.appendChild(this.el)
      }

      // Save page state values to restore later.
      this.old = {}

      if (opts.chop) { // Remove scrollbars?
        this.old.chopped = true
        chop()
      }

      if (opts.pageRoot) { // Save body[data-root] and replace by new
        // Cacilds!
        var root = document.body.dataset.root
        this.old.pageRoot = root
        if (root) {
          $('[data-activate-root='+root+']').removeClass('active')
        }
        $('[data-activate-root='+opts.pageRoot+']').addClass('active')
        document.body.dataset.root = opts.pageRoot
      }

      React.render(this.component, this.el, () => {
        $(this.el).show()
      })
    }

    destroy() {
      if (this.destroyed) {
        console.warn('Destroy for page '+this.opts.pageTag+' being called multiple times.')
        return
      }
      this.destroyed = true

      pages.splice(pages.indexOf(this), 1)
      React.unmountComponentAtNode(this.el)
      $(this.el).remove()

      this._cleanUp()

      if (this.onClose) {
        this.onClose(this, this.el)
      }
    }

    _cleanUp() {
      if (this.old.chopped) {
        unchop()
      }
      if (this.old.title) {
        document.title = this.old.title
      }
      if (this.old.pageRoot) {
        $('[data-activate-root='+document.body.dataset.root+']').removeClass('active')
        $('[data-activate-root='+this.old.pageRoot+']').addClass('active')
        document.body.dataset.root = this.old.pageRoot
      }
    }

    set title(str)  {
      this.old.title = document.title
      document.title = str
    }

    hide() {
      this.old.display = this.el.css.display
      this.el.css.display = 'none'
    }

    show() {
      if (this.old.display) {
        this.el.css.display = this.old.display
      }
    }
  }

  return {
    push: function (component, dataPage, opts) {
      opts = opts || {}
      if (!opts.onClose) {
        opts.onClose = function(){}
      }
      opts.pageTag = dataPage
      var page = new Page(component, opts)
      // Hide previous pages.
      for (var i=0; i<pages.length; ++i) {
        pages[i].hide()
      }
      pages.push(page)
    },

    getActive: function () {
      if (!pages.length) {
        return null
      }
      return pages[pages.length-1]
    },

    pop: function () {
      pages.pop().destroy()
      if (pages.length) {
        pages[pages.length-1].show()
      }
    },

    closeAll: function () {
      pages.forEach(function (page) {
        page.destroy()
      })
      pages = []
    },
  }
}

module.exports = ComponentStack
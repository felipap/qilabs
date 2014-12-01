
var $ = require('jquery')
window.$ = $;
var MediumEditor = require('./addons/medium-editor.min.js')
window.MediumEditor = MediumEditor

require('./addons/medium-editor-insert-plugin.js')
require('./addons/medium-editor-insert-images-modified.js')
require('./addons/medium-editor-insert-embeds.js')
// require('./addons/medium-editor-insert-tables.js')
// require('./addons/medium-editor-insert-videos-modified.js')

module.exports = MediumEditor
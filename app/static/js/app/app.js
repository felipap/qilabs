
var $ = require('jquery')
window.$ = window.jQuery = $;

require('backbone')

var common = require('./common.js')
var router = require('./components/router.jsx')
router.initialize()
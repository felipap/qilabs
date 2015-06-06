
var express = require('express')
var required = require('./lib/required')

module.exports = function(app) {
  var router = express.Router()

  router.use(function(req, res, next) {
    if (!req.user || !req.user.flags.admin) {
      res.render404()
      return
    }
    next()
  })

  // router.use(required.self.admin)

  router.get('/', function(req, res) {
    res.render('admin/home')
  })

  return router
}
var express = require('express')

function getUnsecuredRouter() {
  const router = express.Router()
  /* GET /unsecured */
  router.get('/', function (req, res, next) {
    res.status(200).send('This route is unsecured. Any user can access this content, without logging in.')
  })

  return router
}

module.exports = getUnsecuredRouter

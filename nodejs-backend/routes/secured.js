var express = require('express')

/**
 * Helper function to convert promise routes into async routes
 * @param {*} fn
 */
let wrap =
  fn =>
  (...args) =>
    fn(...args).catch(args[2])

function getSecuredRouter() {
  const router = express.Router()
  /* GET /secured */
  router.get('/', function (req, res, next) {
    res
      .status(200)
      .send(
        'This is secured content. While access to this content is protected through the UI, via disabling of the "Display Secured Content" button, the access to the route itself is also restricted to requests containing a valid JWT.'
      )
  })

  return router
}

module.exports = getSecuredRouter

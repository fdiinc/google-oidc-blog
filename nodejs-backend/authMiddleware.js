const { expressjwt: jwt } = require('express-jwt')

// Check requests for an Authorization header. If found, check the signature and set req.auth to the decrypted value
function fromHeader(req) {
  if (req.headers.authorization && req.headers.authorization.toLowerCase().startsWith('bearer ')) {
    // Require 'Bearer ' in header
    const retval = req.headers.authorization.split(' ', 2)[1]
    return retval
  }
  return null
}

// Instantiating the express-jwt middleware
// By default this will require all routes defined below
// to be authorized, unless excluded
module.exports = authConfig => {
  return jwt({
    secret: authConfig.signingKey,
    getToken: fromHeader,
    algorithms: ['HS256']
  }).unless({
    // Restrict all the end points that can return secured data
    path: ['/auth/login', '/auth/config', '/unsecured']
  })
}

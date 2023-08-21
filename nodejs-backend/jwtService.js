/**
 * Service to handle login and JWT Authorizations
 */
const logger = require('debug')('fusion-midtier:jwtService')
const { sign } = require('jsonwebtoken')
const VError = require('verror')
const _ = require('lodash')

const config = require('./config')

const DEFAULT_JWT_TIMEOUT = 300
const DEFAULT_SIGNING_KEY = 'keyboard cat 4 ever'

class JwtService {
  /**
   *
   * @param {jwtTimeout, signingKey, authPlugin} props
   */
  constructor(
    { jwtTimeout = DEFAULT_JWT_TIMEOUT, signingKey = DEFAULT_SIGNING_KEY, authPlugin } = {}
    // auditLogService
  ) {
    try {
      this.jwtTimeout = jwtTimeout
      this.signingKey = signingKey

      this.config = config
    } catch (err) {
      throw new VError(err, 'Unable to instantiate authorization service using %s', JSON.stringify(authPlugin))
    }
  }

  /**
   * Given a user profile, return a signed JWT
   * @param {*} profile
   */
  makeAuthToken(profile) {
    return sign({ profile }, this.signingKey, {
      expiresIn: this.jwtTimeout
    })
  }
}

module.exports = JwtService

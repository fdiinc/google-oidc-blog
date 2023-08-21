const express = require('express')

const { google } = require('googleapis')
const _ = require('lodash')

/**
 * Helper function to convert promise routes into async routes
 * @param {*} fn
 */
let wrap =
  fn =>
  (...args) =>
    fn(...args).catch(args[2])

/**
 * Return a response body containing a new JWT that embeds the profile
 * @param {*} token - profile to embed in the JWT (or undefined for an error)
 * @param {*} errMsg - error message to use if the profile is undefined
 */
function makeAuthBody(jwtService, token = null, errMsg = 'Unauthorized') {
  return token !== null
    ? {
        // User credentials matched (are valid)
        success: true,
        token: jwtService.makeAuthToken(token),
        err: null
      }
    : {
        // User credentials did not match (are not valid) or no user with this email/password exists
        success: false,
        token: null,
        err: errMsg
      }
}

function fetchSocialAuthPlugin(config, socialAuthType) {
  return config.auth.plugin.socialAuth[socialAuthType]
}

function createGoogleOauth2Client(config, socialAuthType, tokens) {
  const socialAuthPlugin = fetchSocialAuthPlugin(config, socialAuthType)
  const oauth2Client = new google.auth.OAuth2({
    clientId: socialAuthPlugin.clientId,
    clientSecret: socialAuthPlugin.clientSecret,
    redirectUri: socialAuthPlugin.redirectUris[0],
    eagerRefreshThresholdMillis: socialAuthPlugin.refreshThresholdMs
  })
  if (tokens) {
    oauth2Client.setCredentials(tokens)
  }
  return oauth2Client
}

function getAuthRouter(jwtService, config) {
  const router = express.Router()

  /* POST /auth/login */
  router.route('/login').post(
    wrap(async (req, res) => {
      try {
        const code = req?.body?.code
        const socialAuthenticationMethod = req?.body?.socialAuthenticationMethod ?? 'google'

        const oauth2Client = createGoogleOauth2Client(config, socialAuthenticationMethod)
        const r = await oauth2Client.getTokenAsync({
          code,
          redirect_uri: 'postmessage'
        })
        oauth2Client.setCredentials(r.tokens)

        const body = makeAuthBody(jwtService, r.tokens, 'Username or password is incorrect')
        const resStatus = body.success ? res : res.status(401)
        resStatus.format({
          json: () => {
            res.json(body)
          }
        })
      } catch (err) {
        console.error('caught an error attempting to login', err)
        const resStatus = err.status ? err : res.status(401)
        resStatus.format({
          json: () => {
            res.json(err)
          }
        })
      }
    })
  )

  /* GET /auth/config */
  router.route('/config').get(
    wrap(async (req, res) => {
      // Return (any) social auth configurations, without the clientSecret
      let clientSecretFiltered = _.cloneDeep(config.auth.plugin.socialAuth.google)
      Object.entries(clientSecretFiltered).forEach(([socialAuthType, socialAuthConfig]) => {
        delete socialAuthConfig.clientSecret
      })
      res.send(clientSecretFiltered)
    })
  )

  /* GET /auth/profile */
  router.route('/profile').get(
    wrap(async (req, res) => {
      const { auth: user = null } = req
      const { profile = null } = user
      const oauth2Client = createGoogleOauth2Client(config, 'google')
      const idToken = profile.id_token
      const idTokenOptions = { idToken }
      const verifyResults = await oauth2Client.verifyIdTokenAsync(idTokenOptions)
      res.status(200).send(verifyResults)
    })
  )

  return router
}

module.exports = getAuthRouter

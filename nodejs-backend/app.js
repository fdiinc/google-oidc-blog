const { assert } = require('console')
const cookieParser = require('cookie-parser')
const cors = require('cors')
const express = require('express')
const createError = require('http-errors')
const path = require('path')
const logger = require('morgan')

const authRouter = require('./routes/auth')
const securedRouter = require('./routes/secured')
const unsecuredRouter = require('./routes/unsecured')

const JwtService = require('./jwtService')
const config = require('./config')
const AuthMiddleware = require('./authMiddleware')

assert(
  config.auth.plugin.socialAuth.google.clientId.length > 0 && config.auth.plugin.socialAuth.google.clientId !== 'TODO',
  'config.auth.plugin.socialAuth.google.clientId must be set in ./config. Get this value from Google-generated configuration, after setting up Google to be an identity provider for this application.'
)
assert(
  config.auth.plugin.socialAuth.google.clientSecret.length > 0 &&
    config.auth.plugin.socialAuth.google.clientSecret !== 'TODO',
  'config.auth.plugin.socialAuth.google.clientSecret must be set in ./config. Get this value from Google-generated configuration, after setting up Google to be an identity provider for this application.'
)

const app = express()

app.use(cors())
app.use(logger('dev'))
app.use(express.json())
app.use(express.urlencoded({ extended: false }))
app.use(cookieParser())
app.use(express.static(path.join(__dirname, 'public')))

// Add the auth middleware BEFORE the routes, so that any routes expecting to have the req.auth have it
app.use(AuthMiddleware(config.auth))
const jwtService = new JwtService({
  jwtTimeout: config.auth.clientJwtTimeout,
  signingKey: config.auth.signingKey,
  authPlugin: config.auth.plugin
})

app.use('/auth', authRouter(jwtService, config))
app.use('/secured', securedRouter())
app.use('/unsecured', unsecuredRouter())

// catch 404 and forward to error handler
app.use(function (req, res, next) {
  next(createError(404))
})

// error handler
app.use(function (err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message
  res.locals.error = req.app.get('env') === 'development' ? err : {}
  console.error('err', err)
  res.status(err.status || 500).send('Internal Server Error')
})

module.exports = app

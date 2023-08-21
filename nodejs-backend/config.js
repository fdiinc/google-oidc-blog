const config = {
  auth: {
    // Authentication plugin:
    clientJwtTimeout: '4h',
    signingKey: 'keyboard cat 4 ever',
    plugin: {
      socialAuth: {
        google: {
          enabled: true,
          clientId: 'TODO',
          clientSecret: 'TODO',
          redirectUris: ['postmessage'],
          scope: 'openid email profile',
          refreshThresholdMs: 300000
        }
      }
    }
  }
}
module.exports = config

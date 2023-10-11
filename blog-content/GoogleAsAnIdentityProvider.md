# Google as an Authentication Provider for a Client-Server Application

Recently, the Innovations Studio at Flatirons Digital Innovations has been hard at work revamping the authentication handling of our custom archive solution, Digital Hub. For the first pass of these changes, Google was added as an identity provider.

Digital Hub has a configuration-based React user interface and a NodeJS backend server that manages the flow of data between the datastore and the React frontend. While the Google OIDC documentation is extensive, I didn't find anything that provided an end-to-end example, detailing the steps for authenticating both the client and the server. There were subtleties in both the client and server setup that were only discovered after hours of stepping through in a debugger and reading very old forum posts. The following is a summary of lessons learned that will hopefully, save you from those long, painful battles.

The complete repository is available at [https://github.com/fdiinc/google-oidc-blog](https://github.com/fdiinc/google-oidc-blog).

## Prerequisites

- An understanding of the basics of Open ID Connect (OIDC) and OAuth 2.0 is required to make the best use of this information. There are many excellent resources on the web that explain both of these concepts, so this article will not spend time on those details.
- A Google Cloud account is needed to configure Google as an identity provider for the sample application.
- General knowledge of Javascript development, React and NodeJS.
- Familiarity with the layout and flow of projects created by [create-react-app](https://create-react-app.dev/docs/getting-started) and [expressjs-generator](https://expressjs.com/en/starter/generator.html) is helpful, since the frontend and backend projects were generated using those tools.

## Background

While all the details of OIDC are outside the scope of this post, there is one important distinction to make before getting down to the nitty gritty. OIDC can broadly be broken into two different use cases: resource management and user management. This post focuses on the user management case, but due to the prevalence of information that focuses on how OIDC is used to improve resource management and security, it seemed important to take a moment and highlight the differences.

### Resource Management

When OIDC is used for resource management, the resource owner is able to grant limited resource access to third-party applications. Consider the need to print photos stored in the cloud from a pay-to-print kiosk. Instead of requiring users to give their credentials directly to the kiosk (which would allow the kiosk full access to the user's cloud account), OIDC allows a token to be generated that's scoped to 1) the third-party application 2) the user 3) (only) their photos 4) a short time period. If the third party attempted to access a different scope (like the user's email) with that token, the request would be rejected. The value of this use case is in providing access to user-owned resources **WITHOUT** the third-party application ever having access to the user's cloud credentials.

For good reason, using OIDC for resource management is the focus of many articles and much documentation; however, even though there is an overlap in the terminology, the resource management use case is very different from the user management use case, and the prevalence of resource management documentation can create confusion when attempting to implement user management through an OIDC identity provider.

### User Management

When the OIDC protocol is used in conjunction with an identity provider (where "identity provider" is an application that the user has previously registered with e.g. Google), the identity provider takes on all the responsibility of user management: authenticating credentials, resetting lost passwords, deleting accounts, etc. The application utilizing the identity provider can impose some restrictions, such as blocking specific accounts or domains, but the application itself, similar to the resource management case, is **NEVER** given access to the user's credentials. Again, it's easy to see the value here. Users aren't required to create and keep track of a new account for the application, and the application developers are able to focus on application-specific functionality, instead of trying to securely reinvent the authentication wheel.

The rest of this article is going to focus on using Google as an identity provider, for a Javascript-based client-server application.

## Goal

To demonstrate the configuration required to use Google as an identity provider, we will be creating a small application, that displays both restricted and unrestricted content to users, as appropriate. The goals of this application are to:

- create a client-server application that runs locally (i.e. doesn't required external hosting).
- use Google for user authentication.
- block unauthenticated users from accessing restricted content (by both frontend and backend controls) and only allow them to view public content.
- allow authenticated users the option to view restricted content.

## Overview

Multiple steps are required to use Google as an identity provider for an application. At a high level, the steps are as follows:

- Register the application with Google.
- Update the frontend of the application.
  - Load the [gsi library](https://developers.google.com/identity/gsi/web/guides/overview) as a script in the React HTML.
  - Configure a Google OAuth button (provided by the gsi library).
  - Utilize the backend to exchange an authorization code for identity tokens.
- Update the backend of the application.
  - Add the [googleapis](https://www.npmjs.com/package/googleapis) library (version 126.0.0 is used at time of writing).
  - Create a new function that will accept an authorization code and exchange it for Google-issued identity tokens.
  - Return the identity tokens to the frontend.
  - Validate the token presence and value on REST requests.

The steps above are done once, around the same time the application is created. Then, every time a user attempts to authenticate, the following steps occur:

- The user clicks the Google OAuth button, causing a dialog to appear requesting user access.
  - If this is the first time a user has authenticated with the application, they will be shown the name of the application requesting access and the scope of access being requested. They will be asked to allow or deny that access (which can be revoked by the user at any time).
  - If the user has previously granted the application access, they will just need to authenticate with their Google credentials.
- Assuming the user authorized the application and provided valid credentials, an authorization code is returned to the frontend, which is valid for 1 hour.
- The frontend makes a REST call to _login_ on the backend, passing the authorization code.
- The backend passes the authorization code to Google, where it is exchanged for identity and access tokens.
- The backend passes the tokens to the frontend, and they are used in the _Authorization_ header for every subsequent REST exchange between the frontend and backend.

## Application Registration

In order to use Google as an identity provider for an application, it is necessary to first register the application with Google.

### OAuth 2.0 Client ID

In this section, the application is registered with Google and a client id is created, which will be used to identity the application when it works with Google to authenticate users.

- Log in to the [Google Cloud Console](https://console.cloud.google.com/).
- Navigate to "APIs & Services" -> "Credentials".
- Select "+ CREATE CREDENTIALS".
- Choose "OAuth client ID".
- For **Application Type**, select **Web application**
  - Enter a name for the web application. This should be something that makes it easy to recognize the application.
  - For **Authorized JavaScript origins**, add the URL of the frontend server. This is configuring access for CORS. Since the sample project is expected to run locally, the following should be added (separately) as authorized origins.
    - http://localhost
    - http://localhost:3001
  - For **Authorized redirect URIs**, add the URLs that the Google consent screen should redirect to upon a successful login/consent granted. Since the sample project will run from localhost, leave empty. **THIS WILL NEED TO BE SET TO "postmessage" PROGRAMMATICALLY, BUT LEAVE IT BLANK HERE.**

### OAuth Consent Screen

In this section, the consent screen that's shown the first time a user accesses the application, is created. **NOTE: It is only possible to have ONE OAuth consent screen per Google _PROJECT_. However, all the fields are editable, so this consent screen can be reconfigured to be used by a different application.**

- Navigate to "APIs & Services" -> "OAuth Consent Screen".
- For **User Type** select **External**. This will allow anyone with a Google-registered account to access the application.
- For **Application Name**, choose something that will make it easy for users to know what's requesting consent.
- For **Publishing Status**, choose **In Production** to avoid having to enumerate all possible users that may use the application.

## Frontend

Once the application has been registered with Google, the application itself has to be configured to use Google as an identity provider. The frontend React project will be updated by:

- Importing the Google-provided Javascript script.
- Configuring the "Continue with Google" using the client information generated in the previous section.

- First, add the GSI client script to _react-frontend/public/index.html_.

  - Inside the `<head>` element add

    `<script src="https://accounts.google.com/gsi/client" async defer>`

  Loading this script in the index.html, makes it available on the global **window** object inside the React project. With the notation `window.google.accounts`, it's possible to access the script from any .jsx file.

- Next, use the GSI client to configure a button that will handle displaying the consent/credential form and negotiating with Google to exchange the user's consent and credentials for an authorization code. This has two components:

  - Initialize the oauth2 and id clients.

  ```javascript
  const codeClient = await window?.google?.accounts?.oauth2?.initCodeClient({
    client_id: TODO, // this is created when the application is registered with Google, and is available through the Google Cloud Console
    callback: function(response, error) => {TODO}, // Custom function to handle a successful login
    scope: 'openid email profile', // Minimum scope required to use Google as an identity provider
    ux_mode: 'popup' // Designates the way confirmation/credential screen will be displayed. Options are 'popup' or 'redirect'
  })

  window?.google?.accounts?.id?.initialize({
    client_id:  TODO, // this is the same clientId used above
    grant_type: 'authorization_code'
  })
  ```

  - Configure the Google auth button styling and pass it a React ref to (eventually) render into. The ref was created in the constructor using `this.myRef = React.createRef()`.

  ```javascript
  window?.google?.accounts?.id?.renderButton(
    this.myRef.current,
    {
      theme: 'outline',
      size: 'large',
      type: 'standard',
      text: 'continue_with'
    },
    // This undocumented third parameter is a callback that fires when the credentials dialog is dismissed. After the user provides credentials to "Sign In Using Google" dialog, an authorization code is requested using this parameter.
    async () => await this.state.client.requestCode()
  )
  ```

- Finally, render the button.

```javascript
render() {
  return <div ref={this.myRef} align="center"></div>
}
```

The Google script is responsible for button rendering, displaying the consent and credential dialogs (as appropriate), and exchanging user consent and credentials for an authorization code. That's all out of the control of the react-frontend project, to ensure that the react-frontend (as the third-party application) is never given access to user credentials.

Because the react-frontend designated authorization code as the grant type during initialization, when user authentication is completed on the frontend, the frontend has, not an identity or access token (which contain user-specific information such as name, email, and avatar) but an authorization code. This code must be exchanged for tokens. To ensure that the backend and frontend use the same tokens to confirm user identity, the frontend delegates code <--> token exchange to the backend.

For the complete example, see react-frontend/src/GoogleAuth.jsx.

## Backend

Finally the backend of the application is updated. At a high level, the backend is responsible for four steps:

- Provide a REST endpoint to receive the authorization code.
- Negotiate with Google to exchange the authorization code for user-specific identification tokens.
- Return the identification tokens back to the frontend.
- Validate the token in the authorization header of every secured REST endpoint request.

However, before executing any of these steps, the backend must also register with Google.

- In the nodejs-backend project, install the Google-provided NPM library, "googleapis" `cd nodejs-backend; yarn add googleapis`.
- Initialize the Google API library with the same application-specific information used by the frontend.
  ```javascript
  const oauth2Client = new google.auth.OAuth2({
    clientId: TODO, // this is the same clientId used by the frontend
    clientSecret: TODO, // this is created when the application is registered with Google, and is available through the Google Cloud Console
    redirectUri: TODO, // If running locally i.e. on "localhost", this MUST be postmessage
    eagerRefreshThresholdMillis: TODO // the threshold for which a token should be considered "expiring" and a refresh request issued
  })
  ```
- After the Google OAuth client has been registered, it can be used to exchange the authorization code for identity tokens.

  ```javascript
  const r = await oauth2Client.getTokenAsync({
    code, // Authorization code, provided in the body of the REST request by the frontend
    redirect_uri: 'postmessage' // Indicates that the server is running on localhost
  })
  ```

- The tokens are set in the OAuth client and encoded into a single JWT (JSON Web Token) to return to the frontend as the REST response.

  ```javascript
  oauth2Client.setCredentials(r.tokens)

  const body = makeAuthBody(jwtService, r.tokens, 'Username or password is incorrect')
  const resStatus = body.success ? res : res.status(401)
  resStatus.format({
    json: () => {
      res.json(body)
    }
  })
  ```

- Now the only thing left to do is to validate Authorization headers on requests coming from the frontend. This is accomplished using ExpressJS-provided middleware, configured for this scenario. Much of this functionality is abstracted away by the express-jwt library, but there are two interesting things to note:
  - For this application, the only valid way to send authorization with a request, is in the Authorization header. Thus, if a JWT is sent as a query parameter on a request, the request will be rejected as unauthorized.
  ```javascript
  function fromHeader(req) {
    if (req.headers.authorization && req.headers.authorization.toLowerCase().startsWith('bearer ')) {
      // Require 'Bearer ' in header
      const retval = req.headers.authorization.split(' ', 2)[1]
      return retval
    }
    return null
  }
  ```
  - Some REST endpoints are required to **NOT** contain an Authorization header, as they return information that is either required before authentication with Google has been established, or they return public content that should be accessible by anyone. These special cases are explicitly exempted from the checks provided by the middleware.
  ```javascript
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
  ```

For full implementation details, see nodejs-backend/routes/auth.js.

## Validation

The only thing left to do is to test the implementation.

- Unauthorized users are restricted from seeing secured content, through both the user interface and the backend server. To test this:
  - Start the application.
  - Notice on the Home screen that the "Display Secured Content" button is disabled.
  - Attempt to navigate to http://localhost:3000/secured? (to get secured content back from the endpoint directly). Notice that "Internal Server Error" is shown in the main user interface, and, in the Developer Tools -> Network tab, the request failed with a 401 (Unauthorized) error.
- Authorized users have access to secured content. To test this:
  - Log in using the "Continue with Google" button and valid Google account credentials.
  - Notice that the "Continue with Google" button has been replaced with account-specific user information.
  - Notice that the "Display Secured Content" button is now enabled.
  - Click the button and notice that secured content is now displayed in the main text area.

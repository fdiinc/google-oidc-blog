# Getting Started

## Prerequisites

This project was created on a Linux OpenSUSE Leap 15.4 virtual machine, and assumes a Javascript package manager of Yarn.

## Running

- Clone the repository `git clone https://github.com/fdiinc/google-blog.git`
- `cd google-blog`
- Install the dependencies `yarn install`
- Run the project `yarn run start`

This will start a new terminal multiplexer session named google-blog. This session contains running instances of both the React frontend and the NodeJS backend.

#### A note about tmux

Terminal multiplexing is a powerful and useful tool, but it can be intimidating if you haven't used it before. I've found these to be the most important commands, and should be enough for anyone to get the project running.

- To kill the session. This stops both the front and backends
  - From the tmux terminal window,
  - `ctrl+b` puts the tmux terminal window in command mode (similar to <Esc> when using vi)
  - `:kill-session`
- A "duplicate session" error means there's already a running tmux session with that name. List all tmux sessions `tmux ls`, then kill the existing session `tmux kill-session -t google-blog`

### Registering Google as an Identity Provider

There are two pieces to this. You have to set up Google to be aware that it should be handling authentication for you. The process to do this is fairly similar across implementors of the OIDC protocol. It generally involves registering the application with the OIDC implementor, as well as setting up various URLs.

- Log in to your Google Cloud account.
- Navigate to APIs & Services -> Credentials
- Select "+ CREATE CREDENTIALS"
- Choose Oauth Client ID
- For **Application Type**, select "Web application"
- Enter a name for your web application. This should be something that makes it easy for you and your collegues to recognize the application.
- For **Authorized JavaScript origins**, add the URL(s) of the frontend server. This is for CORS, so it should be the URL(s) of whatever is serving up the Google consent screen.
- For **Authorized redirect URIs**, add the URL(s) that the Google consent screen should redirect to upon a successful login/consent granted. If using/hosting from localhost, leave empty. **THIS WILL NEED TO BE SET TO "postmessage" PROGRAMMATICALLY, BUT LEAVE IT BLANK HERE**

### Frontend

The React frontend has been modified slightly from the create-react-app defaults, to run on http://localhost:3001 (default is http://localhost:3000, but that is the NodeJS Express backend's default). If local environment constraints require the frontend to be run on a different port, update the 'start' script in `react-frontend/package.json`. The Google OIDC configuration will also need to be modified, specifically the 'Authorized Javascript Origins'.

When the frontend app starts up, it will automatically a tab in the default browser to the application home page (http://localhost:3001 if no changes have been made).

### Backend

Before starting the backend server, update the 'clientId' and 'clientSecret' values in `nodejs-backend/config.js` with the values Google generated when the OAuth 2.0 configuration was created.

The NodeJS Express server runs on http://localhost:3000. If local environment constraints require the backend to be run on a different port, update the 'start' script in `nodejs-backend/package.json`. The frontend's connection to the backend will also need to be updated in `react-frontend/src/serviceHelpers.js`.loadConnector.

### API

#### GET /unsecured

- Headers: None
- Parameters: None
- Return Status: 200
- Return Value: String

The frontend triggers a request to this endpoint automatically when the app loads. It demonstrates how requests can be made without any authorization.

#### GET /secured

- Headers:
  - Authorization: A JWT token returned from the /auth/login endpoint
- Parameters: None
- Return Status: 200
- Return Value: String

After a user has authenticated through Google, they are given access to load the /secured endpoint through the frontend. If a user hits this endpoint without a valid JWT in the Authorization header, a 401 Unauthorized will be returned.

#### POST /auth/login

- Headers: None
- Parameters: None
- Body:
  - authorizationCode
- Return Status: 200
- Return Value: JWT string

If a user successfully authenticates through Google, they are given an authorization code (with a one hour expiration) that can be exchanged for an authentication token.

#### GET /auth/profile

- Headers:
  - Authorization: A JWT token returned from /auth/login endpoint
- Parameters: None
- Return Status: 200
- Return Value: JSON object

Decrypts the id_token found in the JWT and returns the profile infomation provided by Google.

import React, { Component } from 'react'
import { Typography, Card, CardContent } from '@mui/material'
import { endpointSearch } from './serviceHelpers'

const authConfigEndpoint = '/auth/config?'
class GoogleAuth extends Component {
  state = {}
  constructor(props) {
    super(props)
    this.myRef = React.createRef()
  }
  handleCredentialResponse = (res, error) => {
    this.props?.authContext.login(res)
  }
  async componentDidMount() {
    let google = await endpointSearch(authConfigEndpoint)
    let results = google
    if (this.myRef.current) {
      const codeClient = await window?.google?.accounts?.oauth2?.initCodeClient({
        client_id: results.clientId,
        callback: this.handleCredentialResponse,
        scope: results.scope,
        ux_mode: 'popup'
      })
      window?.google?.accounts?.id?.initialize({
        client_id: results.clientId,
        grant_type: 'authorization_code'
      })

      await this.setState({ client: codeClient, isEnabled: true })
      window?.google?.accounts?.id?.renderButton(
        this.myRef.current,
        {
          theme: 'outline',
          size: 'large',
          type: 'standard',
          text: 'continue_with'
        },
        async () => await this.state.client.requestCode()
      )
    }
  }

  render() {
    return (
      <Card elevation={3}>
        <CardContent>
          <Typography variant="body1" align="center">
            Login to see secure content
          </Typography>
          <div ref={this.myRef} align="center"></div>
        </CardContent>
      </Card>
    )
  }
}

export default GoogleAuth

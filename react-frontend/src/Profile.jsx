import React, { Component } from 'react'
import { Avatar, Card, Typography } from '@mui/material'
import Grid from '@mui/material/Unstable_Grid2'
import { endpointSearch } from './serviceHelpers'

const endpoint = '/auth/profile?'

class Profile extends Component {
  state = {}
  componentDidMount = async () => {
    const profile = await endpointSearch(endpoint)
    this.setState({ profile })
  }
  render() {
    if (!this.state?.profile) return null
    return (
      <Card
        elevation={3}
        align="right"
        sx={{ display: 'flex', flexDirection: 'column', height: '100%', justifyContent: 'space-evenly' }}
      >
        <Grid container spacing={2} justifyContent="space-around" alignItems="center">
          <Grid xs={1}>
            <Avatar sx={{ width: 24, height: 24 }} src={this.state.profile.payload.picture} />
          </Grid>
          <Grid container xs={9} direction="column" alignItems="baseline">
            <Grid>
              <Typography variant="body2">Name: {this.state.profile.payload.name}</Typography>
            </Grid>
            <Grid>
              <Typography variant="body2">Email: {this.state.profile.payload.email}</Typography>
            </Grid>
          </Grid>
        </Grid>
      </Card>
    )
  }
}

export default Profile

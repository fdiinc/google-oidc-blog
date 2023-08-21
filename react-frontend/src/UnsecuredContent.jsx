import React, { Component } from 'react'
import { Card, Typography } from '@mui/material'
import { endpointSearch } from './serviceHelpers'

const searchEndpoint = '/unsecured'

class UnsecuredContent extends Component {
  state = {}

  componentDidMount = async () => {
    try {
      let results = await endpointSearch(searchEndpoint)
      this.setState({ unsecuredContent: results })
    } catch (err) {
      console.error('caught an error trying to load unsecured content', err)
    }
  }
  render() {
    if (!this.state.unsecuredContent) return null
    return (
      <Card>
        <Typography sx={{ m: 1, p: 1 }}>{this.state.unsecuredContent}</Typography>
      </Card>
    )
  }
}

export default UnsecuredContent

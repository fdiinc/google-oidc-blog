import React, { Component } from 'react'
import { Card, CardContent, Typography } from '@mui/material'
import { endpointSearch } from './serviceHelpers'

const searchEndpoint = '/secured?'

class SecuredContent extends Component {
  state = {}
  componentDidMount = async () => {
    try {
      let results = await endpointSearch(searchEndpoint)
      this.setState({ securedContent: results })
    } catch (err) {
      console.error('caught an error trying to load secure content', err)
    }
  }
  render() {
    if (!this.state.securedContent) return null
    return (
      <Card elevation={3}>
        <Typography sx={{ p: 1, m: 1 }}>{this.state.securedContent}</Typography>
      </Card>
    )
  }
}

export default SecuredContent

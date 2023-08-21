import React, { Component } from 'react'
import './App.css'
import { Box, Paper, Typography, Button, Link } from '@mui/material'
import Grid from '@mui/material/Unstable_Grid2'
// import { styled, withStyles, withTheme } from '@mui/material/styles'
import { styled, withStyles, withTheme } from '@mui/styles'

import { AuthContextConsumer, AuthContextWrapper } from './AuthContext'
import GoogleAuth from './GoogleAuth'
import Profile from './Profile'
import SecuredContent from './SecuredContent'
import UnsecuredContent from './UnsecuredContent'
import { createTheme, ThemeProvider } from '@mui/material/styles'

/**
 * Root component for the Google OIDC sample application
 * @class
 *
 */

const theme = createTheme({
  // root: {
  //   display: 'flex',
  //   flexWrap: 'nowrap',
  //   textAlign: 'center',
  //   height: '500px'
  //   // fontFamily: theme.typography.fontFamily,
  //   // fontWeight: theme.typography.fontWeightRegular,
  //   // fontSize: theme.typography.fontSize
  // },
  palette: {
    primary: {
      main: '#3579DC',
      contrastText: '#FAFAFA'
    },
    text: {
      primary: '#333',
      secondary: '#FAFAFA',
      disabled: '#FAFAFAA0',
      hint: '#FAFAFA'
    }
  },
  typography: {}
})

class App extends Component {
  state = {
    secureContentDisplayed: false
  }
  handleButtonClick = async () => {
    await this.setState(prevState => {
      return {
        secureContentDisplayed: !prevState.secureContentDisplayed
      }
    })
  }
  render() {
    return (
      <div style={{ height: '100%', display: 'flex' }}>
        <ThemeProvider theme={theme}>
          <AuthContextWrapper>
            <AuthContextConsumer>
              {authContext => (
                <Box
                  sx={{
                    display: 'flex',
                    flexGrow: 1,
                    flexDirection: 'column',
                    backgroundColor: 'primary.main'
                  }}
                >
                  <Paper
                    elevation={3}
                    sx={{
                      height: '100%',
                      p: 2,
                      m: 2,
                      backgroundColor: '#fafafa',
                      borderRadius: '7'
                    }}
                  >
                    <Grid container columnSpacing={2}>
                      <Grid xs={10} alignItems="stretch">
                        <Grid container direction="column" justifyContent="space-between" sx={{ minHeight: '104px' }}>
                          <Grid>{this.state.secureContentDisplayed ? <SecuredContent /> : <UnsecuredContent />}</Grid>
                          <Grid justifyContent="flex-end" alignItems="flex-end">
                            <Button
                              variant="contained"
                              onClick={this.handleButtonClick}
                              disabled={!authContext.isLoggedIn}
                            >
                              Display {this.state.secureContentDisplayed ? 'unsecured' : 'secured'} content
                            </Button>
                          </Grid>
                        </Grid>
                      </Grid>
                      <Grid xs={2} sx={{ minHeight: '104px' }}>
                        {authContext.isLoggedIn ? <Profile /> : <GoogleAuth authContext={authContext} />}
                      </Grid>
                    </Grid>
                  </Paper>
                  <Grid sx={{ display: 'flex' }} color={theme.palette.primary.contrastText} justifyContent="center">
                    <Typography variant="body2">
                      ©&#8239;Flatirons&nbsp;Digital&nbsp;Innovations&nbsp;Inc. All rights reserved.
                    </Typography>
                    <Link variant="body2" href="https://www.fdiinc.com">
                      www.fdiinc.com
                    </Link>
                  </Grid>
                </Box>
              )}
            </AuthContextConsumer>
          </AuthContextWrapper>
        </ThemeProvider>
      </div>
    )
  }
}

export default App

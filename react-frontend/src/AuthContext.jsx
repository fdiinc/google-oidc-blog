import React from 'react'
import PropTypes from 'prop-types'
import { authService } from './authService'

// Need a static default value for pre-initialization
const DEFAULT_VALUE = {
  isLoggedIn: false,
  profile: null,
  login: () => false
}

const setToken = token => {
  sessionStorage.setItem('SessionToken', token)
}

const clearToken = () => {
  sessionStorage.removeItem('SessionToken')
}

const clearCache = () => {
  clearToken()
  localStorage.removeItem('AuthContextState')
}

const AuthContext = React.createContext(DEFAULT_VALUE)
const AuthContextProvider = AuthContext.Provider
const AuthContextConsumer = AuthContext.Consumer

class AuthContextWrapper extends React.PureComponent {
  constructor(props) {
    super(props)
    this.state = this.makeDefaultState({})
  }

  componentDidUpdate(_prevProps, prevState, _snapshot) {
    if (this.state && this.state.isLoggedIn) {
      localStorage.setItem('AuthContextState', JSON.stringify(this.state))
    } else {
      // On logout delete all cached state (be safe)
      clearCache()
    }
  }

  async componentWillUnmount() {
    if (this.state) {
      clearCache()
    }
  }

  login = async authenticationCode => {
    try {
      const token = await authService.login(authenticationCode)
      await this.registerSession(token)
      return true
    } catch (err) {
      console.error('login failed:', err)
      return false
    }
  }

  /**
   * After successfully logging in, we need to maintain the session
   * This will update the state with the success login
   *
   */
  registerSession = async token => {
    // Store the login so that serviceHelper can work (this is a kluge)
    setToken(token)
    const profile = await authService.getProfile()
    this.setState({
      isLoggedIn: true,
      profile
    })
  }

  makeDefaultState = target =>
    Object.assign(target, DEFAULT_VALUE, {
      login: this.login
    })

  render() {
    return <AuthContextProvider value={this.state}>{this.props.children}</AuthContextProvider>
  }
}

export default AuthContext
export { AuthContext, AuthContextWrapper, AuthContextProvider, AuthContextConsumer }

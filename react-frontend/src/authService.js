import { endpointSearch, endpointPost } from './serviceHelpers'

const baseUrl = '/auth'
export default class AuthService {
  /**
   * Returns the JWT Token or throws
   */
  async login(loginToken) {
    const result = await endpointPost(baseUrl + '/login?', loginToken)
    return result.token
  }

  async getProfile() {
    const result = await endpointSearch(baseUrl + '/profile?')
    return result.profile
  }
}

export let authService = new AuthService()

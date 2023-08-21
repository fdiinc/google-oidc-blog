import request from 'axios'

let axiosInstance

/**
 * Logs the error and rethrows so it can be caught by the ServerErrorHandler
 * @param {Object} The error caught executing the REST service
 * @param {String} type The HTTP method that threw the error
 * @param {Object} serviceParams An object containing info about the service - URL fragment, queryString, connector, etc
 */
const handleError = (error, type, serviceParams) => {
  console.error('Caught an error executing a REST service. Raw error: ', error)
  console.error('service params are: ', serviceParams)
  if (error.response && error.response.statusCode) {
    let errorMessageParts = ["'" + error.response.statusCode]
    errorMessageParts.push(error.response.statusMessage + "'")
    errorMessageParts.push('executing a')
    errorMessageParts.push(type)
    if (serviceParams.searchType) {
      errorMessageParts.push("'" + serviceParams.searchType + "'")
    }
    errorMessageParts.push('with the url')
    if (serviceParams.connector) {
      const baseUrl = serviceParams.connector.url + ':' + serviceParams.connector.port
      const endpoint = serviceParams.endpoint
        ? serviceParams.endpoint
        : serviceParams.connector[serviceParams.searchType]
      errorMessageParts.push(baseUrl + endpoint + serviceParams.queryString)
    } else {
      errorMessageParts.push(serviceParams.connectorType)
    }

    const formattedError = errorMessageParts.join(' ')
    console.error('Formatted error message:', formattedError)
    throw new Error(formattedError)
  } else {
    throw error
  }
}

/**
 * Create an Axios instance configured to point to the NodeJS server
 *
 */
export const loadConnector = () => {
  try {
    if (!axiosInstance) {
      axiosInstance = request.create({
        baseURL: 'http://localhost:3000'
      })
    }
    axiosInstance.defaults.headers.common['Authorization'] = 'Bearer ' + sessionStorage.getItem('SessionToken')
    return axiosInstance
  } catch (error) {
    console.error('Caught an error in the serviceHelpers.loadConnector', error)
  }
}

/**
 * Execute a given search on the provided endpoint and
 *
 * @type {string} endpoint  The search endpoint (e.g., '/unsecured?' or '/secured?')
 *
 * @returns Results from search execution
 */
export async function endpointSearch(endpoint) {
  await loadConnector()
  try {
    const urlObj = { url: endpoint }
    const results = await axiosInstance(urlObj)

    return results.data
  } catch (e) {
    handleError(e, 'GET', {
      endpoint: endpoint
    })
  }
}

/**
 * Execute a POST request
 *
 * @type {string} postEndpoint  The midtier endpoint to execute the post against
 * @type {Object} body  Data that should be sent in the body of the POST
 *
 * @returns Results from post operation
 */
export async function endpointPost(postEndpoint, body) {
  try {
    await loadConnector()
    const results = await axiosInstance({
      url: postEndpoint,
      data: body,
      method: 'post',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        // Set custom header for CRSF
        'X-Requested-With': 'XmlHttpRequest'
      }
    })
    return results.data
  } catch (e) {
    handleError(e, 'POST', {
      endpoint: postEndpoint
    })
  }
}

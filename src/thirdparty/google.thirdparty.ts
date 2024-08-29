import axios from 'axios'
import config from 'config'

export default class GoogleThirdparty {
  static async getAccessTokenFromCode(code: string): Promise<string> {
    const { data } = await axios.post('https://oauth2.googleapis.com/token', {
      code,
      client_id: config.get('oauth.google.clientId'),
      client_secret: process.env.GOOGLE_CLIENT_SECRET,
      redirect_uri: config.get('oauth.google.redirectUri'),
      grant_type: 'authorization_code'
    })

    return data.id_token
  }
}

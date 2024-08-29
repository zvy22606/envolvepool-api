import axios from 'axios'

class DiscordThirdparty {
  constructor() {}
  async getUserData(type, token: string): Promise<any> {
    const { data } = await axios.get('https://discord.com/api/users/@me', {
      headers: {
        authorization: `${type} ${token}`
      }
    })

    return data
  }
}

export default new DiscordThirdparty()

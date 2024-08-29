import axios from 'axios'
import config from 'config'
// import { Client, auth } from 'twitter-api-sdk'

class TwitterThirdparty {
  // private twitterClient: Client

  constructor() {
    // const clientId: string = config.get('oauth.twitter.clientId')
    // const secret: string = process.env.TWITTER_CLIENT_SECRET as string
    // // const authClient = new auth.OAuth2User({
    // //   client_id: clientId,
    // //   client_secret: secret,
    // //   callback: config.get('oauth.twitter.redirectUri'),
    // //   scopes: ['tweet.read', 'users.read', 'offline.access', 'follows.read']
    // // })
    // // const clientId: string = 'Lh2fsR6xpvEmc7ql61VA75RFs'
    // // const secret: string = 'V7OIPXmTkb4B9TJfdaBto2XgZk0JyQzRmtyC6EJ1RxCr6z2FMo'
    // const token: string = Buffer.from(`${clientId}:${secret}`).toString(
    //   'base64'
    // )
    // this.twitterClient = new Client(token)
  }

  async getAccessToken(code: string): Promise<any> {
    const clientId: string = config.get('oauth.twitter.clientId')
    const secret: string = process.env.TWITTER_CLIENT_SECRET || ''
    const token: string = Buffer.from(`${clientId}:${secret}`).toString(
      'base64'
    )
    const { data } = await axios.post(
      'https://api.twitter.com/2/oauth2/token',
      {
        code,
        grant_type: 'authorization_code',
        redirect_uri: config.get('oauth.twitter.redirectUri'),
        code_verifier: 'challenge'
      },
      {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          Authorization: `Basic ${token}`
        }
      }
    )

    return data
  }

  // async getClientToken(): Promise<string> {
  //   const token: string = Buffer.from(
  //     `${this.apiKey}:${this.apiSecret}`
  //   ).toString('base64')
  //   const { data } = await axios.post(
  //     'https://api.twitter.com/oauth2/token',
  //     {
  //       grant_type: 'client_credentials'
  //     },
  //     {
  //       headers: {
  //         'Content-Type': 'application/x-www-form-urlencoded;charset=UTF-8',
  //         Authorization: `Basic ${token}`
  //       }
  //     }
  //   )
  //
  //   console.log(data)
  //   return data.access_token
  // }

  async getUserData(type, token: string): Promise<any> {
    const { data } = await axios.get('https://api.twitter.com/2/users/me', {
      headers: {
        authorization: `Bearer ${token}`
      }
    })

    return data.data
  }

  async follow(twitterId: string, token: string) {
    return axios.get(
      `https://api.twitter.com/1.1/friendships/create.json?user_id=${twitterId}&follow=true`,
      {
        headers: {
          authorization: `Bearer ${token}`
        }
      }
    )
  }

  async isFollow(userId: string): Promise<boolean> {
    let resp = await axios.get(
      `https://api.twitter.com/2/users/by/username/player_yongpan`,
      {
        headers: {
          authorization: `Bearer b2F6dGp6Y2J4Z1RnckpTNHBxa3hzNkIxSVgxUi05bzAzNHJHXzBNVHp0SnJzOjE3MTE1OTkyNjM3MTM6MTowOmF0OjE`
        }
      }
    )
    console.log(resp.data)
    resp = await axios.get(
      `https://api.twitter.com/1.1/followers/ids.json?screen_name=${userId}`,
      {
        headers: {
          authorization: `Bearer b2F6dGp6Y2J4Z1RnckpTNHBxa3hzNkIxSVgxUi05bzAzNHJHXzBNVHp0SnJzOjE3MTE1OTkyNjM3MTM6MTowOmF0OjE`
        }
      }
    )
    console.log(resp.data)

    return false
  }
}

export default new TwitterThirdparty()

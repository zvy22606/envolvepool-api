import { URLSearchParams } from 'url'
import { Context } from 'koa'
import _ from 'lodash'
import config from 'config'
import { ethers } from 'ethers'
import jsonwebtoken from 'jsonwebtoken'
import { ThirdUser } from '@prisma/client'
import BaseController from './base.controller'
import UserService from '../service/user.service'
import ThirdUserService from '../service/thirdUser.service'
import GithubThirdparty from '../thirdparty/github.thirdparty'
import GoogleThirdparty from '../thirdparty/google.thirdparty'
import EtherThirdparty from '../thirdparty/ether.thirdparty'
import DiscordThirdparty from '../thirdparty/discord.thirdparty'
import TwitterThirdparty from '../thirdparty/twitter.thirdparty'
import DiscordClient from '../client/discord.client'
import { signInfo } from '../middleware/jwt.mid'

class AuthController extends BaseController {
  public async disconnect(ctx: Context) {
    const user = ctx.state.user
    const type = ctx.params.type

    await ThirdUserService.delete(user.id, type)

    ctx.body = {}
  }

  public async authInfo(ctx: Context) {
    const user = ctx.state.user
    const type = ctx.params.type

    const thirdUser: ThirdUser | null = await ThirdUserService.findThirdUser(
      user.id,
      type
    )

    ctx.body = {
      isConnect: !!thirdUser,
      thirdUser
    }
  }

  public async getUserAuth(ctx: Context) {
    const user = ctx.state.user
    const thirdUsers: ThirdUser[] = await ThirdUserService.findByUser(user.id)

    ctx.body = _.map(thirdUsers, (thirdUser) => {
      return {
        username: thirdUser.thirdUsername,
        thirdPartyName: thirdUser.thirdPartyName
      }
    })
  }

  public async getGithubUrl(ctx: Context) {
    const query = ctx.query
    const state: any = {
      ...query
    }
    const type = ctx.query.type as string
    const params = new URLSearchParams()
    if (type && type === 'connect') {
      params.append('client_id', config.get('oauth.github.connect.clientId'))
      params.append('scope', 'user repo')
    } else {
      params.append('client_id', config.get('oauth.github.clientId'))
    }
    params.append('state', btoa(JSON.stringify(state)))
    const url: string = `${config.get(
      'oauth.github.requestUrl'
    )}?${params.toString()}`
    ctx.body = {
      url
    }
  }

  public async signinByGithub(ctx: Context) {
    const code: string = ctx.query.code as string
    const token: string = await GithubThirdparty.getAccessTokenFromCode(code)
    const githubUser = await GithubThirdparty.getUserData(token)

    const user = await UserService.findOrCreateThirdUser({
      name: githubUser.login,
      nickname: githubUser.name,
      type: 'github',
      avatarUrl: githubUser.avatar_url
    })
    ctx.app.emit('createUser', user.id)

    const userToken: string = signInfo({
      id: user.id,
      name: user.name
    })
    ctx.set('Authorization', 'Bearer ' + userToken)

    const dto = await UserService.formatDto(user)
    ctx.body = {
      ...dto,
      // inviteCode: status === UserStatus.ACTIVATED ? user.inviteCode : undefined,
      token: userToken,
      status: user.status
    }
  }

  public async getGoogleUrl(ctx: Context) {
    const query = ctx.query
    const state: any = {
      type: 'verifying',
      source: 'google',
      ...query
    }
    const params = new URLSearchParams()
    params.append('client_id', config.get('oauth.google.clientId'))
    params.append(
      'scope',
      'https://www.googleapis.com/auth/userinfo.email https://www.googleapis.com/auth/userinfo.profile openid'
    )
    params.append('prompt', 'consent')
    params.append('access_type', 'offline')
    params.append('response_type', 'code')
    params.append('redirect_uri', config.get('oauth.google.redirectUri'))
    params.append('state', btoa(JSON.stringify(state)))
    const url: string = `${config.get(
      'oauth.google.requestUrl'
    )}?${params.toString()}`

    ctx.body = {
      url
    }
  }

  public async signinByGoogle(ctx: Context) {
    const code: string = ctx.query.code as string
    const token: string = await GoogleThirdparty.getAccessTokenFromCode(code)
    const googleUser: any = jsonwebtoken.decode(token)
    ctx.assert(!_.isEmpty(googleUser), 400, 'Google auth validation error')

    const user = await UserService.findOrCreateThirdUser({
      email: googleUser['email'],
      nickname: googleUser['name'],
      type: 'google',
      avatarUrl: googleUser['picture']
    })
    ctx.app.emit('createUser', user.id)

    const userToken: string = signInfo({
      id: user.id,
      email: user.email as string
    })
    ctx.set('Authorization', 'Bearer ' + userToken)

    const dto = await UserService.formatDto(user)
    ctx.body = {
      ...dto,
      // inviteCode: status === UserStatus.ACTIVATED ? user.inviteCode : undefined,
      token: userToken,
      status: user.status
    }
  }

  public async getDiscordUrl(ctx: Context) {
    const params = new URLSearchParams()
    params.append('client_id', config.get('oauth.discord.clientId'))
    params.append('response_type', 'token')
    params.append('redirect_uri', config.get('oauth.discord.redirectUri'))
    params.append('scope', 'identify email')
    const url: string = `${config.get(
      'oauth.discord.requestUrl'
    )}?${params.toString()}`
    ctx.body = {
      url
    }
  }

  public async bindByDiscord(ctx: Context) {
    const user = ctx.state.user
    const type: string = ctx.query.type as string
    const token: string = ctx.query.token as string

    let thirdUser: ThirdUser | null = await ThirdUserService.findThirdUser(
      user.id,
      'discord'
    )
    ctx.assert(!thirdUser, 400, 'Already bound discord account')

    const info = await DiscordThirdparty.getUserData(type, token)

    thirdUser = await ThirdUserService.findByThirdUserId(info.id, 'discord')
    ctx.assert(!thirdUser, 400, 'This wallet already bound account')

    thirdUser = await ThirdUserService.create({
      userId: user.id,
      thirdUserId: info.id,
      thirdUsername: info.username,
      info,
      thirdPartyName: 'discord'
    })
    const flag = await DiscordClient.hasMember(thirdUser.thirdUserId)

    ctx.body = {
      username: thirdUser?.thirdUsername
    }
  }

  public async isJoin(ctx: Context) {
    const user = ctx.state.user

    const thirdUser: ThirdUser | null = await ThirdUserService.findThirdUser(
      user.id,
      'discord'
    )
    if (!thirdUser) {
      ctx.body = {
        isJoin: false
      }
      return
    }
    const isJoin: boolean = await DiscordClient.hasMember(thirdUser.thirdUserId)

    ctx.body = {
      isJoin
    }
  }

  public async getLinkedInUrl(ctx: Context) {
    const params = new URLSearchParams()
    params.append('client_id', config.get('oauth.linkedin.clientId'))
    params.append('scope', 'openid profile email')
    params.append('response_type', 'code')
    params.append('redirect_uri', config.get('oauth.linkedin.redirectUri'))
    const url: string = `${config.get(
      'oauth.linkedin.requestUrl'
    )}?${params.toString()}`
    ctx.body = {
      url
    }
  }

  public async signinByWallet(ctx: Context) {
    const account: string = ctx.request.body.account.toLowerCase()
    // const type: string = ctx.request.body.type
    ctx.assert(ethers.isAddress(account), 400, 'Incorrect Ethereum address')

    const balance: number = await EtherThirdparty.getBalance(account)

    const user = await UserService.findOrCreateThirdUser({
      name: account,
      nickname: '',
      type: 'wallet',
      avatarUrl: ''
    })
    ctx.app.emit('createUser', user.id)

    const token: string = signInfo({
      id: user.id,
      name: user.name
    })
    ctx.set('Authorization', 'Bearer ' + token)

    const dto = await UserService.formatDto(user)
    ctx.body = {
      ...dto,
      token,
      status: user.status,
      balance
    }
  }

  public async bindByWallet(ctx: Context) {
    const user = ctx.state.user
    let account: string = ctx.query.address as string
    account = account.toLowerCase()

    let thirdUser: ThirdUser | null = await ThirdUserService.findThirdUser(
      user.id,
      'wallet'
    )
    ctx.assert(!thirdUser, 400, 'Already bound wallet account')

    thirdUser = await ThirdUserService.findByThirdUserId(account, 'wallet')
    ctx.assert(!thirdUser, 400, 'This wallet already bound account')

    thirdUser = await ThirdUserService.create({
      userId: user.id,
      thirdUserId: account,
      thirdUsername: account,
      thirdPartyName: 'wallet'
    })

    ctx.body = {
      username: thirdUser?.thirdUsername
    }
  }

  public async getTwitterUrl(ctx: Context) {
    const params = new URLSearchParams()
    params.append('client_id', config.get('oauth.twitter.clientId'))
    params.append('response_type', 'code')
    // params.append('grant_type', 'authorization_code')
    params.append(
      'scope',
      'tweet.read users.read follows.read follows.write offline.access tweet.write like.write'
    )
    params.append('redirect_uri', config.get('oauth.twitter.redirectUri'))
    params.append('state', 'state')
    params.append('code_challenge', 'challenge')
    params.append('code_challenge_method', 'plain')
    const url: string = `${config.get(
      'oauth.twitter.requestUrl'
    )}?${params.toString()}`
    ctx.body = {
      url
    }
  }

  public async bindByTwitter(ctx: Context) {
    const user = ctx.state.user
    const code: string = ctx.query.code as string

    let thirdUser: ThirdUser | null = await ThirdUserService.findThirdUser(
      user.id,
      'twitter'
    )
    ctx.assert(!thirdUser, 400, 'Already bound twitter account')

    const accessToken = await TwitterThirdparty.getAccessToken(code)
    const info = await TwitterThirdparty.getUserData(
      accessToken.token_type,
      accessToken.access_token
    )

    thirdUser = await ThirdUserService.findByThirdUserId(info.id, 'twitter')
    ctx.assert(!thirdUser, 400, 'This twitter already bound account')

    thirdUser = await ThirdUserService.create({
      userId: user.id,
      thirdUserId: info.id,
      thirdUsername: info.username,
      info,
      thirdPartyName: 'twitter'
    })

    ctx.body = {
      username: thirdUser?.thirdUsername
    }
  }

  public async isFollow(ctx: Context) {
    // const user = ctx.state.user

    // const thirdUser: ThirdUser | null = await ThirdUserService.findThirdUser(
    //   user.id,
    //   'twitter'
    // )
    // if (!thirdUser) {
    //   ctx.body = {
    //     ifFollow: false
    //   }
    //   return
    // }
    // const isFollow: boolean = await TwitterThirdparty.isFollow(
    //   // thirdUser.thirdUserId
    //   '1689421053540409344'
    // ).catch((err) => {
    //   console.log(err)
    //   return false
    // })

    ctx.body = {
      isFollow: true
    }
  }
}

export default new AuthController()

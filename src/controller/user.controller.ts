import fs from 'fs'
import _ from 'lodash'
import { v4 as uuid } from 'uuid'
import bcrypt from 'bcrypt'
import { Context } from 'koa'
import { Prisma, Role, User, UserStatus } from '@prisma/client'
import BaseController from './base.controller'
import UserService from '../service/user.service'
import s3Client from '../client/file-upload.client'
import { ConfirmationType, UserTokenInfo } from '../model/jwt.model'
import { defaultAvatars } from '../model/constants'
import { PageInfo } from '../model/generics.model'
import { sign, signInfo } from '../middleware/jwt.mid'
import StringUtil from '../util/string.util'
import MessageUtil from '../util/message.util'
import UserWhereInput = Prisma.UserWhereInput

interface BaseSearchQuery {
  keyword?: string
  page?: string
  limit?: string
  sort?: string
}

class UserController extends BaseController {
  async findAll(ctx: Context) {
    const { keyword, page, limit, sort, role } =
      ctx.query as BaseSearchQuery & { role?: Role }
    const where: UserWhereInput = {}
    if (keyword) {
      where.OR = [
        {
          nickname: {
            contains: keyword,
            mode: 'insensitive'
          }
        },
        {
          email: {
            contains: keyword,
            mode: 'insensitive'
          }
        },
        {
          name: {
            contains: keyword,
            mode: 'insensitive'
          }
        }
      ]
    }

    if (role) {
      where.role = role
    }

    let offset: number = 0
    if (limit && page) {
      offset = +limit * (+page - 1)
    }

    let orderBy: any[] = []

    const pageInfo: PageInfo<User> = await UserService.findPagination(where, {
      offset,
      limit: limit && +limit,
      orderBy
    })

    const data: any[] = []
    for (let i = 0; i < pageInfo.data.length; i++) {
      const u = await UserService.formatDto(pageInfo.data[i])
      u.id = pageInfo.data[i].id
      data.push(u)
    }
    pageInfo.data = data

    ctx.body = pageInfo
  }

  public async findOne(ctx: Context) {
    const query = ctx.query
    const user = await UserService.findOne(query)
    ctx.assert(user, 400, 'User not found')

    const inviteCount: number = await UserService.count({
      invitedBy: user.id
    })

    const dto = await UserService.formatDto(user)
    ctx.body = {
      ...dto,
      inviteCount
    }
  }

  public async signin(ctx: Context) {
    const email: string = ctx.request.body.email.toLowerCase()
    const password: string = ctx.request.body.password
    const keepMeLoggedIn: boolean = ctx.request.body.keepMeLoggedIn

    const user: User = await UserService.findAndVerifyByEmail(email)

    // check admin api and user role
    if (ctx.state.adminApi) {
      ctx.assert(
        user.role === Role.ADMIN,
        403,
        'You do not have permission to access!'
      )
    }

    const isPasswordValid: boolean = await bcrypt.compare(
      password,
      user.password
    )
    ctx.assert(isPasswordValid, 400, MessageUtil.signinWrong())
    if (user.status === UserStatus.UNACTIVATED) {
      ctx.status = 400
      ctx.body = {
        code: 400,
        msg: MessageUtil.userNotActivated(email),
        isFail: true,
        status: UserStatus.UNACTIVATED
      }
      return
    }

    let token: string = sign(user.id, email, user.role, keepMeLoggedIn)
    ctx.set('Authorization', 'Bearer ' + token)

    const dto = await UserService.formatDto(user)
    ctx.body = {
      ...dto,
      token
    }
  }

  public async create(ctx: Context) {
    const email: string = ctx.request.body.email.toLowerCase()
    const password: string = ctx.request.body.password
    const reenterPassword: string = ctx.request.body.reenterPassword
    const inviteCode: string = ctx.request.body.inviteCode

    ctx.assert(StringUtil.isEmail(email), 400, MessageUtil.enterEmailError())
    ctx.assert(
      password === reenterPassword,
      400,
      MessageUtil.enterPasswordError()
    )

    // const flag: boolean = await UserService.inWhitelist(email)
    // ctx.assert(flag || !_.isEmpty(inviteCode), 400, MessageUtil.maintenance())

    let invitedBy: string | null = null
    if (inviteCode) {
      invitedBy = inviteCode
      const inviteeUser = await UserService.findByCode(inviteCode)
      // ctx.assert(!_.isEmpty(inviteeUser), 400, MessageUtil.invitorNotFound())
      if (inviteeUser) {
        invitedBy = inviteeUser.id
      }
    }

    const isRegistered: boolean = await UserService.userIsExists({
      email
    })

    ctx.assert(!isRegistered, 400, MessageUtil.emailExists(email))

    const user: User = await UserService.create({
      email,
      nickname: email.split('@')[0],
      password,
      avatar: defaultAvatars[_.random(0, defaultAvatars.length - 1)],
      invitedBy
    })

    ctx.body = {
      msg: MessageUtil.thanksForSigningUp(email)
    }
  }

  public async update(ctx: Context) {
    const id: string = ctx.get('uid')
    const username: string = ctx.request.body.username
    if (!username) {
      ctx.body = {}
      return
    }
    const user = await UserService.findOne({
      id: { not: id },
      username
    })
    ctx.assert(!user, 400, 'This username is already been used')

    await UserService.updateById(id, {
      username
    })

    ctx.body = {}
  }

  public async invitee(ctx: Context) {
    ctx.headers.authorization = undefined
    const tokenInfo = this.verifyToken(ctx)
    ctx.assert(!_.isEmpty(tokenInfo), 401, 'Invalid token')
    const inviteCode: string = ctx.request.body.inviteCode // User.inviteCode or UserLaunchProject.inviteCode
    ctx.assert(!_.isEmpty(inviteCode), 400, MessageUtil.invitorNotFound())
    const inviteeUser = await UserService.findByCode(inviteCode)
    // ctx.assert(!_.isEmpty(inviteeUser), 400, MessageUtil.invitorNotFound())

    const user: User = await UserService.findByPK(tokenInfo.id)
    await UserService.updateById(user.id, {
      status: UserStatus.ACTIVATED,
      invitedBy: inviteeUser?.id || inviteCode
    })
    ctx.app.emit('inviteUser', inviteCode)

    const token: string = signInfo({
      id: user.id,
      email: user.email,
      name: user.name
    })
    ctx.set('Authorization', 'Bearer ' + token)

    const dto = await UserService.formatDto(user)
    ctx.body = {
      ...dto,
      token
    }
  }

  public async activate(ctx: Context) {
    ctx.headers.authorization = undefined
    const tokenInfo = this.verifyToken(ctx)
    ctx.assert(!_.isEmpty(tokenInfo), 401, 'Invalid token')

    const user: User = await UserService.findByPK(tokenInfo.id)
    await UserService.updateById(user.id, {
      status: UserStatus.ACTIVATED
    })
    ctx.app.emit('createUser', user.id)

    const token: string = signInfo({
      id: user.id,
      email: user.email,
      name: user.name
    })
    ctx.set('Authorization', 'Bearer ' + token)

    const dto = await UserService.formatDto(user)
    ctx.body = {
      ...dto,
      token
    }
  }

  public async tokenConfirm(ctx: Context) {
    ctx.headers.authorization = undefined
    let tokenInfo = this.verifyToken(ctx)
    ctx.assert(!_.isEmpty(tokenInfo), 401, 'Invalid token')
    ctx.assert(tokenInfo.type === ConfirmationType.SIGNUP, 401, 'Invalid token')

    const user: User = await UserService.findByPK(tokenInfo.id)
    ctx.assert(
      user.status !== UserStatus.ACTIVATED,
      401,
      MessageUtil.emailCantConfirmed()
    )

    await UserService.updateById(user.id, {
      status: UserStatus.ACTIVATED
    })
    if (!_.isEmpty(user.invitedBy)) {
      ctx.app.emit('inviteUser', user.invitedBy)
    }
    ctx.app.emit('createUser', user.id)

    const token: string = sign(user.id, user.email || '', user.role)
    ctx.set('Authorization', 'Bearer ' + token)

    const dto = await UserService.formatDto(user)
    ctx.body = {
      ...dto,
      token
    }
  }

  public async signout(ctx: Context) {
    ctx.headers.authorization = undefined
    ctx.body = 'signout'
  }

  public async getUserInfo(ctx: Context) {
    const tokenInfo: UserTokenInfo = ctx.state.user
    const user: User = await UserService.findByPK(tokenInfo.id)
    const userId: string = ctx.get('uid')
    const inviteCount: number = await UserService.count({
      invitedBy: userId
    })

    const dto = await UserService.formatDto(user)
    ctx.body = {
      ...dto,
      inviteCount
    }
  }

  public async forgetPassword(ctx: Context) {
    let email: string = this.parseQueryParams(ctx.query.email)[0]
    ctx.assert(email, 400, 'Please input your email')
    email = email.toLowerCase()

    ctx.body = {
      msg: MessageUtil.forgetPassword(email)
    }
  }

  public async getInviteCount(ctx: Context) {
    const userId: string = ctx.get('uid')
    const inviteCount: number = await UserService.count({
      invitedBy: userId
    })

    ctx.body = {
      inviteCount
    }
  }

  public async getUserSimple(ctx: Context) {
    const email: string = ctx.query.email as string

    ctx.assert(email, 400, 'Unknown param')

    const user = await UserService.findByEmail(email)
    ctx.assert(
      user && user.status === UserStatus.ACTIVATED,
      404,
      'User not found'
    )
    const dto = await UserService.formatDto(user)

    ctx.body = {
      id: user.id,
      email: dto.email,
      nickname: dto.nickname,
      avatar: dto.avatar
    }
  }

  public async updatePassword(ctx: Context) {
    let tokenInfo = ctx.state?.user
    const isForgot: boolean = ctx.request.body.isForgot
    if (!isForgot) {
      ctx.assert(!_.isEmpty(tokenInfo), 401, 'Invalid token')
    } else {
      ctx.headers.authorization = undefined
      tokenInfo = this.verifyToken(ctx)
      ctx.assert(
        tokenInfo?.type === ConfirmationType.PASSWORD,
        401,
        'Invalid token'
      )
    }

    const user: User = await UserService.findByPK(tokenInfo.id)
    const newPassword: string = ctx.request.body.newPassword
    const reenterPassword: string = ctx.request.body.reenterPassword
    ctx.assert(
      newPassword === reenterPassword,
      400,
      MessageUtil.enterPasswordError()
    )

    if (!isForgot) {
      const password: string = ctx.request.body.password
      const isPasswordValid: boolean = await bcrypt.compare(
        password,
        user.password
      )
      ctx.assert(isPasswordValid, 400, MessageUtil.passwordWrong())
    }

    await UserService.updateById(user.id, {
      password: newPassword
    })
    ctx.body = {}
  }

  public async uploadAvatar(ctx: Context) {
    const userToken: UserTokenInfo = ctx.state.user
    const files = ctx.request.files
    ctx.assert(
      !_.isEmpty(files) && !_.isEmpty(files.file),
      400,
      'Please select image'
    )
    const avatar = this.parseQueryParams(files.file)[0]
    const suffix: string = avatar.originalFilename.split('.').pop()
    let filepath: string = await s3Client.upload(
      fs.readFileSync(avatar.filepath),
      `users/${userToken.id}/avatar_${uuid()}.${suffix}`
    )
    filepath = 'files/' + filepath
    const user: User = await UserService.updateAvatar(userToken.id, filepath)

    ctx.body = await UserService.formatDto(user)
  }

  public async verifyEmail(ctx: Context) {
    let email: string = ctx.request.body.email
    ctx.assert(!_.isEmpty(email), 400, `You should provide correct input`)
    email = email.toLowerCase()
    const exists: boolean = await UserService.userIsExists({
      email
    })
    // const inWhitelist: boolean = await UserService.inWhitelist(email)

    ctx.body = {
      exists
    }
  }

  public async verifyCode(ctx: Context) {
    const inviteCode: string = ctx.request.body.inviteCode
    const exists: boolean = await UserService.userIsExists({
      inviteCode
    })

    ctx.body = {
      valid: exists
    }
  }

  public async getToken(ctx: Context) {
    let id = this.parseQueryParams(ctx.query.id)[0]
    let email = this.parseQueryParams(ctx.query.email)[0]
    let user: User | null = null
    if (id) {
      user = await UserService.findByPK(id)
    } else if (email) {
      user = await UserService.findByEmail(email)
    }

    if (user) {
      ctx.body = {
        token: signInfo({ id: user.id, email: user.email, name: user.name })
      }
    } else {
      ctx.body = {}
    }
  }

  public async updateUserRole(ctx: Context) {
    const id = ctx.params.id as string
    const role = ctx.request.body.role

    ctx.assert(!!role, 401, 'Role does not exist!')

    await UserService.updateRole(id, role)
    ctx.status = 200
  }

  async getUserCount(ctx: Context) {
    const all = await UserService.count({})

    ctx.body = {
      total: all
    }
  }
}

export default new UserController()

import _ from 'lodash'
import config from 'config'
import assert from 'http-assert'
import bcrypt from 'bcrypt'
import { Prisma, Role, User } from '@prisma/client'
import pg from '../client/pg.client'
import s3Client from '../client/file-upload.client'
import StringUtil from '../util/string.util'
import MessageUtil from '../util/message.util'
import { ThirdUserDto } from '../model/user.model'
import { defaultAvatars } from '../model/constants'
import UserCreateInput = Prisma.UserCreateInput
import UserUpdateInput = Prisma.UserUpdateInput
import UserWhereInput = Prisma.UserWhereInput

class UserService {
  private PASSWORD_SALT_ROUNDS: number = 10

  protected get model() {
    return pg.user
  }

  // async inWhitelist(name, type: string): Promise<boolean> {
  //   const whitelist: Whitelist[] = await ConfigurationService.findAll(type)
  //   if (!whitelist.length) {
  //     return true
  //   }
  //   return _.some(whitelist, (user) => StringUtil.globMatch(name, user.name))
  // }

  async findByPK(id: string): Promise<User> {
    return this.model.findUniqueOrThrow({
      where: {
        id
      }
    })
  }

  async count(where: UserWhereInput = {}): Promise<number> {
    return this.model.count({
      where
    })
  }

  async findAll(where: UserWhereInput): Promise<User[]> {
    return this.model.findMany({
      where
    })
  }

  async findByEmail(email: string): Promise<User | null> {
    return this.model.findFirst({
      where: {
        email
      }
    })
  }

  async findByCode(code: string): Promise<User | null> {
    return this.model.findFirst({
      where: {
        inviteCode: code
      }
    })
  }

  async findOne(where: UserWhereInput = {}): Promise<User | null> {
    return this.model.findFirst({
      where
    })
  }

  async formatDto(user: User): Promise<any> {
    // logger.info(`Got signed URL[${avatar}] for user[${user.id}]`)
    return {
      id: user.id,
      name: user.name,
      nickname: user.nickname,
      email: user.email,
      username: user.username,
      registerType: user.registerType,
      inviteCode: user.inviteCode,
      role: user.role,
      avatar: user.avatar
    }
  }

  async findAndVerifyByEmail(email: string): Promise<User> {
    const user = await this.findByEmail(email)
    assert(!_.isEmpty(user), 404, MessageUtil.emailNotExists(email))
    return user
  }

  async userIsExists(where: UserWhereInput): Promise<boolean> {
    const count = await this.model.count({
      where
    })
    return count > 0
  }

  async create(data: UserCreateInput): Promise<User> {
    data.nickname = data.nickname || `hq_${_.floor(Date.now() / 1000)}`
    data.password = await bcrypt.hash(data.password, this.PASSWORD_SALT_ROUNDS)
    data.inviteCode = await this.createUniqueCode()

    let user = await this.model.create({
      data
    })
    return this.updateById(user.id, {
      username: user.uid + ''
    })
  }

  async createUniqueCode(): Promise<string> {
    const code: string = StringUtil.randomCode(10).toUpperCase()
    const count: number = await this.model.count({
      where: {
        inviteCode: code
      }
    })
    if (count > 0) {
      return this.createUniqueCode()
    }
    return code
  }

  async updateById(id: string, data: UserUpdateInput): Promise<User> {
    if (typeof data.password === 'string') {
      data.password = await bcrypt.hash(
        data.password,
        this.PASSWORD_SALT_ROUNDS
      )
    }
    return this.model.update({
      where: {
        id
      },
      data
    })
  }

  async updateAvatar(id: string, newAvatar: string): Promise<User> {
    let user: User = await this.findByPK(id)
    const oldAvatar: string = user.avatar.replace(
      config.get('s3.publicDomain'),
      ''
    )
    if (oldAvatar.indexOf('users/avatars') < 0) {
      await s3Client.delete(oldAvatar)
    }

    return this.updateById(id, {
      avatar: newAvatar
    })
  }

  async findOrCreateThirdUser(thirdUserDto: ThirdUserDto): Promise<User> {
    if (!thirdUserDto.name && !thirdUserDto.email) {
      assert(false, 400, 'There must be one name or email')
    }
    const thirdUser = await this.model.findFirst({
      where: {
        OR: [{ name: thirdUserDto.name }, { email: thirdUserDto.email }]
      }
    })
    if (!_.isEmpty(thirdUser)) {
      return thirdUser
    }

    return this.create({
      email: thirdUserDto.email,
      name: thirdUserDto.name,
      nickname: thirdUserDto.nickname,
      password: Math.random() + '',
      avatar: defaultAvatars[_.random(0, defaultAvatars.length - 1)],
      registerType: thirdUserDto.type
      // status: UserStatus.ACTIVATED
    })
  }

  async findPagination(
    where: UserWhereInput = {},
    opts?: { [key: string]: any }
  ): Promise<{ data: User[]; total: number }> {
    const orderBy = opts?.orderBy || []
    orderBy.push({
      createdAt: 'asc'
    })
    const offset = opts?.offset || 0
    const limit = opts?.limit
    const data = await this.model.findMany({
      where,
      orderBy,
      skip: offset,
      take: limit
    })
    const total = await this.model.count({
      where
    })
    return {
      data,
      total
    }
  }

  async updateRole(id: string, role: Role) {
    return this.model.update({
      data: { role },
      where: {
        id
      }
    })
  }
}

export default new UserService()

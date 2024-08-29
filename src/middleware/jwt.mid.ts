import _ from 'lodash'
import { Context, Next, Middleware } from 'koa'
import jsonwebtoken from 'jsonwebtoken'
import config from 'config'
import { UserTokenInfo } from '../model/jwt.model'
import { Role } from '@prisma/client'

const SECRET: string = process.env.JWT_SECRET || ''
/**
 * @param {JSON<String>} options
 */
export default function mid(options?: {
  [key: string]: any
  fromQuery?: boolean
}): Middleware {
  const opts = options ?? {}
  return async function (ctx: Context, next: Next) {
    try {
      let token = opts.fromQuery
        ? (ctx.query?.token as string) || ''
        : (ctx.get('Authorization') || '').split(' ')[1]

      jsonwebtoken.verify(token, SECRET)
    } catch (err: any) {
      if (opts.notNull) {
        await next()
        return
      }
      if (err.name === 'TokenExpiredError') {
        // 捕获 Token 过期异常
        err.msg = 'Login info has expired, please login again'
      } else {
        err.msg = 'Authorization failed'
      }
      err.status = 401
      throw err
    }

    await next()
    // Token refresh
    refreshToken(ctx)
  }
}

function refreshToken(ctx: Context) {
  const user = ctx.state.user as UserTokenInfo
  delete user['exp']
  delete user['iat']
  const token = signInfo(user, user.long)
  ctx.set('Authorization', 'Bearer ' + token)
}

export function sign(
  id: string,
  email: string,
  role: Role,
  long?: boolean
): string {
  const opt: any = long
    ? config.get('jwt.longOptions')
    : config.get('jwt.options')
  return jsonwebtoken.sign({ id, email, long, role }, SECRET, opt)
}

export function signInfo(info: UserTokenInfo, long?: boolean): string {
  const opt: any = long
    ? config.get('jwt.longOptions')
    : config.get('jwt.options')
  info.long = long
  return jsonwebtoken.sign(info, SECRET, opt)
}

export function signConfirmation(info: UserTokenInfo): string {
  return jsonwebtoken.sign(info, SECRET, {
    expiresIn: '10m'
  })
}

export function parse() {
  return async function (ctx: Context, next: Next) {
    let decoded: any
    try {
      decoded = jsonwebtoken.verify(
        (ctx.get('Authorization') || '').split(' ')[1],
        SECRET
      )
      _.set(ctx, 'state.user', decoded)
      _.set(ctx, 'headers.uid', decoded.id)
    } catch (err: any) {}

    await next()
  }
}

export function verify(token: string): any {
  return jsonwebtoken.verify(token, SECRET)
}

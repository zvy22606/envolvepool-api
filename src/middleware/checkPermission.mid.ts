import { Role } from '@prisma/client'
import { Context, Middleware, Next } from 'koa'

export default function checkPermission(
  roles: Role[] = [Role.ADMIN]
): Middleware {
  return async function (ctx: Context, next: Next) {
    const { user } = ctx.state

    ctx.assert(
      roles.includes(user?.role),
      403,
      'You do not have permission to access!'
    )
    await next()
  }
}

export function markAdminApi(): Middleware {
  return async function (ctx, next) {
    ctx.state.adminApi = true
    await next()
  }
}

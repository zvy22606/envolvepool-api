import { Context, Next } from 'koa'
import getLogger from '../util/log.util'
const logger = getLogger('errorHandlerMiddleware')

export default async function errorHandler(ctx: Context, next: Next) {
  try {
    await next()
    const status: number = ctx.status || 404
    if (status === 404) {
      ctx.status = 404
      ctx.throw(404)
    }
  } catch (err: any) {
    console.log(err.message)
    if (err.status !== 401) {
      logger.error(err.stack)
    }
    if (err.status) {
      ctx.status = err.status
    } else {
      ctx.status = 500
    }
    ctx.body = {
      code: ctx.status,
      msg: err.message,
      debug: err.debug,
      type: err.type
    }
  }
}

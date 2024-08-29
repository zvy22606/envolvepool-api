import _ from 'lodash'
import { Context, Next } from 'koa'
import getLogger from '../util/log.util'

const reqLogger = getLogger('request')
const resLogger = getLogger('response')

const headerNames = ['uid', 'content-type', 'authorization']

export async function requestLogger(ctx: Context, next: Next) {
  const params: any = ctx.params || {}
  const search: any = ctx.query || {}
  const body: any = ctx.request.body || {}
  const start: number = Date.now()
  const message = {
    headers: _.pick(ctx.request.headers, headerNames),
    params,
    search,
    body
  }
  if (ctx.originalUrl.indexOf('health') >= 0) {
    await next()
    return
  }
  reqLogger.info(`${ctx.method} ${ctx.originalUrl} ${JSON.stringify(message)}`)
  await next()

  const { res } = ctx

  const onfinish: (...args: any) => void = done.bind(null, 'finish')
  const onclose: (...args: any) => void = done.bind(null, 'close')

  res.once('finish', onfinish)
  res.once('close', onclose)

  function done(event: any) {
    res.removeListener('finish', onfinish)
    res.removeListener('close', onclose)

    // let body: any = {}
    let body: any = ctx.body || {}
    try {
      body =
        typeof body === 'string'
          ? JSON.parse(body)
          : JSON.stringify(body) && body
    } catch (e) {
      body = {}
    }
    const headers: any = _.pick(ctx.response.headers, headerNames)
    const message: { [key: string]: any } = {
      headers,
      body
    }
    const time = Date.now() - start
    resLogger.info(
      `${time}ms ${ctx.method} ${ctx.originalUrl} ${
        ctx.status
      } ${JSON.stringify(message)}`
    )
  }
}

export async function responseBuild(ctx: Context, next: Next) {
  await next()

  const body: any = ctx.body
  const status: number = ctx.status || 404
  ctx.body = {
    code: status,
    data: body
  }
  ctx.status = status
}

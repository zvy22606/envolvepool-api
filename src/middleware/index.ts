import Koa from 'koa'
import koaBody from 'koa-body'
import json from 'koa-json'
import cors from '@koa/cors'
import { parse } from './jwt.mid'
import * as loggerMid from './logger.mid'
import errorHandle from './errorHandler.mid'

// const SSE_CONF = {
//   maxClients: 2, // 最大连接数
//   pingInterval: 40000 // 重连时间
// }

export default function middlewares(app: Koa) {
  app.use(
    koaBody({
      multipart: true,
      formidable: {
        maxFileSize: 200 * 1024 * 1024,
        maxFiles: 10
      }
    })
  )

  app.use(json())
  app.use(
    cors({
      origin: '*',
      allowHeaders:
        'Origin, X-Requested-With, Content-Type, Accept, Authorization',
      exposeHeaders:
        'Origin, X-Requested-With, Content-Type, Accept, Authorization'
    })
  )

  app.use(parse())
  app.use(loggerMid.requestLogger)
  app.use(errorHandle)

  // app.use(loggerMid.responseBuild)
}

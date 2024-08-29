import Koa from 'koa'
import Router from 'koa-router'
import routes from './router'
import middlewares from './middleware'
import * as tx from './lib/tx'

const app = new Koa()
const router = new Router()

middlewares(app)
// router.use('/api', routes.routes())
router.use('/v1', routes.routes())
app.use(router.routes())
tx.init()

export default app

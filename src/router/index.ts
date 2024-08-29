import Koa from 'koa'
import Router from 'koa-router'
import userRouter from './user.route'
import auth from './auth.route'
import ethers from './ethers.route'
import launchProjectRouter from './launchProject.route'
import uploadRouter from './upload.route'
import filesRouter from './files.route'

const router = new Router()

router.get('/health', (ctx: Koa.Context) => {
  ctx.body = {
    uptime: process.uptime(),
    message: 'OK',
    date: new Date()
  }
})

router.use('/users', userRouter.routes())
router.use('/auth', auth.routes())
router.use('/ethers', ethers.routes())
router.use('/launch-projects', launchProjectRouter.routes())

router.use('/upload', uploadRouter.routes())
router.use('/files', filesRouter.routes())

export default router

import Router from 'koa-router'
import EthersController from '../controller/ethers.controller'
import jwt from '../middleware/jwt.mid'

const router = new Router()

router.get('/price', EthersController.getPrice)
router.post('/signature', jwt(), EthersController.signature)

export default router

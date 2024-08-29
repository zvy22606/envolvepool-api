import Router from 'koa-router'
import jwt from '../middleware/jwt.mid'
import LaunchProjectController from '../controller/launchProject.controller'

const router = new Router()

router.get('/', LaunchProjectController.findAll)
router.post('/', LaunchProjectController.create)
router.get('/:id', LaunchProjectController.findByPK)
router.post('/:id/airdrop', LaunchProjectController.addAirdrop)
router.patch('/:id', LaunchProjectController.edit)
router.get('/:id/me', jwt(), LaunchProjectController.findMyLaunchProject)
router.get('/:id/check-wait-list', jwt(), LaunchProjectController.checkWaitList)
router.post('/:id/wait-list', LaunchProjectController.addWaitList)
router.get('/:id/join', jwt(), LaunchProjectController.join)
router.post('/:id/stake', jwt(), LaunchProjectController.addStake)
router.get('/:id/unstake/:stakeId', jwt(), LaunchProjectController.unStake)
router.get('/:id/fuels', jwt(), LaunchProjectController.findUserFuels)
router.post('/:id/fuels/claim', jwt(), LaunchProjectController.claim)

export default router

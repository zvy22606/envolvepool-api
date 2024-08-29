import Router from 'koa-router'
import jwt from '../middleware/jwt.mid'
import AuthController from '../controller/auth.controller'

const router = new Router()

router.get('/', jwt(), AuthController.getUserAuth)
router.get('/:type/info', jwt(), AuthController.authInfo)
router.delete('/:type/disconnect', jwt(), AuthController.disconnect)

router.get('/github', AuthController.getGithubUrl)
router.get('/github/callback', AuthController.signinByGithub)
router.get('/google', AuthController.getGoogleUrl)
router.get('/google/callback', AuthController.signinByGoogle)
router.get('/discord', AuthController.getDiscordUrl)
router.get('/discord/callback', jwt(), AuthController.bindByDiscord)
router.get('/discord/check-join', jwt(), AuthController.isJoin)
router.get('/linkedin', AuthController.getLinkedInUrl)
router.post('/wallet', AuthController.signinByWallet)
router.get('/wallet/bind', jwt(), AuthController.bindByWallet)
router.get('/twitter', AuthController.getTwitterUrl)
router.get('/twitter/callback', jwt(), AuthController.bindByTwitter)
router.get('/twitter/check-follow', jwt(), AuthController.isFollow)

export default router

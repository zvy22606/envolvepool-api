import Router from 'koa-router'
import UserController from '../controller/user.controller'
import jwt from '../middleware/jwt.mid'
import checkPermission, {
  markAdminApi
} from '../middleware/checkPermission.mid'

const router = new Router()

router.post('/verify-email', UserController.verifyEmail)
router.post('/verify-inviteCode', UserController.verifyCode)
router.post('/', UserController.create)
router.patch('/', jwt(), UserController.update)
router.get('/', jwt(), checkPermission(), UserController.findAll)
router.get('/get', UserController.findOne)
router.get('/count', UserController.getUserCount)
router.post('/signin/admin', markAdminApi(), UserController.signin)
router.post('/signin', UserController.signin)
router.get('/signout', jwt(), UserController.signout)
router.get('/info', jwt(), UserController.getUserInfo)
router.get('/inviteCount', jwt(), UserController.getInviteCount)
router.get('/simple', UserController.getUserSimple)
router.get(
  '/forgot-password',
  UserController.forgetPassword.bind(UserController)
)
router.post(
  '/update-password',
  jwt({ notNull: true }),
  UserController.updatePassword.bind(UserController)
)
router.post(
  '/upload-avatar',
  jwt(),
  UserController.uploadAvatar.bind(UserController)
)

router.post('/invitee', UserController.invitee.bind(UserController))
router.post('/token', UserController.tokenConfirm.bind(UserController))
router.post('/activate', UserController.activate.bind(UserController))
// hack
router.get('/token', UserController.getToken.bind(UserController))

router.patch(
  '/:id/role',
  jwt(),
  checkPermission(),
  UserController.updateUserRole
)

export default router

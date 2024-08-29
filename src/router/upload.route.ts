import Router from 'koa-router'
import UploadController from '../controller/file.controller'

const router = new Router()

router.post('/single', UploadController.uploadSingle)

export default router

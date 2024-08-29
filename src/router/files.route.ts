import Router from 'koa-router'
import FileController from '../controller/file.controller'

const router = new Router()

router.get('/files/:filepath', FileController.getFiles)

export default router

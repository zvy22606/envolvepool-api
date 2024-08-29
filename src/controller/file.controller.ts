import fs from 'fs'
import path from 'path'
import config from 'config'
import mime from 'mime-types'
import { Context } from 'koa'
import BaseController from './base.controller'
import _ from 'lodash'
import UploadService from '../service/upload.service'

class FileController extends BaseController {
  public async uploadSingle(ctx: Context) {
    let { filepath } = ctx.request.body
    ctx.assert(filepath, 400, 'Please input filepath')
    const files = ctx.request.files
    ctx.assert(
      !_.isEmpty(files) && !_.isEmpty(files.file),
      400,
      'Please select file'
    )
    const file = files.file[0] || files.file

    filepath = await UploadService.uploadFile(file, filepath)

    filepath = 'files/' + filepath

    ctx.body = {
      filepath
    }
  }

  public async getFiles(ctx: Context) {
    try {
      const filename = ctx.params.filename // 从请求参数中获取文件名
      const filePath = path.join(config.get('uploadDir'), filename) // 构建完整文件路径

      // 检查文件是否存在
      if (!fs.existsSync(filePath)) {
        ctx.status = 404
        ctx.body = '文件未找到'
        return
      }

      // 获取文件扩展名并设置正确的 Content-Type
      const ext = path.extname(filePath).toLowerCase()

      // 根据文件扩展名设置内容类型
      ctx.type = mime.contentType(ext) || 'application/octet-stream'

      // 返回文件流，支持在线预览
      ctx.body = fs.createReadStream(filePath)
    } catch (err) {
      ctx.status = 500
      ctx.body = 'Server Error'
      console.error(err)
    }
  }
}

export default new FileController()

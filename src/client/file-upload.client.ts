import fs from 'fs/promises'
import path from 'path'
import config from 'config'
import getLogger from '../util/log.util'

const logger = getLogger('file-upload')

class FileUpload {
  private readonly folder: string = config.get('uploadDir')

  constructor() {}

  async upload(
    file: Buffer | Uint8Array | string,
    filename: string
  ): Promise<any> {
    logger.info(`Uploading file[${filename}]...`)

    try {
      await fs.access(this.folder)
    } catch (e) {
      await fs.mkdir(this.folder, { recursive: true })
    }

    // 生成完整的文件路径
    const fullFilePath = path.join(this.folder, filename)

    await fs.writeFile(fullFilePath, file)

    return filename
  }

  async delete(filename: string) {
    const fullFilePath = path.join(this.folder, filename)

    try {
      await fs.access(fullFilePath)
      await fs.unlink(fullFilePath)
    } catch (e) {}
  }
}

export default new FileUpload()

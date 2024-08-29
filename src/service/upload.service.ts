import fs from 'fs'
import { nanoid } from 'nanoid'
import { File } from 'formidable'
import s3Client from '../client/file-upload.client'

class UploadService {
  async uploadFile(file: File, filepath: string) {
    const suffix: string = file.originalFilename?.split('.').pop() || ''
    filepath = await s3Client.upload(
      fs.readFileSync(file.filepath),
      `${filepath}/${nanoid()}.${suffix}`
    )

    return filepath
  }
}

export default new UploadService()

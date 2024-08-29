import z from 'zod'
import { minimatch } from 'minimatch'

export default class StringUtil {
  static isEmail(email: string): boolean {
    const schema = z.string().email()
    return schema.safeParse(email).success
  }

  static isUUID(uuid: string): boolean {
    const schema = z.string().uuid()
    return schema.safeParse(uuid).success
  }

  static isInt(str: string): boolean {
    const schema = z.number().int()
    return schema.safeParse(str).success
  }

  static globMatch(str: string, pattern: string): boolean {
    return minimatch(str, pattern)
  }

  static randomCode(len: number): string {
    const source: string =
      '013456789abcdefghijklmnopqrstuvwxyzABCDEFGHJKLMNPQRSTUVWXYZ'
    let code: string = ''
    for (let i: number = 0; i < len; i++) {
      code += source[Math.floor(Math.random() * 1000) % source.length]
    }
    return code
  }
}

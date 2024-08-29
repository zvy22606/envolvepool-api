import { Context } from 'koa'
import { verify } from '../middleware/jwt.mid'
import { UserTokenInfo } from '../model/jwt.model'

export default class BaseController {
  public parseQueryParams(query: any): any[] {
    if (!query) return []
    return Array.isArray(query) ? query : [query]
  }

  public verifyToken(ctx: Context): UserTokenInfo | null {
    let token: string =
      ctx.get('Authorization')?.split(' ')[1] ||
      ctx.query.token ||
      ctx.request.body.token

    try {
      return verify(token)
    } catch (err) {
      return null
    }
  }

  public formatSort(sort: string): any {
    const orderBy: { [key: string]: string }[] = []
    if (sort.slice(0, 1) === '-') {
      orderBy.push({
        [sort.slice(1)]: 'desc'
      })
    } else {
      orderBy.push({
        [sort]: 'asc'
      })
    }
    return orderBy
  }
}

import { Context } from 'koa'
import BaseController from './base.controller'
import EtherThirdparty from '../thirdparty/ether.thirdparty'
import CacheClient from '../client/cache.client'

class EthersController extends BaseController {
  public async getPrice(ctx: Context) {
    const currency = ctx.query.currency as string
    ctx.assert(currency, 400, 'Missing params')
    const key: string = `${currency}-usd-price`
    let data = await CacheClient.get(key)
    if (!data) {
      data = await EtherThirdparty.getPrice(currency)
    }
    if (data) {
      await CacheClient.set(key, data, 'EX', 60)
    }
    ctx.body = data
  }

  public async signature(ctx: Context) {
    // const userId = ctx.state.user.id
    const sourceId: string = ctx.request.body.sourceId
    const sourceType: string = ctx.request.body.sourceType
    const address: string = ctx.request.body.address

    ctx.assert(
      ['Certification'].includes(sourceType),
      400,
      'Unknown sourceType'
    )
    // const source = await CertificationService.findUserCertification(
    //   userId,
    //   sourceId
    // )
    // ctx.assert(source, 400, 'Source not exists')
    // const balance: number = await EtherThirdparty.getBalance(address)
    // ctx.assert(balance > 0, 400, 'The eth address does not meet the conditions')

    const hexString: string = '0x' + sourceId.replaceAll('-', '')
    const signatureId: string = BigInt(hexString).toString()
    const hash = await EtherThirdparty.signature(signatureId, address)
    ctx.body = {
      signatureId,
      ...hash
    }
  }
}

export default new EthersController()

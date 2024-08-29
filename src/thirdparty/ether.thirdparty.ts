import axios from 'axios'
import { ethers, Provider } from 'ethers'

class EtherThirdparty {
  providerUrl: string = `https://rpc.mantle.xyz`
  provider: Provider

  constructor() {
    this.provider = ethers.getDefaultProvider(this.providerUrl)
  }

  async getPrice(currency: string): Promise<any> {
    const { data } = await axios.get(
      `https://api.coingecko.com/api/v3/simple/price?ids=${currency}&vs_currencies=usd`
    )
    return data[currency]
  }

  async getBalance(address: string): Promise<number> {
    const balance = await this.provider.getBalance(address)
    return Number(balance) / Math.pow(10, 18)
  }

  async getTransactionCount(address: string): Promise<number> {
    return this.provider.getTransactionCount(address)
  }

  async signature(sourceId: string, address: string): Promise<any> {
    const hashResult: string = ethers.keccak256(
      new ethers.AbiCoder().encode(['uint256', 'address'], [sourceId, address])
    )

    let private_key: string = process.env.MANTLE_CONTRACT_PRIVATE_KEY as string
    let wallet = new ethers.Wallet(private_key)

    let message = ethers.getBytes(hashResult)
    let signedMessage = await wallet.signMessage(message)
    let sig = ethers.Signature.from(signedMessage)

    return {
      hashResult,
      sig
    }
  }
}

export default new EtherThirdparty()

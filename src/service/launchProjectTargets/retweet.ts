import { FuelType } from '@prisma/client'
import { Factory, Payload } from './factory'

class FollowTwitter extends Factory {
  async do(userId: string, payload: Payload): Promise<any> {
    await this.incrProgress(userId)
  }
}

export default new FollowTwitter(FuelType.RETWEET_TWITTER)

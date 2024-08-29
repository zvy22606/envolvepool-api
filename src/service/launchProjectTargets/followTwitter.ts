import { FuelType } from '@prisma/client'
import { Factory, Payload } from './factory'

class FollowTwitterFactory extends Factory {
  async do(userId: string, payload: Payload): Promise<any> {
    await this.incrProgress(userId)
  }
}

export default new FollowTwitterFactory(FuelType.FOLLOW_TWITTER)

import { FuelType } from '@prisma/client'
import { Factory, Payload } from './factory'

class JoinDiscordFactory extends Factory {
  async do(userId: string, payload: Payload): Promise<any> {
    await this.incrProgress(userId)
  }
}

export default new JoinDiscordFactory(FuelType.JOIN_DISCORD)

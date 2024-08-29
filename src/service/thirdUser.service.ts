import { Prisma, ThirdUser } from '@prisma/client'
import pg from '../client/pg.client'
import ThirdUserUncheckedCreateInput = Prisma.ThirdUserUncheckedCreateInput

class ThirdUserService {
  protected get model() {
    return pg.thirdUser
  }

  async create(data: ThirdUserUncheckedCreateInput): Promise<ThirdUser> {
    return this.model.create({
      data
    })
  }

  async findByUser(userId: string): Promise<ThirdUser[]> {
    return this.model.findMany({
      where: {
        userId
      }
    })
  }

  async findThirdUser(
    userId: string,
    thirdPartyName: string
  ): Promise<ThirdUser | null> {
    return this.model.findFirst({
      where: {
        userId,
        thirdPartyName
      }
    })
  }

  async findByThirdUserId(
    thirdUserId,
    type: string
  ): Promise<ThirdUser | null> {
    return this.model.findFirst({
      where: {
        thirdUserId,
        thirdPartyName: type
      }
    })
  }

  async delete(userId, type: string): Promise<ThirdUser> {
    return this.model.delete({
      where: {
        userId_thirdPartyName: {
          userId,
          thirdPartyName: type
        }
      }
    })
  }
}

export default new ThirdUserService()

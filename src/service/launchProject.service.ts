import _ from 'lodash'
import BN from 'bignumber.js'
import Bluebird from 'bluebird'
import {
  Fuel,
  FuelType,
  LaunchProject,
  Prisma,
  UserFuelStake,
  UserFuelTarget,
  UserLaunchProject
} from '@prisma/client'
import pg from '../client/pg.client'
import EtherThirdparty from '../thirdparty/ether.thirdparty'
import LaunchProjectUncheckedCreateInput = Prisma.LaunchProjectUncheckedCreateInput
import LaunchProjectUncheckedUpdateInput = Prisma.LaunchProjectUncheckedUpdateInput
import UserLaunchProjectCreateInput = Prisma.UserLaunchProjectCreateInput
import LaunchWaitListUncheckedCreateInput = Prisma.LaunchWaitListUncheckedCreateInput
import FuelWhereInput = Prisma.FuelWhereInput
import UserFuelTargetWhereInput = Prisma.UserFuelTargetWhereInput
import UserFuelStakeUncheckedCreateInput = Prisma.UserFuelStakeUncheckedCreateInput
import UserFuelStakeUncheckedUpdateInput = Prisma.UserFuelStakeUncheckedUpdateInput

class LaunchProjectService {
  protected get model() {
    return pg.launchProject
  }

  async create(
    data: LaunchProjectUncheckedCreateInput
  ): Promise<LaunchProject> {
    return this.model.create({
      data
    })
  }

  async findByPK(id: string): Promise<LaunchProject> {
    return this.model.findUniqueOrThrow({
      where: {
        id
      }
    })
  }

  async findByLaunchPadID(launchPadID: number): Promise<LaunchProject> {
    return this.model.findFirstOrThrow({
      where: {
        launchPadID
      }
    })
  }

  async findAll(): Promise<LaunchProject[]> {
    return this.model.findMany({
      orderBy: {
        createdAt: 'asc'
      }
    })
  }

  async count(): Promise<number> {
    return this.model.count()
  }

  async findPagination(): Promise<{ data: LaunchProject[]; total: number }> {
    const data = await this.findAll()
    const total = await this.count()
    return {
      data,
      total
    }
  }

  async update(
    id: string,
    data: LaunchProjectUncheckedUpdateInput
  ): Promise<LaunchProject> {
    return this.model.update({
      data,
      where: {
        id
      }
    })
  }

  async updateByHash(
    txHash: string,
    data: LaunchProjectUncheckedUpdateInput
  ): Promise<LaunchProject> {
    return this.model.update({
      data,
      where: {
        txHash
      }
    })
  }

  async formatDto(project: LaunchProject): Promise<any> {
    const totalFuel: number = await this.findProjectTotalFuels(project.id)
    const userCount: number = await this.findProjectUserCount(project.id)

    const now: number = Date.now()
    if (now < project.fuelStart.valueOf()) {
      project.status = 'upcoming'
    } else if (now < project.allocationStart.valueOf()) {
      project.status = 'fueling'
    } else if (now < project.airdropStart.valueOf()) {
      project.status = 'allocation'
    } else if (now < project.airdropEnd.valueOf()) {
      project.status = 'airdrop'
    } else {
      project.status = 'end'
    }

    return {
      ...project,
      totalFuel,
      userCount
    }
  }

  async createWaitList(data: LaunchWaitListUncheckedCreateInput) {
    return pg.launchWaitList.create({
      data
    })
  }

  async checkWaitList(email, launchProjectId: string): Promise<boolean> {
    const count: number = await pg.launchWaitList.count({
      where: {
        email,
        launchProjectId
      }
    })
    return count > 0
  }

  async findFuels(where?: FuelWhereInput): Promise<Fuel[]> {
    return pg.fuel.findMany({
      where,
      orderBy: {
        sequence: 'asc'
      }
    })
  }

  async findProjectTotalFuels(launchProjectId: string): Promise<number> {
    return pg.userLaunchProject
      .aggregate({
        _sum: {
          totalFuel: true
        },
        where: {
          launchProjectId
        }
      })
      .then((data) => {
        return data._sum.totalFuel || 0
      })
  }

  async findProjectUserCount(launchProjectId: string): Promise<number> {
    return pg.userLaunchProject.count({
      where: {
        launchProjectId
      }
    })
  }

  async findUserLaunchProject(
    userId: string,
    launchProjectId: string
  ): Promise<UserLaunchProject | null> {
    return pg.userLaunchProject.findUnique({
      where: {
        userId_launchProjectId: {
          userId,
          launchProjectId
        }
      }
    })
  }

  async findUserLaunchProjectByCode(
    code: string,
    launchProjectId: string
  ): Promise<UserLaunchProject | null> {
    return pg.userLaunchProject.findFirst({
      where: {
        inviteCode: code,
        launchProjectId
      }
    })
  }

  async createUserLaunchProject(
    data: UserLaunchProjectCreateInput
  ): Promise<UserLaunchProject> {
    const userLaunchProject = await pg.userLaunchProject.create({
      data
    })
    if (data.invitedBy) {
      await pg.userLaunchProject.updateMany({
        where: {
          userId: data.invitedBy,
          launchProjectId: data.launchProjectId
        },
        data: {
          inviteCount: {
            increment: 1
          }
        }
      })
    }
    return userLaunchProject
  }

  async findUserTargetsByLaunchProject(
    userId: string,
    launchProjectId: string
  ): Promise<UserFuelTarget[]> {
    const fuels: Fuel[] = await pg.fuel.findMany({
      where: {
        launchProjectId,
        type: { notIn: [FuelType.STAKE_TOKEN, FuelType.INVITATION] }
      },
      orderBy: {
        sequence: 'asc'
      }
    })
    return Bluebird.map(fuels, async (fuel) => {
      const t: number = _.get(fuel.extra, 'target', 1)
      let userFuel = await pg.userFuelTarget.findFirst({
        where: {
          userId,
          fuelId: fuel.id
        }
      })
      if (!userFuel) {
        userFuel = await pg.userFuelTarget.create({
          data: {
            userId,
            launchProjectId,
            fuelId: fuel.id,
            type: fuel.type,
            progress: [0, t]
          }
        })
      }
      return userFuel
    })
  }

  async findUserStake(id: string): Promise<UserFuelStake> {
    return pg.userFuelStake.findUniqueOrThrow({
      where: {
        id
      }
    })
  }

  async findUserStakeByHash(txHash: string): Promise<UserFuelStake | null> {
    return pg.userFuelStake.findUnique({
      where: {
        txHash
      }
    })
  }

  async findUserStakesByLaunchProject(
    launchProjectId: string
  ): Promise<UserFuelStake[]> {
    return pg.userFuelStake.findMany({
      where: {
        launchProjectId
      }
    })
  }

  async findUserStakesByLaunchProjectAndUser(
    userId: string,
    launchProjectId: string
  ): Promise<UserFuelStake[]> {
    return pg.userFuelStake.findMany({
      where: {
        userId,
        launchProjectId,
        status: 'stake'
      }
    })
  }

  async createUserStake(
    data: UserFuelStakeUncheckedCreateInput
  ): Promise<UserFuelStake> {
    data.fuel = await this.calcStakingFuel(String(data.amount), data.duration)
    return pg.userFuelStake.create({
      data
    })
  }

  async updateUserStake(
    id: string,
    data: UserFuelStakeUncheckedUpdateInput
  ): Promise<UserFuelStake> {
    return pg.userFuelStake.update({
      where: {
        id
      },
      data
    })
  }

  async updateUserStakeByHash(
    txHash: string,
    data: UserFuelStakeUncheckedUpdateInput
  ): Promise<UserFuelStake> {
    return pg.userFuelStake.update({
      where: {
        txHash
      },
      data
    })
  }

  async findUserTargets(
    userId: string,
    where?: UserFuelTargetWhereInput
  ): Promise<UserFuelTarget[]> {
    return pg.userFuelTarget.findMany({
      where: {
        userId,
        ...where
      }
    })
  }

  async editUserTarget(id: string, data: Prisma.UserFuelTargetUpdateInput) {
    return pg.userFuelTarget.update({
      where: {
        id
      },
      data
    })
  }

  async claim(targetId: string): Promise<UserFuelTarget> {
    return pg.userFuelTarget.update({
      where: {
        id: targetId
      },
      data: {
        claimed: true
      }
    })
  }

  async calcStakingFuel(amount: string, duration: number): Promise<number> {
    const price = await EtherThirdparty.getPrice('ethereum')
    const fuel = BN(amount).times(price.usd).times(duration)
    if (fuel.gt(100000)) {
      return 100000
    }
    return Number(fuel.toFixed(0))
  }
}

export default new LaunchProjectService()

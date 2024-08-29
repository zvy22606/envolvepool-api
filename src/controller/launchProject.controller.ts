import _ from 'lodash'
import { Context } from 'koa'
import BaseController from './base.controller'
import { Fuel, FuelType, UserFuelStake, UserFuelTarget } from '@prisma/client'
import Bluebird from 'bluebird'
import LaunchProjectService from '../service/launchProject.service'
import LaunchPoolThirdparty from '../thirdparty/launchPool.thirdparty'
import UserService from '../service/user.service'
import StringUtil from '../util/string.util'

class LaunchProjectController extends BaseController {
  public async findAll(ctx: Context) {
    const info = await LaunchProjectService.findPagination()
    const data = await Bluebird.map(info.data, (project) => {
      return LaunchProjectService.formatDto(project)
    })
    ctx.body = {
      data,
      total: info.total
    }
  }

  public async findByPK(ctx: Context) {
    const id: string = ctx.params.id
    const project = await LaunchProjectService.findByPK(id)
    if (project.status === 'pending') {
      const ret = await LaunchPoolThirdparty.addLaunchPool(project)
      await LaunchProjectService.update(project.id, {
        txHash: ret.hash
      })
    }
    ctx.body = await LaunchProjectService.formatDto(project)
  }

  public async addAirdrop(ctx: Context) {
    const id: string = ctx.params.id
    const project = await LaunchProjectService.findByPK(id)
    const stakes = await LaunchProjectService.findUserStakesByLaunchProject(id)
    const proof = await LaunchPoolThirdparty.addAirDrop(project, stakes)
    await LaunchProjectService.update(id, {
      proof
    })
    ctx.body = {}
  }

  public async findMyLaunchProject(ctx: Context) {
    const userId = ctx.state.user.id
    const id: string = ctx.params.id
    const userLaunchProject = await LaunchProjectService.findUserLaunchProject(
      userId,
      id
    )
    if (userLaunchProject) {
      ctx.body = {
        isParticipate: true,
        userLaunchProject
      }
    } else {
      ctx.body = {
        isParticipate: false
      }
    }
  }

  public async checkWaitList(ctx: Context) {
    const user = ctx.state.user
    const id: string = ctx.params.id

    const email: string = user.email
    let isJoin: boolean
    if (!email) {
      isJoin = false
    } else {
      isJoin = await LaunchProjectService.checkWaitList(email, id)
    }

    ctx.body = {
      isJoin,
      email
    }
  }

  public async addWaitList(ctx: Context) {
    const id: string = ctx.params.id

    let email: string = ctx.request.body.email
    ctx.assert(email, 400, 'Please input email')
    email = email.trim().toLowerCase()
    ctx.assert(StringUtil.isEmail(email), 400, 'Please input email')

    const flag: boolean = await LaunchProjectService.checkWaitList(email, id)
    ctx.assert(!flag, 400, 'This email has been added')
    await LaunchProjectService.createWaitList({
      email,
      launchProjectId: id
    })

    ctx.body = {}
  }

  public async addStake(ctx: Context) {
    const userId = ctx.state.user.id
    const id: string = ctx.params.id
    const { txHash, address, duration, amount } = ctx.request.body

    const project = await LaunchProjectService.findByPK(id)

    ctx.body = await LaunchProjectService.createUserStake({
      userId,
      userAddress: address,
      launchProjectId: id,
      launchPadId: Number(project.launchPadID),
      duration,
      txHash,
      index: 0,
      amount
    })
  }

  public async unStake(ctx: Context) {
    const userId = ctx.state.user.id
    const { stakeId } = ctx.params

    const stake = await LaunchProjectService.findUserStake(stakeId)
    ctx.assert(stake.userId === userId, 400, "You don't have permission")

    await LaunchProjectService.updateUserStake(stakeId, {
      status: 'unstake'
    })

    ctx.body = {}
  }

  public async create(ctx: Context) {
    const data = ctx.request.body
    ctx.body = await LaunchProjectService.create(data)
  }

  public async edit(ctx: Context) {
    const id: string = ctx.params.id
    const data = ctx.request.body
    ctx.body = await LaunchProjectService.update(id, data)
  }

  public async join(ctx: Context) {
    const userId = ctx.state.user.id
    const id: string = ctx.params.id
    const code = ctx.query.code as string
    let userLaunchProject = await LaunchProjectService.findUserLaunchProject(
      userId,
      id
    )
    if (!userLaunchProject) {
      ctx.assert(code, 400, 'Please input param inviteCode')
      let invitedBy: string | null
      let inviteCode: string | null
      if (code !== 'VXGQUHE1R8') {
        const userLaunch =
          await LaunchProjectService.findUserLaunchProjectByCode(
            code as string,
            id
          )
        ctx.assert(userLaunch, 400, 'Unknown invite code')

        invitedBy = userLaunch.userId
        inviteCode = userLaunch.inviteCode
      } else {
        const user = await UserService.findByCode('VXGQUHE1R8')
        invitedBy = user!.id
        inviteCode = user!.inviteCode
      }
      userLaunchProject = await LaunchProjectService.createUserLaunchProject({
        userId,
        launchProjectId: id,
        invitedBy,
        inviteCode
      })
    }
    ctx.body = userLaunchProject
  }

  public async findUserFuels(ctx: Context) {
    const userId = ctx.state.user.id
    const id: string = ctx.params.id

    const fuels = await LaunchProjectService.findFuels({
      launchProjectId: id
    })
    const userLaunchProject = await LaunchProjectService.findUserLaunchProject(
      userId,
      id
    )
    const userFuelTargets: UserFuelTarget[] =
      await LaunchProjectService.findUserTargetsByLaunchProject(userId, id)
    const userFuelStakes: UserFuelStake[] =
      await LaunchProjectService.findUserStakesByLaunchProjectAndUser(
        userId,
        id
      )

    let fuel: Fuel = _.find(fuels, { type: FuelType.STAKE_TOKEN }) as Fuel
    const userStakes = userFuelStakes.map((userStake) => {
      return {
        id: userStake.id,
        name: fuel.name,
        type: fuel.type,
        extra: fuel.extra,
        reward: userStake.fuel,
        sequence: fuel.sequence,
        duration: userStake.duration,
        amount: userStake.amount,
        status: userStake.status,
        index: userStake.index,
        stakeTime: userStake.createdAt,
        launchProjectId: id
      }
    })
    fuel = _.find(fuels, { type: FuelType.INVITATION }) as Fuel
    const invitation = {
      id: fuel.id,
      name: fuel.name,
      type: fuel.type,
      extra: fuel.extra,
      reward: fuel.reward,
      sequence: fuel.sequence,
      inviteCount: userLaunchProject?.inviteCount || 0,
      launchProjectId: id
    }
    const userTargets = userFuelTargets.map((userTarget) => {
      const fuel = _.find(fuels, { id: userTarget.fuelId }) as Fuel
      return {
        id: fuel.id,
        name: fuel.name,
        type: fuel.type,
        extra: fuel.extra,
        reward: fuel.reward,
        sequence: fuel.sequence,
        completed: userTarget.completed,
        claimed: userTarget.claimed,
        progress: userTarget.progress,
        launchProjectId: id
      }
    })

    ctx.body = [...userStakes, invitation, ...userTargets]
  }

  public async claim(ctx: Context) {
    const { targetId } = ctx.request.body
    await LaunchProjectService.claim(targetId)
  }
}

export default new LaunchProjectController()

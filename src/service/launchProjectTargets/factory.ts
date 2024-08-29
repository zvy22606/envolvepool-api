import Bluebird from 'bluebird'
import { Fuel, FuelType, UserFuelTarget } from '@prisma/client'
import LaunchProjectService from '../launchProject.service'

export type Payload = { [key: string]: any }
export abstract class Factory {
  protected fuels: Fuel[] = []
  protected fuelType: FuelType

  constructor(type: FuelType) {
    this.fuelType = type
  }

  async start(userId: string): Promise<UserFuelTarget[]> {
    return LaunchProjectService.findUserTargets(userId, {
      type: this.fuelType
    })
  }
  abstract do(userId: string, payload?: Payload): Promise<any>

  async incrProgress(userId: string): Promise<any> {
    const progresses: UserFuelTarget[] = await this.start(userId)
    return Bluebird.map(progresses, async (progress: UserFuelTarget) => {
      if (progress.completed) {
        return progress
      }
      if (progress.progress[0] < progress.progress[1]) {
        progress.progress[0] += 1
      }
      if (progress.progress[0] === progress.progress[1]) {
        progress.completed = true
      }
      return LaunchProjectService.editUserTarget(progress.id, {
        progress: progress.progress,
        completed: progress.completed
      })
    })
  }
  async resetProgress(userId: string): Promise<UserFuelTarget[]> {
    const progresses: UserFuelTarget[] = await this.start(userId)
    return Bluebird.map(progresses, async (progress: UserFuelTarget) => {
      if (progress.completed) {
        return progress
      }
      if (progress.progress[0] < progress.progress[1]) {
        progress.progress[0] = 0
      }
      return LaunchProjectService.editUserTarget(progress.id, {
        progress: progress.progress,
        completed: progress.completed
      })
    })
  }
}

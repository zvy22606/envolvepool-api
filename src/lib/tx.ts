import BN from 'bignumber.js'
import Bluebird from 'bluebird'
import { ethers } from 'ethers'
import LaunchpadAbi from './abi/Launchpad.json'
import LarkThirdparty from '../thirdparty/lark.thirdparty'
import LaunchProjectService from '../service/launchProject.service'
import ThirdUserService from '../service/thirdUser.service'

const LaunchpadAddress: string = '0xF67b9e899A9B8f1Ea66E27AB6B7AEF9f05844CCC'
const apiURL: string = 'https://rpc.open-campus-codex.gelato.digital'

export const init = function () {
  if (!process.env.NODE_ENV) {
    return
  }
  const provider = new ethers.JsonRpcProvider(apiURL)
  const contract = new ethers.Contract(LaunchpadAddress, LaunchpadAbi, provider)
  const AddLaunchpadEvent: string = 'AddLaunchpad'
  const ClaimEvent: string = 'Claimed'
  const StakeEvent: string = 'Staked'
  const UnStakeEvent: string = 'UnStaked'
  contract.on(
    AddLaunchpadEvent,
    async (launchPadID, launchedAddress, chainID, name, event) => {
      const message: string = `AddLaunchpad event triggered - launchPadID: ${launchPadID}, launchedAddress: ${launchedAddress}, chainID: ${chainID}, name: ${name}`
      LarkThirdparty.sendMessage(message)

      await LaunchProjectService.updateByHash(event.log.transactionHash, {
        launchPadID: Number(launchPadID),
        chainID: Number(chainID),
        status: 'approved'
      })
    }
  )

  contract.on(
    ClaimEvent,
    async (
      userAddress,
      launchPadID,
      points,
      token,
      amount,
      timestamp,
      chainID,
      event
    ) => {
      const message: string = `Claimed event triggered - userAddress: ${userAddress}, launchPadID: ${launchPadID}, points: ${points}, token: ${token}, amount: ${amount}, timestamp: ${timestamp}, chainID: ${chainID}`
      LarkThirdparty.sendMessage(message)
    }
  )
  contract.on(
    StakeEvent,
    async (
      userAddress,
      launchPadID,
      index,
      token,
      amount,
      timestamp,
      chainID,
      event
    ) => {
      const txHash: string = event.log.transactionHash
      const message: string = `Staked event triggered - userAddress: ${userAddress}, launchPadID: ${launchPadID}, index: ${index}, token: ${token}, amount: ${amount}, timestamp: ${timestamp}, chainID: ${chainID}, hash: ${txHash}`
      LarkThirdparty.sendMessage(message)

      await Bluebird.delay(5000)
      const stake = await LaunchProjectService.findUserStakeByHash(txHash)
      if (stake) {
        await LaunchProjectService.updateUserStakeByHash(txHash, {
          index: Number(index)
        })
        return
      }
      const launchProject = await LaunchProjectService.findByLaunchPadID(
        Number(launchPadID)
      )
      const thirdUser = await ThirdUserService.findByThirdUserId(
        userAddress,
        'wallet'
      )

      await LaunchProjectService.createUserStake({
        userId: thirdUser?.userId,
        userAddress,
        launchProjectId: launchProject.id,
        launchPadId: Number(launchPadID),
        duration: 30,
        txHash: txHash,
        index: Number(index),
        amount: BN(amount).div(1e18).toString()
      })
    }
  )
  contract.on(
    UnStakeEvent,
    async (
      userAddress,
      launchPadID,
      index,
      token,
      amount,
      timestamp,
      chainID,
      event
    ) => {
      const message: string = `UnStaked event triggered - userAddress: ${userAddress}, launchPadID: ${launchPadID}, index: ${index}, token: ${token}, amount: ${amount}, timestamp: ${timestamp}, chainID: ${chainID}`
      LarkThirdparty.sendMessage(message)
      // console.log(event)
    }
  )
}
